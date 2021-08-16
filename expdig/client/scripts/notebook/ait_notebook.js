/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2013\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2013
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.Notebook class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.Notebook. This class
    is used for showing ADOxx style notebooks in the web
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.Notebook = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var that = this;

  var m_aStore = null;

  var m_sArtefactId = aConfig.artefactId;
  var m_aChangedAttrs = new Ext.util.MixedCollection ();
  var m_aChangedRels = new Ext.util.MixedCollection ();
  var m_sClassID = null;
  var m_nArtefactType = aConfig.artefactType;
  var m_aOpeningView = g_aMain.getMainArea ().getView (aConfig.viewId);

  var m_sModelId = aConfig.modelId || (m_aOpeningView ? m_aOpeningView.getModelId () : null);
  var m_bEditMode = false;
  var m_bEditable = false;
  var m_bIsInitialized = false;
  var m_aEditModePanel = null;
  var m_aReadModePanel = null;
  var m_aReadModeTooltips = [];
  var m_aHighlightParams = aConfig.highlightParams;
  var m_aChapters = [];

  var m_aReadModeButton = null;
  var m_aEditModeButton = null;
  var m_aSaveButton = null;
  var m_aPrintButton = null;
  var m_aChangeHistoryButton = null;
  var m_aGenerateURLButton = null;

  var m_aNBData = null;

  aConfig.closable = true;
  aConfig.layout="fit";
  aConfig.autoScroll = true;
  aConfig.autoWidth = true;
  aConfig.id = "notebook-"+m_sArtefactId;

  var m_aMaxTimeFilterField = null;
  var m_aMinTimeFilterField = null;

  this._getData = function ()
  {
    return m_aNBData;
  };

  function initializeNB ()
  {
    var aTBarConfig = [];

    // If we show a change history, build the change history button
    if (m_aNBData.showChangeHistory)
    {
      // The save toolbar icon
      var aChangeHistoryConfBtn =
      {
        text:getString("ait_notebook_tip_change_history"),
        tooltip:getString("ait_notebook_tip_change_history"),
        handler: that.showChangeHistory,
        // the scope for the callback is the notebook
        scope: that
      };

      if(Ext.isIE6)
      {
        aChangeHistoryConfBtn.iconCls = 'ait_change_history';
      }
      else
      {
        aChangeHistoryConfBtn.cls = 'x-btn-text-icon';
        aChangeHistoryConfBtn.icon='images/doc_list_16.png';
      }

      m_aChangeHistoryButton = new Ext.Button (aChangeHistoryConfBtn);
      aTBarConfig[aTBarConfig.length] = m_aChangeHistoryButton;
    }

    m_aGenerateURLButton = new Ext.Toolbar.Button
    (
      {
        cls: 'x-btn-text-icon',
        icon: 'images/clipboard_new.png',
        text: getString("ait_menu_main_generate_url"),
        tooltip: getString("ait_menu_main_generate_url"),
        handler: onGenerateURL,
        scope: that
      }
    );

    aTBarConfig[aTBarConfig.length] = m_aGenerateURLButton;

    // Only show save, editmode and readmode tools if the notebook is editable and we are not in offline mode
    if
    (
      !g_aSettings.offline &&
      (
        (m_aNBData.edit && m_nArtefactType === AIT_ARTEFACT_DIAGRAM) ||
        (m_aNBData.edit && m_aNBData.repoObject) ||
        //(!m_aNBData.repoObject && m_aOpeningView && m_aOpeningView.isEditable())
        (!m_aNBData.repoObject && m_aNBData.edit)
      )
    )
    {
      var aReadModeButtonConf =
      {
        cls: 'x-btn-text-icon',
        hidden:true,
        text:getString("ait_notebook_read_mode"),
        tooltip:getString("ait_notebook_read_mode"),
        scope:that,
        handler:that.switchMode
      };

      var aEditModeButtonConf =
      {
        cls: 'x-btn-text-icon',
        text:getString("ait_notebook_edit_mode"),
        tooltip:getString("ait_notebook_edit_mode"),
        scope:that,
        handler:that.switchMode
      };

      var aSaveButtonConf =
      {
        cls: 'x-btn-text-icon',
        icon : 'images/save.png',
        hidden:true,
        disabled:true,
        text:getString("ait_notebook_tip_save"),
        tooltip:getString("ait_notebook_tip_save"),
        handler: function (aClickEvent) {this.save (false);},
        scope:that
      };


      if(Ext.isIE6)
      {
        aEditModeButtonConf.iconCls = 'ait_edit_notebook';
        aReadModeButtonConf.iconCls = 'ait_read_notebook';
        aSaveButtonConf.iconCls = 'ait_read_notebook';
      }
      else
      {
        aEditModeButtonConf.icon = 'images/edit_16.png';
        aEditModeButtonConf.cls  = 'x-btn-text-icon';
        aReadModeButtonConf.icon = 'images/eye_16.png';
        aReadModeButtonConf.cls  = 'x-btn-text-icon';
        aSaveButtonConf.icon = 'images/print_16.png';
        aSaveButtonConf.cls  = 'x-btn-text-icon';
      }

      m_aReadModeButton = new Ext.Button (aReadModeButtonConf);
      m_aEditModeButton = new Ext.Button (aEditModeButtonConf);
      m_aSaveButton = new Ext.Button (aSaveButtonConf);

      aTBarConfig = [m_aReadModeButton, m_aEditModeButton, m_aSaveButton].concat(aTBarConfig);
    }


    aTBarConfig = [{xtype: 'tbfill'}].concat(aTBarConfig);
    aTBarConfig[aTBarConfig.length] = {xtype: 'tbspacer', width: 20};

    aConfig.tbar = new Ext.Toolbar (aTBarConfig);

    aConfig.tbar.cls = 'ait_relcontrol_tbar';
    aConfig.style = "margin:0pt;padding:0pt;";

    aConfig.header = false;
    aConfig.bodyStyle = 'background-color:transparent';
    aConfig.cls = "ait_transparent";

  }
  
  function buildChapters (bReadMode)
  {
    if (!bReadMode)
    {
      for (var i = 0; i < m_aChapters.length;++i)
      {
        if (!bReadMode)
        {
          m_aChapters[i].destroy ();
        }
        m_aChapters[i] = null;
      }
    }

    m_aChapters = [];

    for (var i = 0; i < m_aNBData.children.length;++i)
    {
      var aChapterData = m_aNBData.children[i];
           
      if (com.boc.axw.isGroupEmpty (aChapterData))
      {
        continue;
      }

      var aChapter = new boc.ait.notebook.Group
      (
        {
          //xtype: 'boc-notebookgroup',
          title: aChapterData.name,
          notebook: that,
          data: aChapterData,
          chapter: true,
          autoWidth: true,
          autoHeight: true,
          renderImmediately: bReadMode || (i === 0),
          listeners :
          {
            beforeexpand: function(aCh)
            {
              aCh.renderGroup ();
            },

            collapse: function (aCh)
            {
              aCh.clearGroup(true);
            }
          }
        }
      );

      m_aChapters.push(aChapter);
    }
  }

  function renderEditMode ()
  {
    buildChapters (false);
    
    m_aEditModePanel = new Ext.Container
    (
      {
        header: false,
        title:"editmode",
        border: false,
        autoHeight: true,
        autoWidth:true,
        layout: 'accordion',
        layoutConfig:
        {
          animate:false
        }
      }
    );


    for (var i = 0; i < m_aChapters.length;++i)
    {
      m_aEditModePanel.add(m_aChapters[i]);
    }
  }

  function renderReadMode ()
  {
    buildChapters (true);

    var aControls = [];

    for (var i = 0; i < m_aChapters.length;++i)
    {
      var aChapter = m_aChapters[i];
      aControls[aControls.length] = aChapter;

      aControls = aControls.concat(aChapter.getControls());
    }

    var aRows = [];

    for (var i = 0; i < aControls.length;++i)
    {
      var aRow = null;
      // For each control, get the readmode representation and add it to the rows
      // that will make up the read mode panel
      if ((typeof aControls[i].getReadModeRepresentation) === "function")
      {
        aRow = aControls[i].getReadModeRepresentation(m_aHighlightParams).getSimpleRepresentation();
      }
      else
      {
        // If we don't have a readmode representation, we use a dummy
        aRow =
        {
          tag:'tr', children:
          [
            {
              tag: 'td',
              html: 'not implemented: '
            },
            {
              tag:'td',
              html: 'val'
            }
          ]
        };
      }


      if (aControls[i].props && aControls[i].props.dom_id)
      {
        aRow.dom_id = aControls[i].props.dom_id;
      }
      aRows [aRows.length] = aRow;
    }


    // Create a new HTML table, that we fill with the rows we created before
    m_aReadModePanel = new Ext.BoxComponent
    (
      {
        autoScroll:true,
        autoHeight: true,
        autoEl:
        {
          tag: 'table',
          cls: 'ait_readmode_notebook',
          children: aRows,
          style: "background-color:white;"
        }
      }
    );

    /*m_aReadModePanel = new Ext.Container
    (
      {
        //header: false,
        autoScroll:true,
        title:"readmode",
        header:false,
        items: [aReadModeBox],
        //cls:'ait_transparent',
        listeners:
        {
          render: function (aPanel)
          {
            aPanel.el.dom.style.margin = "0pt";
            aPanel.el.dom.style.padding = "0pt";
          }
        }
      }
    );*/

    // Create an eventlistener for the table's render event
    m_aReadModePanel.mon(m_aReadModePanel,"render", function (aPanel)
      {
        // Don't do anything when we are in offline mode
        if (g_aSettings.offline)
        {
          return;
        }

        for (var i = 0; i < aControls.length;++i)
        {
          var aCtrl = aControls[i];
          if (aCtrl.props && aCtrl.props.dom_id)
          {
            var aReadModeCtrl = Ext.DomQuery.selectNode("tr[dom_id='"+aCtrl.props.dom_id+"']", aPanel.getEl().dom);
            if (aReadModeCtrl)
            {
              aCtrl.readModeControl = aReadModeCtrl;
            }
          }
        }

        for (var i = 0; i < m_aNBData.children.length;++i)
        {
          var aGroupData = m_aNBData.children[i];
          if (aGroupData.props.onLoad)
          {
            var f = new Function (aGroupData.props.onLoad);
            f.call (that);
          }
        }
      }
    );
  }
  
  /*
      Protected method that returns whether the notebook is editable or not
      \retval The notebook's editable status
  */
  //--------------------------------------------------------------------
  this._isEditable = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      return m_bEditable && !g_aSettings.offline;
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
    var aArtefactTemplate = Ext.data.Record.create
    (
      [
        {name: 'text'},
        {name: 'idClass'},
        {name: 'classId'},
        {name: 'repoInst'},
        {name: 'modelId'},
        {name: 'idClass_lang'},
        {name: 'id'},
        {name: 'iconUrl'},
        {name: '_is_leaf', type: 'bool'},
        {name: 'artefactType'},
        {name: 'context'}
      ]
    );


    return  [
              new aArtefactTemplate
              (
                {
                  id: this._getArtefactId (),
                  _is_leaf: true,
                  context: "notebook"
                },
                this._getArtefactId ()
              )
            ];
  };

  this._isEditMode = function ()
  {
    return m_bEditMode;
  };
  
  /*
      Protected method that returns the id of the artefact that is represented in the
      notebook
      \retval The id of the artefact that is represented in the
      notebook
  */
  //--------------------------------------------------------------------
  this._getArtefactId = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      return m_sArtefactId;
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };
  
  /*
      Returns the class id of the object whose notebook we are
      displaying.
      \retval The class id
  */
  //--------------------------------------------------------------------
  this._getClassID = function ()
  //--------------------------------------------------------------------
  {
    return m_sClassID;
  };
  
  /*
      Protected method that returns the artefacttype of the notebook

      \retval The type of artefact that is displayed.
  */
  //--------------------------------------------------------------------
  this._getArtefactType = function()
  //--------------------------------------------------------------------
  {
    return m_nArtefactType;
  };
  
  this._getParentId = function ()
  {
    return m_aNBData.parentId;
  };

  function handleNotebookData ()
  {
    var aData = null;
    if (g_aSettings.offline)
    {
      aData = g_aOfflineData.notebookData;
    }
    else
    {
      aData = this.reader.jsonData;
    }
    if (!aData || aData.error)
    {
      if (aData && aData.error)
      {
        showErrorBox (aData.errString.replace(/%OBJECT_NAME%/g, m_aNBData.name).replace(/%OBJECT_CLASS%/g, m_aNBData.classname));
        unmaskWC ();
      }
      return;
    }
    if (aData && aData.errString)
    {
      showExtendedEditBox (aData.errString.replace(/\[ait-[0-9]*\]\n/g, "").replace(/\[ado-[0-9]*\]\n/g, ""));
    }

    m_aNBData = aData.payload;

    m_bEditable = m_aNBData.edit;

    m_sClassID = m_aNBData.classID;

    if (!m_bIsInitialized)
    {
      initializeNB.call (that);
    }

    if (m_bEditMode)
    {
      if (m_aReadModePanel)
      {
        for (var i = 0; i < m_aChapters.length;++i)
        {
          m_aChapters[i].clearGroup();
        }
        m_aChapters = [];
        m_aReadModePanel.destroy ();
        that.remove (m_aReadModePanel, true);
        m_aReadModePanel = null;
      }

      renderEditMode.call (this);
    }
    else
    {
      if (m_aEditModePanel)
      {
        for (var i = 0; i < m_aChapters.length;++i)
        {
          m_aChapters[i].collapse();
        }
        that.remove (m_aEditModePanel, true);
        m_aEditModePanel = null;
      }

      renderReadMode.call (this);
    }

    if (!m_bIsInitialized)
    {
      var sTitle = m_aNBData.name + " ("+m_aNBData.classname;
      if (m_aNBData.repoObject)
      {
        sTitle+=", "+getString("ait_repo_object")+")";
      }
      else
      {
        sTitle+=")";
      }
      sTitle = boc.ait.htmlEncode (sTitle);

      aConfig.title = sTitle;
      //that.setTitle (sTitle);

      // Set the notebook's editable status

      that.iconUrl = boc.ait.getIconPath() + m_aNBData.iconUrl;
      m_sClassID = m_aNBData.classID;

      // Setup listeners for the notebook
      aConfig.listeners =
      {
        render: function(aPanel)
        {
          if (!aPanel.ownerCt)
          {
            return;
          }


          if (aPanel.ownerCt.getTabEl)
          {
            var aSelector = Ext.get(aPanel.ownerCt.getTabEl(aPanel));
            aSelector.addClass("x-tab-with-icon");
            var aSpan = Ext.query("span", aSelector.dom)[1];
            aSpan.style.backgroundImage = "url("+that.iconUrl+")";
            aSpan.style.backgroundPosition = "0 center";

            var aAnchor = Ext.query("a", aSelector.dom)[0];
            aAnchor.style.backgroundImage="url('images/tab_close.png')";
            aAnchor.style.backgroundPosition="right center";
            aAnchor.style.height="16";
            aAnchor.style.width="16";
          }

          var aP = aPanel.body.dom.parentNode.parentNode.parentNode;

          aP.style.backgroundImage = "url(images/screen.jpg)";
          aP.style.backgroundRepeat = "no-repeat";
          aP.style.backgroundPosition = "left bottom";
        }
      };

      aConfig.autoHeight = true;

      boc.ait.notebook.Notebook.superclass.constructor.call(that, aConfig);

      /*
          Inner function that unlocks the resource this notebook is based on
      */
      //--------------------------------------------------------------------
      var aUnlockFunction = function ()
      //--------------------------------------------------------------------
      {
        Ext.Ajax.request
        (
          {
            url:"proxy",
            //method:"POST",
            params:
            {
              type: "unlock",
              params: Ext.encode
              (
                {
                  id: m_sArtefactId,
                  modelId: m_sModelId,
                  // We pass a flag indicating whether the resource was locked exclusively
                  // This is required so the server side script knows which lock to remove
                  editable: /*m_bEditable*/ m_bEditMode
                }
              )
            },
            // Use empty callback functions
            success: Ext.emptyFn,
            failure: Ext.emptyFn
          }
        );
      };

      /*
          Inner function that is called when the notebook is destroyed
      */
      //--------------------------------------------------------------------
      var aOnDestroyFunction = function ()
      //--------------------------------------------------------------------
      {
        if (g_aSettings.offline)
        {
          return;
        }

        //if (m_nArtefactType !== AIT_ARTEFACT_MODINST)

        // call the server side unlock function after a short timeout, this is necessary for firefox,
        // otherwise a communication failure would occur for some reason...
        setTimeout
        (
          aUnlockFunction, 1
        );
      };

      // Setup listeners for the notebook

      that.on("destroy", aOnDestroyFunction, that);
      that.on
      (
        "beforedestroy",
        function (aP)
        {
          if (aP.tooltip)
          {
            aP.tooltip.destroy();
            aP.tooltip = null;
            delete aP.tooltip;
            aP.selector = null;
            delete aP.selector;
          }
        }
      );
    }
    if (m_bEditMode)
    {
      that.add (m_aEditModePanel);

      m_aEditModeButton.hide();
      m_aReadModeButton.show();
      m_aSaveButton.show();
      m_aPrintButton.hide ();
    }
    else
    {
      that.add (m_aReadModePanel);

      if (!g_aSettings.offline)
      {
        m_aEditModeButton.show();
        m_aReadModeButton.hide();
        m_aSaveButton.hide();
        m_aPrintButton.show ();
      }
    }

    that.doLayout ();

    if (!m_bIsInitialized)
    {
      m_bIsInitialized = true;
      aConfig.success.apply(aConfig.scope, [that]);
    }
    else
    {
      unmaskWC ();
    }
  }

  if (!g_aSettings.offline)
  {
    // Retrieve the notebook data from the server and store it in a jsonstore
    m_aStore = new Ext.data.JsonStore
    (
      {
        autoDestroy:true,
        url: 'proxy',
        baseParams:
        {
          type: 'notebook',
          params: Ext.encode
          (
            {
              id: m_sArtefactId,
              artefactType: m_nArtefactType,
              modelId: m_sModelId,
              editMode: m_bEditMode,
              initial: m_bIsInitialized
            }
          )
        }
      }
    );

    // Load the notebook data
    m_aStore.load
    (
      {
        callback: handleNotebookData
      }
    );
  }
  else
  {
    var sUrl = "";
    var sArtId = m_sArtefactId.replace(/[\{\}]/g, "");
    if (m_nArtefactType === AIT_ARTEFACT_OBJECT || m_nArtefactType === AIT_ARTEFACT_MODINST)
    {
      sUrl = '../data/'+sArtId+'-'+g_aSettings.lang+'.ajson';
    }
    else
    {
      sUrl = '../data/'+sArtId+'.ajson';
    }
    loadOfflineData
    (
      {
        url:sUrl,
        loaded:false
      },
      handleNotebookData
    );
  }
  
  this._switchMode = function ()
  {
    maskWC ();
    var bError = false;
    try
    {
      // If we are not in edit mode and we still have unsaved changes, we
      // ask the user if he wants to save his changes now
      if (m_bEditMode && (m_aChangedAttrs.getCount () > 0 || m_aChangedRels.getCount () > 0))
      {
        Ext.Msg.show
        (
          {
            title: getStandardTitle(),
            msg: getString("axw_unsaved_artefact_changes"),
            buttons: Ext.Msg.YESNOCANCEL,
            icon: Ext.MessageBox.QUESTION,

            // Callback that is called when the user picks an option
            fn:function (sChoice)
            {
              switch (sChoice)
              {
                // Yes, the user wants to save his changes
                case "yes":
                  maskWCBlank ();
                  // Call the save function, it automatically switches to readmode afterwards
                  that._save ();
                  break;
                // No the user wants to throw away his changes
                case "no":
                  // Reset the changed attributes and switch the mode
                  m_aChangedAttrs.clear ();
                  m_aChangedRels.clear ();
                  that._switchMode (false);
                  break;
                // Cancel, the user wants to cancel the save action
                case "cancel":
                  // Unmask the web client and do nothing
                  unmaskWC ();
                  break;
              }
            }
          }
        );
        // Unmask the web
        unmaskWC ();
        return;
      }

      m_bEditMode = !m_bEditMode;
      m_aStore.destroy();
      // Retrieve the notebook data from the server and store it in a jsonstore
      m_aStore = new Ext.data.JsonStore
      (
        {
          url: 'proxy',
          autoDestroy:true,
          baseParams:
          {
            type: 'notebook',
            params: Ext.encode
            (
              {
                id: m_sArtefactId,
                artefactType: m_nArtefactType,
                modelId: m_sModelId,
                editMode: m_bEditMode,
                initial: !m_bIsInitialized
              }
            )
          }
        }
      );


      // Load the notebook data
      m_aStore.load
      (
        {
          callback: handleNotebookData
        }
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
      bError = true;
    }
    finally
    {
      if (bError)
      {
        unmaskWC ();
      }
    }
  };

  this._doClose = function ()
  {
    if (m_bEditMode && (m_aChangedAttrs.getCount () > 0 || m_aChangedRels.getCount () > 0))
    {
      Ext.Msg.show
      (
        {
          title: getStandardTitle(),
          msg: getString("axw_unsaved_artefact_changes"),
          buttons: Ext.Msg.YESNOCANCEL,
          icon: Ext.MessageBox.QUESTION,

          // Callback that is called when the user picks an option
          fn:function (sChoice)
          {
            switch (sChoice)
            {
              // Yes, the user wants to save his changes
              case "yes":
                maskWCBlank ();
                // Call the save function, it automatically switches to readmode afterwards
                that._save (/*false, */function (){that.ownerCt.remove (that);unmaskWC();});
                break;
              // No the user wants to throw away his changes
              case "no":
                m_aChangedAttrs.clear ();
                m_aChangedRels.clear ();
                that.ownerCt.remove (that);
                g_aMain.getStatusBar ().setStatus ('');
                break;
              // Cancel, the user wants to cancel the save action
              case "cancel":
                break;
            }
          }
        }
      );
      return false;
    }
    else
    {
      g_aMain.getStatusBar ().setStatus ('');

      that = null;

      for (var i = 0; i < m_aReadModeTooltips.length;++i)
      {
        m_aReadModeTooltips[i].destroy ();
      }
      m_aReadModeTooltips = null;

      if (m_aReadModePanel)
      {
        m_aReadModePanel = null;
      }
      if (m_aEditModePanel)
      {
        m_aEditModePanel = null;
      }

      if (!m_bEditMode)
      {
        for (var i = 0; i < m_aChapters.length;++i)
        {
          m_aChapters[i].clearGroup ();
          m_aChapters[i].destroy ();
          m_aChapters[i] = null;
        }
      }
    }
  };

  /*
      Protected method that is called whenever one of the values in the fields
      contained in the notebook changes. The new value is passed and gets added
      to the m_aChangedAttrs Array.
      \param sFieldName The name of the field that was changed
      \param aNewVal The new value of the field
  */
  //--------------------------------------------------------------------
  this._onAttrChange = function (sFieldName, aNewVal)
  //--------------------------------------------------------------------
  {
    try
    {
      // Add a new object representing the changed field to the object
      m_aChangedAttrs.add(sFieldName, aNewVal);

      // Set the tab's appearance to unsaved
      this.setSavedState (false);

      // If we have a save button enable it
      if (m_aSaveButton)
      {
        m_aSaveButton.enable();
        //m_aSaveButton.removeClass("x-item-disabled");
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  this._onRelChange = function (sRelation, aChange)
  {
    m_aChangedRels.add (sRelation, aChange);

    // Set the tab's appearance to unsaved
    this.setSavedState (false);
    if (m_aSaveButton)
    {
      m_aSaveButton.enable();
      //m_aSaveButton.removeClass("x-item-disabled");
    }
  };

  /*
      Protected method that is called whenever one of the values in the fields
      contained in the notebook changes to the original value.
      \param sFieldName The name of the field that was changed
  */
  //--------------------------------------------------------------------
  this._rmAttrChange = function (sFieldName)
  //--------------------------------------------------------------------
  {
    try
    {
      m_aChangedAttrs.removeKey(sFieldName);

      if (m_aChangedAttrs.getCount() > 0)
      {
        return;
      }

      if (m_aSaveButton)
      {
        m_aSaveButton.disable();
        ///m_aSaveButton.addClass("x-item-disabled");
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Protected method that saves the changed values in the notebook.
  */
  //--------------------------------------------------------------------
  this._save = function (aSaveCallback, bSilent)
  //--------------------------------------------------------------------
  {
    maskWC ();

    var bCloseNotebookAfterSave = false;
    try
    {
      /*
          Inner function that is called when the ajax request to save the changed nb data
          returned successfully
          \param aResponse The AJAX response object
          \param aOptions The original options passed to the AJAX request
      */
      //--------------------------------------------------------------------
      var aSuccessMsgFunction = function (aResponse, aOptions)
      //--------------------------------------------------------------------
      {
        var aData = Ext.util.JSON.decode(aResponse.responseText);
        if (!aData || aData.error)
        {
          if (aData && aData.error)
          {
            if (!bSilent)
            {
              showErrorBox (aData.errString.replace(/%OBJECT_NAME%/g, m_aNBData.name).replace(/%OBJECT_CLASS%/g, m_aNBData.classname));
            }
            unmaskWC ();
          }
          return;
        }
        if (aData && aData.errString)
        {
          if(!bSilent)
          {
            showExtendedEditBox (aData.errString.replace(/\[ait-[0-9]*\]\n/g, "").replace(/\[ado-[0-9]*\]\n/g, ""));
          }
        }

        this.fireEvent("save", m_aChangedAttrs);

        // Get the object tree
        var aTreeControl = g_aMain.getTreeArea().getObjectTree().getTreeControl();
        // If the diagram tree is active, get the diagram tree
        if (m_nArtefactType == AIT_ARTEFACT_DIAGRAM)
        {
          aTreeControl = g_aMain.getTreeArea().getDiagramTree().getTreeControl();
        }
        var aNode = aTreeControl.store.getById (that.artefactId);


        // If the node we want to change is already loaded in the tree, update the visualized values
        if (aNode)
        {
          var aVisAttrs = {};
          if (this.getArtefactType() === AIT_ARTEFACT_OBJECT)
          {
            aVisAttrs = g_aSettings.visibleObjectAttrs;
          }
          else if (this.getArtefactType() === AIT_ARTEFACT_DIAGRAM)
          {
            aVisAttrs = g_aSettings.visibleModelAttrs;
          }

          // Iterate through the changed attributes.
          m_aChangedAttrs.eachKey (function (sAttr, aChange)
                                  {
                                    var bFound = false;
                                    // Check if the changed attribute is also visualized in the catalogue
                                    // If so, update the node in the catalogue
                                    for (var i = 0; i < aVisAttrs.length;++i)
                                    {
                                      var aVisAttr = aVisAttrs[i];
                                      for (var sId in aVisAttr)
                                      {
                                        if (aVisAttr[sId].name === sAttr)
                                        {
                                          // Apparently Record.set(..) only works when setting to
                                          // simple values. So we simply change the existing value
                                          // and execute Record.commit()
                                          var aOldVal = aNode.get("attr_"+sAttr.toLowerCase());
                                          aOldVal.val = aChange.val;
                                          aOldVal.id = aChange.id;
                                          aOldVal.noValue = aChange.noValue;
                                          //aNode.set("attr_"+sAttr.toLowerCase(), aOldVal);
                                          aNode.commit ();
                                          bFound = true;
                                          break;
                                        }
                                      }
                                      if(bFound)
                                      {
                                        break;
                                      }
                                    }

                                    // If the changed attribute was the name, update the tree
                                    if (sAttr === ATTR_NAME)
                                    {
                                      aNode.set("text", aChange.val);
                                    }
                                  }
                                );

          aTreeControl.store.commitChanges();
        }

        // Clear any unsaved changes
        this._clearUnsavedChanges ();

        // Change the status message in the status bar.
        g_aMain.getStatusBar().setStatus (getString("ait_save_successful").replace(/%OBJECT_NAME%/g, m_aNBData.name));

        if (!bCloseNotebookAfterSave)
        {
          if ((typeof aSaveCallback) !== "function")
          {
            this.switchMode.defer(1, that, [false]);
          }
          else
          {
            aSaveCallback.call (that);
          }
        }
        else
        {
          this.close ();
          if (!bSilent)
          {
            g_aMain.getTreeArea().getObjectTree().refresh();
          }
          unmaskWC ();
        }
      };

      var ajaxSaveNotebook = function ()
      {
        // Only save if there is something to save
        if (m_aChangedAttrs.getCount() > 0 || m_aChangedRels.getCount () > 0)
        {
          var aChanges =
          {
            attrs: {},
            rels: {}
          };

          m_aChangedAttrs.eachKey (function (sKey, aItem)
                                   {
                                     if (typeof aItem === "string")
                                     {
                                       aItem = aItem.replace(/[\x01-\x08\x0b\x0c\x0e-\x1f]/ig,'?');
                                     }
                                     aChanges.attrs[sKey] = aItem;
                                   }
                                  );

          m_aChangedRels.eachKey (function (sKey, aItem)
                                  {
                                    var aRelArr = [];

                                    aItem.eachKey (function (sId, aChangedRel)
                                                                 {
                                                                   aRelArr[aRelArr.length] =
                                                                   {
                                                                     id: sId,
                                                                     fromInstId: aChangedRel.fromInstId,
                                                                     toEpId: aChangedRel.toEpId,
                                                                     fromEpId: aChangedRel.fromEpId,
                                                                     toInstId : aChangedRel.toInstId,
                                                                     toArtefactType: aChangedRel.toArtefactType,
                                                                     fromArtefactType: aChangedRel.fromArtefactType,
                                                                     create: aChangedRel.added
                                                                   };
                                                                 }
                                                        );

                                    if (aRelArr.length > 0)
                                    {
                                      aChanges.rels[sKey] = aRelArr;
                                    }
                                  }
                                 );


          // Start an ajax request that passes the JSON encoded object containing
          // the changed values to the server saves them
          Ext.Ajax.request
          (
            {
              url:"proxy",
              method:"POST",
              params:
              {
                type: "savenotebook",
                params:Ext.encode
                (
                  {
                    artefactType: m_nArtefactType,
                    modelId: m_sModelId,
                    id: that.artefactId,
                    changes: aChanges
                  }
                )
              },
              // On success we show a message
              success: aSuccessMsgFunction,
              scope: this
            }
          );
        }
      };



      var aTimeFilter = g_aMain.getMenuBar ().getTimeFilter ();
      if (aTimeFilter && aTimeFilter.isEnabled () )
      {
        if ( m_aMaxTimeFilterField && !m_aMaxTimeFilterField.isNoValue())
        {
          if (m_aMaxTimeFilterField.getValAsDate ().getTime() < aTimeFilter.getFilter().getTime())
          {
            bCloseNotebookAfterSave = true;
          }
        }
        if (m_aMinTimeFilterField && !m_aMinTimeFilterField.isNoValue())
        {
          if (m_aMinTimeFilterField.getValAsDate ().getTime() > aTimeFilter.getFilter().getTime())
          {
            bCloseNotebookAfterSave = true;
          }
        }
      }

      if (bCloseNotebookAfterSave && !bSilent)
      {
        maskWCBlank ();
        Ext.Msg.confirm
        (
          getStandardTitle(),
          boc.ait.htmlEncode (getString ("ait_notebook_closed_after_save_timefilter").replace (/%INST_NAME%/g, m_aNBData.name)).replace(/\n/g, "<br/>"),
          function (sResult)
          {
            if (sResult === "no")
            {
              unmaskWC ();
              return;
            }
            else
            {
              maskWC ();
              ajaxSaveNotebook.call (this);
            }
          },
          this
        );
      }
      else
      {
        ajaxSaveNotebook.call (this);
      }
      //bCloseNotebookAfterSave = false;
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  this._clearUnsavedChanges = function ()
  {
    m_aChangedAttrs.clear ();
    m_aChangedRels.clear ();

    if (m_aSaveButton)
    {
      m_aSaveButton.disable ();
    }

    // Set the tab's appearance to saved
    this.setSavedState (true);
  };

  /*
    Protected method that shows the change history for the current object.
  */
  //--------------------------------------------------------------------
  this._showChangeHistory = function ()
  //--------------------------------------------------------------------
  {
    showChangeHistory (m_sArtefactId, m_nArtefactType);
  };

  this._getIcon = function ()
  {
    return m_aNBData.iconUrl;
  };

  this._setTimeFilterField = function (aField, bMax)
  {
    if (bMax)
    {
      m_aMaxTimeFilterField = aField;
    }
    else
    {
      m_aMinTimeFilterField = aField;
    }
  };

  this._getTimeFilterField = function (bMax)
  {
    return bMax ? m_aMaxTimeFilterField : m_aMinTimeFilterField;
  };

  this._getTabContextMenu = function ()
  {
    return new  Ext.menu.Menu
                (
                  {
                    items:
                    [
                      new Ext.menu.Item
                      (
                        {
                          text: getString("bla")
                        }
                      )
                    ]
                  }
                );
  };

  /*
    Protected function that generates a fixed url for the current tab.

    \retval The generated fix url for the current tab.
  */
  //--------------------------------------------------------------------
  this._generateURL = function ()
  //--------------------------------------------------------------------
  {
    // Create the base url
    var sURL = "t=nb&id="+m_sArtefactId+"&at="+this.getArtefactType();
    // If the artefact is a modelling instance, put the model's id into the url as well
    if (this.getArtefactType() === AIT_ARTEFACT_MODINST)
    {
      sURL+="&mid="+m_sModelId;
    }
    return sURL;
  };

  this._onRelChange = function (sRelation, aChange)
  {
    m_aChangedRels.add (sRelation, aChange);

    // Set the tab's appearance to unsaved
    this.setSavedState (false);
    if (m_aSaveButton)
    {
      m_aSaveButton.enable();
      m_aSaveButton.removeClass("x-item-disabled");
    }
  };

  this._getControls = function ()
  {
    var aCtrls = [];
    for (var i = 0; i < m_aChapters.length;++i)
    {
      aCtrls = aCtrls.concat (m_aChapters[i].getControls());
    }

    return aCtrls;
  };
  
  this._getData = function ()
  {
    return m_aNBData;
  };
};

// boc.ait.notebook.Notebook is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.Notebook,
  boc.ait.Tab,
  {
    // public members:
    doClose : function ()
    {
      return this._doClose ();
    },

    isEditable : function ()
    {
      return this._isEditable ();
    },

    /*
        Returns the class id of the object whose notebook we are
        displaying.
        \retval The class id
    */
    //--------------------------------------------------------------------
    getClassID : function ()
    //--------------------------------------------------------------------
    {
      return this._getClassID ();
    },

    /*
        Public method that returns the artefacttype of the notebook

        \retval The type of artefact that is displayed.
    */
    //--------------------------------------------------------------------
    getArtefactType: function ()
    //--------------------------------------------------------------------
    {
      return this._getArtefactType ();
    },

    /*
        Public method that returns the id of the artefact that is represented in the
        notebook
        \retval The id of the artefact that is represented in the
        notebook
    */
    //--------------------------------------------------------------------
    getArtefactId : function ()
    //--------------------------------------------------------------------
    {
      return this._getArtefactId ();
    },

    getParentId : function ()
    {
      return this._getParentId ();
    },

    /*
        Public method that switches the mode

        \param bEditMode If this is true, the notebook is switched to edit mode
                         Otherwise, it is switched to readmode
    */
    //--------------------------------------------------------------------
    switchMode: function (bEditMode)
    //--------------------------------------------------------------------
    {
      this._switchMode (bEditMode);
    },

    /*
        Public method that is called whenever one of the values in the fields
        contained in the notebook changes. The new value is passed and gets added
        to the m_aChangedAttrs Array.
        \param sField The name of the attribute that was changed
        \param aNewVal The new value of the field
    */
    //--------------------------------------------------------------------
    onAttrChange : function (sField, aNewVal, bNoValue)
    //--------------------------------------------------------------------
    {
      checkParam (sField, "string");
      // aNewVal is not checked, it can be string, number, object, boolean, ...
      this._onAttrChange (sField, aNewVal, bNoValue);
    },

    /*
        Public method that is called whenever one of the values in the fields
        contained in the notebook changes back to the old value. Then the given
        field is removed out of the aAttrChangeArray
        \param sField The name of the attribute that was changed
    */
    //--------------------------------------------------------------------
    rmAttrChange : function(sField)
    //--------------------------------------------------------------------
    {
      checkParam (sField, "string");
      this._rmAttrChange (sField);
    },

    /*
        Public method that saves the changed values in the notebook.
    */
    //--------------------------------------------------------------------
    save : function (aSaveCallBack, bSilent)
    //--------------------------------------------------------------------
    {
      this._save (aSaveCallBack, bSilent);
    },

    clearUnsavedChanges : function ()
    {
      this._clearUnsavedChanges ();
    },

    /*
        Public function that displays the current artefact's change history
    */
    //--------------------------------------------------------------------
    showChangeHistory: function ()
    //--------------------------------------------------------------------
    {
      this._showChangeHistory ();
    },

    setTimeFilterField : function (aField, bMax)
    {
      this._setTimeFilterField (aField, bMax);
    },

    getTimeFilterField : function (bMax)
    {
      return this._getTimeFilterField (bMax);
    },

    getTabContextMenu : function ()
    {
      return this._getTabContextMenu ();
    },

    onRelChange : function (sRelation, aChange)
    {
      this._onRelChange (sRelation, aChange);
    },

    isEditMode : function ()
    {
      return this._isEditMode ();
    },

    getControls : function ()
    {
      return this._getControls ();
    },
    
    getData : function ()
    {
      return this._getData ();
    }
  }
);

// Register the notebook's xtype
Ext.reg("notebook", boc.ait.notebook.Notebook);