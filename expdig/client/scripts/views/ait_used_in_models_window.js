/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
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
*/
//--------------------------------------------------------------------
boc.ait.views.UsedInModelsWindow = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var m_aModelList = null;
  var m_aOKButton = null;
  var m_aCancelButton = null;
  var m_aStore = null;
  var m_aPayload = null;
  var m_bWasParentMasked = false;
  var m_sNoModelsText = getString ("ait_no_diagrams_found");
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
      // Get the selected model and execute the callback function
      var aModelArr = m_aModelList.getSelectedElements();

      if(aModelArr.length > 0)
      {
        maskWC ();
        g_aMain.getMainArea().openModel
        (
          {
            artefactId: aModelArr[0].get("id"), 
            callback: function ()
            {
              unmaskWC ();
            }
          }
        );

        // Destroy the config window
        this.destroy();
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Private method that is called after the configs are successfully loaded from the server.
      Creates and fills the listbox shown in the config window
      the window's body and loads the config data.
  */
  //--------------------------------------------------------------------
  var fillList = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      var aConfigData = m_aPayload;

      var aEntries = [];
      // Iterate over the config array retrieved from the server
      for (var i = 0; i < aConfigData.length;++i)
      {
        var aDataEntry = aConfigData[i];
        aEntries[i] =
        {
          id: aDataEntry.modelID,
          text: boc.ait.htmlEncode (aDataEntry.modelName),
          idClass_lang: aDataEntry.idClass_lang,
          iconUrl: aDataEntry.modelIcon,
          leaf: true
        };
      }


      /*
        Inner method that is called when an entry in the config list is clicked
      */
      //--------------------------------------------------------------------
      var aOnConfigListClickFunction = function ()
      //--------------------------------------------------------------------
      {
        // get the selected model
        var aSelection = m_aModelList.getSelectedElements();

        // Enable the ok button if a model is selected
        if(aSelection.length > 0)
        {
          m_aOKButton.enable();
        }
      };

      function renderName (sValue, aMetadata, aRecord, nRowIndex, nColIndex, m_aStore)
      {
        var sPre = "";
        if (aRecord.get("broken") === true)
        {
          sPre="<img src='images/broken.png' class='ait_broken_reference_grid'/>&nbsp;";
        }
        return sPre+sValue;
      }

      function renderIcon (sValue, aMetadata, aRecord, nRowIndex, nColIndex, m_aStore)
      {
        if (aMetadata.renderInSupportDialog)
        {
          return sValue;
        }

        // Use the blank image url as the standard overlay for the modeltype, folder or class icon
        var sSrc = Ext.BLANK_IMAGE_URL;
        // If the current record is not editable, we want to overlay its icon with a lock

        // Render leaf nodes
        aMetadata.attr="style='background:url("+boc.ait.getIconPath ()+aRecord.data.iconUrl+") center center transparent no-repeat;'";

        return "<span style='background:url("+sSrc+") 6px center transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
      }

      // Create a new instance of the listbox
      m_aModelList = new boc.ait.util.ListBox
      (
        {
          // Fill the listbox with the entries we created before
          data: aEntries,
          selModel: new Ext.tree.DefaultSelectionModel(),
          anchor: '100% 100%',
          // Setup the listeners for the listbox
          listeners:
          {
            // When an entry is double clicked, the selected entry should be applied and
            // the window closed
            dblclick: onOk,
            // When an entry is selected we want to enable the ok button
            click: aOnConfigListClickFunction,
            
            scope: this
            
          },

          fields:
          [
            {name:'text'},
            {name:'id'},
            {name:'iconUrl'},
            {name:'idClass_lang'}
          ],
          columns :
          [
            new Ext.grid.RowNumberer(),
            {
              id: "idClass_lang",
              header: getString("ait_search_result_type"),
              sortable: true,
              dataIndex: "idClass_lang",
              width:40,
              fixed: true,
              renderer: renderIcon,
              name: 'idClass_lang'
            },
            {id:'text', header:'Name', sortable: true, dataIndex: 'text', renderer: renderName}
          ]
        }
      );
      // Add the config list to the config window's items
      this.add
      (
        m_aModelList
      );

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
        
        if ((typeof aConfig.callback) === "function")
        {
          aConfig.callback.call (aConfig.scope || this, aEntries, this);
        } 
      };

      aUnmaskFunction.defer(250, this);

    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };
  
  /*
  Private method that is called when the config window is shown. Masks
  the window's body and loads the config data.
  */
  //--------------------------------------------------------------------
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
      
      // Get the name of the current selected artefact for the dialogs title
      var sTitle = aConfig.artefact.get("text");
      sTitle = boc.ait.htmlEncode (sTitle);
      // Set the window's title
      aConfig.title = sTitle + " ("+aConfig.artefact.get("idClass_lang")+") : "+getString("ait_used_in_title");
    
      aConfig.modal = true;
    
      // Get the text that will be shown when there are no configurations to display
      m_sNoModelsText = aConfig.noModelsText || m_sNoModelsText;
    
      // Make sure the header is always visible
      aConfig.constrainHeader = true;
    
      // Create an OK button
      m_aOKButton = new Ext.Button
      (
        {
          minWidth: 80,
          text: getString("ait_open"),
          disabled: true,
          handler:onOk,
          scope: this
        }
      );
    
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
        //HFA: get the async call before it is shown:
        //beforeshow: onBeforeshow,  
          
        // When the window is shown, we want to populate it
        show: onShow,
        scope: this
      };
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };
  
  
  var processData = function() 
  {
    var aScope = aConfig.scope || this;
    var aData = m_aStore.reader.jsonData;
    var aConfigData = aData.payload;
    
    if (!aData || aData.error)
    {
      //handle errrors
      unmaskWC();
      if (aData && aData.error)
      {
        showInfoBox (aData.errString);
      }
      if (typeof(aConfig.failure) == "function")
      {
        aConfig.failure.call(aScope, this);
      }
    }
    else if (aConfigData.length === 0 && !aConfig.silent) 
    {
      // If there are currently no configurations for the selected elements, show an
      // info box and close the configuration window again.
      unmaskWC();
      showInfoBox
      (
        m_sNoModelsText
      );
    }
    else 
    {
      //save the retrieved data and prompt the result
      m_aPayload = aConfigData;
      buildObject.call(this); 
      boc.ait.views.UsedInModelsWindow.superclass.constructor.call(this, aConfig);
      this.show();
    }
  };
  
  var retrieveUsageData = function() 
  {
    var sID = aConfig.artefact.get("id");


    // Create a new instance of JsonStore to receive the list of configurations from the server
    m_aStore = new Ext.data.JsonStore
    (
      {
        autoDestroy:true,
        url: 'proxy',
        baseParams:
        {
          type: 'usedInModels',
          params: Ext.encode
          (
            {
              instId: sID
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
        //HFA: after data has been retrieved, check payload for content and error and visualize results
        callback: processData,
        scope: this
      }
    );
    
  };


  //HFA CR #052485, changed scoping as well to minimize usage of "that"
  //retrieve the elements, as soon as they have been retrieved, build the object and visualize it
  retrieveUsageData.call(this);
  
};

// boc.ait.views.ConfigWindow is derived from Ext.Window
Ext.extend
(
  boc.ait.views.UsedInModelsWindow,
  Ext.Window,
  {

  }
);
// Register the configwindow's xtype
Ext.reg("boc-usedinmodelswindow", boc.ait.views.UsedInModelsWindow);