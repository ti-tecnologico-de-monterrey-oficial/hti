/* ********************************************************************
 * \note Copyright\n
 * This file is part of ADOit.\n
 * (C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2017\n
 * All Rights Reserved\n 
 * Use, duplication or disclosure restricted by BOC Information Systems\n
 * Vienna, 1995 - 2017
 * *********************************************************************
 * \author MWh
 * This file contains JS functionality for the startup of the ADOit
 * WebClient.
 * *********************************************************************
 */

// Overwrite the blank image url for the tree. This normally points to an url in the domain www.extjs.com
Ext.BLANK_IMAGE_URL = 'ext/resources/images/default/s.gif';  // 2.0

Ext.namespace ("com.boc.axw");
Ext.namespace ("boc.ait");

com.boc.axw._mouseDown = null;

var MyAjax = function(param)
{
  Ext.apply(this, param || {});
  this.method = this.method || 'POST';
  MyAjax.superclass.constructor.call(this);

  if (this.success)
  {
    this.on('requestcomplete', this.success);
  }
  if (this.failure)
  {
    this.on('requestfailed', this.failure);
  }
};


Ext.Ajax.on ("requestcomplete", function (aConn, aResponse, aOptions)
  {
    var sSessionID = aResponse.getResponseHeader("sessionID");
    if (sSessionID)
    {
      WindowStorage.set("sessionID", sSessionID);
    }
  }
);


boc.ait.viewList = {};
/*
  Global function that adds a plugin to the global plugin array
  \param aPlugin An object describing the plugin to install
*/
//--------------------------------------------------------------------
boc.ait.registerView = function (aView)
//--------------------------------------------------------------------
{
  boc.ait.viewList[aView.viewType] = aView;

  /*
    Private function that adds a menu entry to the passed menu
  */
  /*--------------------------------------------------------------------*/
  function addMenuEntry (aMenu)
  /*--------------------------------------------------------------------*/
  {
    aMenu.insertCommand
    (
      {
        cmdId: aView.id,
        /* Add the portfolio view to the main view menu */
        superMenuId: 'ait_menu_main_views'
      }
    );
  }
  
  /* Apply the overlay to the report menu */
  applyOverlay (boc.ait.menu.ReportMenu, null, addMenuEntry);


  /*
    Private function that adds the portfolio menu entry to a component's
    context menu
  */
  /*--------------------------------------------------------------------*/
  function extendCmpContextMenu (aCmp)
  /*--------------------------------------------------------------------*/
  {
    aCmp.getContextMenu().insertCommand
    (
      {
        cmdId: aView.id,
        superMenuId: 'ait_menu_main_views'
      }
    );
  }

  /* Extend the main tree's, the graphical view's and all search results' context menus */
  applyOverlay (boc.ait.Tree, null, extendCmpContextMenu);
  applyOverlay (boc.ait.search.SearchResult, null, extendCmpContextMenu);
  applyOverlay (boc.ait.views.GraphicalView, null, extendCmpContextMenu);
};

boc.ait.setWebClientInitialized = function ()
{
  Ext.get('loading').remove();
  g_aSettings.initialized = true;
  unmaskWC ();
  g_aEvtMgr.fireEvent ("ait.webclient.ready", g_aMain);
};

/*
  Global function that is called when the settings were loaded
*/
//--------------------------------------------------------------------
var settingsLoaded = function ()
//--------------------------------------------------------------------
{
  /*
    Inner function that is called when all data has finished loading
  */
  //--------------------------------------------------------------------
  var aDataLoaded = function (aDataToLoad)
  //--------------------------------------------------------------------
  {
    // we are in offline mode and not both the tree and the diagram data has loaded, return
    // ! Offline mode is not supported at the moment, so please ignore this setting !
    if(g_aSettings.offline)
    {
      aDataToLoad.loaded = true;

      for (var i = 0; i < g_aOfflineDataToLoad.length;++i)
      {
        if (!g_aOfflineDataToLoad[i].loaded)
        {
          return;
        }
      }
    }

    // Create a new keymap to create behavior when certain keys are pressed
    g_aKeyMap = new Ext.KeyMap
    (
      //document.body,
      Ext.getBody(),
      //document,
      // Add an empty config, every component is responsible for adding a binding
      []
    );

    // Iterate through the plugins and load them
    for (var s in boc.ait.pluginList)
    {
      var aPlugin = boc.ait.pluginList[s];
      if ((typeof aPlugin) === "object")
      {
        aPlugin.load ();
      }
    }
    
    // Create a new WebClient
    g_aMain = new boc.ait.WebClient();
    
    aTimeoutFct ();
  };

  // If we are in offline mode, load the offline data
  if (g_aSettings.offline)
  {
    g_aOfflineDataToLoad =
    [
      {url:'../data/objecttree-data-'+g_aSettings.lang+'.ajson', loaded: false},
      {url:'../data/diagramtree-data-'+g_aSettings.lang+'.ajson', loaded: false},
      {url:'../data/ait_object_search-'+g_aSettings.lang+'.ajson', loaded:false},
      {url:'../data/ait_model_search-'+g_aSettings.lang+'.ajson', loaded:false}
    ];

    for (var i = 0; i < g_aOfflineDataToLoad.length;++i)
    {
      loadOfflineData(g_aOfflineDataToLoad[i], aDataLoaded);
    }

    g_aSettings.searchData = g_aMMData[g_aSettings.lang];
    g_aSettings.productData = g_aProductData;

    g_aSettings.filePointerProtocols = ["http","https","ftp"];

    document.title = getStandardTitle ();
  }
  else
  {
    // If no Data could be loaded, return
    if (!this.reader.jsonData || !this.reader.jsonData.payload)
    {
      return;
    }

    // Iterate through all web settings and apply them to the global settings object
    var aWCSettings = this.reader.jsonData.payload;
    for (var sKey in aWCSettings.generalSettings)
    {
      if (sKey.indexOf("general_") === 0)
      {
        g_aSettings[sKey.substring(("general_").length, sKey.length)] = aWCSettings.generalSettings[sKey];
      }
    }

    g_aSettings.lang  = aWCSettings.lang;
    // Get the creatable classes from the returned data
    g_aSettings.creatableClasses = aWCSettings.creatableClasses;
    // Get the deletable classes from the returned data
    g_aSettings.deletableClasses = aWCSettings.deletableClasses;
    // Get the search data from the returned data
    g_aSettings.searchData = aWCSettings.startupData.searchData;
    g_aSettings.BIAenabled = aWCSettings.startupData.BIAenabled;
    g_aSettings.productData = aWCSettings.productData;
    
    g_aSettings.filePointerProtocols = aWCSettings.filePointerProtocols;
    g_aSettings.langList = aWCSettings.langList;

    g_aSettings.user = aWCSettings.user;
    g_aSettings.filterSettings = aWCSettings.filterSettings;

    g_aSettings.showOwnerInWebSearchResults = aWCSettings.startupData.showOwnerInWebSearchResults;
    if (g_aSettings.showOwnerInWebSearchResults)
    {
      g_aSettings.ownerShipRelClass = aWCSettings.startupData.searchData.ownerShipRelClass;
    }

    document.title += " (" + g_aSettings.user.loginName + ")";

    // Store the repository data in the global settings
    g_aSettings.repoData = aWCSettings.repoData;

    // Store information about visible attributes in the global settings
    g_aSettings.visibleObjectAttrs = aWCSettings.visibleObjectAttrs;
    g_aSettings.visibleModelAttrs = aWCSettings.visibleModelAttrs;

    aDataLoaded();
    // Initialize quick tips to show tooltips
    Ext.QuickTips.init();
  }

  // Upon startup show a slowly fading mask for the entire screen. This results in a cool effect (fireworks ... )
  function aTimeoutFct ()
  {
    if (g_aSettings.initialized !== true && g_aMain)
    {
      if (Ext.get('loading-mask'))
      {
        Ext.get('loading-mask').fadeOut({remove:true});
      }
      if (!boc.ait.isEmpty(g_aParams))
      {
        maskWC ();

        var bUnmask = false;
        try
        {
          // Get the type of parameter ("nb" for notebook or "view")
          var sType = g_aParams.t;
          if (Ext.isEmpty(sType))
          {
            bUnmask = true;
            return;
          }
          
          var nArtefactType = AIT_ARTEFACT_OBJECT;
          // Handle views
          if (sType === "view")
          {
            var sViewType = g_aParams.vt;
            // Get the view type
            if (Ext.isEmpty(sViewType))
            {
              bUnmask = true;
              return;
            }

            // Handle the graphical view
            if (sViewType === "graphical")
            {
              // If there is no id, ignore the start parameters
              if (Ext.isEmpty(g_aParams.id))
              {
                bUnmask = true;
                return;
              }
              g_aMain.getMainArea().openModel
              (
                {
                  artefactId: "{"+g_aParams.id+"}",
                  callback: boc.ait.setWebClientInitialized
                }
              );
            }
            else
            {
              var aArtefacts = [];
              // Create a record template for the base objects/model for the view
              var ArtefactTemplate = Ext.data.Record.create
              (
                [
                  {name: 'id'},
                  {name: 'artefactType'}
                ]
              );
              // Get the artefact info
              var sArtInfo = g_aParams.ai;
              // If there is artefact info, get all passed artefact ids and their artefact type
              if (!Ext.isEmpty(sArtInfo))
              {
                var aArtInfo = sArtInfo.split(",");
                if (aArtInfo.length === 0)
                {
                  bUnmask = true;
                  return;
                }
                for (var i = 0; i < aArtInfo.length;++i)
                {
                  var sArtPair = aArtInfo[i];
                  // If there is no | (separator between id and artefact type), ignore the parameters
                  if (sArtPair.indexOf("|") === -1)
                  {
                    bUnmask = true;
                    return;
                  }
                  var aArtPair = sArtPair.split("|");
                  // If the pair does not have exactly two contained elements, ignore the parameters
                  if (aArtPair.length !== 2)
                  {
                    bUnmask = true;
                    return;
                  }
                  nArtefactType = Ext.num(aArtPair[1]);
                  if (nArtefactType === undefined)
                  {
                    bUnmask = true;
                    return;
                  }
                  // Create the current artefact info
                  aArtefacts[i] = new ArtefactTemplate
                  (
                    {
                      id: "{"+aArtPair[0]+"}",
                      artefactType: nArtefactType
                    },
                    "{"+aArtPair[0]+"}"
                  );
                }
              }
              // Otherwise, the base artefact has to be a model. There have to be the parameters
              // "id" and "at" (artefact type)
              else if (!Ext.isEmpty (g_aParams.id) && !Ext.isEmpty(g_aParams.at))
              {
                nArtefactType = Ext.num(g_aParams.at);
                if (nArtefactType === undefined)
                {
                  bUnmask = true;
                  return;
                }

                // Create the artefact info
                aArtefacts[0] = new ArtefactTemplate
                (
                  {
                    id: "{"+g_aParams.id+"}",
                    artefactType: nArtefactType
                  },
                  "{"+g_aParams.id+"}"
                );
              }
              else
              {
                bUnmask = true;
                return;
              }

              // Open the view. We also pass the config instance id as we don't want to have
              // a configuration window, we already know the right configuration
              g_aMain.getMainArea().openView
              (
                {
                  artefacts: aArtefacts,
                  viewType: sViewType,
                  configInstId: "{"+g_aParams.cid+"}",
                  callback: boc.ait.setWebClientInitialized
                }
              );
            }
          }
          // Handle notebooks
          else if (sType === "nb")
          {
            // If there is no "id" or no "at" (artefacttype), we ignore the parameters
            if (Ext.isEmpty(g_aParams.id) || Ext.isEmpty (g_aParams.at))
            {
              bUnmask = true;
              return;
            }
            nArtefactType = Ext.num(g_aParams.at);
            // If the artefact type is no number or the artefact is a modelling instance, but there
            // was no model id passed, we ignore the parameters
            if ((nArtefactType === undefined) || (nArtefactType === AIT_ARTEFACT_MODINST && Ext.isEmpty (g_aParams.mid)))
            {
              bUnmask = true;
              return;
            }

            // Open the notebook
            g_aMain.getMainArea().openNB
            (
              {
                artefactId : "{"+g_aParams.id+"}",
                artefactType: nArtefactType,
                undocked: false,
                highlightParams: null,
                viewId: null,
                modelId: (!Ext.isEmpty(g_aParams.mid) ? "{"+g_aParams.mid+"}" : ""),
                callback: boc.ait.setWebClientInitialized
              }
            );
          }
        }
        catch (aEx)
        {
          displayErrorMessage (aEx);
          bUnmask = true;
        }
        finally
        {
          // If an error occurred, we unmask the web client, otherwise this is done by the called
          // functionality for us (e.g. open a notebook)
          if (bUnmask)
          {
            boc.ait.setWebClientInitialized ();
          }
          // Otherwise, we reset the parameters - we already handled them.
          else
          {
            g_aParams = {};
          }
        }
      }
      else
      {
        boc.ait.setWebClientInitialized ();
      }
      if (Ext.get('loading-mask'))
      {
        Ext.get('loading-mask').fadeOut({remove:true});
      }
    }
    else
    {
      aTimeoutFct.defer (500, this);
    }
  }
};

try
{
  // Use a state provider to store the user's setting (selected theme) in a cookie
  Ext.state.Manager.setProvider(new Ext.state.CookieProvider({}));
  var sTheme = Ext.state.Manager.get("Theme");
  
  // The viewport that defines the overall layout
  var g_aMain = null;
  var g_sLog = "";

  var g_aEvtMgr = new boc.ait.EventManager ();

  // Global array that holds the available plugin for the web client
  boc.ait.pluginList = [];

  /*
    Global function that adds a plugin to the global plugin array
    \param aPlugin An object describing the plugin to install
  */
  //--------------------------------------------------------------------
  function registerPlugin (aPlugin)
  //--------------------------------------------------------------------
  {
    checkParam (aPlugin, "object");
    checkParam (aPlugin.id, "string");

    if (aPlugin.type === "view")
    {
      boc.ait.registerView (aPlugin);
    }
    else
    {
      checkParam (aPlugin.load, "function");
      boc.ait.pluginList[aPlugin.id] = aPlugin;
    }

    return true;
  }

  function getLanguageWithFallback (sPreferredLanguageID)
  {
    //hardcoded fallback to "en"
    var sLanguageIDToCheck = sPreferredLanguageID || "en";
    if (!g_aLangs)
    {
      console.warn ("no languages available. cannot really fallback. still trying with " + sLanguageIDToCheck);
      return sLanguageIDToCheck;
    }
    
    for (var i = 0; i < g_aLangs.length; ++i)
    {
      if (g_aLangs [i].id === sLanguageIDToCheck)
      {
        return sLanguageIDToCheck;
      }
    }
    return g_aLangs [0].id;
  }

  function setLangIDAndLoadLanguageFile (sLangID, settingsLoaded)
  {
    g_aSettings.lang = sLangID;
    loadOfflineData
    (
      {url:'locale/'+sLangID+".js", loaded:false},
      settingsLoaded
    );
  }

  // Global keymap to create eventhandlers for certain key strokes
  var g_aKeyMap = null;
  //var g_nMaskCnt = 0;

  // Global settings for the web client
  g_aSettings =
  {
    loggedin: true,
    initialized: false,
    page:"main",
    lang: "en",
    // Is the web client used in offline mode?
    offline: true,
    // Should searching be allowed?
    allowSearching: true,
    // Should moving elements in the catalog be allowed?
    allowMoving: true,
    // Should deleting artefacts be allowed?
    allowDeleting: true,
    // Should creating new objects be allowed?
    allowCreatingNewObjects: true,
    // Should creating new object groups be allowed?
    allowCreatingObjectGroups: true,
    // Should creating new model groups be allowed?
    allowCreatingModelGroups: true,
    // Should renaming of elements directly in the tree be allowed?
    allowRenaming: true,
    // Should the BIA functionality be activated?
    allowBIA: true,
    // Should the portfolio functionality be activated?
    allowPortfolio:true,
    // Should the tree panel be expanded on startup? - By default the tree panel is expanded if there is no start page
    // If there is a start page and it contains plugins, the tree panel is not shown. Customized plugins may overwrite
    // this setting - CR #051823
    showTreePanel: undefined,
    // Which tree should be active by default?
    defaultTree: AIT_ARTEFACT_DIAGRAM,
    
    useRecycleBin : false,

    showStartPage: true,

    showDiagrams: true,
    useSearchByDefaultInRelDialogue: false,
    // By default hide class-specific columns in the search
    searchHideSpecificColumns : true,

    searchArtefactType: AIT_SEARCH_BOTH,

    notebookSettings:
    {
      expandedReadModeChapters : {}
    }
  };

  // Global object that holds the data if the web client is used in offline m ode
  var g_aOfflineData =
  {
    objectGroups : {},
    modelGroups:   {},
    objectSearch:  {},
    modelSearch:   {}
  };
  var g_aOfflineDataToLoad = null;
  var g_aParams = {};

  // Define a handler for the Ext.onReady event
  Ext.onReady
  (
    function()
    {
      boc.ait._parsePageParams ();

      //window.startOnReady = new Date().getTime();
      // Remove the default context menu for all browsers
      document.oncontextmenu = function ()
      {
        return false;
      };
      
      // General handling for the middle mouse button click handling.
      // Required for AXW-79458 to prevent default handling in Firefox
      document.onmousedown = function (aEvent)
      {
        var nButton = aEvent.browserEvent ? aEvent.browserEvent.button : aEvent.button;
        com.boc.axw._mouseDown = {button: nButton, target: aEvent.target};
      }
      
      document.onmouseup = function (aEvent)
      {
        if (!com.boc.axw._mouseDown)
        {
          return false;
        }
        var nButton = aEvent.browserEvent ? aEvent.browserEvent.button : aEvent.button;
        if (com.boc.axw._mouseDown.button !== nButton)
        {
          com.boc.axw._mouseDown = null;
          return false;
        }
        if (com.boc.axw._mouseDown.target !== aEvent.target)
        {
          com.boc.axw._mouseDown = null;
          return false;
        }
        
        if (nButton === 1)
        {
          if (g_aEvtMgr.fireEvent (com.boc.axw.events.MOUSE_CLICK_MIDDLE, aEvent) === false)
          {
            return false;
          }
          // If there is no event handler or the event handler did not anyway handle the event,
          // we check if a tab panel selector was middle-clicked - in this case we prevent the default behavior (AXW-79458)
          var aEl = Ext.fly (aEvent.target);
          if (aEl.hasClass ("x-tab-strip-text") || aEl.hasClass ("x-tab-strip-inner") || aEl.hasClass ("x-tab-right") || aEl.hasClass ("x-tab-left") || aEl.hasClass ("x-tab-panel"))
          {
            aEvent.preventDefault ();
            aEvent.stopPropagation ();
            return false;
          }
        }
      }
      
      // Set the ajax timeout to 6 minutes.
      Ext.Ajax.timeout = 360000;


      g_aParams = boc.ait.getURLParameters ();


      g_aSettings.debug = g_aParams.debug === "true";
      g_aSettings.testmode = g_aParams.testmode === "true";
      g_aSettings.testmode_extended = g_aParams.testmode_extended === "true";
      g_aSettings.login = g_aParams.login;

      var aClientIdField = Ext.get("clientId");
      g_aSettings.clientId = aClientIdField ? aClientIdField.getValue() : "";

      if (!g_aSettings.offline)
      {
        // If there is no session id in the url parameters, show an error message
        if (!g_aParams.sessionid && !g_aParams.login)
        {
          onSessionTimeout
          (
            {
              getResponseHeader : function(){}
            }
          );
          return;
        }

        WindowStorage.set("sessionID", g_aParams.sessionid);

        var nFilter = g_aParams.tf;

        // Create a new jsonreader
        var aReader = new Ext.data.JsonReader();
        // Retrieve the general web client settings from the server and store them in a jsonstore
        var aStore = new Ext.data.JsonStore
        (
          {
            autoDestroy:true,
            url: 'proxy',
            baseParams:
            {
              type: 'settings',
              // Pass the filter passed as an URL parameter to the settings web method
              params:Ext.encode
              (
                {
                  filter: nFilter
                }
              )
            },
            reader: aReader
          }
        );

        // Load the settings data
        aStore.load
        (
          {
            callback: settingsLoaded
          }
        );
      }
      else
      {
        var sLanguageIDToLoad = "en";
        // Check if there are any parameters
        if (!boc.ait.isEmpty(g_aParams) && g_aParams.lang)
        {
          sLanguageIDToLoad = g_aParams.lang;
        }
        setLangIDAndLoadLanguageFile (getLanguageWithFallback (sLanguageIDToLoad), settingsLoaded);
      }
    }
  );


}
catch (aEx)
{
  displayErrorMessage (aEx);
}



/*
  Global function that applys an overlay to the passed class. Has to
  be called from within a plugin. The class to be overlain has to
  include the plugin boc.ait.plugins.Customizable for this to have an effect

  \param aClass The class to overlay
  \param aScope The scope for the overlay function
  \param aOverlayFn A function that is to be called when the class is instantiated.
*/
//--------------------------------------------------------------------
var applyOverlay = function (aClass, aScope, aOverlayFn)
//--------------------------------------------------------------------
{
  checkParam (aClass, "function");
  checkParamNull (aScope, "object");
  checkParam (aOverlayFn, "function");

  // Check if the overlaid class already has an array of overlaying functions,
  // if not, create a new one
  if (!Ext.isArray(aClass.prototype.overlayingFns))
  {
    aClass.prototype.overlayingFns = [];
  }
  // Add the new overlay to the class' overlays
  aClass.prototype.overlayingFns[aClass.prototype.overlayingFns.length] =
  {
    scope: aScope,
    fn: aOverlayFn
  };
};