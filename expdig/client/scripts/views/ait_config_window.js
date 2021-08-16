/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.views.ConfigWindow class.
**********************************************************************
*/

// Create namespace boc.ait.views
Ext.namespace('boc.ait.views');


/*
    Implementation of the class boc.ait.views.ConfigWindow. This class provides
    a means for the user to select a configuration for the view he wants to display
    code.
    \param aConfig The configuration object.
    HFa CR #054101 solved empty dialog box. 
    shown is now called implicitly, class resembles closely ait_used_in_models_window.js now, maybe combine them?
    before dialog is constructed, we check now first if any views are available. only if there are any, we construct the view,
    cleaned up code (jshint)
*/
//--------------------------------------------------------------------
boc.ait.views.ConfigWindow = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var m_aConfigList = null;
  var m_aOKButton = null;
  var m_aCancelButton = null;
  var m_aStore = null;
  var m_aPayload = null;
  var m_bWasParentMasked = false;
  var m_sNoConfigsText = getString ("ait_no_configs");
  // Initialize the config object if necessary
  aConfig = aConfig || {};

  /*
    Inner function that is called when the config window's ok button is clicked
  */
  //--------------------------------------------------------------------
  var onOk = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      if (m_aConfigList.getSelectedElements().length === 0)
      {
        return;
      }
      // Get the selected configuration and execute the callback function
      if ((typeof aConfig.success) === "function")
      {
        aConfig.success.call (aConfig.scope || this, m_aConfigList.getSelectedElements ()[0].get("id"));
      }
      this.on("hide", function ()
        {
          this.close ();
        },
        this
      );

      this.hide();
      // Destroy the config window
      if (m_bWasParentMasked)
      {
        maskWC();
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Private method that is called when the configs are loaded from the server.
      Creates and fills the listbox shown in the config window
      the window's body and loads the config data.
  */
  //--------------------------------------------------------------------
  var fillList = function ()
  //--------------------------------------------------------------------
  {
    try
    {

      // Get the diagram info from the data object
      var aConfigData = m_aPayload;//aData.payload;

      var aEntries = [];
      // Iterate over the config array retrieved from the server
      for (var i = 0; i < aConfigData.length;++i)
      {
        var aDataEntry = aConfigData[i];
        // Check if the current entry has an ID. At the moment only configurations for the
        // If there is no id, set the id of the data entry to some generated id
        var sFragID = aDataEntry.fragId ? aDataEntry.fragId : aConfig.viewType+"_config_"+i;

        aEntries[i] =
        {
          id: sFragID,
          configId : aConfig.viewType,
          text: aDataEntry.name
        };
      }


      /*
        Inner method that is called when an entry in the config list is clicked
      */
      //--------------------------------------------------------------------
      var aOnConfigListClickFunction = function ()
      //--------------------------------------------------------------------
      {
        if (m_aConfigList.getSelectedElements().length > 0)
        {
          // Enable the ok button
          m_aOKButton.enable();
        }
      };


      // Create a new instance of the listbox
      m_aConfigList = new boc.ait.util.ListBox
      (
        {
          anchor: '100% 100%',
          // Fill the listbox with the entries we created before
          data: aEntries
        }
      );

      m_aConfigList.getSelectionModel().on("selectionchange", aOnConfigListClickFunction);


      m_aConfigList.on("dblclick", onOk, this);

      this.add (m_aConfigList);

      // Force the config window to redo its layout
      this.doLayout();


      /*
        Inner function that unmasks the config window's body
      */
      //--------------------------------------------------------------------
      var aUnmaskFunction = function ()
      //--------------------------------------------------------------------
      {
        this.body.unmask();
      };

      // Unmask the config window after a short timeout
      aUnmaskFunction.defer(250, this);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

//  /*
//      Private method that is called when the config window is shown. Masks
//      the window's body and loads the config data.
//  */
  
  var onShow = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      // Mask the body
      this.body.mask(getString("ait_loading"), 'x-mask-loading');
    
      m_bWasParentMasked = isWCMasked();
      if (m_bWasParentMasked)
      {
        unmaskWC();
      }
    
      fillList.call(this);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };
  
  
  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      // Set the window's width
      aConfig.width = 400;
      // Set the window's height
      aConfig.height = 400;
      // Use anchor layout
      aConfig.layout = 'anchor';
      // Set the window's title
      aConfig.title = getString("ait_config_window_title");

      aConfig.modal = true;

      // Get the text that will be shown when there are no configurations to display
      m_sNoConfigsText = aConfig.noConfigsText || m_sNoConfigsText;

      // Make sure the header is always visible
      aConfig.constrainHeader = true;

      // Create an OK button
      m_aOKButton = new Ext.Button
      (
        {
          minWidth: 80,
          text: 'OK',
          disabled: true,
          handler:onOk,
          scope: this
        }
      );

      /*
          Inner function that is called when the config window is destroyed
      */
      //--------------------------------------------------------------------
      var aOnDestroyFunction = function (aClosedPanel)
      //--------------------------------------------------------------------
      {
        // Get the scope from the config or use this as scope
        var aScope = aConfig.scope || this;
        // Get the passed failure callback
        var aFailureCallback = aConfig.failure;
        // If a proper failure callback was passed, call it
        if (typeof(aFailureCallback) == "function")
        {
          aFailureCallback.apply(aScope);
        }
      };

      // Create a cancel button
      m_aCancelButton = new Ext.Button
      (
        {
          minWidth: 80,
          text: getString("ait_cancel"),
          // On cancel we destroy the window
          handler: this.destroy,
          // Use the window as scope for the callback function
          scope: this
        }
      );
      // Add the ok and the cancel button to the dialog
      aConfig.buttons =
      [
        m_aOKButton,
        m_aCancelButton
      ];

      // Set up the listeners for the config window
      aConfig.listeners =
      {
        // When the window is shown, we want to populate it
        show: onShow,
        // When the window is destroyed, we execute our event handler
        destroy: aOnDestroyFunction,
        scope: this
      };
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };
  
  /** called after retrieving data, decides if gui is constructed or message box is displayed */
  var processData = function() 
  {
 
    var aScope = aConfig.scope || this;

    // The scope for this method is the datm_aStore, so we can access its members
    // Get the json Data from the data store's reader
    var aData = m_aStore.reader.jsonData;
    // Check if we successfully retrieved the diagram info, otherwise
    // display an error message and return
    if (!aData || aData.error)
    {
      unmaskWC();
      if (aData && aData.error)
      {
        showErrorBox (aData.errString);
      }
      if (typeof(aConfig.failure) == "function")
      {
        aConfig.failure.apply(aScope, [this]);
      }
      return;
    }
    
    m_aPayload = aData.payload;


    if(m_aPayload === null || m_aPayload === undefined || m_aPayload.length === 0) {
      unmaskWC();
      showInfoBox
      (
        m_sNoConfigsText
      );

    }
    else {
      buildObject.call(this);
      boc.ait.views.ConfigWindow.superclass.constructor.call(this, aConfig);
      this.show();
    }
    
  };
  
  /** retrieves the information for the gui before it is constructed */
  var retrieveUsageData = function() 
  {
    try
    {
      // Create a new instance of JsonStore to receive the list of configurations from the server
      m_aStore = new Ext.data.JsonStore
      (
        {
          autoDestroy:true,
          url: 'proxy',
          baseParams:
          {
            type: 'getconfigs',
            params: Ext.encode
            (
              {
                configId: aConfig.viewType,
                appTestData: aConfig.applicationTestData
              }
            )
          },
          // Use a new JsonReader as reader for the store
          reader: new Ext.data.JsonReader()
        }
      );

      // Load the store and set a callback function
      m_aStore.load
      (
        {
          callback: processData,
          scope: this
        }
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };  

  /** buildobject and constructer call of superclass is only called if necessary */
  retrieveUsageData.call(this);

};

// boc.ait.views.ConfigWindow is derived from Ext.Window
Ext.extend
(
  boc.ait.views.ConfigWindow,
  Ext.Window,
  {

  }
);
// Register the configwindow's xtype
Ext.reg("boc-configwindow", boc.ait.views.ConfigWindow);