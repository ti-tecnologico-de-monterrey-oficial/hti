/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.views.View class.
**********************************************************************
*/

// Create namespace boc.ait.views
Ext.namespace('boc.ait.views');

/*
    Implementation of the class boc.ait.views.View. The View is the
    base class for graphical views, BIAs and portfolios.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.views.View = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var m_bEditable = false;
  var m_aStore = null;

  var m_sModelId = null;
  var m_aArtefactIds = null;
  var m_nScrollTop = 0;
  var m_nScrollLeft = 0;

  // Initialize the config object if necessary
  aConfig = aConfig || {};

  var m_sConfigInstId = null;

  var createView = function (sConfig)
  {
    g_aMain.getMainArea().setConfigWindow (null);
    if (sConfig)
    {
      m_sConfigInstId = sConfig;
    }
    
    var aStoreConfig = aConfig.retrieverConfig ||
    {
      url: 'proxy',
      baseParams:{},
      // Use a new JsonReader as reader for the store
      reader: new Ext.data.JsonReader()
    };
    aStoreConfig.baseParams.type = "view";
    aStoreConfig.baseParams.webMethod = aConfig.webMethod || "diagraminfo";
    aStoreConfig.baseParams.params = Ext.encode
    (
      {
        artefactInfo:aConfig.artefactInfo,
        viewType: aConfig.configId || aConfig.viewType,
        configId: (aStoreConfig.baseParams.configId ? aStoreConfig.baseParams.configId : aConfig.configurable) ? sConfig : undefined
      }
    );

    aStoreConfig.autoDestroy = true;

    // Create a new instance of JsonStore to receive the diagram info data from the server
    m_aStore = new Ext.data.JsonStore (aStoreConfig);


    if (!g_aSettings.offline)
    {
      // Load the store and set a callback function
      m_aStore.load
      (
        {
          scope: this,
          callback: function (aRecords, aOptions, bSuccess)
          {
            var aData = m_aStore.reader.jsonData;

            if (!aData)
            {
              unmaskWC ();
              return;
            }

            if (aData && aData.error)
            {
              showInfoBox (aData.errString);
              unmaskWC ();
              return;
            }
            
            aConfig.callback.call(m_aStore);
            
            if (aData.payload.type === "graphical")
            {
              aConfig.id = aData.payload.artefactId;
            }

            boc.ait.views.View.superclass.constructor.call(this, aConfig);
            
            // Fix for an issue in IE which does not remember the scrolling position
            // when switching tabs.
            if (Ext.isIE)
            {
              this.on("afterrender", function (aP)
                {
                  aP.body.on("scroll", function ()
                    {
                      m_nScrollTop = aP.body.dom.scrollTop;
                      m_nScrollLeft = aP.body.dom.scrollLeft;
                    }
                  );
                }
              );
              
              this.on("activate", function (aP)
                {
                  if (aP.body)
                  {
                    aP.body.scrollTo ("top", m_nScrollTop);
                    aP.body.scrollTo ("left", m_nScrollLeft);
                  }
                }
              );
            }

            // Check if a function was passed as callback
            if (typeof(aConfig.success) === "function")
            {
              // Call the callback and pass the view tab as parameter. Also pass false to
              // make sure that the success callback does not unmask the caller's body
              var aScope = aConfig.scope || this;
              aConfig.success.apply(aScope, [this, true]);
              var sTitle = aConfig.title;
              if (sTitle.length > 50)
              {
                sTitle = sTitle.substring(0,50)+"...";
              }
              g_aMain.getStatusBar ().setStatus (getString("ait_open_artefact_successful").replace(/%ARTEFACT_NAME%/g, Ext.util.Format.htmlDecode(sTitle)));
            }
          }
        }
      );
    }
    else
    {
      aConfig.callback.call();

      boc.ait.views.View.superclass.constructor.call(this, aConfig);

      // Check if a function was passed as callback
      if (typeof(aConfig.success) === "function")
      {
        // Call the callback and pass the view tab as parameter. Also pass false to
        // make sure that the success callback does not unmask the caller's body
        var aScope = aConfig.scope || this;
        aConfig.success.apply(aScope, [this, true]);
        g_aMain.getStatusBar ().setStatus (getString("ait_open_artefact_successful").replace(/%ARTEFACT_NAME%/g, Ext.util.Format.htmlDecode(aConfig.title)));
      }
    }
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
      // Use anchor layout
      aConfig.layout = 'anchor';
      // views use the dockable plugin
      aConfig.plugins = (aConfig.plugins || []).concat ([boc.ait.plugins.Dockable]);
      // Make the view closable
      aConfig.closable = true;

      m_bEditable = aConfig.editable === true;

      m_sModelId = aConfig.modelId;
      m_aArtefactIds = aConfig.artefactIds;
        
      // For the view use either an id that was already set from the outside or the base
      // artefact's id
      aConfig.id = aConfig.id || aConfig.viewId || aConfig.artefactId;

      /*
          Inner function that is called when the view is destroyed. Unlocks
          the view's diagram.
      */
      //--------------------------------------------------------------------
      var aOnDestroyFunction = function ()
      //--------------------------------------------------------------------
      {
        function aUnlockFunction ()
        {
          var aArtefactData = this.getArtefactData();
          var bEditable = true;
          if (aArtefactData && aArtefactData instanceof Array)
          {
            bEditable = !!aArtefactData[0].get("editable");
          }
          
          // Start an ajax request that unlocks the diagram
          Ext.Ajax.request
          (
            {
              url:"proxy",
              params:
              {
                type: "unlock",
                params: Ext.encode
                (
                  {
                    id: aConfig.artefactId,
                    viewId: this.getViewId(),
                    editable: bEditable
                  }
                )
              },
              // We don't need success or failure callbacks here because
              // we don't want to do anything on success and our basex
              // extension handles all ajax failures anyway
              success: Ext.emptyFn,
              failure: Ext.emptyFn
            }
          );
        }

        if (typeof this.destroyView === "function")
        {
          this.destroyView ();
        }

        if(g_aSettings.offline)
        {
          return;
        }
        if (aConfig.artefactId)
        {
          aUnlockFunction.defer(1, this);
        }
        g_aMain.getStatusBar ().setStatus ("");
      };

      // Add a listener to the view's destroy event
      aConfig.listeners = aConfig.listeners || {};
      aConfig.listeners.scope = this;
      aConfig.listeners.destroy = aOnDestroyFunction;

      if (aConfig.configurable && aConfig.configInstId)
      {
        createView.call (this, aConfig.configInstId);
      }
      else if (aConfig.configurable && aConfig.configId)
      {
        // Get the passed scope for the callback functions. If no scope was provided, use
        // this as scope
        var aScope = this;

        // As failure callback for the config window we use the passed failure callback or -
        // if none was provided - an empty function
        var aFailureCallback = aConfig.failure || Ext.emptyFn;


        var aIDs = [];

        // Iterate through the artefacts and get their ids as well as the ids of the
        // classes they are instantiated from
        if (aConfig.artefacts)
        {
          for (var i = 0; i < aConfig.artefacts.length;++i)
          {
            aIDs[i] = aConfig.artefacts[i].get("id");
          }
        }
        else
        {
          aIDs[0] = aConfig.artefact.get("id");
        }
        
        /** HFa CR #054101, changed config window*/
        // Create a new configuration window to allow the user to pick the configuration
        // for the bia
        var aConfigWin = new boc.ait.views.ConfigWindow
        (
          {
            artefactIds: aIDs,
            applicationTestData : aConfig.appTestData,
            noConfigsText: aConfig.noConfigsText,
            viewType: aConfig.configId,
            // The scope for the callback functions
            scope: aScope,
            // On success create the view
            success: createView,
            // On failure we call the failure call back
            failure: function (aWindow)
            {
              g_aMain.getMainArea().setConfigWindow (null);
              aFailureCallback.call (aScope, aWindow);
            }
          }
        );

        /** HFa CR #054101, configwindow is shown implicitly if data is available */
        g_aMain.getMainArea ().setConfigWindow (aConfigWin);

      }
      else
      {
        createView.call (this);
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // Call to the constructor function to build the object
  buildObject.call(this);

  this._getModelId = function ()
  {
    return m_sModelId;
  };

  this._getArtefactIds = function ()
  {
    return m_aArtefactIds;
  };

  this._isEditable = function ()
  {
    return aConfig.editable === true;
  };

  this._clearUnsavedChanges = function ()
  {

  };

  this._getConfigInstId = function ()
  {
    return m_sConfigInstId;
  };

  this._setModelId = function (sModelId)
  {
    m_sModelId = sModelId;
  };

  this._getViewType = function ()
  {
    return aConfig.viewType;
  };
};

// boc.ait.views.View is derived from Ext.Panel
Ext.extend
(
  boc.ait.views.View,
  boc.ait.Tab,
  {
    getModelId: function ()
    {
      return this._getModelId ();
    },

    setModelId : function (sModelId)
    {
      this._setModelId (sModelId);
    },

    getArtefactIds : function ()
    {
      return this._getArtefactIds ();
    },

    isEditable : function ()
    {
      return this._isEditable ();
    },

    getConfigInstId : function ()
    {
      return this._getConfigInstId ();
    },

    getViewType : function ()
    {
      return this._getViewType ();
    }
  }
);

// Register the view's xtype
Ext.reg("boc-view", boc.ait.views.View);