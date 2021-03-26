/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains JS functionality for the startup of the ADOxx Web
WebClient.
**********************************************************************
*/

Ext.BLANK_IMAGE_URL = 'ext/resources/images/default/s.gif';  // 2.0


var g_aLoginSettings = {};

var g_aSettings =
{
  user:
  {
    loginName:''
  },
  page:"login"
};


// Called when all scripts are loaded
Ext.onReady
(
  /*
      Function that is called when all resources are loaded. Sets up the
      login page.
  */
  //--------------------------------------------------------------------
  function()
  //--------------------------------------------------------------------
  {
    boc.ait._parsePageParams ();

    Ext.Ajax.timeout = 360000;

    // Define the interval for connection attempts to the web server to get the current
    // initialisation status of the web app
    var UPDATE_INTERVAL = 5000;
    
    var sToolkit = "main";
    if (g_aSettings.pageParams.forward && g_aSettings.pageParams.forward === "admin")
    {
      sToolkit = "admin";
    }
    var sImgSrc = "images/sys/"+sToolkit+"_startup.png";
  
    // Create the image to be shown on the login page
    var aImage =
    {
      xtype: 'box',
      autoEl:
      {
        tag: "img",
        id: "adoitnp_image",
        src: sImgSrc,
        style: "margin:5px;"
      }
    };

    // Create the container panel for the image
    var aImagePanel = new Ext.Panel
    (
      {
        title: '',
        items: aImage,
        region:'north',
        width: 475,
        style: 'margin-top:50px;margin-bottom:15px;margin-left: auto; margin-right: auto;',
        bodyStyle:"border-color: green"
      }
    );
    
    var aStatusBox = new Ext.BoxComponent
    (
      {
        xtype: 'box',
        hidden:true,
        autoEl:
        {
          tag: "div",
          id:"ait_login_page_init_status_div",
          style: "margin:5px;text-align:center;color:blue;",
          html: boc.ait.getServerInitStateAsHTML ()
        }
      }
    );

    var aLoadingIndicator = new Ext.BoxComponent
    (
      {
        xtype: 'box',
        hidden:true,
        autoEl:
        {
          tag: "div",
          style: "margin:5px;text-align:center;color:blue;",
          html:"<table style='text-align:center;width:100%;'><tr><td><img src='ext/resources/images/default/grid/loading.gif'/></td></tr></table>",
          id:"indicator"
        }
      }
    );
    
    // Create the outer panel that holds the image and the login panel with the login form.
    var aOuterPanel = new Ext.Panel
    (
      {
        layout:'form',
        region:'center',
        autoScroll: true,
        items:
        [
          aImagePanel,
          aStatusBox,
          aLoadingIndicator
        ]
      }
    );

    function renderLoginMask ()
    {
      var aLangField = null;

      var sLang = g_aLoginSettings.lang || "en";

      Ext.get("adoitnp_image").set
      (
        {
          src:"images/sys/"+sLang+"/"+sToolkit+"_about_screen.png"
        }
      );

      // Initialize the quick tips
      Ext.QuickTips.init();

      
      var aNameField = null;
      var aLoginButton = null;
      
      /*
        Is called whenever some text is input into the text fields.
        Evaluates the input text and then enables or disables the login
        button accordingly.
      */
      //--------------------------------------------------------------------
      var enableDisableLoginFct = function ()
      //--------------------------------------------------------------------
      {
        // Only enable the login button, if a name and a password were provided
        if (aNameField.getValue().length > 0)
        {
          aLoginButton.enable();
        }
        else
        {
          aLoginButton.disable();
        }
      };

      // Create a text field where the user can enter his username
      aNameField = new Ext.form.TextField
      (
        {
          fieldLabel:getString("ait_user"),
          name:'name',
          allowBlank:true,
          style: "width:150px;margin-top:1px",
          tabIndex: 1,
          enableKeyEvents: true,
          listeners:
          {
            render: function(){this.focus();},
            keyup: enableDisableLoginFct
          }
        }
      );

      // Create a text field where the user can enter his password
      var aPassField = new Ext.form.TextField
      (
        {
          fieldLabel:getString("ait_password"),
          name:'pass',
          inputType:'password',
          allowBlank:true,
          style: "width:150px;",
          tabIndex: 2,
          enableKeyEvents:true,
          listeners:
          {
            keyup: enableDisableLoginFct
          }
        }
      );

      var aLoginItems =
      [
        //aImagePanel,
        aNameField,
        aPassField
      ];

      if (g_aLoginSettings.showLangSelection)
      {
        var aLangData = [];
        for (var i = 0; i < g_aLoginSettings.loginLangs.length;++i)
        {
          var sLangId = g_aLoginSettings.loginLangs[i].listKey.substring(0,2);
          aLangData[aLangData.length] = [sLangId, getString("ait_lang_"+sLangId)];
        }
        // Create a simple store containing the available languages
        var aLangStore = new Ext.data.SimpleStore
        (
          {
            fields: ['id', 'val'],
            data : aLangData
          }
        );

        // Create a combobox with the available languages for the user to pick
        aLangField = new Ext.form.ComboBox
        (
          {
            name: 'lang',
            //style: "width:150px;",
            width:159,
            store: aLangStore,
            mode: 'local',
            forceSelection: true,
            triggerAction: 'all',
            selectOnFocus:true,
            tabIndex: 3,
            editable:false,
            fieldLabel: getString("ait_lang"),
            valueField: 'id',
            displayField:'val'
          }
        );

        aLangField.value = sLang;

        aLoginItems[aLoginItems.length] = aLangField;
      }

      // Create a new panel that will contain the fields wie just created
      var aFieldPanel = new Ext.Panel
      (
        {
          title:'',
          layout:'form',
          style:'text-align:left;padding-left:100px;padding-top:10px;',
          bodyStyle: 'border: none;',
          items: aLoginItems
        }
      );

      /*
        Is called when the user's login attempt was successful. Forwards the
        user to the main page.
      */
      //--------------------------------------------------------------------
      var onLoginSuccess = function (aResponseObj, aOptionsObj)
      //--------------------------------------------------------------------
      {
        WindowStorage.set("idm_mode", "none");

        if (!g_aSettings.pageParams.forward || g_aSettings.pageParams.forward === "main")
        {
          boc.ait.forwardToMainPage (aResponseObj.getResponseHeader ("sessionID"), null);
        }
        else
        {
          var sHref = g_aSettings.pageParams.forward+".jsp"+"?sessionid="+aResponseObj.getResponseHeader ("sessionID");
          
          if (g_aSettings.pageParams.debug)
          {          
            sHref+="&debug=true";
          }
          document.location.href = sHref;
        }
      };

      /*
        Is called when the user's login attempt was not successful.
        Shows an error message to the user
      */
      //--------------------------------------------------------------------
      var onLoginFailure = function (aResponseObj, aOptionsObj)
      //--------------------------------------------------------------------
      {
        // If the login failed because the web server could not connect to the repository
        // with the specified username and password, show an error message
        var sError = aResponseObj.getResponseHeader("error");

        if(sError)
        {

          if (sError.indexOf("ait_") === 0)
          {

            // Remove this block when moving back to Ext JS 3.0
            if (Ext.isIE)
            {
              //sError = sError.substring(0, sError.length - 1 );
              sError = sError.trim();
              sError = sError.replace(/\n/g, "").replace(/\r/g, "");
            }

            if (sError === "ait_max_license_users")
            {
              sError = getString (sError).
                        replace(/%MAX_USERS%/g, aResponseObj.getResponseHeader("maxLicUsers")).
                        replace(/%DB_NAME%/g, aResponseObj.getResponseHeader ("dbName"));
            }
            else
            {
              sError = getString (sError);
            }
          }

          showErrorBox (sError, getString("ait_login_failed"), function(){aNameField.focus();});
        }
        // Otherwise, we could not reach the authentication server
        else
        {
          showErrorBox (getString("ait_server_unreachable")+"\n"+ aResponseObj.responseText, null, function(){aNameField.focus();});
        }
        // Reset the password field
        aPassField.reset();
        // Unmask the form
        Ext.getBody().unmask();
      };
      
      /*
        Is called when the user clicks the login button or presses enter.
      */
      //--------------------------------------------------------------------
      var submitFct = function ()
      //--------------------------------------------------------------------
      {
        // Mask the body
        Ext.getBody().mask(getString("ait_loading"), 'x-mask-loading');

        g_aSettings.user =
        {
          loginName: aNameField.getValue()
        };


        Ext.Ajax.request
        (
          {
            url:"auth",
            method:"POST",
            params:
            {
              lang: g_aLoginSettings.showLangSelection ? aLangField.getValue() : sLang,
              name: aNameField.getValue(),
              pass: encodeURIComponent (aPassField.getValue()),
              forward: g_aSettings.pageParams.forward
            },
            // Define a callback function that is called when the login attempt was successful
            success: onLoginSuccess,
            failure: onLoginFailure
          }
        );
      };

      /*
        Is called when the user presses enter somewhere on the form.
        If a username and a password were provided, starts the login process
      */
      //--------------------------------------------------------------------
      var onPressEnter = function (nKey, aEvent)
      //--------------------------------------------------------------------
      {
        // Necessary to kill the beep in internet explorer when pressing enter in a textbox
        aEvent.stopEvent();

        // Only login if a username and a password were provided
        if (aNameField.getValue ().length > 0)
        {
          submitFct ();
        }
        // Return false to stop the form from reloading the page.
        return true;
      };

      // The button that starts the login process
      aLoginButton = new Ext.Button
      (
        {
          text:getString("ait_login"),
          disabled: true,
          width:80,
          handler:submitFct,
          style:'font-size:12px;',
          cls:'ait_login_button'
        }
      );

      // Create our login panel
      var aLoginPanel = new Ext.FormPanel
      (
        {
          id:'ait_login_panel',
          baseCls : 'login-panel-base',
          hidden:true,
          cls : 'login-panel',
          buttonAlign:'center',
          standardSubmit: true,
          labelWidth:80,
          // The url to which our data will be submitted
          //url:'auth',
          url:'main.jsp',
          action:'main.jsp',
          width:475,
          items: aFieldPanel,
          buttons:[aLoginButton]
        }
      );

      aLoginPanel.on
      (
        "render",
        function (aPanel)
        {
          // Creates a keymap that allows the user to simply press Enter to login
          new Ext.KeyMap
          (
            aPanel.getEl(),
            {
              key: Ext.EventObject.ENTER,
              fn: onPressEnter
            }
          );
        }
      );

      // Add the login panel to the outer panel, then redo the layout
      aOuterPanel.add (aLoginPanel);
      aOuterPanel.doLayout ();

      // Show the login panel, so there are no strange gui effects when doing the layout
      aLoginPanel.show();
      aLoginPanel.doLayout ();

      // Focus the name field
      aNameField.focus();
    }

    new Ext.Viewport
    (
      {
        layout:'border',
        autoHeight:true,
        autoScroll:true,
        items:
        [
          aOuterPanel
        ]
      }
    );

    // The time to update is the defined update interval
    var nTimeToUpdate = UPDATE_INTERVAL;
    // Initially this variable is true, so the status dependent render tries to
    // get the current initialisation status from the server
    var bInitialConnectionTry = true;

    /*
      Function that renders the content of the login mask based on the status of the web server.
    */
    function doStatusDependentRender ()
    {
      //showErrorBox(getString("ait_connection_to_webserver_lost"));
      var sInitStatus = Ext.get("server_state").getValue();

      // If the web server is done initializing get the settings for the login mask (login language, usertype, etc.)
      if (sInitStatus === "ait_initialization_complete")
      {
        Ext.Ajax.request
        (
          {
            url:"login",
            method:"POST",
            success: function (aResponseObj, aOptions)
            {
              g_aLoginSettings = Ext.decode(aResponseObj.responseText);
              // Dynamically load the locale javascript. Default language is english
              loadOfflineData
              (
                {url:"scripts/locale/"+(g_aLoginSettings.lang || "en")+".js?a="+Ext.id()+(new Date().getTime()), loaded:false},
                function ()
                {
                  // Hide the status box and render the actual login mask
                  aStatusBox.hide ();
                  aLoadingIndicator.hide ();
                  renderLoginMask ();
                }
              );
            }
          }
        );
      }
      else
      {
        // Otherwise make sure that the statusbox is shown
        aStatusBox.show();
        aLoadingIndicator.show ();

        if (nTimeToUpdate === 0 || bInitialConnectionTry)
        {
          nTimeToUpdate = UPDATE_INTERVAL;

          // Set the current interval indicator to 0 or the remaining seconds to the next update
          Ext.get("ait_login_page_init_interval_msg").dom.innerHTML = bInitialConnectionTry ? (nTimeToUpdate/1000)+"" : ""+0;
          bInitialConnectionTry = false;
          // mask the web client
          maskWC ("Loading");
          // Query the web server for the initialization status
          Ext.Ajax.request
          (
            {
              url:"status",
              method:"POST",
              success: function (aResponseObj, aOptions)
              {
                var aStatus = Ext.decode(aResponseObj.responseText);
                var aStatusEl = Ext.get("status_td").dom;
                var sColor = "blue";
                switch (aStatus.code)
                {
                  case "ait_initialization_aserver_not_reachable":
                  case "ait_unknown_initialization_error":
                    sColor = "red";
                    break;
                  case "ait_initialization_complete":
                    sColor = "green";
                    break;
                }

                aStatusEl.style.color = sColor;

                // Set the status message
                aStatusEl.innerHTML = aStatus.detail;

                // Store the current server_state
                Ext.get("server_state").set({value: aStatus.code});
                //Ext.get("ait_login_page_init_updating_indicator").dom.innerHTML = "";
                unmaskWC ();
                // Refresh the status
                doStatusDependentRender ();
              },
              failure: function ()
              {
                // Unmask the web client
                unmaskWC ();
                // Refresh the status
                doStatusDependentRender.defer (0);
              }
            }
          );
        }
        else
        {
          Ext.get("ait_login_page_init_interval_msg").dom.innerHTML = ""+(nTimeToUpdate/1000);
          nTimeToUpdate-=1000;
          doStatusDependentRender.defer (1000);
        }
      }
    }

    // Dummy call to Ext.MessageBox so all necessary stuff for boxes is loaded. This is required because
    // otherwise, if the connection to tomcat is aborted before a login happened, the error
    // box can't be shown correctly.
    var aBox = showErrorBox ("");
    aBox.hide ();
    // Do the status dependent rendering of the login mask
    doStatusDependentRender ();


  }
);