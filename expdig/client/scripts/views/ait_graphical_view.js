/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2016\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2016
**********************************************************************
\author MWh
This file contains the code for the boc.ait.views.GraphicalView class.
**********************************************************************
*/

// Create namespace boc.ait.views
Ext.namespace('boc.ait.views');


/*
    Implementation of the class boc.ait.views.GraphicalView. This is
    the standard view for a diagram. It shows the diagram as an svg
    inside a tab in the main tab panel
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.views.GraphicalView = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  var that = this;
  
  var MAX_DESCRIPTION_LENGTH_FOR_TOOLTIP = 2000;

  // Initialize the config object if necessary
  aConfig = aConfig || {};

  aConfig.plugins = (aConfig.plugins || []).concat([boc.ait.plugins.Customizable]);
  var m_aDiagramBox = null;
  var m_aImgEl = null;
  var m_aImageMap = null;
  var m_aData = null;
  var m_aDiagramInfo = null;
  var m_aArea = null;
  var m_aRetrieverConfig = null;
  var m_bIsLoaded = false;
  var m_bMouseAccessLocked = true;

  var m_aCtxMenu = null;

  var m_aReferencesSubMenu = null;
  var m_aReferencesMenuItem = null;
  
  var InstTemplate = boc.ait.commons.getArtefactDataTemplate (AIT_ARTEFACT_OBJECT, [{name: 'repoInst', type:'bool'},{name: 'context'}]);
  var ViewTemplate = boc.ait.commons.getArtefactDataTemplate (AIT_ARTEFACT_DIAGRAM, [{name:'context'}]);


  // Store the zoom info in the view
  var m_aZoomInfo =
  {
    scale: 1.0,
    maxScale: 2.0,
    minScale: 0.01
  };

  var m_aLoadingItem = null;

  function setupContextMenu ()
  {
    m_aCtxMenu = new boc.ait.menu.Menu
    (
      {
        commands : [
                    "ait_menu_main_set_mouseaccess_lock",
                    "ait_menu_main_remove_mouseaccess_lock",
                    "-",
                    "ait_menu_main_open_notebook",
                    "-",
                    "ait_menu_view_save_on_disk",
                    "-",
                    "ait_menu_main_used_in_models",
                    "-",
                    {
                      cmdId: "ait_menu_main_views",
                      commands:
                      [
                        "ait_menu_main_show_bia"
                      ]
                    },
                    "-",
                    "ait_menu_main_generate_url"
                   ]
      }
    );

    if (!g_aSettings.offline)
    {

      m_aReferencesSubMenu = new Ext.menu.Menu
      (
        {}
      );
      m_aReferencesMenuItem = new Ext.menu.Item
      (
        {
          text:getString ('ait_graphical_view_ctx_menu_references'),
          handler: Ext.emptyFn,
          menu: m_aReferencesSubMenu
        }
      );
      m_aCtxMenu.insertMenuItem (m_aReferencesMenuItem);
      
      // check if context menu was loaded from an empty area, and hide References menu item
      m_aCtxMenu.menu.on("beforeshow", function (aMenu)
        {
          var aCtx = m_aCtxMenu.getContext ();
          // If there is no context or the owner of the context is the view itself instead of a specific
          // artefact, we do not show the references menu, since we did not click on a modelling instance
          if (!aCtx || m_aCtxMenu.getParams("owner") instanceof boc.ait.views.View)
          {
            m_aReferencesMenuItem.hide ();
          }
        });
    }
  }
  
  setupContextMenu ();

  /*
    Protected function that sets up the event handlers for an image map area

    \param aElement The area element for which event handlers should be set up
    \param aInstInfo The data with which to setup the area event handlers
  */
  //--------------------------------------------------------------------
  this._setupDefaultEventHandlersForArea = function (aArea, aAreaInfo)
  //--------------------------------------------------------------------
  {
    aArea.applyStyles("cursor: pointer;");
    aArea.on
    (
      "click",
      function (aEvent)
      {
        var nArtefactType = aAreaInfo.repoInst ? AIT_ARTEFACT_OBJECT : AIT_ARTEFACT_MODINST;
        g_aMain.getMainArea().openNotebook (aAreaInfo.id, nArtefactType, false, null, that.artefactId, that.artefactId);
      },
      aArea
    );


    function onAreaContextMenu (aEvent)
    {
      // Get the actual menu from the ctxmenu object
      var aMenu = m_aCtxMenu.menu;
      var aInstData =
      {
        context:"inst"
      };
      Ext.apply (aInstData, aAreaInfo);
      var aModInst = new InstTemplate (aInstData, aInstData.id);

      aModInst.id = aAreaInfo.id;

      m_aCtxMenu.setContext ([aModInst]);
      m_aCtxMenu.setParams ({viewId:that.viewId});
      m_aCtxMenu.setParams ("owner", aModInst);
      m_aCtxMenu.setParams ("ownerComp", that);
      if (aModInst.get("repoInst") === false)
      {
        m_aReferencesMenuItem.hide ();
      }

      function onBeforeShow (aMenu)
      {
        if (aAreaInfo.repoInst === false)
        {
          m_aReferencesMenuItem.hide ();
          return;
        }

        m_aLoadingItem = new Ext.menu.Item
        (
          {
            text:getString("ait_loading"),
            icon: 'ext/resources/images/default/grid/loading.gif', // icons can also be specified inline
            cls: 'x-btn-icon',
            disabled: true
          }
        );
        m_aReferencesSubMenu.addMenuItem (m_aLoadingItem);

        Ext.Ajax.request
        (
          {
            url:"proxy",
            method:"POST",
            params:
            {
              type: "getreferences",
              params: Ext.encode
              (
                {
                  artefactID: aAreaInfo.id,
                  artefactType: AIT_ARTEFACT_OBJECT
                }
              )
            },
            // We use the tree as scope for the callbacks
            scope: that,
            // On success we check the return object
            success: function (aResponse, aOptions)
            {
              // Decode the response Object
              var aRetObj = Ext.util.JSON.decode(aResponse.responseText);
              // Check if an error occurred (artefact does not exist, is locked, was deleted, ...)
              if (aRetObj.error)
              {
                // Show an error message
                showErrorBox(aRetObj.errString);
                // Undo the change in the tree
                return;
              }
              
              var aRef = null;
              function onClickOpenNotebook()
              {
                if (aRef.artefactType === AIT_ARTEFACT_OBJECT)
                {
                  g_aMain.getMainArea().openNotebook (this.id, this.artefactType);
                }
                else
                {
                  g_aMain.getMainArea().openDiagram (this.id);
                }
              }

              for (var i = 0; i < aRetObj.payload.length;++i)
              {
                var aRelClassEntry = aRetObj.payload[i];
                m_aReferencesSubMenu.addMenuItem
                (
                  {
                    text:aRelClassEntry.name,
                    canActivate: false,
                    cls: 'ait_references_sub_menu_relclassname'
                  }
                );

                var aRefs = aRelClassEntry.refs;

                for (var j = 0; j < aRefs.length;++j)
                {
                  aRef = aRefs[j];
                  m_aReferencesSubMenu.addMenuItem
                  (
                    {
                      text:aRef.name,
                      icon: boc.ait.getIconPath ()+aRef.icon,
                      cls: 'x-btn-icon',
                      scope: aRef,
                      handler: onClickOpenNotebook
                    }
                  );
                }
              }
              m_aReferencesSubMenu.remove (m_aLoadingItem);

              if (aRetObj.payload.length === 0)
              {
                m_aReferencesSubMenu.addMenuItem
                (
                  {
                    text:getString("ait_graphical_view_ctx_menu_no_references"),
                    disabled: true
                  }
                );
              }
            }
          }
        );
      }

      if (!g_aSettings.offline)
      {
        m_aCtxMenu.menu.on("beforeshow", onBeforeShow);

        m_aCtxMenu.menu.on("hide", function ()
          {
            m_aReferencesSubMenu.removeAll ();
            m_aCtxMenu.menu.un("beforeshow", onBeforeShow);
          }
        );
      }

      aMenu.showAt(aEvent.getXY());
      // Stop the propagation of the event
      aEvent.stopEvent();
    }


    aArea.on
    (
      "mousedown",
      function (aEvent)
      {
        if (aEvent.button === 2)
        {
          m_aCtxMenu.menu.hide();
          if (!g_aSettings.offline)
          {
            m_aReferencesMenuItem.show ();
          }
          onAreaContextMenu (aEvent);
        }
      }
    );

    if (aAreaInfo.name !== "" || aAreaInfo.description !== "")
    {
      // mask the strings for correct visualization
      var sName = boc.ait.htmlEncode (aAreaInfo.name);
      var sDescription = aAreaInfo.description;
      if (sDescription.length > MAX_DESCRIPTION_LENGTH_FOR_TOOLTIP)
      {
        sDescription = sDescription.substring (0, MAX_DESCRIPTION_LENGTH_FOR_TOOLTIP-3)+"...";
      }

      new Ext.ToolTip
      (
        {
          target: aArea.dom,
          trackMouse:true,
          showDelay: 0,
          dismissDelay: 0,
          hideDelay: 0,
          constrainPosition:true,
          shadow: true,
          html:"<b>"+sName+"</b><br/><div>"+boc.ait.htmlEncode (sDescription).replace(/\n/g,"<br/>")+"</div>"
        }
      );
    }
  };

  var createImageMap = function (aBox)
  {
    var aAreas = aBox.getEl().dom.childNodes;
    var i;
    for (i = aAreas.length-1; i >= 0;--i)
    {
      Ext.get(aAreas[i]).remove();
    }

    if (!m_aDiagramInfo.imageMapInfo)
    {
      return;
    }

    for (i = m_aDiagramInfo.imageMapInfo.length-1;i>=0;--i)
    {
      var aAreaInfo = m_aDiagramInfo.imageMapInfo[i];
      if (aAreaInfo.locked && m_bMouseAccessLocked === true)
      {
        continue;
      }

      for (var j = 0; j < aAreaInfo.posInfo.length;++j)
      {
        var aPosInfo = aAreaInfo.posInfo[j];
        m_aArea = Ext.get(Ext.DomHelper.append
        (
          aBox.getEl().dom,
          {
            tag: "area",
            shape: "rect",
            href: "#",
            aobjectid:aAreaInfo.id,
            coords: aPosInfo.x*m_aZoomInfo.scale+" "+aPosInfo.y*m_aZoomInfo.scale+" "+(aPosInfo.x+aPosInfo.width)*m_aZoomInfo.scale+" "+(aPosInfo.y+aPosInfo.height)*m_aZoomInfo.scale
          }
        ));

        that._setupDefaultEventHandlersForArea (m_aArea, aAreaInfo);
      }
    }
  };

  /*
      Private method that is used as a callback for the graphical view's data store.
      This method receives the diagraminfo returned from the server and sets
      the diagram tab's title. It also calls the server method that returns
      the diagram's svg representation
  */
  //--------------------------------------------------------------------
  var handleDiagramInfo = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      // Set the scope for callbacks passed to this class
      var aScope = aConfig.scope || that;

      if (!g_aSettings.offline)
      {
        // The scope for this method is the datastore, so we can access its members
        // Get the json Data from the data store's reader
        m_aData = this.reader.jsonData;

        // Check if we successfully retrieved the diagram info, otherwise
        // display an error message and return
        if (!m_aData || m_aData.error)
        {
          if (m_aData && m_aData.error)
          {
            showErrorBox (m_aData.errString);
          }
          if (typeof(aConfig.failure) == "function")
          {
            aConfig.failure.apply(aScope, [that]);
          }
          return;
        }
        if (m_aData.errString !== null && m_aData.errString !== undefined && m_aData.errString !== "")
        {
          showInfoBox (m_aData.errString);
        }
        // Get the diagram info from the data object
        m_aDiagramInfo = m_aData.payload;

        // Set the zoom information according to the information retrieved from the aserver
        m_aZoomInfo.scale = m_aDiagramInfo.scale;
        m_aZoomInfo.maxScale = m_aDiagramInfo.maxScale;
        m_aZoomInfo.minScale = m_aDiagramInfo.minScale;

        aConfig.title = boc.ait.htmlEncode(m_aDiagramInfo.title);
        if (!aConfig.title)
        {
          // Set the tab's title to the name of the diagram
          aConfig.title = boc.ait.htmlEncode (m_aDiagramInfo.name);
          if (aConfig.title === undefined || aConfig.title === null || aConfig.title === "")
          {
            aConfig.title = "&nbsp;";
          }
          aConfig.title+= " ("+m_aDiagramInfo.classname+")";
        }


        aConfig.iconUrl = boc.ait.getIconPath() + m_aDiagramInfo.iconUrl;

        aConfig.modelId = (aConfig.artefactId = m_aDiagramInfo.artefactId);

        that.setModelId (aConfig.modelId);
        aConfig.editable = m_aDiagramInfo.editable;
        aConfig.viewId = m_aDiagramInfo.viewId || aConfig.modelId;

        // Create a box component that holds a div that will later contain the diagram image
        m_aDiagramBox = new Ext.BoxComponent
        (
          {
            xtype:'box',
            autoEl:
            {
              tag:'div'
            }
          }
        );

        var sStyle = "border: " + ((aConfig.viewType === "graphical" || aConfig.viewType === "bia") ? "1px" : "0px")+" solid black";

        // As soon as the container div is rendered, we create an image element that calls the proxy servlet
        // to get the diagram image data
        m_aDiagramBox.on("render", function (aBox)
          {
            m_aImgEl = Ext.DomHelper.append
            (
              aBox.getEl().dom,
              {
                tag:'img',
                useMap: '#imageMap'+aConfig.viewId,
                style: sStyle,
                src: "views?id="+m_aDiagramInfo.id+"&timestamp="+(new Date()).getTime()+"&sessionid="+WindowStorage.get("sessionID")+"&scale="+m_aZoomInfo.scale,
                id:'graphicalview'+aConfig.viewId
              },
              true
            );

            // Add a load handler to the created image tag that unmasks the web client and fires the modelloaded event
            m_aImgEl.on("load", function ()
              {
                m_aImgEl.show ();
                unmaskWC();

                // Set the internal status to loaded
                m_bIsLoaded = true;
                g_aEvtMgr.fireEvent("modelloaded", that, m_aDiagramInfo.id);
                that.fireEvent("loaded", that, m_aDiagramInfo);
              }
            );

            m_aImgEl.on("error", function()
              {
                showErrorBox (getString("ait_image_not_loaded"));
                m_aImgEl.hide ();
                unmaskWC ();
              }
            );

            var aImageTab = m_aData.payload.type === "graphical" ? aBox : aBox.ownerCt;

            // Create a context menu for the image box
            aImageTab.getEl().on("contextmenu", function (aEvent, aEl)
              {
                // Hide the references menu item
                m_aReferencesMenuItem.hide ();

                var aContext = that.getArtefactData ();

                // Set the context
                m_aCtxMenu.setContext (aContext);
                m_aCtxMenu.setParams (that);
                m_aCtxMenu.setParams ("context", "view");
                m_aCtxMenu.setParams ("owner", that);
                m_aCtxMenu.setParams ("ownerComp", that);

                var aMenu = m_aCtxMenu.menu;
                // Show the menu at the event's position.
                aMenu.showAt (aEvent.getXY());
              }
            );
          }
        );



        // Create the image map for the diagram so we can open notebooks and insert mouseovers for the diagram
        // image.
        m_aImageMap = new Ext.BoxComponent(
        {
          xtype:"box",
          autoEl:
          {
            name:"imageMap"+aConfig.viewId,
            tag:"map"
          }
        });

        m_aImageMap.on("render", function (aBox)
          {
            try
            {
              createImageMap (aBox);
            }
            catch (aEx)
            {
              displayErrorMessage (aEx);
            }
          }
        );
      }
      else
      {
        m_aData = g_aOfflineData.notebookData;
        m_aDiagramInfo = m_aData.payload;
        m_aDiagramInfo.imageMapInfo = g_aOfflineData.imageMapInfo;
        aConfig.title = m_aDiagramInfo.name;
        if (aConfig.title === undefined || aConfig.title === null || aConfig.title === "")
        {
          aConfig.title = "&nbsp;";
        }
        aConfig.title+= " ("+m_aDiagramInfo.classname+")";
        aConfig.autoScroll = true;
        aConfig.iconUrl = boc.ait.getIconPath ()+m_aDiagramInfo.iconUrl;

        m_aDiagramBox = new Ext.BoxComponent
        (
          {
            xtype:'box',
            autoEl:
            {
              tag:'div'
            }
          }
        );

        // As soon as the container div is rendered, we create an image element that calls the proxy servlet
        // to get the diagram image data
        m_aDiagramBox.on("render", function (aBox)
          {
            var aImgElConfig = 
            {
              tag:'img',
              useMap: '#imageMap'+aConfig.modelId,
              style: "border: 1px solid black;",
              src: "../images/"+aConfig.modelId.replace(/[\{\}]/g, "")+".png",
              id:'graphicalview'+aConfig.modelId
            };
            
            if (m_aDiagramInfo.width)
            {
              aImgElConfig.width = m_aDiagramInfo.width;
            }
            if (m_aDiagramInfo.height)
            {
              aImgElConfig.height = m_aDiagramInfo.height;
            }
            m_aImgEl = Ext.DomHelper.append
            (
              aBox.getEl().dom,
              aImgElConfig,
              true
            );
            // Add a load handler to the created image tag that unmasks the web client
            m_aImgEl.on("load", function ()
              {
                unmaskWC ();
              }
            );

            var aImageTab = m_aData.payload.type === "graphical" ? aBox : aBox.ownerCt;

            // Create a context menu for the image box
            aImageTab.getEl().on("contextmenu", function (aEvent, aEl)
              {
                if (!g_aSettings.offline)
                {
                  // Hide the references menu item
                  m_aReferencesMenuItem.hide ();
                }

                var aContext = that.getArtefactData ();
                
                // Set the context
                m_aCtxMenu.setContext (aContext);
                m_aCtxMenu.setParams (that);
                m_aCtxMenu.setParams ("context", "view");
                m_aCtxMenu.setParams ("owner", that);
                m_aCtxMenu.setParams ("ownerComp", that);

                var aMenu = m_aCtxMenu.menu;
                // Show the menu at the event's position.
                aMenu.showAt (aEvent.getXY());
              }
            );
          }
        );
        
        // Create the image map for the diagram so we can open notebooks and insert mouseovers for the diagram
        // image.
        m_aImageMap = new Ext.BoxComponent(
        {
          xtype:"box",
          autoEl:
          {
            name:"imageMap"+aConfig.modelId,
            tag:"map"
          }
        });



        m_aImageMap.on("render", function (aBox)
          {
            try
            {
              for (var i = m_aDiagramInfo.imageMapInfo.length-1;i>=0;--i)
              {
                var aAreaInfo = g_aOfflineData.imageMapInfo[i];
                m_aArea = Ext.get(Ext.DomHelper.append
                (
                  aBox.getEl().dom,
                  {
                    tag: "area",
                    shape: "rect",
                    href: "#",
                    aobjectid:aAreaInfo.id,
                    coords: aAreaInfo.x+" "+aAreaInfo.y+" "+(Number(aAreaInfo.x)+Number(aAreaInfo.width))+" "+(Number(aAreaInfo.y)+Number(aAreaInfo.height))
                  }
                ));

                that._setupDefaultEventHandlersForArea (m_aArea, aAreaInfo);
              }
            }
            catch (aEx)
            {
              displayErrorMessage (aEx);
            }
          }
        );
      }

      // Add the box component to the view tab's items
      aConfig.items =
      [
        m_aDiagramBox
      ];
      if (m_aImageMap)
      {
        aConfig.items[aConfig.items.length] = m_aImageMap;
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };
  
  
  /*
    Protected function that returns data about the current artefact.

    \retval Data describing the current artefact.
  */
  //--------------------------------------------------------------------
  this._getArtefactData = function ()
  //--------------------------------------------------------------------
  {
    var aData = [];
    // If the view was based on a diagram, the context for the
    // context menu is the diagram
    if (m_aDiagramInfo.artefactType === AIT_ARTEFACT_DIAGRAM)
    {
      var aViewData =
      {
        context:'view'
      };
      Ext.apply (aViewData, m_aDiagramInfo);
      // Create the context
      aData[0] = new ViewTemplate (aViewData, aViewData.artefactId);
    }
    // Otherwise, the context are all the objects on which the view is based
    else
    {
      for (var i = 0; i < m_aDiagramInfo.imageMapInfo.length;++i)
      {
        var aInfo = m_aDiagramInfo.imageMapInfo[i];
        var aInstData =
        {
          context:"view"
        };
        Ext.apply (aInstData, aInfo);
        aData[i] = new InstTemplate (aInstData, aInstData.id);
      }
    }

    return aData;
  };

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    try
    {
      aConfig.autoScroll = true;

      aConfig.modelId = aConfig.artefactId;
      m_aRetrieverConfig = aConfig.retrieverConfig;


      aConfig.callback = handleDiagramInfo;

      if (aConfig.viewType)
      {
        // Get the right view from the global view list
        var aView = boc.ait.viewList[aConfig.viewType];

        if (aView)
        {
          // If the configuration instance and the artefact info are already provided
          // we don't need to call build view
          // We already have all information we need about the view.
          if (!aConfig.configInstId || !aConfig.artefactInfo)
          {
            // Build the view
            aView.onBuildView.call (this, aConfig);
          }

          aConfig.configurable = aView.configurable;
          aConfig.configId = aView.configId;
          aConfig.noConfigsText = getString (aView.noConfigsText);
          aConfig.viewId = Ext.id ();
        }
      }

      if (g_aSettings.offline)
      {
        loadOfflineData
        (
          {
            url:'../data/'+ aConfig.modelId.replace(/[\{\}]/g, "") +'.ajson',
            loaded: false
          },
          function ()
          {
            boc.ait.views.GraphicalView.superclass.constructor.call(that, aConfig);
          }
        );
        return;
      }
      else
      {
        aConfig.configurable = aConfig.configurable || false;
        aConfig.viewType = aConfig.viewType || "graphical";
        aConfig.artefactInfo = aConfig.artefactInfo ||
        {
          artefactType: AIT_ARTEFACT_DIAGRAM,
          artefactId: aConfig.artefactId
        };
        
        // Call to the superclass' constructor
        boc.ait.views.GraphicalView.superclass.constructor.call(that, aConfig);
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // Call to the constructor function to build the object
  buildObject();


  /*
    Retrieves the view's image

    \retval The view's image
  */
  //--------------------------------------------------------------------
  this._getModelImage = function ()
  //--------------------------------------------------------------------
  {
    return Ext.DomQuery.selectNode( "img", m_aDiagramBox.getEl().dom);
  };

  /*
    Retrieves the view's id

    \retval The view's id
  */
  //--------------------------------------------------------------------
  this._getViewId = function ()
  //--------------------------------------------------------------------
  {
    return m_aDiagramInfo.id;
  };

  /*
    Destroys the view, clearing the image's src attribute and hiding the image element
  */
  //--------------------------------------------------------------------
  this._destroyView = function ()
  //--------------------------------------------------------------------
  {
    if (m_aImgEl)
    {
      // Set the source element to Ext's blank image, otherwise undefined behavior may occur, especially in IDM
      // environments
      m_aImgEl.dom.setAttribute("src", Ext.BLANK_IMAGE_URL);
      m_aImgEl.hide ();
    }
  };

  /*
    Zooms the current view to the passed scale

    \param nScale The scale to set the current view to
  */
  //--------------------------------------------------------------------
  this._zoom = function (nScale)
  //--------------------------------------------------------------------
  {
    this._doZoom ({scale: nScale});
  };

  /*
    Retrieves the view's context menu

    \retval The view's context menu.
  */
  //--------------------------------------------------------------------
  this._getContextMenu = function ()
  //--------------------------------------------------------------------
  {
    return m_aCtxMenu;
  };

  /*
    Retrieves zoom information from the view

    \retval An object containing zoom information:
      - scale The current scale
      - maxScale The maximum scale
      - minScale The minimum scale
  */
  //--------------------------------------------------------------------
  this._getZoomInfo = function ()
  //--------------------------------------------------------------------
  {
    return m_aZoomInfo;
  };

  /*
    Public function that saves the current view as image.
  */
  //--------------------------------------------------------------------
  this._saveViewImage = function ()
  //--------------------------------------------------------------------
  {
    maskWC ();
    try
    {
      if (!g_aSettings.offline)
      {
        // Retrieve the current view's image in scale 100%
        document.location.href = "views?id="+m_aDiagramInfo.id+"&timestamp="+(new Date()).getTime()+"&sessionid="+WindowStorage.get("sessionID")+"&inline=false&scale=1.0";
      }
      else
      {
        window.open("../images/"+m_aDiagramInfo.artefactId.replace(/[\{\}]/g, "")+".png");
      }
      return true;
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
      return false;
    }
    finally
    {
      unmaskWC ();
    }
  };

  /*
    Protected function that generates a fixed url for the current tab.

    \retval The generated fix url for the current tab.
  */
  //--------------------------------------------------------------------
  this._generateURL = function ()
  //--------------------------------------------------------------------
  {
    var aViewData = m_aData.payload;
    // Create the base url
    var sURL = "t=view&vt="+aViewData.type+"&at="+m_aDiagramInfo.artefactType;

    // If the current artefact is a diagram, store the diagram id as id
    if (m_aDiagramInfo.artefactType === AIT_ARTEFACT_DIAGRAM)
    {
      sURL+="&id="+m_aDiagramInfo.artefactId;
    }
    // Otherwise, get all the artefacts that make up the current view and store them in the url
    else if (m_aDiagramInfo.artefactType === AIT_ARTEFACT_OBJECT)
    {
      sURL+="&ai=";
      for (var i = 0; i < m_aDiagramInfo.imageMapInfo.length;++i)
      {
        var aInfo = m_aDiagramInfo.imageMapInfo[i];
        sURL+=aInfo.id+"|"+aInfo.artefactType;
        if (i !== m_aDiagramInfo.imageMapInfo.length-1)
        {
          sURL+=",";
        }
      }
    }

    // If the config is configurable, store the config instance id
    if (aConfig.configurable)
    {
      sURL+="&cid="+this.getConfigInstId ();
    }
    return sURL;
  };

  this._isLoaded = function ()
  {
    return m_bIsLoaded;
  };

  /*
    Public function that updates the view's image map.

    \param bMouseAccessLocked Determines whether mouse access locks should be considered
  */
  //--------------------------------------------------------------------
  this._updateImageMap = function (bMouseAccessLocked)
  //--------------------------------------------------------------------
  {
    m_bMouseAccessLocked = bMouseAccessLocked;
    createImageMap (m_aImageMap);
  };

  /*
    Public function that retrieves whether the view considers mouse access locks or not
  */
  //--------------------------------------------------------------------
  this._isMouseAccessLocked = function ()
  //--------------------------------------------------------------------
  {
    return m_bMouseAccessLocked;
  };

  /*
    Protected function that returns the data for the current view.

    \retval The data for the current view. Contains data about the view and all contained instances
  */
  //--------------------------------------------------------------------
  this._getViewInfo = function ()
  //--------------------------------------------------------------------
  {
    return m_aDiagramInfo;
  };

  /*
    Protected function that returns the element that contains the image map for the current view.

    \retval The element that contains the image map for the current view.
  */
  //--------------------------------------------------------------------
  this._getImageMap = function ()
  //--------------------------------------------------------------------
  {
    return m_aImageMap;
  };

  /*
    Protectedfunction that returns an object containing the left and top offset of the image in the view

    \retval An object containing:
            left: The left offset of the image
            top: The top offset of the image
  */
  //--------------------------------------------------------------------
  this._getImageOffset = function ()
  //--------------------------------------------------------------------
  {
    var aModelImage = this._getModelImage();
    return {left:aModelImage.offsetLeft-2, top: aModelImage.offsetTop-2};
  };
  
  /*
    Protected function that changes the zoomlevel of the current view
    \param aParams A dictionary like object containing
          scale: The target scale of the current view
          callback: [optional] A callback function that is called when zooming the view is done
          scope: [optional] The scope for the passed callback function
  */
  //--------------------------------------------------------------------
  this._doZoom = function (aParams)
  //--------------------------------------------------------------------
  {
    // Mask the web client
    maskWC ();

    function onZoom ()
    {
      m_aImgEl.un ("load", onZoom, this);
      aParams.callback.call (aParams.scope || this);
    }
    if ((typeof aParams.callback) === "function")
    {
      m_aImgEl.on("load", onZoom, this);
    }
    
    
    // Store the current new scale
    m_aZoomInfo.scale = aParams.scale;

    // Reset the image element's source
    m_aImgEl.set
    (
      {
        src: "views?id="+m_aDiagramInfo.id+"&timestamp="+(new Date()).getTime()+"&sessionid="+WindowStorage.get("sessionID")+"&scale="+aParams.scale
      }
    );

    // Recreate the image map
    createImageMap (m_aImageMap);

    this.fireEvent ("zoom", m_aZoomInfo);
  };
};

// boc.ait.views.GraphicalView is derived from boc.ait.views.View
Ext.extend
(
  boc.ait.views.GraphicalView,
  boc.ait.views.View,
  {
    /*
      Retrieves the view's image

      \retval The view's image
    */
    //--------------------------------------------------------------------
    getModelImage : function ()
    //--------------------------------------------------------------------
    {
      return this._getModelImage ();
    },

    /*
      Retrieves the view's id

      \retval The view's id
    */
    //--------------------------------------------------------------------
    getViewId: function ()
    //--------------------------------------------------------------------
    {
      return this._getViewId ();
    },

    /*
      Destroys the view, clearing the image's src attribute and hiding the image element
    */
    //--------------------------------------------------------------------
    destroyView : function ()
    //--------------------------------------------------------------------
    {
      this._destroyView ();
    },

    /*
      Zooms the current view to the passed scale

      \param nScale The scale to set the current view to
    */
    //--------------------------------------------------------------------
    zoom : function (nScale)
    //--------------------------------------------------------------------
    {
      this._zoom (nScale);
    },

    /*
      Retrieves the view's context menu

      \retval The view's context menu.
    */
    //--------------------------------------------------------------------
    getContextMenu : function ()
    //--------------------------------------------------------------------
    {
      return this._getContextMenu ();
    },

    /*
      Retrieves zoom information from the view

      \retval An object containing zoom information:
        - scale The current scale
        - maxScale The maximum scale
        - minScale The minimum scale
    */
    //--------------------------------------------------------------------
    getZoomInfo : function ()
    //--------------------------------------------------------------------
    {
      return this._getZoomInfo ();
    },

    /*
      Public function that saves the current view as image.
    */
    //--------------------------------------------------------------------
    saveViewImage : function ()
    //--------------------------------------------------------------------
    {
      return this._saveViewImage ();
    },

    isLoaded : function ()
    {
      return this._isLoaded ();
    },

    /*
      Public function that updates the view's image map.

      \param bMouseAccessLocked Determines whether mouse access locks should be considered
    */
    //--------------------------------------------------------------------
    updateImageMap : function (bMouseAccessLocked)
    //--------------------------------------------------------------------
    {
      checkParamNull (bMouseAccessLocked, "boolean");
      this._updateImageMap (bMouseAccessLocked);
    },

    /*
      Public function that retrieves whether the view considers mouse access locks or not
    */
    //--------------------------------------------------------------------
    isMouseAccessLocked : function ()
    //--------------------------------------------------------------------
    {
      return this._isMouseAccessLocked ();
    },

    /*
      Public function that returns the data for the current view.

      \retval The data for the current view. Contains data about the view and all contained instances
    */
    //--------------------------------------------------------------------
    getViewInfo : function ()
    //--------------------------------------------------------------------
    {
      return this._getViewInfo ();
    },

    /*
      Public function that returns the element that contains the image map for the current view.

      \retval The element that contains the image map for the current view.
    */
    //--------------------------------------------------------------------
    getImageMap : function ()
    //--------------------------------------------------------------------
    {
      return this._getImageMap ();
    },

    /*
      Public function that sets up the event handlers for an image map area

      \param aElement The area element for which event handlers should be set up
      \param aInstInfo The data with which to setup the area event handlers
    */
    //--------------------------------------------------------------------
    setupDefaultEventHandlersForArea :function (aElement, aInstInfo)
    //--------------------------------------------------------------------
    {
      this._setupDefaultEventHandlersForArea (aElement, aInstInfo);
    },

    /*
      Public function that returns an object containing the left and top offset of the image in the view

      \retval An object containing:
              left: The left offset of the image
              top: The top offset of the image
    */
    //--------------------------------------------------------------------
    getImageOffset : function ()
    //--------------------------------------------------------------------
    {
      return this._getImageOffset ();
    },
    
    /*
      Public function that changes the zoomlevel of the current view
      \param aParams A dictionary like object containing
            scale: The target scale of the current view
            callback: [optional] A callback function that is called when zooming the view is done
            scope: [optional] The scope for the passed callback function
    */
    //--------------------------------------------------------------------
    doZoom : function (aParams)
    //--------------------------------------------------------------------
    {
      checkParam (aParams, "object");
      checkParam (aParams.scale, "number");
      checkParamNull (aParams.callback, "function");
      checkParamNull (aParams.scope, "object");
      
      this._doZoom (aParams);
    }
  }
);
// Register the graphical view's xtype
Ext.reg("boc-graphicalview", boc.ait.views.GraphicalView);