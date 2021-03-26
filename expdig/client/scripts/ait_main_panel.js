/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.MainPanel class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait', 'boc.ait.search');


/*
    Implementation of the class boc.ait.MainPanel. This class contains the tabs in the center
    region of the web client
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.MainPanel = function (aConfig)
//--------------------------------------------------------------------
{
  var that = this;
  // private members
  var m_aStartPage = null;
  var m_aCustomStartpage = null;
  var m_aSearchTab = null;
  var m_aCfgWindow = null;

  aConfig = aConfig || {};

  Ext.History.init();

  // Handle this change event in order to restore the UI to the appropriate history state.
  Ext.History.on('change', function(token){Ext.History.forward();});

  Ext.History.add(1);
  Ext.History.add(0);

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    try
    {
      aConfig.deferredRender = false;
      aConfig.hideMode = "offsets";
      // Activate the first panel
      aConfig.activeTab = 0;
      // allow scrolling the tabs when the space in the panel header is not sufficient
      aConfig.enableTabScroll = true;
      aConfig.autoScroll = false;
      // Redo the layout everytime the tab is changed
      aConfig.layoutOnTabChange = true;


      aConfig.resizeTabs= true;
      aConfig.minTabWidth= 175;
      aConfig.tabWidth= 175;
      aConfig.border = false;

      if (g_aGlobalData.customStartpage && g_aGlobalData.customStartpage.content)
      {
        m_aCustomStartpage = new com.boc.axw.HTMLTab
        (
          {
            closable:false,
            content: g_aGlobalData.customStartpage.content,
            title: g_aGlobalData.customStartpage.title
          }
        );

        g_aSettings.showCustomStartpage = true;
      }

      // Check if a startpage should be shown
      if (g_aSettings.showStartPage)
      {
        // Create a new instance of the start page
        m_aStartPage = new boc.ait.StartPage
        (
          {
            title: getString("ait_startpage_title"),
            id: 'ait_startpage'
          }
        );

        m_aStartPage.on("afterrender", function (aPanel)
          {
            aPanel.body.dom.style.backgroundImage = "url(images/screen.jpg)";
            aPanel.body.dom.style.backgroundRepeat = "no-repeat";
            aPanel.body.dom.style.backgroundPosition = "left bottom";
          }
        );
        // Add the startpage to the mainpanel's items
        aConfig.items =
        [
          m_aStartPage
        ];
      }


      /*
        Inner function that closes the currently opened tab.
      */
      //--------------------------------------------------------------------
      var aCloseTabFunction = function ()
      //--------------------------------------------------------------------
      {
        // Get the web client's main area
        var aMainArea = g_aMain.getMainArea();
        if (!aMainArea)
        {
          return;
        }
        // Get the active Tab from the main area
        var aTab = g_aMain.getMainArea().getActiveTab();
        // If there is a tab and it is closable, we close it
        if (aTab && aTab.closable)
        {
          // Remove the tab and destroy it
          aMainArea.remove(aTab, true);
        }
      };

      // Add a binding to the key map. When the user presses 'escape', the currently active
      // tab in the web client's main area is closed
      g_aKeyMap.addBinding
      (
        {
          key: Ext.EventObject.ESC,
          scope: Ext.getBody(),
          fn: aCloseTabFunction
        }
      );

      aConfig.listeners =
      {
        /*
          Listener for the tabchange event that shows or hides the slider in the
          status bar
        */
        //--------------------------------------------------------------------
        tabchange: function (aTabPanel, aTab)
        //--------------------------------------------------------------------
        {
          // If there is no web client yet, ignore the event
          if (!g_aMain)
          {
            return;
          }

          //HFa: enabled zoom widget for model editor
          // If the tab is a graphical view, show the zoom slider and
          // configure it according to the zoom info in the tab.

          //which can be asked whether or not the zoom slider should be shown
          if (!g_aSettings.offline && (aTab instanceof boc.ait.views.GraphicalView))
          {
            g_aMain.getStatusBar().showZoomSlider (aTab.getZoomInfo());
          }
          // Otherwise, hide the zoom slider
          else
          {
            g_aMain.getStatusBar().hideZoomSlider ();
          }
        },
        render: function (aPanel)
        {
          if (m_aCustomStartpage)
          {
            aPanel._showTab (m_aCustomStartpage);
            aPanel.remove(m_aStartPage);
            aPanel.body.addClass("axw-content-area");
          }
          else if (!m_aStartPage.items || m_aStartPage.items.length === 0)
          {
            aPanel.openSearchTab();
            aPanel.remove(m_aStartPage);
          }
        }
      };

      g_aEvtMgr.on("instancesdeleted", function (aDeletedInstanceIDs)
        {
          for (var i = 0; i < aDeletedInstanceIDs.length;++i)
          {
            var sID = aDeletedInstanceIDs[i];
            var aTab = that.findById(sID);
            // Check if the artefact we just deleted was opened in a tab, if so close the tab
            if (!aTab)
            {
              aTab = that.findById("notebook-"+sID);
            }
            if (aTab)
            {
              that.remove(aTab, true);
            }
            // If we did not find the tab, maybe it is undocked and opened as a window
            else
            {
              if (!aTab)
              {
                aTab = Ext.getCmp ("win-"+sID);
              }
              if (!aTab)
              {
                aTab = Ext.getCmp ("win-notebook-"+sID);
              }
              if (aTab)
              {
                aTab.close();
              }
            }
          }
        }
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // protected members:
  this._onHistoryChange = function ()
  {
    Ext.History.forward();
  };


  /*
      Protected method that opens the notebook of the element with the passed sID
      \param sID The id of the element whose notebook should be opened
      \param nArtefactType The type of artefact that was passed. Can be one of AIT_ARTEFACT_OBJECT or AIT_ARTEFACT_DIAGRAM
      \param bUndocked [optional] True if the notebook should be displayed undocked, otherwise false.
  */
  //--------------------------------------------------------------------
  this._openNotebook = function (sID, nArtefactType, bUndocked, aHighlightParams, sViewId, sModelId)
  //--------------------------------------------------------------------
  {
    return this._openNB
    (
      {
        artefactId : sID,
        artefactType: nArtefactType,
        undocked: bUndocked,
        highlightParams: aHighlightParams,
        viewId: sViewId,
        modelId: sModelId
      }
    );
  };

  /*
      Protected method that opens the notebook of the element with the passed sID
      \param sID The id of the element whose notebook should be opened
      \param nArtefactType The type of artefact that was passed. Can be one of AIT_ARTEFACT_OBJECT or AIT_ARTEFACT_DIAGRAM
      \param bUndocked [optional] True if the notebook should be displayed undocked, otherwise false.
  */
  //--------------------------------------------------------------------
  this._openNB = function (aParams)
  //--------------------------------------------------------------------
  {
    try
    {
      var sID = aParams.artefactId;
      var nArtefactType = aParams.artefactType;
      var bUndocked = aParams.undocked;
      var aHighlightParams = aParams.highlightParams;
      var sViewId = aParams.viewId;
      var sModelId = aParams.modelId;
      var aCallback = aParams.callback;
      var aScope = aParams.scope || this;

      var sTabID = "notebook-"+sID;
      // Try to find an already opened component with the notebook of the passed id's element
      var aTab = Ext.getCmp(sTabID);
      // If we found an existing component....
      if (aTab)
      {
        // Try to find a tab with the current id and show it
        if (this.findById(sTabID))
        {
          aTab.show();

          if (typeof aCallback === "function")
          {
            aCallback.call(aScope, aTab);
          }
        }
        // If we could not find a tab with the id, the tab was undocked and is now a window
        else
        {
          // Find the window containing the notebook and bring it to front
          var aWin = Ext.getCmp("win-"+sTabID);
          if (aWin)
          {
            aWin.toFront();
            if (typeof aCallback === "function")
            {
              aCallback.call(aScope, aWin);
            }
          }
        }
      }
      // If we could not find a component with the passed id, we create a new notebook
      else
      {
        // Mask the main area's body
        //this.body.mask('Loading', 'x-mask-loading');
        maskWC();
        var aShowTabFn = this._showTab;
        if (bUndocked)
        {
          aShowTabFn = this._showTabUndocked;
        }

        var aSuccessCB = function (aTab, bUnmasked)
        {
          aShowTabFn.call (this, aTab, bUnmasked, aCallback, aScope);
        };

        g_aEvtMgr.fireEvent("notebook");
        // Create a new notebook
        new boc.ait.notebook.Notebook
        (
          {
            // The objectid of the notebook is the passed id
            artefactId: sID,
            viewId: sViewId,
            modelId: sModelId,
            artefactType: nArtefactType,
            scope: this,
            // When the notebook was created, it will be shown by the passed callback
            success: aSuccessCB,
            // On failure, unmask the body
            failure: function ()
            {
              this.destroy ();
              unmaskWC ();
              if (typeof aCallback === "function")
              {
                aCallback.call(aScope);
              }
            },

            highlightParams: aHighlightParams
          }
        );

      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Protected method that opens the diagram of the element with the passed sID
      \param sID The id of the element whose diagram should be opened
      \retval true, if a new tab was opened, false, if an existing tab was brought to the front
  */
  //--------------------------------------------------------------------
  this._openDiagram = function (sID)
  //--------------------------------------------------------------------
  {
    this._openModel
    (
      {
        artefactId: sID
      }
    );
  };


  /*
      Protected method that opens the diagram of the element with the passed sID
      \param sID The id of the element whose diagram should be opened
      \retval true, if a new tab was opened, false, if an existing tab was brought to the front
  */
  //--------------------------------------------------------------------
  this._openModel = function (aParams)
  //--------------------------------------------------------------------
  {
    //document.log = document.log || "";
    //document.log+=new Date().getTime() + ": Started retrieving diagram\n";

    var sID = aParams.artefactId;
    var aCallback = aParams.callback;
    var aScope = aParams.scope || this;

    try
    {
      // Try to find an already opened component with the diagram of the passed id's element
      var aTab = Ext.getCmp(sID);
      // If we found an existing component....
      if (aTab)
      {
        // Try to find a tab with the current id and show it
        if (this.findById(sID))
        {
          aTab.show();

          if (typeof aCallback === "function")
          {
            aCallback.call (aScope, aTab);
          }
        }
        // If we could not find a tab with the id, the tab was undocked and is now a window
        else
        {
          // Find the window containing the diagram and bring it to front
          var aWin = Ext.getCmp("win-"+sID);
          if (aWin)
          {
            aWin.toFront();
            if (typeof aCallback === "function")
            {
              aCallback.call (aScope, aWin);
            }
          }
        }
      }
      else
      {
        // Mask the main area's body
        maskWC();
        // Create a new graphical view
        new boc.ait.views.GraphicalView
        (
          {
            artefactId: sID,
            // The scope for all callbacks is the mainpanel
            scope: this,
            // On success, show the view in a new tab
            success: function (aTab, bUndocked)
            {
              this._showTab (aTab, bUndocked, aCallback, aScope);
            },
            // On failure, unmask the body
            failure: function (aTab)
            {
              unmaskWC ();
              if (typeof aCallback === "function")
              {
                aCallback.call (aScope, aTab);
              }
            }
          }
        );
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
    Protected function that opens a view. To retrieve the view,
    the passed aRetrieverConfig will be used.
    \param aRetrieverConfig An object containing information how to retrieve the view
  */
  //--------------------------------------------------------------------
  this._openView = function (aOpenViewConfig)
  //--------------------------------------------------------------------
  {
    try
    {
      // Mask the main area's body
      maskWC();

      aOpenViewConfig.scope = aOpenViewConfig.scope || this;

      var aCallback = aOpenViewConfig.callback;

      var aSuccessCB = function (aTab, bUnmasked)
      {
        this._showTab.call (this, aTab, bUnmasked, aCallback, aOpenViewConfig.scope);
      };

      aOpenViewConfig.success = aOpenViewConfig.success || aSuccessCB;
      aOpenViewConfig.failure = aOpenViewConfig.failure|| unmaskWC;

      // Create a new graphical view
      new boc.ait.views.GraphicalView (aOpenViewConfig);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Protected method that opens a searchresult
  */
  //--------------------------------------------------------------------
  this._openSearchTab = function (aParams)
  //--------------------------------------------------------------------
  {
    try
    {
      aParams = aParams || {};
      // Mask the main area's body
      //this.body.mask('Loading', 'x-mask-loading');
      maskWC();

      // Create a new searchWindow
      if (!m_aSearchTab || aParams.forceNewTab === true)
      {

        var bClosable = true;
        // The search page is only closable if it is not the first shown tab
        if (!m_aCustomStartpage && aParams.forceNewTab !== true && (!m_aStartPage.items || m_aStartPage.items.length === 0))
        {
          bClosable = false;
        }
        m_aSearchTab = new boc.ait.search.SearchWindow
        (
          {
            // The objectid of the notebook is the passed id
            //objectid:sID,
            scope: this,
            // When the notebook was created, it will be shown by the passed callback
            success: this._showTab,
            searchConfig: aParams.searchConfig,
            // On failure, unmask the body
            failure: unmaskWC,
            closable: bClosable
          }
        );

        // Remove the searchtab variable when the searchtab is closed
        m_aSearchTab.on("destroy", function ()
          {
            m_aSearchTab = null;
          },
          this
        );
      }
      else
      {
        m_aSearchTab.show();
        unmaskWC();
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };


  /*
      Protected method that opens a BIA for the element with the passed sID
      \param aNodes The nodes that are marked in the tree
  */
  //--------------------------------------------------------------------
  this._openBIA = function (aNodes)
  //--------------------------------------------------------------------
  {
    try
    {
      // Mask the mainpanel's body
      //this.body.mask('Loading', 'x-mask-loading');
      maskWC();

      // create a new BIA view
      new boc.ait.views.BIAView
      (
        {
          artefacts: aNodes,
          // Scope for all callbacks is the mainpanel
          scope: this,
          // On success show the BIA in a new tab
          success: this._showTab,
          // On failure, unmask the body
          failure: unmaskWC
        }
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Protected method that opens a window which shows all diagrams in
      which the selected instance is used
      \param aNodes The nodes that are marked in the tree
  */
  //--------------------------------------------------------------------
  this._openUsedInModels = function (aParams)
  //--------------------------------------------------------------------
  {
    try
    {
      maskWC();

      // create a new window with a list of diagrams
      new boc.ait.views.UsedInModelsWindow
      (
        {
          artefact: aParams.artefact,
          noModelsText: getString("ait_no_diagrams_found"),
          callback: aParams.callback,
          silent: aParams.silent,
          // Scope for all callbacks is the mainpanel
          scope: aParams.scope || this,
          // On failure, unmask the body
          failure: unmaskWC
        }
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Protected method that shows the passed tab and unmasks the main panel
      This method is usually passed as a callback to notebooks and views.
      \param aTab The tab that was created and should be shown in the main panel
      \param bDoNotUnmask If this is true, this function will not unmask the main panel's body. In this
             case the calling component has to handle the unmasking itself.
  */
  //--------------------------------------------------------------------
  this._showTab = function (aTab, bDoNotUnmask, aCallbackFn, aScope)
  //--------------------------------------------------------------------
  {
    try
    {
      // Store the scope of this function in a private variable
      // Later we will use this variable to call the functions in the inner showtab-function
      var that = this;
      aScope = aScope || this;

      /*
          Inner function that adds the tab to the main panel, shows it and
          unmasks the mainpanel's body
      */
      //--------------------------------------------------------------------
      var aShowTab = function ()
      //--------------------------------------------------------------------
      {
        that.add(aTab);

        aTab.doLayout();
        aTab.show();
        if (bDoNotUnmask !== true)
        {
          unmaskWC();
        }

        g_aMain.doLayout();
        if (typeof aCallbackFn === "function")
        {
          aCallbackFn.call (aScope, aTab);
        }
      };

      // Execute the actual functionality after a short time to create a fade out effect
      setTimeout(aShowTab, 250);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Protected method that shows the passed tab undocked (=in a separate window)and unmasks the main panel
      This method is usually passed as a callback to notebooks and views.
      \param aTab The tab that was created and should be shown undocked
  */
  //--------------------------------------------------------------------
  this._showTabUndocked = function(aTab)
  //--------------------------------------------------------------------
  {
    try
    {
      /*
          Inner function that adds the tab to the main panel, shows it and
          unmasks the mainpanel's body
      */
      //--------------------------------------------------------------------
      var aShowTab = function ()
      //--------------------------------------------------------------------
      {
        var aWindow = new Ext.Window
        (
          {
            width:400,
            height:600,
            items: aTab,
            modal: true,
            layout:'fit'
          }
        );
        aWindow.show();
        unmaskWC();
      };

      // Execute the actual functionality after a short time to create a fade out effect
      setTimeout(aShowTab, 250);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Protected function that returns a reference to the web client's start page.

      \retval Returns the web client's start page
  */
  //--------------------------------------------------------------------
  this._getStartPage = function ()
  //--------------------------------------------------------------------
  {
    return m_aStartPage;
  };

  this._getCustomStartpage = function ()
  {
    return m_aCustomStartpage;
  };

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.MainPanel.superclass.constructor.call(this, aConfig);

  this.on("beforeremove", function (aCont, aCmp)
    {
      if (aCmp instanceof boc.ait.notebook.Notebook)
      {
        var nRes = aCmp.doClose ();
        return nRes;
      }
    }
  );

  this._getView = function (sViewId)
  {
    for (var i = 0; i < this.items.getCount ();++i)
    {
      var aCurItem = this.items.get(i);
      if ((typeof aCurItem.getViewId) !== "function")
      {
        continue;
      }
      var sCurViewId = aCurItem.getViewId();
      if (sCurViewId && sCurViewId === sViewId)
      {
        return aCurItem;
      }
    }
    return null;
  };

  /*
    Private function that returns an object containing all open tabs and whether
    there are unsaved tabs or not.

    \retval An object containing two members:
              tabs: An array containing all open tabs
              unsavedTabs: This is true if there are tabs containing unsaved changes, otherwise false
  */
  //--------------------------------------------------------------------
  function innerGetRelevantTabs (aParams)
  //--------------------------------------------------------------------
  {
    aParams = aParams || {};
    var aOpenTabData = [];
    var aOpenTabs = [];
    var aUnsavedTabData = [];

    // Iterate through all of the tab panel's items
    this.items.each
    (
      function (aItem)
      {
        // If the item is not closable, ignore it
        if (!aItem.initialConfig.closable)
        {
          return;
        }
        // Iterate through all passed tabs to ignore
        for (var i = 0; aParams.tabsToIgnore && i < aParams.tabsToIgnore.length;++i)
        {
          // If the current tab should be ignored, return
          if (aItem === aParams.tabsToIgnore[i])
          {
            return;
          }
        }

        var bUnsaved = false;
        if ((typeof aItem.getSavedState) === "function")
        {
          // Check the current tab's saved state
          bUnsaved = !aItem.getSavedState ();
        }

        if (bUnsaved)
        {
          var aTabData =
          {
            text: aItem.initialConfig.title,
            idClass_lang: (typeof aItem.getClassName === "function") ? aItem.getClassName () : "",
            iconUrl: aItem.getIcon (),
            id: aItem.id,
            _is_leaf:true
          };

          aOpenTabData[aOpenTabData.length] = aTabData;
          aUnsavedTabData[aUnsavedTabData.length] = aTabData;
        }

        aOpenTabs[aOpenTabs.length] = aItem;
      },
      this
    );

    // Create the return object
    return  {
              tabData: aOpenTabData,
              tabs: aOpenTabs,
              unsavedTabData: aUnsavedTabData
            };
  }

  /*
    Protected function that closes all open and closable tabs.

    \param aParams A param object containing:
            tabsToIgnore: An array of tabs not to close
            callback:     A callback function that is called as soon as all the tabs are closed
            scope:        The scope in which the callback function is executed
  */
  //--------------------------------------------------------------------
  this._closeTabs = function (aParams)
  //--------------------------------------------------------------------
  {
    aParams = aParams || {};

    /*
      Private function that closes the passed tabs

      \param aTabInfo An object containing tabs to close
    */
    //--------------------------------------------------------------------
    function innerCloseTabs (aTabInfo, aTabsToSave)
    //--------------------------------------------------------------------
    {
      // Iterate through all passed tabs
      for (var i = 0; i < aTabInfo.tabs.length;++i)
      {
        var aTab = aTabInfo.tabs[i];
        // If the current tab is unsaved, save and close it
        if ((typeof aTab.getSavedState) === "function" && !aTab.getSavedState ())
        {
          var bFound = false;
          for (var j = 0; j < aTabsToSave.length;++j)
          {
            if (aTabsToSave[j].id === aTab.id)
            {
              aTab.close
              (
                {
                  save: true
                }
              );
              bFound = true;
              break;
            }
          }

          if (!bFound)
          {
            aTab.close
            (
              {
                save:false
              }
            );
          }
        }
        // Otherwise, just remove the tab
        else
        {
          //this.remove (aTabInfo[i]);
          if ((typeof aTab.close) === "function")
          {
            aTabInfo.tabs[i].close
            (
              {
                save:false
              }
            );
          }
          else
          {
            this.remove (aTab);
          }
        }
      }


      /*
        Private function that is called when all tabs are closed.

        This function checks if there are still open tabs, in which case it sleeps for 200 ms and then
        calls itself again.
      */
      //--------------------------------------------------------------------
      function innerStopCloseTabs ()
      //--------------------------------------------------------------------
      {
        // See if there are no open tabs levt
        if (innerGetRelevantTabs.call (this, aParams).tabs.length === 0)
        {
          // Call the passed callback function
          if (typeof aParams.callback === "function")
          {
            var aScope = aParams.scope || this;
            aParams.callback.call (aScope, true);
          }
          // Otherwise, just unmask the Web Client
          else
          {
            unmaskWC ();
          }
        }
        // If there are still open tabs, wait for 200 seconds and call yourself again
        else
        {
          innerStopCloseTabs.defer (200, this);
        }
      }

      // Call a function that checks whether all tabs are closed and continue
      innerStopCloseTabs.call (this);
    }

    // Retrieve information about all open tabs
    var aRelevantTabInfo = innerGetRelevantTabs.call (this, aParams);

    // If there are tabs containing unsaved data, ask the user how to proceed
    if (aRelevantTabInfo.unsavedTabData.length > 0)
    {
      // Open a dialog showing all tabs containing unsaved changes and ask the user which
      // tabs should be savwed
      var aDialog = new boc.ait.UnsavedTabsDialog
      (
        {
          title: getStandardTitle (),
          data: aRelevantTabInfo.unsavedTabData,
          scope: this,
          /*
            Anonymous callback function that indicates what the user selected

            \param sResult Can be either "cancel" or "continue"
            \param aSelections An array of records the user selected to be saved
          */
          callback: function (sResult, aSelections)
          {
            // If the user selected cancel, call the callback function for the current function
            // if there is one
            if (sResult === "cancel")
            {
              if (typeof aParams.callback === "function")
              {
                var aScope = aParams.scope || this;
                aParams.callback.call (aScope, false);
              }
              return;
            }
            // If the user selected continue, begin closing the tabs
            else if (sResult === "continue")
            {
              innerCloseTabs.call (this, aRelevantTabInfo, aSelections);
            }
          }
        }
      );
      aDialog.show ();
    }
    // If there are only tabs with saved content, begin closing them
    else
    {
      innerCloseTabs.call (this, aRelevantTabInfo);
    }
  };

  /*
    Protected function that returns an array containing all open tabs.

    \retval An array containing the open tabs in the mainpanel
  */
  //--------------------------------------------------------------------
  this._getOpenTabs = function ()
  //--------------------------------------------------------------------
  {
    return innerGetRelevantTabs.call (this).tabs;
  };

  this._setConfigWindow = function (aWindow)
  {
    m_aCfgWindow = aWindow;
  };

  this._getConfigWindow = function ()
  {
    return m_aCfgWindow;
  };
};

// boc.ait.MainPanel is derived from Ext.TabPanel
Ext.extend
(
  boc.ait.MainPanel,
  Ext.TabPanel,
  {
    // public members

    /*
      Public function that opens the notebook of the element with the passed sID
      \param sID The id of the element whose notebook should be opened
      \param nArtefactType The type of artefact that was passed. Can be one of AIT_ARTEFACT_OBJECT or AIT_ARTEFACT_DIAGRAM
      \param bUndocked [optional] True if the notebook should be displayed undocked, otherwise false.
    */
    //--------------------------------------------------------------------
    openNotebook : function (sID, nArtefactType, bUndocked, aHighlightParams, sViewId, sModelId)
    //--------------------------------------------------------------------
    {
      checkParam (sID, "string");
      checkParam (nArtefactType, "number");
      checkParamNull (bUndocked, "boolean");
      checkParamNull (aHighlightParams, "object");

      this._openNotebook (sID, nArtefactType, bUndocked, aHighlightParams, sViewId, sModelId);
    },

    openNB : function (aParams)
    {
      checkParam (aParams, "object");

      this._openNB (aParams);
    },

    /*
      Public function that opens the diagram with the passed sID
      \param sID The id of the diagram that should be opened
      \retval true, if a new tab was opened, false, if an existing tab was brought to the front
    */
    //--------------------------------------------------------------------
    openDiagram : function (sID)
    //--------------------------------------------------------------------
    {
      checkParam (sID, "string");

      this._openDiagram (sID);
    },

    openModel : function (aParams)
    {
      checkParam (aParams, "object");

      this._openModel (aParams);
    },

    /*
      Public function that opens a view. To retrieve the view,
      the passed aRetrieverConfig will be used.
      \param aRetrieverConfig An object containing information how to retrieve the view
    */
    //--------------------------------------------------------------------
    openView : function (aOpenViewConfig)
    //--------------------------------------------------------------------
    {
      checkParam (aOpenViewConfig, "object");

      this._openView (aOpenViewConfig);
    },

    /*
      Public function that opens a BIA for the element with the passed sID
      \param aNodes The selected nodes for which the BIA should be executed
    */
    //--------------------------------------------------------------------
    openBIA : function (aNodes)
    //--------------------------------------------------------------------
    {
      checkParam (aNodes, "object");

      this._openBIA (aNodes);
    },

    /*
      Public function that opens a BIA for the element with the passed sID
      \param aNodes The selected nodes for which the BIA should be executed
    */
    //--------------------------------------------------------------------
    openUsedInModels : function (aParams)
    //--------------------------------------------------------------------
    {
      checkParam (aParams, "object");

      this._openUsedInModels (aParams);
    },

    /*
      Public function that opens the search tab and passes the search
      data to the search window.
    */
    //--------------------------------------------------------------------
    openSearchTab : function (aParams)
    //--------------------------------------------------------------------
    {
      this._openSearchTab (aParams);
    },

    /*
      Public function that returns a reference to the web client's startpage.
      \retval The web client's start page
    */
    //--------------------------------------------------------------------
    getStartPage: function ()
    //--------------------------------------------------------------------
    {
      return this._getStartPage();
    },

    getCustomStartpage : function ()
    {
      return this._getCustomStartpage ();
    },

    getActiveNotebook: function ()
    {
      return this._getActiveNotebook ();
    },

    getView : function (sViewId)
    {
      return this._getView (sViewId);
    },

    /*
      Public function that returns an array containing all open tabs.

      \retval An array containing the open tabs in the mainpanel
    */
    //--------------------------------------------------------------------
    getOpenTabs : function ()
    //--------------------------------------------------------------------
    {
      return this._getOpenTabs ();
    },

    /*
      Public function that closes all open and closable tabs.

      \param aParams A param object containing:
              tabsToIgnore: An array of tabs not to close
              callback:     A callback function that is called as soon as all the tabs are closed
              scope:        The scope in which the callback function is executed
    */
    //--------------------------------------------------------------------
    closeTabs : function (aParams)
    //--------------------------------------------------------------------
    {
      checkParamNull (aParams, "object");

      this._closeTabs (aParams);
    },

    setConfigWindow : function (aWindow)
    {
      this._setConfigWindow (aWindow);
    },

    getConfigWindow : function ()
    {
      return this._getConfigWindow ();
    }
  }
);

// Register the mainpanel's xtype
Ext.reg("boc-mainpanel", boc.ait.MainPanel);
