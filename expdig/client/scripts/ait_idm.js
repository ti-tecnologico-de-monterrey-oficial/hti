/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains JS functionality for the startup of ADOxx Web.
**********************************************************************
*/

Ext.BLANK_IMAGE_URL = 'ext/resources/images/default/s.gif';  // 2.0


var g_aSettings =
{
  page:"idm"
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
    var aErrorField = Ext.get("error");
    var bError = aErrorField ? aErrorField.getValue() === "true" : false;

    var sDetailMsg = Ext.get("detailMsg").getValue();

    var UPDATE_INTERVAL = 5000;
    Ext.Ajax.timeout = 360000;

    if (bError && sDetailMsg && sDetailMsg !== "")
    {
      if (sDetailMsg.indexOf("ait_") === 0)
      {
        if (sDetailMsg === "ait_max_license_users")
        {
          var sMaxLicUsers = Ext.get("maxLicUsers").getValue();
          var sDBName = Ext.get("dbName").getValue();
          sDetailMsg = getString (sDetailMsg).
                        replace(/%MAX_USERS%/g, sMaxLicUsers).
                        replace(/%DB_NAME%/g, sDBName);
        }
        else
        {
          sDetailMsg = getString(sDetailMsg);
        }
      }
      showErrorBox
      (
        sDetailMsg,
        getStandardTitle(),//"ADOit Web Client Startup",
        function ()
        {
          boc.ait.forwardToLogin ();
        }
      );
      return;
    }

    var sSessionId = Ext.get("sessionid").getValue();

    var aIDMModeField = Ext.get("idm_mode");
    var sIDMMode = aIDMModeField ? aIDMModeField.getValue() : null;

    var aReadModeField = Ext.get("read_mode");
    var bReadMode = aReadModeField ? aReadModeField.getValue () === "true" : false;


    WindowStorage.set("idm_mode", sIDMMode);

    var nTimeToUpdate = UPDATE_INTERVAL;
    var bInitialConnectionTry = true;

    var aStatusBox = new Ext.BoxComponent
    (
      {
        xtype: 'box',
        hidden:true,
        region:"center",
        autoEl:
        {
          tag: "div",
          id:"ait_login_page_init_status_div",
          style: "margin:5px;text-align:center;color:blue;",
          html: boc.ait.getServerInitStateAsHTML ()
        }
      }
    );

    new Ext.Viewport
    (
      {
        layout:"border",
        autoHeight:true,
        autoWidth:true,
        items:
        [
          new Ext.BoxComponent
          (
            {
              region:"north",
              autoEl:
              {
                tag:"div",
                style:"height:50%"
              }
            }
          ),
          aStatusBox
        ]
      }
    );

    /*
      Function that renders the content of the login mask based on the status of the web server.
    */
    function doStatusDependentRender ()
    {
      var sInitStatus = Ext.get("server_state").getValue();
      // If the web server is done initializing get the settings for the login mask (login language, usertype, etc.)
      if (sInitStatus === "ait_initialization_complete")
      {
        boc.ait.forwardToMainPage (sSessionId, bReadMode ? getString("ait_idm_read_mode") : null);
      }
      else
      {
        // Otherwise make sure that the statusbox is shown
        aStatusBox.show();

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
                aStatusEl.innerHTML = getString(aStatus.code);//aStatus.detail;

                // Store the current server_state
                Ext.get("server_state").set({value: aStatus.code});
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