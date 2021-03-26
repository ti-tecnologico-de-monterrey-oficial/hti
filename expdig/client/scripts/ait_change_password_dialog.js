/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.PasswordDialog class that
is used to change a user's password.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');


/*
    Implementation of the class boc.ait.PasswordDialog.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.PasswordDialog = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var that = this;
  // Initialize the config object if necessary
  aConfig = aConfig || {};

  var m_aOldPassBox = null;
  var m_aPassPanel = null;
  var m_aNewPassBox = null;
  var m_aCheckPassBox = null;
  var m_aOKButton = null;
  var m_aCancelButton = null;
  var m_aScope = null;

  /*
      Private function that is called whenever the selection in the trees
      or the value of the name field changes
  */
  //--------------------------------------------------------------------
  var doEnableDisable = function ()
  //--------------------------------------------------------------------
  {
    var sOldPass = m_aOldPassBox.getValue();
    var sNewPass = m_aNewPassBox.getValue();
    var sCheckPass = m_aCheckPassBox.getValue();
    // If no name was entered, disable the ok button
    if (Ext.isEmpty (sOldPass) || Ext.isEmpty (sNewPass) || Ext.isEmpty (sCheckPass))
    {
      m_aOKButton.disable();
      return false;
    }

    // If all checks were passed, enable the ok button
    m_aOKButton.enable();
    return true;
  };

  /*
      Private callback function that is called when the object was succesfully created in the
      aserver.
  */
  //--------------------------------------------------------------------
  var doPasswordChanged = function (aResponse, aOptions)
  //--------------------------------------------------------------------
  {
    try
    {
      // Decode the response Object
      var aRetObj = Ext.util.JSON.decode(aResponse.responseText);
      if (aRetObj.error)
      {
        showErrorBox(aRetObj.errString);
        that.getEl().unmask();
        return;
      }

      if(aRetObj.errString)
      {
        showInfoBox(aRetObj.errString);
      }

      if(aRetObj.payload && aRetObj.payload.userLocked === true)
      {
        showErrorBox (getString("ait_password_user_locked"));
        that.getEl().unmask();
        return;
      }      
      
      if(aRetObj.payload && aRetObj.payload.wrongPw === true)
      {
        showErrorBox (getString("ait_wrong_password"));
        that.getEl().unmask();
        return;
      }

      showInfoBox (getString("ait_password_changed"));

      // Close the dialog
      that.close();
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };


  /*
      Private function that is called when the ok button is clicked.
  */
  //--------------------------------------------------------------------
  var doOk = function ()
  //--------------------------------------------------------------------
  {
    that.getEl().mask(getString("ait_loading"), 'x-mask-loading');
    var bError = false;
    try
    {
      var sOldPass = m_aOldPassBox.getValue();
      var sNewPass = m_aNewPassBox.getValue();
      var sCheckPass = m_aCheckPassBox.getValue();

      if(sNewPass != sCheckPass)
      {
        showErrorBox (getString("ait_password_mismatch"));
        that.getEl().unmask();
        return;
      }
      
      if(sNewPass == sOldPass)
      {
        showErrorBox (getString("ait_password_equal"));
        that.getEl().unmask();
        return;        
      }
      
      if(sNewPass.length < 3)
      {
        showErrorBox (getString("ait_password_too_short"));
        that.getEl().unmask();
        return;        
      }      

      var aAjaxParams =
      {
        type: "change_password",
        params:
        {
          old_pw : sOldPass,
          new_pw : sNewPass
        }
      };

      aAjaxParams.params = Ext.encode (aAjaxParams.params);

      // Start a new ajax call to create an object on the aserver
      Ext.Ajax.request
      (
        {
          url:"proxy",
          method:"POST",
          params: aAjaxParams,
          // We use the dialog as scope for the callbacks
          scope: that,
          // On success we handle the return data
          success: doPasswordChanged,
          failure: that.getEl().unmask
        }
      );
    }
    catch (aEx)
    {
      bError = true;
      displayErrorMessage (aEx);
    }
    finally
    {
      if (bError)
      {
        that.getEl().unmask();
      }
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
      // The configuration's title should be the passed title, or by default
      // the string 'Create new Object'
      aConfig.title = getString("ait_menu_main_change_password");
      aConfig.layout = 'border';
      aConfig.modal = true;

      aConfig.defaults =
      {
        style: 'padding: 5px;background-color:#FFFFFF;'
      };

      // Make sure the dialog's header is always visible
      aConfig.constrainHeader = true;

      m_aScope = aConfig.scope || this;

      // Create a new textbox where the user can enter a name for the new class
      m_aOldPassBox = new Ext.form.TextField
      (
        {
          fieldLabel:getString("ait_old_password"),
          name:'old_pass',
          inputType:'password',
          allowBlank:true,
          tabIndex: 1,
          enableKeyEvents:true,
          border: false,
          //autoWidth: true,
          //cls: "boc-notebook-singlelinefield boc-notebook-field",
          style:"width:98%;",
          listeners:
          {
            render: function ()
            {
              if (Ext.isIE8)
              {
                m_aOldPassBox.getEl().dom.parentNode.style.paddingTop= "1pt";
              }
            },
            valid: doEnableDisable,
            keyup: doEnableDisable
          }
        }
      );

      // Create a new textbox where the user can enter a name for the new class
      m_aNewPassBox = new Ext.form.TextField
      (
        {
          fieldLabel:getString("ait_new_password"),
          name:'new_pass',
          inputType:'password',
          allowBlank:true,
          tabIndex: 2,
          enableKeyEvents:true,
          border: false,
          //autoWidth: true,
          //cls: "boc-notebook-singlelinefield boc-notebook-field",
          style:"width:98%",
          listeners:
          {
            render: function ()
            {
              if (Ext.isIE8)
              {
                m_aNewPassBox.getEl().dom.parentNode.style.paddingTop= "1pt";
              }
            },
            valid: doEnableDisable,
            keyup: doEnableDisable
          }
        }
      );

      // Create a new textbox where the user can enter a name for the new class
      m_aCheckPassBox = new Ext.form.TextField
      (
        {
          fieldLabel:getString("ait_check_password"),
          name:'check_pass',
          inputType:'password',
          allowBlank:true,
          tabIndex: 3,
          enableKeyEvents:true,
          border: false,
          //autoWidth: true,
          //cls: "boc-notebook-singlelinefield boc-notebook-field",
          style:"width:98%",
          listeners:
          {
            render: function ()
            {
              if (Ext.isIE8)
              {
                m_aCheckPassBox.getEl().dom.parentNode.style.paddingTop= "1pt";
              }
            },
            valid: doEnableDisable,
            keyup: doEnableDisable
          }
        }
      );

      // Create a panel that will hold the name box
      m_aPassPanel = new Ext.Panel
      (
        {
          border: false,
          hideLabel:false,
          labelAlign: 'top',
          layout:"form",
          items:
          [
            m_aOldPassBox,
            m_aNewPassBox,
            m_aCheckPassBox
          ]
        }
      );

      aConfig.layout = 'form';
      aConfig.autoHeight = true;
      aConfig.width = '400px';
      aConfig.items =
      [
        m_aPassPanel
      ];

      aConfig.resizable = false;
      aConfig.autoDestroy = true;
      aConfig.closeAction = 'close';

      // Create the ok button
      m_aOKButton = new Ext.Button
      (
        {
          text: getString("ait_ok"),
          tabIndex: 4,
          disabled: true,
          minWidth: 80,
          handler: doOk
        }
      );

      // Create the cancel button
      m_aCancelButton = new Ext.Button
      (
        {
          text: getString("ait_cancel"),
          tabIndex: 5,
          minWidth: 80,
          handler: function ()
          {
            that.close();
          }
        }
      );

      // Setup the dialog's buttons
      aConfig.buttons =
      [
        m_aOKButton,
        m_aCancelButton
      ];

      aConfig.listeners =
      {
        render : function (aCmp)
        {
          // Create a KeyMap
           new Ext.KeyMap(aCmp.getEl(),
            {
              key: Ext.EventObject.ENTER,
              fn: function ()
              {
                //if (!m_aOKButton.disabled)
                if (doEnableDisable())
                {
                  doOk ();
                }
              }
            }
          );
        }
      };
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.PasswordDialog.superclass.constructor.call(this, aConfig);

  /*
      Handler function for the namepanel's render event
      \param aCmp The name panel
  */
  //--------------------------------------------------------------------
  m_aPassPanel.on("render", function (aCmp)
  //--------------------------------------------------------------------
    {
      if (aCmp.header)
      {
        aCmp.header.addClass ("boc-form-group-no-border");
      }
    }
  );

  this.on("show", function(aCmp)
    {
      m_aOldPassBox.focus(false, true);
    }
  );
};

// boc.ait.PasswordDialog is derived from Ext.Window
Ext.extend
(
  boc.ait.PasswordDialog,
  Ext.Window,
  {
  }
);

// Register the dialog's xtype
Ext.reg("boc-passworddialog", boc.ait.PasswordDialog);