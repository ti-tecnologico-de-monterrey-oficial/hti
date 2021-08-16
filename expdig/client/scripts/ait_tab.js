/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2016\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2016
**********************************************************************
\author MWh
This file contains the code for the boc.ait.Tab class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');

/*
    Implementation of the class boc.ait.Tab. The View is the
    base class for graphical views, BIAs and portfolios.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.Tab = function (aConfig)
//--------------------------------------------------------------------
{
  var m_bSavedState = true;

  // Create a context menu for the tab header
  // By default included are 'close', 'close all' and 'close all others'
  var m_aTabContextMenu = new boc.ait.menu.Menu
  (
    {
      commands:
      [
        "ait_menu_tab_close",
        "ait_menu_tab_close_all",
        "ait_menu_tab_close_all_others",
        "-",
        "ait_menu_main_generate_url"
      ]
    }
  );

  // Set the context menu's context (the tab)
  m_aTabContextMenu.setParams (this);
  try
  {
    m_aTabContextMenu.setContext (this.getArtefactData ());
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }

  aConfig.plugins = [boc.ait.plugins.Customizable];
  
  
  /*
    Protected function that returns the tab's context menu

    \retval The tab's context menu
  */
  //--------------------------------------------------------------------
  this._getTabContextMenu = function ()
  //--------------------------------------------------------------------
  {
    return m_aTabContextMenu;
  };

  boc.ait.Tab.superclass.constructor.call (this, aConfig);

  /*
    Protected function that changes the tab's appearance (= font color) depending on the passed parameter
    \param bSaved If this is false, there are unsaved changes and the tab's font color is switched to red
                  If this is true, there are no unsaved changes anymore, the tab's font color is changed to black

  */
  //--------------------------------------------------------------------
  this._setSavedState = function (bSaved)
  //--------------------------------------------------------------------
  {
    m_bSavedState = bSaved;
    if (!this.ownerCt || ((typeof this.ownerCt.getTabEl) !== "function"))
    {
      return;
    }
    var aTabStrip = Ext.get (this.ownerCt.getTabEl (this));
    if (!aTabStrip)
    {
      return;
    }
    var aSpan = Ext.get(Ext.query("span", aTabStrip.dom)[1]);
    if (!aSpan)
    {
      return;
    }
    aSpan.setStyle ("color", bSaved ? "black" : "red");
  };

  /*
    Protected function that returns whether the tab is currently saved or there are unsaved changes
    \retval True if there are no unsaved changes, otherwise false

  */
  //--------------------------------------------------------------------
  this._getSavedState = function ()
  //--------------------------------------------------------------------
  {
    return m_bSavedState;
  };

  /*
    Protected function that closes the tab

    \param aParams A Js object that contains members:
            save: true, if the tab should be saved before closing it, otherwise false
            callback: A callback function that is called after the closing is completed
            scope: The scope for the callback function
  */
  //--------------------------------------------------------------------
  this._close = function (aParams)
  //--------------------------------------------------------------------
  {
    aParams = aParams || {};
    // If changes should be saved, the tab's save function is called
    if (aParams.save)
    {
      this.save
      (
        /*
          Anonymous function that serves as a callback for the save function
          After the save is done, the callback passed to the close function is called
        */
        function ()
        {
          this.ownerCt.remove (this);
          if (typeof aParams.callback === "function")
          {
            aParams.callback.call ((aParams.scope || this));
          }
        },
        // The saving should be done in a silent way
        true
      );
    }
    // Otherwise, clear unsaved changes, close the tab and call the callback
    else
    {
      if (this.ownerCt)
      {
        this.clearUnsavedChanges ();
        this.ownerCt.remove (this);
        if (typeof aParams.callback === "function")
        {
          aParams.callback.call ((aParams.scope || this));
        }
      }
    }
  };
};

// boc.ait.views.View is derived from Ext.Panel
Ext.extend
(
  boc.ait.Tab,
  boc.ait.GenericTab,
  {
    /*
      Public function that returns data about the current artefact.

      \retval Data describing the current artefact.
    */
    //--------------------------------------------------------------------
    getArtefactData : function ()
    //--------------------------------------------------------------------
    {
      if (this._getArtefactData)
      {
        return this._getArtefactData ();
      }
      return null;
    },
    
    /*
      Public function that returns the tab's context menu

      \retval The tab's context menu
    */
    //--------------------------------------------------------------------
    getTabContextMenu : function ()
    //--------------------------------------------------------------------
    {
      return this._getTabContextMenu ();
    },


    /*
      Public function that initializes the tab (sets initial event listeners, so
      the context menu is created correctly
    */
    //--------------------------------------------------------------------
    initTab : function ()
    //--------------------------------------------------------------------
    {
      this._initTab ();
    },

    /*
      Public function that changes the tab's appearance (= font color) depending on the passed parameter
      \param bSaved If this is false, there are unsaved changes and the tab's font color is switched to red
                    If this is true, there are no unsaved changes anymore, the tab's font color is changed to black

    */
    //--------------------------------------------------------------------
    setSavedState : function (bUnsaved)
    //--------------------------------------------------------------------
    {
      this._setSavedState (bUnsaved);
    },

    /*
      Public function that returns whether the tab is currently saved or there are unsaved changes
      \retval True if there are no unsaved changes, otherwise false

    */
    //--------------------------------------------------------------------
    getSavedState : function ()
    //--------------------------------------------------------------------
    {
      return this._getSavedState ();
    },

    /*
      Public function that closes the tab

      \param aParams A Js object that contains members:
              save: true, if the tab should be saved before closing it, otherwise false
              callback: A callback function that is called after the closing is completed
              scope: The scope for the callback function
    */
    //--------------------------------------------------------------------
    close : function (aParams)
    //--------------------------------------------------------------------
    {
      this._close (aParams);
    },

    /*
      Public function that returns the url of the icon of the current tab
      \retval A string containing the icon url of the tab
    */
    //--------------------------------------------------------------------
    getIcon : function ()
    //--------------------------------------------------------------------
    {
      return this._getIcon ();
    },

    /*
      Public function that clears any unsaved changes from the tab
    */
    //--------------------------------------------------------------------
    clearUnsavedChanges : function ()
    //--------------------------------------------------------------------
    {
      this._clearUnsavedChanges ();
    },

    /*
      Public function that generates a fixed url for the current tab.

      \retval The generated fix url for the current tab.
    */
    //--------------------------------------------------------------------
    generateURL : function ()
    //--------------------------------------------------------------------
    {
      return this._generateURL();
    }
  }
);

// Register the view's xtype
Ext.reg("boc-tab", boc.ait.Tab);