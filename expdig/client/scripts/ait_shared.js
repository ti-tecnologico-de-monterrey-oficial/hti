/*********************************************************************
 \note Copyright\n 
 This file is part of ADOxx Web.\n 
 (C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2016\n 
 All Rights Reserved\n 
 Use, duplication or disclosure restricted by BOC Information Systems\n Vienna,
 1995 - 2016
 ********************************************************************* 
 \author MWh 
 This file contains shared JS functionality for the ADOxx Web Client
 *********************************************************************
 */

Ext.namespace("boc.ait.tests");
Ext.namespace("com.boc.axw");
Ext.namespace("boc.ait.commons");

Ext.namespace ("g_aSettings");

// Workaround because there is no Ext.Element.cache in Ext 3.*, but e.g. the ZDF
// AL uses it
Ext.namespace ("Ext.Element.cache");



Ext.Ajax.on ("beforerequest", function (aConn, aOptions)
  {
    if (!g_aSettings.loggedin && (g_aSettings.page === "main" || g_aSettings.page === "admin"))
    {
      return false;
    }
    aOptions.params = aOptions.params || {};
    if (!WindowStorage.get("sessionID") && g_aSettings.login)
    {
      aOptions.params.login = g_aSettings.login;
    }

    if (!aOptions.params.sessionid)
    {
      aOptions.params.sessionid = g_aSettings.pageParams.sessionid;// WindowStorage.get("sessionID");
    }


    if(Ext.isIE)
    {
      // Removed this entry since GET only allows a restricted data length
      // in IE 7
      // aOptions.method = "GET";
      aOptions.url = aOptions.url+"?"+new Date().getTime()+Ext.id();
    }
  }
);

/*
 * Common implementation for all check routines \param aObject object to be
 * checked \param aType type of object agains which object should be checked,
 * can be null \param bMember true if member check \retval nothing if check is
 * ok, throws NS_ERROR_NOT_INITIALIZED or NS_ERROR_INVALID_ARG otherwise
 */
// --------------------------------------------------------------------
function checkObject (aObject, aType, bMember)
// --------------------------------------------------------------------
{
  if (aObject === null || aObject === undefined)
  {
    throw (bMember ?
           new Error("NS_ERROR_NOT_INITIALIZED"):
           new Error("NS_ERROR_INVALID_ARG"));
  }

  if (aType !== undefined &&
      aType !== null)
  {
    // we could get string or object as type
    // if string then check against typeof
    // in other case do it with instanceof
    if (typeof (aType) === "string")
    {
      if (typeof (aObject) !== aType)
      {
        //FIXME:
        //Why does it behave different for type string (no exception thrown)
        try
        {
          throw (bMember ?
                 new Error("NS_ERROR_NOT_INITIALIZED") :
                 new Error("NS_ERROR_INVALID_ARG"));
               }
               catch (aEx)
               {
                 displayErrorMessage (aEx);
               }
      }
    }
    else if (!(aObject instanceof aType))
    {
      throw (bMember ?
             new Error("NS_ERROR_NOT_INITIALIZED") :
             new Error("NS_ERROR_INVALID_ARG"));
    }
  }
}

/*
 * Function checks if given parameter is defined (not null or undefined) and if
 * it is of given type (if aType was given) If some of conditions is not
 * fulfilled then NS_ERROR_INVALID_ARG exception is thrown \param aObject object
 * to be checked againts \param aType type of object to be checked against
 * \retval nothing if everything is ok or throws NS_ERROR_INVALID_ARG
 */
// --------------------------------------------------------------------
function checkParam (aObject, aType)
// --------------------------------------------------------------------
{
  checkObject (aObject, aType, false);
}

/*
 * Works the same as checkParam but client is allowed to deliver null as
 * parameter. However if parameter is not null then the checks will be performed
 */
// --------------------------------------------------------------------
function checkParamNull (aObject, aType)
// --------------------------------------------------------------------
{
  if (aObject === null || aObject === undefined)
  {
    return;
  }

  return checkParam (aObject, aType);
}

/*
 * This function checks all the passed arguments from a function against the
 * argument types passed in the second argument. Call this function e.g. with
 * 'checkFunction (new function (a, b), ["string", "object"]);' \param aFunction
 * The passed function to check \param aArgTypes An array of types to match the
 * arguments of the passed function against.
 */
// --------------------------------------------------------------------
function checkFunction (aFunction, aArgTypes)
// --------------------------------------------------------------------
{
  var aArgs = aFunction.arguments;
  if (aArgs.length != aArgTypes.length)
  {
    throw ("ait_checkFunction: aArgs.length != aArgTypes.length!");
  }
  for (var i = 0; i < aArgs.length;++i)
  {
    checkParam (aArgs[i], aArgTypes[i]);
  }
}

/*
 * Shows an error message containing the properties of the passed error object
 * \param aErrObj An object of class Error
 */
// --------------------------------------------------------------------
function displayErrorMessage (aErrObj)
// --------------------------------------------------------------------
{
  try
  {
    var sErrText = "";
    if (typeof aErrObj == "string")
    {
      sErrText = aErrObj;
    }
    else if (aErrObj instanceof Error)
    {
      sErrText = "";
      // Fix for printing a stack trace in firefox, as they changed something in
      // the latest version so we cannot
      // access the stack trace by simple object property enumeration anymore..
      var aErrChecker =
      {
        name: false,
        message: false,
        stack: false
      };
      for (var sPart in aErrChecker)
      {
        if (aErrObj[sPart])
        {
          sErrText+=sPart+": " +aErrObj[sPart]+"\n";
          aErrChecker[sPart] = true;
        }
      }
      // Iterate over the members in the passed error object and concatenate
      // them
      for (var sPropName in aErrObj)
      {
        if (aErrChecker[sPropName])
        {
          continue;
        }
        sErrText+=sPropName+": " + aErrObj[sPropName]+"\r\n";
      }
    }

    // Create a new text area to display the text created before.
    // We can't use Ext.Msg.show here, because this ignores our linebreaks for
    // some reason...
    var aErrTextArea =
    {
      // lazy instantiation
      xtype: 'textarea',
      value: "Used Browser: "+navigator.userAgent+"\n--------------------------\n"+ sErrText
    };

    var aErrorWindow = null;

    // Create a new inner function that will be used to close the error window
    var closeWindowFunction = function ()
    {
      if (aErrorWindow.close)
      {
        aErrorWindow.close();
      }
    };

    // Create a new window to show our error message
    aErrorWindow = new Ext.Window
    (
      {
        layout:'fit',
        width:500,
        height:300,
        title: getString("ait_error"),
        // Add the textarea we created before to the window's items
        items:
        [
          aErrTextArea
        ],
        buttons:
        [
          // Only ok button, so the user can acknowledge and close the message
          {
            text:'OK',
            // The handler is the inner function we created before
            handler: closeWindowFunction
          }
        ]
      }
    );
    // show the window
    aErrorWindow.show();
  }
  catch (aEx)
  {
    // Uh, oh... We could not even build/show the error message.
    // Something is very wrong here...
    // -> Try showing a simpler error message and hope, at least this will work.
    alert ("Exception showing displayErrorMessage: " + aEx + "\n\n");

    // Show the current exception, but also the original (passed) error object
    // to help locating the source of this error:
    alert ("Original error: " + aErrObj + "\nCausal error: " + aEx);
  }
}



// Override for the accordion layout. This allows to expand more than one panel
// at the same time
// Normally, only one panel can be expanded, the others are collapsed
Ext.override
(
  Ext.layout.Accordion,
  {
    beforeExpand : function(p)
    {
      var oldActive = this.activeItem;
      // The following is the only line changed from the original beforeExpand
      // function.
      if(oldActive && oldActive.collapsible){
      // if(oldActive){
        // oldActive.collapse(this.animate);
      }
      this.activeItem = p;
      if(this.activeOnTop){
        p.el.dom.parentNode.insertBefore(p.el.dom, p.el.dom.parentNode.firstChild);
      }
      this.layout();
    }
  }
);

// This is taken from the included ext-basex.js package. It allows us to create
// eventhandlers
// for certain Ajax status codes.


/*
 * Function that is called when a session timeout occurred during communication
 * with the server. The function shows an infomessage and forwards the user to
 * the login page.
 */
// --------------------------------------------------------------------
function onSessionTimeout (aResponseObj)
// --------------------------------------------------------------------
{
  if ((typeof g_aMain) === "object" && g_aMain && g_aMain.isLoggedOut ())
  {
    return;
  }
  try
  {
    g_aSettings.loggedin = false;
    // Retrieve the session timeout from the web server and show an info box for
    // the user
    var sSessionTimeoutMsg = "";
    var sSessionTimeout = aResponseObj.getResponseHeader("sessiontimeout");
    var bExpired = aResponseObj.getResponseHeader("sessionexpired") === "true";

    if (sSessionTimeout && bExpired)
    {
      try
      {
        sSessionTimeoutMsg = getString("ait_session_timeout").replace(/%MINUTES%/, (Number(sSessionTimeout)/60));
      }
      catch (aEx)
      {
        sSessionTimeoutMsg = getString("ait_session_timeout_default");
      }
    }
    else
    {
      sSessionTimeoutMsg = getString("ait_session_timeout_default");
    }

    // Remove all possible loading masks so our info box is shown.
    unmaskWC();

    var aLoadingIndicator = Ext.get('loading');
    if (aLoadingIndicator)
    {
      aLoadingIndicator.remove();
    }
    var aLoadingMask = Ext.get('loading-mask');
    if (aLoadingMask)
    {
      aLoadingMask.fadeOut({remove:true});
    }
    
    if (boc.ait.isEmpty (g_aSettings.pageParams) || !g_aSettings.pageParams.rid)
    {
      // Show an alert message
      showInfoBox
      (
        sSessionTimeoutMsg,
        "Session Timeout",
        // Pass the inner function from before as callback to forward the user
        // to the login page
        boc.ait.forwardToLogin
      );
    }
    else
    {
      boc.ait.forwardToLogin ();
    }
  }
  catch (aOuterEx)
  {
    displayErrorMessage (aOuterEx);
  }
}

/*
 * Global function that returns a string from the global strings array based on
 * a passed id
 * 
 * \param sId The id of the string to retrieve
 */
function getString (sId)
{
  // If the string with the passed id can be found, return it
  if (typeof g_aStrings == "object" && g_aStrings[sId])
  {
    return g_aStrings[sId];
  }
  // Otherwise, return the id again.
  return sId;
}

/*
 * Function that is called when an error occurred during communication with the
 * server. The function shows an errormessage.
 */
// --------------------------------------------------------------------
function onError (aResponse)
// --------------------------------------------------------------------
{
  if ((typeof g_aMain) === "object" && g_aMain && g_aMain.isLoggedOut ())
  {
    return;
  }
  try
  {
    var aError = null;
    var sErrorString = aResponse.getResponseHeader ("errorstring");

    if (sErrorString)
    {
      aError = new Error(sErrorString);
    }
    else
    {
      aError = new Error (aResponse.statusText);
    }
    // Create a new error object and display it.
    displayErrorMessage (aError);
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
}

/*
 * Event handler for states 404 and 0. In ADOxx Web status 409
 * stands for some general error during the communication with the server.
 */
/*
 * Ext.lib.Ajax.onStatus ( [404], function () {
 * showErrorBox(getString("ait_connection_to_webserver_lost")); } );
 */

/*
 * Ext.lib.Ajax.onStatus ( [0], function (nStatus, aStatus, aResponse) { if
 * (aResponse.argument !== null && aResponse.argument !== undefined) {
 * showErrorBox(getString("ait_connection_to_webserver_lost")); } } );
 */


/*
 * Event handler for status 409. In ADOxx Web status 409 stands
 * for some general error during the communication with the server.
 */
/*
 * Ext.lib.Ajax.onStatus ( [409], onError );
 */

function getInfoText (aParams)
{
  checkParam (aParams, "object");

  Ext.Ajax.request
  (
    {
      url:"proxy",
      method:"POST",
      params:
      {
        type: "infotext",
        params: Ext.encode
        (
          {
            classID:aParams.classID,
            artefactType: aParams.artefactType,
            attributeName: aParams.attributeName
          }
        )
      },
      success: aParams.success,
      failure: aParams.failure,
      scope: aParams.scope
    }
  );
}

/*
 * Function that requests an infotext from the aserver and displays it in a
 * textbox.
 * 
 * This function may throw an exception back to the calling function. \param
 * sClassID The ID of the class or relation class to either retrieve the
 * infotext or search for the attribute definition for which to retrieve the
 * infotext \param nArtefactType The type of artefact to retrieve \param
 * sAttributeName [optional] The name of the attribute for which to retrieve the
 * infotext
 */
// ---------------------------------------------------------------------
function showInfoText (sClassID, nArtefactType, sAttributeName)
// ---------------------------------------------------------------------
{
  checkParam (sClassID, "string");
  checkParam (nArtefactType, "number");
  checkParamNull (sAttributeName, "string");

  // Construct the title of the box that shows the infotext
  var sTitle = "";
  if (sAttributeName)
  {
    sTitle = getString ("ait_attribute");
  }
  else if (nArtefactType == AIT_ARTEFACT_RELATION)
  {
    sTitle = getString ("ait_relation");
  }
  else if (nArtefactType == AIT_ARTEFACT_OBJECT)
  {
    sTitle = getString ("ait_class");
  }
  // By default we assume a diagram type
  else
  {
    sTitle = getString ("ait_modeltype");
  }

  // Create the edit box that displays the infotext
  var aEditBox = new boc.ait.util.ExtendedEditBox
  (
    {
      title: sTitle,
      modal:true,

      /*
       * Inner Function that serves as a callback in the editbox. This function
       * will be used to retrieve the text to display.
       * 
       * This function may throw an exception back to the calling function.
       */
      // ---------------------------------------------------------------------
      loadFunction : function ()
      // ---------------------------------------------------------------------
      {
        this.body.mask(getString("ait_loading"), 'x-mask-loading');
        var that = this;
        getInfoText
        (
          {
            classID: sClassID,
            artefactType: nArtefactType,
            attributeName: sAttributeName,
            /*
             * Inner Function that serves as a callback for when the ajax
             * request finishes successfully.
             * 
             * This function may throw an exception back to the calling
             * function.
             * 
             * \param aResponse The AJAX response object \param aOptions The
             * original options passed to the AJAX request
             */
            // ---------------------------------------------------------------------
            success: function (aResponse, aOptions)
            // ---------------------------------------------------------------------
            {
              var aRetObj = Ext.util.JSON.decode(aResponse.responseText);
              if (aRetObj.error)
              {
                showErrorBox(aRetObj.errString);
                return;
              }

              // Set the value of the text area
              that.setText (aRetObj.payload.infotext);

              // Set the title of the textbox
              that.setTitle(sTitle+": " + aRetObj.payload.title);
              that.body.unmask();
            },
            failure: that.body.unmask,
            scope: that
          }
        );
      }
    }
  );
  aEditBox.show();
}

/*
 * Function that requests an infotext from the aserver and displays it in a
 * textbox.
 * 
 * This function may throw an exception back to the calling function. \param
 * aHistoryOwnerData The data of the object for which to retrieve the change
 * history.
 */
// ---------------------------------------------------------------------
boc.ait.showChangeHistory = function (aHistoryOwnerData)
// ---------------------------------------------------------------------
{
  checkParam (aHistoryOwnerData, "object");

  var aStore = new Ext.data.JsonStore
  (
    {
      url: "proxy",
      autoDestroy:true,
      baseParams:
      {
        type: "changehistory",
        params: Ext.encode
        (
          {
            artefactID: aHistoryOwnerData.get("id"),
            artefactType: aHistoryOwnerData.get("artefactType")
          }
        )
      }
    }
  );


  var showChangeHistoryData = function ()
  {
    var aRetObj = this.reader.jsonData;
    if (aRetObj.error)
    {
      showErrorBox(aRetObj.errString);
      return;
    }

    // Fix for CR #052567 - Show an info box instead of an empty window if there
    // are no change history entries.
    if (aRetObj.payload.recordVal.value.rows.length === 0)
    {
      showInfoBox ( getString ("ait_notebook_no_change_history").
        replace(/%OBJECT_NAME%/g, aHistoryOwnerData.get("text")).
        replace(/%OBJECT_CLASS%/g, aHistoryOwnerData.get("idClass_lang")));
      return;
    }

    var aRecord = new boc.ait.notebook.Record
    (
      {
        data: aRetObj.payload.recordVal,
        autoScroll:true,
        showDisabled: false,
        header: false
      }
    );


    var aWin = new Ext.Window
    (
      {
        title: getString("ait_notebook_tip_change_history"),
        modal: true,
        /*
         * items: new Ext.Panel ( { title: '', layout:'anchor', header: false,
         * //items: [aRelControl], autoWidth:true, autoHeight:true } ),
         */
        layout : 'fit',
        autoScroll: false,
        width: 500,
        items: aRecord,
        height: 500,
        resizable: true
      }
    );
    aWin.show();

  };

  // Load the notebook data
  aStore.load
  (
    {
      callback: showChangeHistoryData
    }
  );
};



/*
 * Function that takes a function and passes it to the application server for
 * execution.
 * 
 * 
 * This function may throw an exception back to the calling function. \param
 * aFunction The function to execute on the webserver \param aCB A possible
 * callback to call after the server function has finished \param aScope An
 * optional scope for the callback function
 */
// ---------------------------------------------------------------------
function callServerMethod (aFunction, aCB, aScope, bEnsureRepoSession)
// ---------------------------------------------------------------------
{
  checkParam (aFunction, "function");
  checkParamNull (aCB, "function");
  checkParamNull (aScope, "object");
  
  if (bEnsureRepoSession !== false)
  {
    bEnsureRepoSession = true;
  }

  // perform the ajax request
  Ext.Ajax.request
  (
    {
      url:"proxy",
      method:"POST",
      params:
      {
        type: "serverMethod",
        ensureRepoSession: bEnsureRepoSession,
        params: Ext.encode
        (
          {
            // Pass a string representation of the function
            fn: aFunction.toString()
          }
        )
      },
      // We use the dialog as scope for the callbacks
      scope: aScope,
      // On success we handle the return data
      success: aCB
    }
  );
}

/*
 * Shows an extended edit box with a multiline text field
 * 
 * 
 * This function may throw an exception back to the calling function. \param
 * sText The text to display \param sTitle The title to display
 */
// ---------------------------------------------------------------------
function showExtendedEditBox (sText, sTitle, bEditable, aCallback, aScope)
// ---------------------------------------------------------------------
{
  var aBox = new boc.ait.util.ExtendedEditBox
  (
    {
      text: sText,
      title: sTitle || getStandardTitle (),
      editable:bEditable,
      callback: aCallback,
      scope: aScope
    }
  );
  aBox.show();

  return aBox;
}

// Override for the standard onEnable Function -
// This changes the disabled behaviour of all form controls so that disabled
// Texts are still selectable
Ext.form.Field.prototype.onEnable =
  function ()
  {
    this.getActionEl().removeClass(this.disabledClass);
    this.el.dom.readOnly = false;
  };

// Override for the standard onDisable Function -
// This changes the disabled behaviour of all form controls so that disabled
// Texts are still selectable
Ext.form.Field.prototype.onDisable =
  function ()
  {
    this.getActionEl().addClass(this.disabledClass);
    this.el.dom.readOnly = true;
  };

/*
 * Escapes the special characters within a search string
 * 
 * 
 * This function may throw an exception back to the calling function. \param
 * sString The search string to escape \retval The escaped search string
 */
// ---------------------------------------------------------------------
function escapeSearchString (sString)
// ---------------------------------------------------------------------
{
  function escapeSubString (sSubString)
  {
    return sSubString.replace(/\\/g, '\\\\').
              replace(/\+/g, '\\+').
              replace(/\-/g, '\\-').
              replace(/\&/g, '\\&').
              replace(/\|/g, '\\|').
              replace(/\!/g, '\\!').
              replace(/\(/g, '\\(').
              replace(/\)/g, '\\)').
              replace(/\{/g, '\\{').
              replace(/\}/g, '\\}').
              replace(/\[/g, '\\[').
              replace(/\]/g, '\\]').
              replace(/\^/g, '\\^').
              replace(/\>/g, '\\>').
              replace(/\"/g, '\\"').
              replace(/\~/g, '\\~').
              replace(/\:/g, '\\:').
              replace(/\?/g, '\\?');
  }

  var s = sString;
  var i = 0;
  var a = [];
  // Iterate through the string, as long as we find quotes
  while ((i = s.indexOf('"')) > -1)
  {
    // If the quote is not the first character, we take the substring before the
    // quote
    // as a separate token
    if (i !== 0)
    {
      a[a.length] = escapeSubString(s.substring(0, i));
      // The rest of the string will be handled in the next iteration
      s = s.substring (i, s.length);
      continue;
    }
    // Store the substring without the leading quote in a temporary string
    var sTemp = s.substring(i+1, s.length);
    var j = 0;
    // If the temporary string contains at least another quote, we store the
    // substring before that quote as another token
    if ((j = sTemp.indexOf('"')) > -1)
    {
      a[a.length] = '"'+sTemp.substring(0, j)+'"';
      s = sTemp.substring(j+1, sTemp.length);
    }
    // Otherwise, the whole temporary string is handled as a token
    else
    {
      a[a.length] = escapeSubString('"'+sTemp);
      s = "";
      break;
    }
  }

  // Store the rest of the string as the last token
  a[a.length] = escapeSubString(s);

  // The query is the array of tokens joined by a blank
  return a.join(" ");
}

/*
 * Masks the whole web client
 * 
 * \param sLoadingText [optional] The text do display in the mask \param aMaskEl
 * [optional] The element to mask. If this is not provided, the whole Web Client
 * is masked.
 */
// ---------------------------------------------------------------------
function maskWC (sLoadingText, aMaskEl)
// ---------------------------------------------------------------------
{
  // ++g_nMaskCnt;
  if (!sLoadingText)
  {
    sLoadingText = getString("ait_loading");
  }
  aMaskEl = aMaskEl || document.body;
  Ext.get (aMaskEl).mask (sLoadingText, 'x-mask-loading');
}

/*
 * Masks the whole web client, but does not show a loading message
 */
// ---------------------------------------------------------------------
function maskWCBlank (aMaskEl)
// ---------------------------------------------------------------------
{
  aMaskEl = aMaskEl || document.body;
  var aMaskExtEl = Ext.get(aMaskEl);
  if (aMaskExtEl && aMaskExtEl.mask)
  {
    aMaskExtEl.mask ();
  }
}


/*
 * Unmasks the whole web client
 */
// ---------------------------------------------------------------------
function unmaskWC (aMaskEl)
// ---------------------------------------------------------------------
{
  if (g_aSettings.initialized === false)
  {
    return;
  }
  aMaskEl = aMaskEl || document.body;
  var aMaskExtEl = Ext.get(aMaskEl);
  if (aMaskExtEl && aMaskExtEl.unmask)
  {
    aMaskExtEl.unmask();
  }  
}

/*
 * Determines whether the web client is currently masked
 * 
 * \retval true, if the web client is masked, otherwise false
 */
// ---------------------------------------------------------------------
function isWCMasked()
// ---------------------------------------------------------------------
{
  return Ext.get(document.body).isMasked();
}

/*
 * Destroys an element. Used to clean up memory and DOM structure
 * 
 * \param The element to destroy
 */
// ---------------------------------------------------------------------
function destroy (aEl)
// ---------------------------------------------------------------------
{
  try
  {
    if ((typeof aEl) === "undefined")
    {
      return;
    }
    if (aEl !== null)
    {
      if ((typeof aEl.destroy) == "function")
      {
        delete Ext.Element.cache[aEl.id];
        aEl.destroy();
      }
      aEl = null;
    }
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
}


/*
 * Destroys a DOM-element. Used to clean up memory and DOM structure
 * 
 * \param The element to destroy
 */
// ---------------------------------------------------------------------
function destroyDOM (aEl)
// ---------------------------------------------------------------------
{
  var aDOM = null;
  if (aEl instanceof Ext.Element)
  {
    aDOM = aEl.dom;
  }
  else
  {
    aDOM = aEl.getEl().dom;
  }
  var l = aDOM.childNodes.length;
  for (var i = 0; i < l;++i)
  {
    aDOM.removeChild(aDOM.childNodes[0]);
  }
  aDOM.parentNode.removeChild(aDOM);
  aDOM = null;
}

/*
 * Shows an error box.
 * 
 * \param sText The text to show \param sTitle [optional] The title for the box
 * \param aCallBack [optional] A callback function to call when the box' OK
 * button is clicked.
 */
// ---------------------------------------------------------------------
function showErrorBox (sText, sTitle, aCallBack)
// ---------------------------------------------------------------------
{
  var aConf =
  {
    msg: sText,
    icon: Ext.MessageBox.ERROR,
    title: sTitle,
    fn: aCallBack
  };
  return showBox (aConf);
}

/*
 * Shows a warning box.
 * 
 * \param sText The text to show \param sTitle [optional] The title for the box
 * \param aCallBack [optional] A callback function to call when the box' OK
 * button is clicked.
 */
// ---------------------------------------------------------------------
function showWarningBox (sText, sTitle, aCallBack)
// ---------------------------------------------------------------------
{
  var aConf =
  {
    msg: sText.replace(/\[ait-[0-9]*\]\n/, "").replace(/\[ado-[0-9]*\]\n/g, ""),
    icon: Ext.MessageBox.WARNING,
    title: sTitle,
    fn: aCallBack
  };
  return showBox (aConf);
}

/*
 * Shows an info box.
 * 
 * \param sText The text to show \param sTitle [optional] The title for the box
 * \param aCallBack [optional] A callback function to call when the box' OK
 * button is clicked.
 */
// ---------------------------------------------------------------------
function showInfoBox (sText, sTitle, aCallBack)
// ---------------------------------------------------------------------
{
  var aConf =
  {
    msg: sText.replace(/\[ait-[0-9]*\]\n/, "").replace(/\[ado-[0-9]*\]\n/g, ""),
    icon: Ext.MessageBox.INFO,
    title: sTitle,
    fn: aCallBack
  };
  return showBox (aConf);
}


/*
 * Shows a message box.
 * 
 * \param aConfig A configuration object that defines the exact look and
 * contents of the box
 */
// ---------------------------------------------------------------------
function showBox (aConfig)
// ---------------------------------------------------------------------
{
  aConfig.minWidth = 500;
  aConfig.title = aConfig.title ? aConfig.title : getStandardTitle();
  aConfig.buttons = Ext.Msg.OK;
  aConfig.fn = aConfig.fn ? aConfig.fn : Ext.emptyFn;
  aConfig.modal = true;
  try
  {
    aConfig.msg = boc.ait.htmlEncode(aConfig.msg).replace(/\n/g, "<br/>");
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }

  return Ext.Msg.show (aConfig);
}

/*
 * Returns the standard title for dialogs in the web client
 * 
 * \retval The standard title for dialogs in the web client.
 */
// ---------------------------------------------------------------------
function getStandardTitle ()
// ---------------------------------------------------------------------
{
  // Build the title for the offline web client
  if (g_aSettings.offline)
  {
    return g_aSettings.productData.productName + " "+getString("axw_html_publishing_window_title");
  }
  
  // If we have no product data yet (because the aserver is not available yet),
  // just show the current window title.
  if (!g_aSettings.productData)
  {
    return document.title;
  }
  var sTitle = g_aSettings.productData.productName + " ";
  sTitle+= "Web Client" + (g_aSettings.user && g_aSettings.user.loginName ? " ("+g_aSettings.user.loginName+")" : "");
  return sTitle;
}

Ext.override(Ext.ToolTip,{
    onMouseMove: function(e) {
      this.targetXY = e.getXY();
        if(!this.hidden && this.trackMouse){
          this.setPagePosition(
            this.constrainPosition ?
                this.el.adjustForConstraints(this.getTargetXY())
                    :
                this.getTargetXY()
              );
          }
       }
});

function setDragStyle (sCls)
{
  Ext.dd.DragDropMgr.lastDragStyle = sCls;
  return sCls;
}

function getDragStyle ()
{
  return Ext.dd.DragDropMgr.lastDragStyle;
}

/*
 * Checks whether an object or associative array is empty
 * 
 * \param aObj The object to check \retval true, if the object is empty,
 * otherwise false
 */
// ---------------------------------------------------------------------
boc.ait.isEmpty = function (aObj)
// ---------------------------------------------------------------------
{
  for (var s in aObj) {s = s;return false;}
  return true;
};

var isEmpty = boc.ait.isEmpty;

boc.ait.clone = function (obj)
{
  if(obj === null || typeof(obj) !== 'object')
  {
    return obj;
  }
  var temp = null;
  if (typeof obj.constructor === "function")
  {
     temp = obj.constructor();
  }
  else
  {
    return obj;
  }  
  // changed
  for(var key in obj)
  {
    try
    {
      temp[key] = boc.ait.clone(obj[key]);
    }
    catch (aEx)
    {
      alert("key: " + key + " : " + obj[key]);
      throw aEx;
    }
  }
  return temp;
};

var clone = boc.ait.clone;

function onRequestException (aConn, aResponse, aOptions)
{
  if ((typeof g_aMain) === "object" && g_aMain && g_aMain.isLoggedOut ())
  {
    return;
  }
  var aCallback = Ext.emptyFn;
  if (aResponse.status === 0 || aResponse.status === 404)
  {
    Ext.Ajax.un("requestexception", onRequestException);
    Ext.Ajax.request
    (
      {
        url:"proxy",
        method:"POST",
        params:
        {
          type: "ping"
        },
        success: function ()
        {
          Ext.Ajax.on("requestexception", onRequestException);
        },
        failure: function ()
        {
          var sErrStr =
            ((typeof g_aStrings) !== "undefined") ?
            getString("ait_connection_to_webserver_lost") :
            "Apparently, the connection to the Web Server has been disturbed or broken. Please restart your Web Client and in case this problem occurs again, contact your administrator.";
          showErrorBox(sErrStr);

          Ext.Ajax.on("requestexception", onRequestException);
        }
      }
    );
  }
  else if (aResponse.status === 403)
  {
    onSessionTimeout (aResponse);
  }
  else if (aResponse.status === 506)
  {
    onError (aResponse);
  }
  // AServer is not responding -> States 409, 410, 502 and 504
  else if (aResponse.status === 409 || aResponse.status === 410 || aResponse.status === 507 || aResponse.status === 504 || aResponse.status === 502)
  {
    aCallback = Ext.emptyFn;
    if (g_aSettings && g_aSettings.page === "idm")
    {
      aCallback = boc.ait.forwardToLogin;
    }
    showErrorBox (getString("ait_aserver_not_responding_message"), null, aCallback);
  }
  else if (aResponse.status === 508)
  {
    aCallback = Ext.emptyFn;
    if (g_aSettings && g_aSettings.page === "idm")
    {
      aCallback = boc.ait.forwardToLogin;
    }
    showErrorBox (getString("ait_aserver_init_message"), null, aCallback);
  }
  else if (aResponse.status === 509)
  {
    showErrorBox (getString("ait_aserver_request_exceeded_axis_timeout"));
  }
  else if ((aResponse.isAbort === true && aResponse.isTimeout === true) || aResponse.statusText === "transaction aborted")
  {
    // Make sure the web client is unmasked after an AJAX timeout occurred
    unmaskWC();
    // Show a short message to the user.
    showWarningBox(getString("ait_script_timeout_message").replace(/%SECONDS%/g, (Ext.Ajax.timeout/1000)));
  }
  else if (aResponse.status !== 500 /*
                                     * && aResponse.statusText !== "transaction
                                     * aborted"
                                     */)
  {
    alert("An error occurred during a request, status ("+aResponse.status+") is unhandled!");
    alert("Responsetext: " + aResponse.responseText);
    if (!Ext.isIE)
    {
      alert(aResponse.toSource());
    }
  }
  unmaskWC ();
  if (g_aSettings.initialized === true)
  {
    if (Ext.get('loading'))
    {
      Ext.get('loading').remove();
    }
    if (Ext.get('loading-mask'))
    {
      Ext.get('loading-mask').fadeOut({remove:true});
    }
  }
  
  var nLoadScriptSleep = 10000;
  
  function _doDeferredLoadScriptStart ()
  {
    if (boc.ait.tests._TestControlBox)
    {
      boc.ait.tests._TestControlBox.setText ("Application Server does not respond, trying to reestablish connection.");
    }
    Ext.Ajax.request
    (
      {
        url:"status",
        method:"GET",
        success: function (aResponseObj, aOptions)
        {
          var aStatus = Ext.decode(aResponseObj.responseText);
          if (aStatus.code === "ait_initialization_complete")
          {
            boc.ait.tests.startLoadScript ();
          }
          else
          {
            _doDeferredLoadScriptStart (nLoadScriptSleep);
          }
        }
      }
    );
  }

  if (boc.ait.tests._TestRunning)
  {
    boc.ait.tests.stopLoadScript ();

    _doDeferredLoadScriptStart.defer (nLoadScriptSleep);
  }
}

Ext.Ajax.on("requestexception", onRequestException);

function transformRecordsToData (aRecords)
{
  var aResultArr = [];
  for (var i = 0; i < aRecords.length;++i)
  {
    aResultArr[i] = aRecords[i].data;
  }
  return aResultArr;
}

/*
 * Publicly available function that opens a file in a new separate window or tab
 * 
 * \param sFile The file to open
 */
// ---------------------------------------------------------------------
boc.ait.openFile = function (sFile)
// ---------------------------------------------------------------------
{
  // Check if a value was passed
  if (sFile !== "")
  {
    var bFound = false;
    for (var i = 0; i < g_aSettings.filePointerProtocols.length;++i)
    {
      if (sFile.indexOf(g_aSettings.filePointerProtocols[i]) === 0)
      {
        bFound = true;
        break;
      }
    }
    if (!bFound && sFile.indexOf("file:///") !== 0)
    {
      // Add the correct protocol to the file
      sFile = "file:///"+sFile;
    }
  }
  try
  {
    // Try to open the file in a new window
    window.open(sFile);
  }
  catch (aEx)
  {
    // Handle security issues when opening files in firefox
    if (Ext.isGecko && aEx && aEx.result && aEx.result === 2147500037)
    {
      showErrorBox (getString("ait_file_not_callable"));
    }
    // Handle security issues when opening files in IE
    else if (Ext.isIE && aEx && aEx.number && aEx.number === -2147024891)
    {
      showErrorBox (getString("ait_file_not_callable"));
    }
    // Handle security issues when opening files in IE
    else if (Ext.isIE && aEx && aEx.number && aEx.number === -2147023673)
    {}
    // Handle any type of error message
    else
    {
      displayErrorMessage (aEx);
    }
  }
};

/*
 * Global function that loads offline data.
 *  ! Offline mode is not supported at the moment ! \param sUrl The url from
 * which to load offline data \param aCallback The callback function to call
 * when this function has finished.
 */
// --------------------------------------------------------------------
var loadOfflineData = function (aDataToLoad, aCallback)
// --------------------------------------------------------------------
{
  var headID = document.getElementsByTagName("head")[0];
  var newScript = document.createElement('script');
  newScript.type = 'text/javascript';

  // variable that stores whether or not the script was already loaded
  // This is because IE9 supports both ways how to load a script and
  // erroneously executes the passed callback twice
  var bScriptLoaded = false;
  // This handler does not work in IE. It is called when the script
  // was loaded successfully
  newScript.onload = function ()
  {
    // If the script was already loaded, return here
    if (bScriptLoaded)
    {
      return;
    }
    // Remember that the script was already loaded
    bScriptLoaded = true;
    aCallback (aDataToLoad);
  };

  // This handler does only work in IE. It is called when the script
  // was loaded successfully
  newScript.onreadystatechange = function ()
  {
    // If the script was already loaded, return here
    if (bScriptLoaded)
    {
      return;
    }
    if (this.readyState === 'loaded' || this.readyState === 'complete')
    {
      // Remember that the script was already loaded
      bScriptLoaded = true;
      aCallback (aDataToLoad);
    }
  };
  newScript.src = aDataToLoad.url;
  headID.appendChild (newScript);
};


/*
 * Global function that takes a "raw" file reference (e.g. E:\text.txt) and
 * transforms it into html code that creates a link with which to open the file
 * 
 * \param sFile The file reference
 */
// --------------------------------------------------------------------
boc.ait.transformFileReferenceToLink = function (sFile, sAlternativePath, bShowLink)
// --------------------------------------------------------------------
{
  if (!sFile)
  {
    return "";
  }
  var sVal = sFile;
  // Check if the ere was a value passed
  if (sVal !== "")
  {
    var bFound = false;
    for (var i = 0; i < g_aSettings.filePointerProtocols.length;++i)
    {
      if (sFile.indexOf(g_aSettings.filePointerProtocols[i]) === 0)
      {
        bFound = true;
        break;
      }
    }
    if (!bFound && sVal.indexOf("file:///") !== 0)
    // Insert the correct protocol
    // if (sVal.indexOf("http://") !== 0 && sVal.indexOf("file:///") !== 0 &&
    // sVal.indexOf("db:/") !== 0 && sVal.indexOf("adoxx:/") !== 0)
    {
      sVal = "file:///"+sVal;
    }
    
    if (sFile.indexOf("db:/") === 0)
    {
      sFile = sFile.substring (sFile.lastIndexOf ("/")+1);
      if (sFile.indexOf ("\\") > -1)
      {
        sFile = sFile.substring (sFile.lastIndexOf ("\\")+1);
      }
    }
    if (sAlternativePath)
    {
      sVal = sAlternativePath;
    }
    
    if (bShowLink === false)
    {
      return sFile;
    }
    else
    {
      // Return the html string
      return "<a href=\"javascript:boc.ait.openFile('"+sVal.replace(/\134/g, "\\\\")+"')\">"+sFile+"</a>";
    }
  }
  return sFile;
};

/*
 * Global function that returns the path to the library specific icons
 * 
 * \retval The path to the folder in which the library specific icons (class,
 * modeltype) reside
 */
// --------------------------------------------------------------------
boc.ait.getIconPath = function ()
// --------------------------------------------------------------------
{
  if (g_aSettings.offline)
  {
    return "../images/icons/";
  }
  return "images/icons/"+g_aSettings.repoData.libName+"/";
};

/*
 * Global function that returns the path to the library specific plugins
 * 
 * \bViews True, if the plugin path for the views is to be determined, otherwise
 * false (default).
 * 
 * \retval The path to the folder in which the library specific plugins reside
 */
// --------------------------------------------------------------------
boc.ait.getPluginPath = function (bViews)
// --------------------------------------------------------------------
{
  return "plugins/"+g_aSettings.repoData.libName+"/"+(bViews ? "view/" : "custom/");
};


/*
 * Global internal function that creates a report
 * 
 * \param aConfig A dictionary-like config object that contains the following
 * members: \template The template to be used for creating the report \success
 * [optional] A custom success function that is passed the response of the
 * servlet. If this is defined, the parameters title, contentType, fileName and
 * inline have no meaning. \url [optional] The url of the servlet that takes the
 * report request. "proxy" by default \reportMethod [optional] The web method
 * that does the report on the aserver side. By default, the web method "report"
 * is used. \params A JS struct containing parameters for the aserver side web
 * method that generates the report \title The title of the report \contentType
 * [optional] The content type. By default, application/pdf is assumed \fileName
 * [optional] The filename of the report \inline [optional] If this is true, the
 * web client tries to show the report inline. Otherwise, the report is sent as
 * attachment (can be saved). True by default.
 * 
 * \retval The path to the folder in which the library specific plugins reside
 */
// --------------------------------------------------------------------
boc.ait._doReport = function (aConfig)
// --------------------------------------------------------------------
{
  checkParam (aConfig, "object");

  checkParamNull (aConfig.url, "string");
  checkParamNull (aConfig.reportMethod, "string");
  checkParam (aConfig.title, "string");
  checkParamNull (aConfig.contentType, "string");
  checkParamNull (aConfig.fileName, "string");
  checkParamNull (aConfig.inline, "boolean");
  checkParamNull (aConfig.success, "function");
  checkParamNull (aConfig.template, "string");
  checkParam (aConfig.params, "object");
  checkParamNull (aConfig.callback, "function");
  checkParamNull (aConfig.scope, "object");
  checkParamNull (aConfig.openReport, "boolean");

  var bOpenReport = aConfig.openReport !== false;
  var aScope = aConfig.scope || this;


  // Start an ajax request that creates the report
  Ext.Ajax.request
  (
    {
      // Define the url for the ajax request
      url:aConfig.url || "proxy",
      // Set the parameters for the request
      params:
      {
        // The type of the request is "report"
        type: "report",
        // Define the web method to be called when generating the report
        reportType: aConfig.reportMethod || "report",
        // Define the parameters for the web method
        params: Ext.encode (aConfig.params)
      },
      // On success we call either the passed function or
      // the default success function
      success: aConfig.success || function (aResponse, aOptions)
      {
        var aData = Ext.util.JSON.decode(aResponse.responseText);
        if (!aData || aData.error)
        {
          if (aData)
          {
            Ext.Msg.alert(getString("ait_error"), aData.errString);
          }
        }
        else
        {
          var sTitle = aConfig.title;
          var sCT = aConfig.contentType;
          var sFN = aConfig.fileName;
          var bInline = aConfig.inline;

          // Build the url at which the report can be retrieved
          var sSrc = "?sessionid="+WindowStorage.get("sessionID")+"&id="+aData.payload.id+"&title="+sTitle;

          if (sCT)
          {
            sSrc+="&ct="+sCT;
          }
          if (sFN)
          {
            sSrc+="&fn="+sFN;
          }

          if (bOpenReport)
          {
            // If the report should not be displayed inline, we set the current
            // url to the report url
            if (bInline === false)
            {
              document.location.href="report"+sSrc+"&in=false";
            }
            // Otherwise, we open a new tab with the default reports page
            else
            {
              window.open("reports.html"+sSrc);
            }
          }
          if (aConfig.callback)
          {
            aConfig.callback.call (aScope, sSrc);
          }
        }
        unmaskWC();
      },
      failure: function ()
      {
        unmaskWC();
      }
    }
  );
};

/*
 * Global function that creates a report using a custom reporting web method.
 * 
 * \param aConfig A dictionary-like config object that contains the following
 * members: \success [optional] A custom success function that is passed the
 * response of the servlet. If this is defined, the parameters title,
 * contentType, fileName and inline have no meaning. \url [optional] The url of
 * the servlet that takes the report request. "proxy" by default \reportMethod
 * The web method that does the report on the aserver side. \params A JS struct
 * containing parameters for the aserver side web method that generates the
 * report \title The title of the report \contentType [optional] The content
 * type. By default, application/pdf is assumed \fileName [optional] The
 * filename of the report \inline [optional] If this is true, the web client
 * tries to show the report inline. Otherwise, the report is sent as attachment
 * (can be saved). True by default.
 * 
 * \retval The path to the folder in which the library specific plugins reside
 */
// --------------------------------------------------------------------
boc.ait.doCustomReport = function (aConfig)
// --------------------------------------------------------------------
{
  checkParam (aConfig, "object");
  checkParam (aConfig.reportMethod, "string");
  checkParamNull (aConfig.url, "string");
  checkParam (aConfig.title, "string");
  checkParam (aConfig.params, "object");
  checkParamNull (aConfig.contentType, "string");
  checkParamNull (aConfig.fileName, "string");
  checkParamNull (aConfig.inline, "boolean");
  checkParamNull (aConfig.success, "function");

  boc.ait._doReport (aConfig);
};


/*
 * Global function that creates a report using the standard reporting web method
 * 
 * \param aConfig A dictionary-like config object that contains the following
 * members:
 * 
 * \template The template to be used for creating the report \success [optional]
 * A custom success function that is passed the response of the servlet. If this
 * is defined, the parameters title, contentType, fileName and inline have no
 * meaning. \url [optional] The url of the servlet that takes the report
 * request. "proxy" by default \reportMethod [optional] The web method that does
 * the report on the aserver side. By default, the web method "report" is used.
 * \reportArtefacts A JS struct containing the artefact information for the
 * aserver side web method that generates the report \title The title of the
 * report \contentType [optional] The content type. By default, application/pdf
 * is assumed \fileName [optional] The filename of the report \inline [optional]
 * If this is true, the web client tries to show the report inline. Otherwise,
 * the report is sent as attachment (can be saved). True by default.
 * 
 * \retval The path to the folder in which the library specific plugins reside
 */
// --------------------------------------------------------------------
boc.ait.doStandardReport = function (aConfig)
// --------------------------------------------------------------------
{
  checkParam (aConfig, "object");

  checkParamNull (aConfig.url, "string");
  checkParam (aConfig.reportArtefacts, "object");
  checkParam (aConfig.title, "string");
  checkParamNull (aConfig.contentType, "string");
  checkParamNull (aConfig.fileName, "string");
  checkParamNull (aConfig.inline, "boolean");
  checkParamNull (aConfig.success, "function");
  checkParam (aConfig.template, "string");

  aConfig.params =
  {
    reportArtefacts: aConfig.reportArtefacts,
    template: aConfig.template
  };

  boc.ait._doReport (aConfig);
};

/*
 * Global function that forwards to the login page.
 * 
 * \param bManualLogout True if the logout was done manually
 */
// --------------------------------------------------------------------
boc.ait.forwardToLogin = function (bManualLogout)
// --------------------------------------------------------------------
{
  // If there is still a pending Ajax request, we cancel it.
  if (Ext.Ajax.isLoading())
  {
    Ext.Ajax.abort ();
  }

  maskWC (getString("ait_logout_msg"));
  // Set the base url

  var sHREF = "";

  var sIDMMode = Ext.get("idm_mode") ? Ext.get("idm_mode").getValue() : null;

  var bIDM = false;
  if (sIDMMode === "idm")
  {
    sHREF = "./idm";
    bIDM = true;
  }
  else if (sIDMMode === "idmtest")
  {
    sHREF = "./idmtest";
    bIDM = true;
  }
  else
  {
    sHREF = "./index.jsp";
  }

  var sIDMForwardPage = Ext.get("idmForwardPage") ? Ext.get("idmForwardPage").getValue() : "";
  
  // If we are in idm-mode, we forward to the defined forward page if there is one,
  // otherwise we go the default logout.html page. (It does not make sense to forward to the index.jsp, as in idm
  // mode, the customer does not expect a login mask.
  if (bIDM)
  {
    if (sIDMForwardPage && sIDMForwardPage.trim() !== "")
    {
      document.location.href = sIDMForwardPage;
      return;
    }
    else
    {
      document.location.href = "logout.html";
      return;
    }
  }

  var bFirst = true;

  // If the logout was triggered manually and there are start parameters
  if (!bManualLogout && (typeof g_aParams) !== "undefined" && !boc.ait.isEmpty (g_aParams))
  {
    // Go through the parameters
    for (var sKey in g_aParams)
    {
      if (bFirst)
      {
        sHREF +="?";
        bFirst = false;
      }
      else
      {
        sHREF +="&";
      }

      // Add the parameters to the href
      sHREF +=sKey+"="+g_aParams[sKey];
    }
  }

  var sDebug = "";
  if (g_aSettings.pageParams.debug)
  {
    if (bFirst)
    {
      sDebug+="?";
      bFirst = false;
    }
    else
    {
      sDebug+="&";
    }
    sDebug += "debug=true";
  }
  
  var sForward = "";
  if (g_aSettings.page)
  {
    if (g_aSettings.page !== "main")
    {
      if (bFirst)
      {
        sForward +="?";
        bFirst = false;
      }
      else
      {
        sForward+="&";
      }
      sForward+="forward="+g_aSettings.page;
    }
  }

  var sTestmode = "";
  if (g_aSettings.testmode)
  {
    sTestmode += (bFirst ? "?" : "&") + ("testmode=true");
  }
  else if (g_aSettings.testmode_extended)
  {
    sTestmode += (bFirst ? "?" : "&") + ("testmode_extended=true");
  }
  
  // Forward to the login page
  document.location.href = sHREF + sDebug + sForward + sTestmode;
};

/*
 * Global function that returns the visible attributes for the passed artefact
 * type.
 * 
 * \param nArtefactType Either AIT_ARTEFACT_OBJECT or AIT_ARTEFACT_DIAGRAM
 * 
 * \retval An array with the visible attributes for the passed artefact type.
 */
// --------------------------------------------------------------------
boc.ait.getVisibleAttributes = function (nArtefactType)
// --------------------------------------------------------------------
{
  checkParam (nArtefactType, "number");

  if (nArtefactType === AIT_ARTEFACT_OBJECT)
  {
    return g_aSettings.visibleObjectAttrs;
  }
  else if (nArtefactType === AIT_ARTEFACT_DIAGRAM)
  {
    return g_aSettings.visibleModelAttrs;
  }
  return null;
};

/*
 * Global function that returns meta data for the passed value object, depending
 * on the passed artefact type
 * 
 * \param aValObj The object containing data about the value \param
 * nArtefactType Either AIT_ARTEFACT_OBJECT or AIT_ARTEFACT_DIAGRAM
 * 
 * \retval An object containing metadata for the passed value object
 */
// --------------------------------------------------------------------
boc.ait.getAttrValInfo = function (aValObj, nArtefactType)
// --------------------------------------------------------------------
{
  checkParam (aValObj, "object");
  checkParam (nArtefactType, "number");

  var aVisAttrs = boc.ait.getVisibleAttributes (nArtefactType);

  var aAttrValInfo = null;
  for (var i = 0; i < aVisAttrs.length;++i)
  {
    aAttrValInfo = aVisAttrs[i];
    if (aAttrValInfo.id !== aValObj.id)
    {
      continue;
    }
    else
    {
      break;
    }
  }

  return aAttrValInfo;
};


/*
 * Global function that forwards to the main page. This also handles any kind of
 * url parameters (e.g. debug, or generated urls - e.g. to open a notebook after
 * the login)
 * 
 * \param sSessionID The Session ID \param sLoadingMsg [optional] An alternative
 * loading message
 */
// --------------------------------------------------------------------
boc.ait.forwardToMainPage = function (sSessionID, sLoadingMsg)
// --------------------------------------------------------------------
{
  checkParam (sSessionID, "string");
  checkParamNull (sLoadingMsg, "string");

  WindowStorage.set("sessionID", sSessionID);

  maskWC(sLoadingMsg);

  var sID = (new Date()).getTime()+Ext.id ();


  var bDebug = false;
  var bTestmode = false;
  var sParams = "";

  var sRepoId = "";
  try
  {
    // Get the parameters passed to this page
    var sSearch = document.location.search;
    // Check if there are any parameters
    if (sSearch.indexOf("?") > -1)
    {
      sSearch = sSearch.substring(1);
      var aParamsArr = [];
      // Split the params string
      aParamsArr = sSearch.split("&");

      // Iterate through the parameters passed to the page
      for (var i = 0; i < aParamsArr.length;++i)
      {
        var aKeyValPair = aParamsArr[i].split("=");
        // Get the repository id, so it can be handled correctly
        if (aKeyValPair[0] === "rid")
        {
          sRepoId = "{"+aKeyValPair[1]+"}";
        }
        else if (aKeyValPair[0] === "debug")
        {
          bDebug = (aKeyValPair[1] === "true");
        }
        else if (aKeyValPair[0] === "testmode")
        {
          bTestmode = (aKeyValPair[1] === "true");
        }
        else if (aKeyValPair[0] === "forward")
        {

        }
        // Filter out the debug parameter
        else if (aKeyValPair[0] !== "sessionid")
        {
          sParams+="&"+aKeyValPair[0]+"="+aKeyValPair[1];
        }
      }
    }
  }
  catch (aEx)
  {
    alert(aEx);
  }
  
  var aAskForRepoEl = Ext.get("axw.idm.askForRepo");
  if (aAskForRepoEl && aAskForRepoEl.getValue() === "false")
  {
    window.location='main.jsp?sessionid='+sSessionID+ sParams+(bDebug ? "&debug=true" : "")+(bTestmode ? "&testmode=true":"");
    return;
  }
  
  /*
   * Inner function that sets the used repository to the passed one.
   * 
   * \param aRepoData An object that contains the repository's relevant data
   * (repoid, libid, libname)
   */
  // --------------------------------------------------------------------
  var setRepository = function (aRepoData)
  // --------------------------------------------------------------------
  {
    maskWC (sLoadingMsg);
    var bError = false;
    try
    {
      checkParamNull (sID, "string");

      // Send an ajax request that sets the correct repository
      Ext.Ajax.request
      (
        {
          url:"proxy",
          method:"POST",
          params:
          {
            type: "setRepo",
            repoid: aRepoData.id,
            libId: aRepoData.libId,
            libName: aRepoData.libName,
            sessionid: sSessionID
          },
          // On success, forward to the main page
          success: function (aResponse, aOptions)
          {
            // Redirect to the main page. If required, add the debug parameter
            // to the URL
            window.location='main.jsp?sessionid='+sSessionID+ sParams+(bDebug ? "&debug=true" : "")+(bTestmode ? "&testmode=true":"");
          },
          // On failure, show an error message
          failure: function (aResponse, aOptions)
          {
            showErrorBox ("Some error occurred after selecting the repository.");
            unmaskWC();
          }
        }
      );
    }
    catch (aEx)
    {
      bError = true;
      throw aEx;
    }
    finally
    {
      if (bError)
      {
        unmaskWC ();
      }
    }
  };

  // Send a request to the server. Get all repositories for the logged in user
  Ext.Ajax.request
  (
    {
      url:"proxy",
      method:"POST",
      params:
      {
        type: "repositories",
        ensureRepoSession: false,
        sessionid: sSessionID
      },
      success: function (aResponse, aOptions)
      {
        var aRetObj = Ext.util.JSON.decode(aResponse.responseText);
        var aRepos = [], i;
        // Iterate through the repository data
        for (i = 0; i < aRetObj.payload.length;++i)
        {
          aRepos[i] =
          {
            text : aRetObj.payload[i].name,
            libId: aRetObj.payload[i].libId,
            libName: aRetObj.payload[i].libName,
            id : aRetObj.payload[i].id,
            icon: 'images/statusbar_repo_icon.png',
            leaf : true
          };
        }
        
        if (aRepos.length === 0)
        {
          showErrorBox (getString("ait_user_not_in_repository"));
          setTimeout
          (
            function ()
            {
              Ext.Ajax.request
              (
                {
                  url:"proxy",
                  params:
                  {
                    type: "logout",
                    sessionid: sSessionID
                  }
                }
              );
            },
            1
          );
          unmaskWC ();
          return;
        }

        // If there is more than one repository, show a selection box to the
        // user
        if (aRepos.length > 1)
        {
          // If we already have a repository id (from the url parameters), try
          // to
          // find the matching repository
          if (!Ext.isEmpty (sRepoId))
          {
            for (i = 0; i < aRepos.length;++i)
            {
              if (aRepos[i].id === sRepoId)
              {
                // If we found a matching repository, use it
                setRepository (aRepos[i]);
                return;
              }
            }
          }

          // Show the repo selection dialog to the user
          var aSelRepoDialog = new boc.ait.SelectRepoDialog
          (
            {
              repos: aRepos,
              okCallBack: setRepository,
              scope: this
            }
          );

          // When the repo selection dialog is closed, logout from the
          // aserver
          aSelRepoDialog.on("close", function (aWin)
            {
              setTimeout
              (
                function ()
                {
                  Ext.Ajax.request
                  (
                    {
                      url:"proxy",
                      params:
                      {
                        type: "logout",
                        sessionid: sSessionID
                      }
                    }
                  );
                },
                1
              );
            }
          );

          // Show the repository selection dialog
          aSelRepoDialog.show ();
          unmaskWC ();
        }
        else
        {
          // Use the first (and only) repository
          setRepository (aRepos[0]);
        }

      },

      failure:function ()
      {}
    }
  );
};


/*
 * Global function that switches the currently used language
 * 
 * \param sLang The language to switch to
 */
// --------------------------------------------------------------------
boc.ait.switchLanguage = function (sLang)
// --------------------------------------------------------------------
{
  checkParam (sLang, "string");


  /*
   * Inner function that does the language switch on the web server
   */
  // --------------------------------------------------------------------
  function _ajaxSwitchLanguage ()
  // --------------------------------------------------------------------
  {
    Ext.Ajax.request
    (
      {
        url:"proxy",
        method:"POST",
        params:
        {
          type: "lang",
          lang:sLang
        },
        success: function ()
        {
          maskWC ();
          try
          {
            // Set the url for the main page and forward to it
            var sURL = "main.jsp?sessionid="+WindowStorage.get("sessionID") + (g_aSettings.debug === true ? "&debug=true" : "");

            document.location.href = sURL;
          }
          catch (aEx)
          {
            displayErrorMessage (aEx);
            unmaskWC ();
          }
        }
      }
    );
  }

  var aOpenTabs = g_aMain.getMainArea ().getOpenTabs ();
  // If there are open tabs, ask the user if he wants to proceed
  if (aOpenTabs.length > 0)
  {
    Ext.Msg.confirm
    (
      getStandardTitle (),
      boc.ait.htmlEncode(getString ("ait_lang_change")).replace(/\n/g, "<br/>"),
      function (sResult)
      {
        // If the user wishes to proceed, close all tabs in the main area
        // Pass the actual function that resets the web client and uses the new
        // selected language to the
        // closeTabs function as a callback
        if (sResult === "yes")
        {
          g_aMain.getMainArea().closeTabs
          (
            {
              callback: function ()
              {
                // Do the language switch on the server
                _ajaxSwitchLanguage ();
              }
            }
          );
        }
      }
    );
  }
  // If there are no open tabs to close, proceed
  else
  {
    // Do the language switch on the server
    _ajaxSwitchLanguage ();
  }
};


/*
 * Retrieves the url parameters passed in the current url as JS Object
 * 
 * \retval A dictionary style object containing the url parameters as key value
 * pairs.
 */
// ---------------------------------------------------------------------
boc.ait.getURLParameters = function ()
// ---------------------------------------------------------------------
{
  // Get the parameters passed to this page
  var sSearch = document.location.search;

  var aParams = {};
  // Check if there are any parameters
  if (sSearch.indexOf("?") > -1)
  {
    sSearch = sSearch.substring(1);
    var aParamsArr = [];
    aParamsArr = sSearch.split("&");
    // Iterate through the parameters passed to the page
    for (var i = 0; i < aParamsArr.length;++i)
    {
      var aKeyValPair = aParamsArr[i].split("=");
      aParams[aKeyValPair[0]] = aKeyValPair[1];
    }
  }

  return aParams;
};

/*
 * Encodes a string and masks all html specific characters
 * 
 * \retval The cleaned/encoded string
 */
// ---------------------------------------------------------------------
boc.ait.htmlEncode = function (sString, bSkipSpecialEscape)
// ---------------------------------------------------------------------
{
  // If we are in offline mode, already masked entities (&,<,>) have to be
  // unmasked
  var bDoSpecialEscape = g_aSettings.offline && bSkipSpecialEscape !== true;
  if (bDoSpecialEscape)
  {
    sString = sString.replace(/\&gt;/g, ">").replace(/\&lt;/g, "<").replace(/\&amp;/g, "&");
  }
  sString = Ext.util.Format.htmlEncode(sString);
  // These strings may be present in case of richvalues (only in HTML-export) -> replace them to 
  // have proper visualisation (replacement strings defined in xml_to_string.xsl)
  if (bDoSpecialEscape)
  {
    return sString.replace(/\@@OT@@/g, "<").replace(/\@@CT@@/g, ">").replace(/\@@QT@@/g, "\"");
  }  
  return sString;
};

/*
 * Searches for objects or models in the repository, configured by the passed
 * params object
 * 
 * \param aParams A dictionary like param object that configures the search -
 * callback: A callback function that is called when the search finishes. The
 * callback has two parameters: a boolean flag indicating whether the search was
 * successful and if the search was successful, the search result: callback:
 * function (bSuccess, aSearchResult) { ... } - scope: The scope in which the
 * callback should be executed - maskElement: [optional] The element to mask
 * when the search is performed
 * 
 * \retval The cleaned/encoded string
 */
// ---------------------------------------------------------------------
boc.ait.doSearch = function (aParams)
// ---------------------------------------------------------------------
{
  try
  {
    maskWC (null, aParams.maskElement);

    var aSearchParams = boc.ait.clone (aParams);

    var aCallback = aSearchParams.callback;
    var aScope = aSearchParams.scope || this;

    Ext.Ajax.request
    (
      {
        url:"proxy",
        method:"GET",
        params:
        {
          type: "search",
          params: Ext.encode (aParams)
        },
        success: function (aResponse, aOptions)
        {
          var aRetObj = null;
          try
          {
            aRetObj = Ext.decode(aResponse.responseText);
          }
          finally
          {
            unmaskWC (aParams.maskElement);
          }
          
          if (aRetObj.error)
          {
            showErrorBox (aRetObj.errString);
            return;
          }
          
          if (aCallback)
          {
            aCallback.call (aScope, true, aRetObj.payload);
          }
        },
        failure: function ()
        {
          unmaskWC (aParams.maskElement);
          aCallback.call (aScope, false, null);
        }
      }
    );
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};



Ext.override(Ext.data.Store,{
    createSortFunction : function (f, direction)
    {
      direction = direction || "ASC";
      var directionModifier = direction.toUpperCase() == "DESC" ? -1 : 1;

      var sortType = this.fields.get(f).sortType;


      return function(r1, r2)
      {
        var v1 = sortType(r1.data[f]),
            v2 = sortType(r2.data[f]);

        if (typeof v1 == "string" && typeof v2 == "string")
        {
          v1 = v1.toLowerCase ();
          v2 = v2.toLowerCase ();
        }

        return directionModifier * (v1 > v2 ? 1 : (v1 < v2 ? -1 : 0));
      };
    }
  }
);

/*
 * Reloads the scripts on the aserver.
 * 
 * \param aParams An optional params object, that can contain a callback to call
 * when reloading the aserver scripts is finished.
 */
// ---------------------------------------------------------------------
boc.ait.reloadAServerScripts = function (aParams)
// ---------------------------------------------------------------------
{
  aParams = aParams || {};
  var aCallback = aParams.callback;
  var aScope = aParams.scope || this;

  Ext.Ajax.request
  (
    {
      url:"proxy",
      method:"POST",
      params:
      {
        type: "reload"/*
                       * , ensureRepoSession: false
                       */
      },
      success: function ()
      {
        g_aMain.getStatusBar().setStatus ("Reloaded Scripts.");
        if ((typeof aCallback) === "function")
        {
          aParams.callback.call (aScope, true);
        }
      },
      failure: function (aResponse)
      {
        g_aMain.getStatusBar().setStatus ("Scripts were not reloaded!");

        showErrorBox (aResponse.responseText);
        if ((typeof aCallback) === "function")
        {
          aParams.callback.call (aScope, false);
        }
      },
      scope: aParams.scope
    }
  );
};

/*
 * Creates an artefact using the passed parameters
 * 
 * \param aParams A params object containing the following members: name: The
 * name of the new artefact artefactType: The artefact type of the new artefact
 * (AIT_ARTEFACT_OBJECT by default) targetGroupID: [optional] The id of the
 * group to place the artefact in targetGroupName: [optional] The name of the
 * group to place the artefat in. The group with that name is either created or
 * looked for in the group specified by targetGroupID. establishOwnership:
 * [optional] Should ownership to the new object be established?
 * storeInDefaultGroup: [optional] Should the new artefact be stored in the
 * default group? classID: The id of the class of the new artefact attributs:
 * [optional] An object containing key/value pairs, where the key is the
 * language independent name of the attribute and the value is the ... value.
 * callback: [optional] The callback function that is called when the artefact
 * was created. Parameters are bSuccess: Was the artefact created successfully?
 * aObject: A js object containing data about the new artefact scope: [optional]
 * The scope in which callback is executed
 */
// ---------------------------------------------------------------------
boc.ait.createArtefact = function (aParams)
// ---------------------------------------------------------------------
{
  var aCallback = aParams.callback;
  var aScope = aParams.scope || this;
  var aAjaxParams =
  {
    type: "createobject",
    params:
    {
      name: boc.ait.stripIllegalCharacters(aParams.name),
      artefactType: aParams.artefactType || AIT_ARTEFACT_OBJECT,
      targetGroupID: aParams.targetGroupID,
      targetGroupName: aParams.targetGroupName,
      attributes: aParams.attributes,
      establishOwnership : aParams.establishOwnership,
      // Only store in the default group, if no group can be selected here
      storeInDefaultGroup: aParams.storeInDefaultGroup,
      classId: aParams.classId
    }
  };

  g_aEvtMgr.fireEvent ("beforecreateobject", aAjaxParams);

  aAjaxParams.params = Ext.encode (aAjaxParams.params);

  // Start a new ajax call to create an object on the aserver
  Ext.Ajax.request
  (
    {
      url:"proxy",
      method:"POST",
      params: aAjaxParams,
      // On success we handle the return data
      success: function (aResponse, aOptions)
      // --------------------------------------------------------------------
      {
        try
        {
          // Decode the response Object
          var aRetObj = Ext.decode(aResponse.responseText);
          if (aRetObj.error)
          {
            if (aParams.silent !== true)
            {
              showErrorBox(aRetObj.errString);
            }
            if(typeof aCallback === "function")
            {
              aCallback.call (aScope, false);
            }
            return;
          }

          if(aRetObj.errString && aParams.silent !== true)
          {
            showInfoBox(aRetObj.errString);
          }
          var aPayload = aRetObj.payload;
          g_aEvtMgr.fireEvent ("instancecreated", aPayload);

          // Call the callback defined for when the creation finishes
          if (typeof aCallback == "function")
          {
            aCallback.call(aScope, true, aPayload);
          }
        }
        catch (aEx)
        {
          displayErrorMessage (aEx);
        }
      }
    }
  );
};

/*
 * Deletes an artefact using the passed parameters
 * 
 * \param aParams A params object containing the following members:
 * artefactInfo: An array containing the ids of the artefacts to delete
 * artefactType: The artefact type of the artefact(s) to delete callback:
 * [optional] The callback function that is called when the artefact was
 * deleted. Parameters are bSuccess: Was the artefact deleted successfully?
 * aObjectInfo: A js object containing information about the deleted artefact(s)
 * scope: [optional] The scope in which callback is executed
 */
// ---------------------------------------------------------------------
boc.ait.deleteArtefact = function (aParams)
// ---------------------------------------------------------------------
{
  maskWC ();
  var aCallback = aParams.callback;
  var aScope = aParams.scope || this;
  
  // Start a new ajax call to delete the selected artefact on the server
  Ext.Ajax.request
  (
    {
      url:"proxy",
      method:"POST",
      params:
      {
        type: "delete",
        params: Ext.encode
        (
          {
            artefactInfo: aParams.artefactInfo,
            artefactType: aParams.artefactType,
            useRecycleBin: g_aSettings.useRecycleBin
          }
        )
      },
      // On success we check the return object
      success: function (aResponse, aOptions)
      {
        // Decode the response Object
        var aRetObj = Ext.decode(aResponse.responseText);
        if (aRetObj.error)
        {
          if (aParams.silent !== true && aRetObj.errString)
          {
            showErrorBox(aRetObj.errString);
          }
          if(typeof aCallback === "function")
          {
            aCallback.call (aScope, false);
          }
          unmaskWC ();
          return;
        }
        
        g_aEvtMgr.fireEvent("instancesdeleted", aRetObj.payload.deletedInstanceIds, aRetObj.payload.newParentId);
        // Call the callback defined for when the creation finishes
        if (typeof aCallback == "function")
        {
          aCallback.call(aScope, true, aRetObj.payload);
        }
        
        unmaskWC ();
      }
    }
  );
};

/*
 * Global function that returns the artefact data template for the passed
 * artefact type.
 * 
 * \param nArtefactType The artefact type for which to retrieve the template
 * \param aAdditionalFields [optional] An array of additional fields to add the
 * template
 */
// ---------------------------------------------------------------------
boc.ait.commons.getArtefactDataTemplate = function (nArtefactType, aAdditionalFields)
// ---------------------------------------------------------------------
{
  checkParam (nArtefactType, "number");
  checkParamNull (aAdditionalFields, Array);

  // Setup the default fields that are always available
  var aFields =
  [
    {name: 'text'},
    {name: 'idClass'},
    {name: 'classId'},
    {name: 'modelId'},
    {name: 'idClass_lang'},
    {name: 'id'},
    {name: 'iconUrl'},
    {name: '_is_leaf', type: 'bool'},
    {name: 'artefactType'},
    {name: 'context'},
    {name: '_parent'},
    {name: 'type'},
    {name: 'editable'},
    {name: 'pool'}
  ];
  
  var i;

  // If the artefact is an object or diagram, we add the always visible
  // attributes
  if (nArtefactType === AIT_ARTEFACT_OBJECT || nArtefactType === AIT_ARTEFACT_DIAGRAM)
  {
    // Add the visible attributes to the record template
    var aVisAttrs = boc.ait.getVisibleAttributes (nArtefactType);

    for (i = 0; aVisAttrs && i < aVisAttrs.length;++i)
    {
      var aVisAttr = aVisAttrs[i];
      aFields.push
      (
        {
          name: 'attr_'+aVisAttr.name.toLowerCase()
        }
      );
    }
  }

  // Add additionalfields that were passed
  for (i = 0; aAdditionalFields && i < aAdditionalFields.length;++i)
  {
    aFields.push (aAdditionalFields[i]);
  }

  // Return the record template
  return Ext.data.Record.create (aFields);
};

/*
 * Public convenience function that returns the selected nodes in the tree.
 */
// ---------------------------------------------------------------------
boc.ait.getArt = function ()
// ---------------------------------------------------------------------
{
  var aNodes = g_aMain.getTreeArea().getActiveTree().getSelectedNodes ();
  if (aNodes.length === 1)
  {
    return aNodes[0];
  }
  return aNodes;
};

/*
 * Global function that evaluates a JSON path and returns the value at the path.
 * Optionally, the value at the path is set to a passed value.
 * 
 * \param aObject The object on which to evaluate the json path \param sPath The
 * json path expression \param aVal [optional] The value to set at the evaluated
 * JSONPath.
 * 
 * \retval The element at the evaluated json path
 */
// ---------------------------------------------------------------------
boc.ait.evalJSONPath = function (aObject, sPath, aVal)
// ---------------------------------------------------------------------
{
  var aPathElements = sPath.split(".");
  var aCtx = aObject;
  var aParent = aObject;
  var sLastPathElement = null;
  for (var i = 0; i < aPathElements.length;++i)
  {
    sLastPathElement = aPathElements[i];
    if (!aCtx)
    {
      break;
    }
    aParent = aCtx;
    aCtx = aCtx[aPathElements[i]];
  }

  if (aParent && (aVal !== undefined) && (aVal !== null) && sLastPathElement)
  {
    aParent[sLastPathElement] = aVal;
  }

  return aCtx;
};

boc.ait._parsePageParams = function ()
{
  var sSearch = document.location.search;
  if (!g_aSettings)
  {
    g_aSettings = {};
  }
  g_aSettings.pageParams = {};
  // Check if there are any parameters
  if (sSearch.indexOf("?") > -1)
  {
    sSearch = sSearch.substring(1);
    var aParamsArr = [];
    // Split the params string
    aParamsArr = sSearch.split("&");

    // Iterate through the parameters passed to the page
    for (var i = 0; i < aParamsArr.length;++i)
    {
      var aKeyValPair = aParamsArr[i].split("=");
      g_aSettings.pageParams[aKeyValPair[0]] = aKeyValPair[1];
    }
  }
};

/*
 * Retrieves an object containing information to use for a global search query.
 * The created query contains all globally indexed attributes.
 * 
 * \param aConfig A dictionary like object containing the following parameters:
 * pattern: The pattern to search for artefactType: [optional] Either
 * AIT_ARTEFACT_OBJECT or AIT_ARTEFACT_DIAGRAM Restricts the query's result set.
 */
// ---------------------------------------------------------------------
boc.ait.getGlobalSearchQuery = function (aConfig)
// ---------------------------------------------------------------------
{
  checkParam (aConfig, "object");
  checkParam (aConfig.pattern, "string");
  checkParamNull (aConfig.artefactType, "number");
  
  var sPattern = aConfig.pattern;
  var sQueryString = "";
  if (aConfig.artefactType === AIT_ARTEFACT_OBJECT)
  {
    sQueryString = "TYPE:repoinst AND ";
  }
  else if (aConfig.artefactType === AIT_ARTEFACT_DIAGRAM)
  {
    sQueryString = "TYPE:model AND ";
  }
  
  sPattern = sPattern.trim().replace(/\"/g, "").replace(/\'/g   , "");
  
  var aAttributes = 
  {
    name: sPattern
  };
  
  if(!g_aSettings.searchData.global_attributes)
  {
    sQueryString += "((ATTR_DESCRIPTION: " +sPattern+ " OR DESCRIPTION: " + sPattern+ ") OR NAME: " + sPattern+") ";
    
    aAttributes.description = sPattern;
    aAttributes.attr_description = sPattern;
  }
  else
  {
    var nLength = g_aSettings.searchData.global_attributes.length;
    sQueryString += "(";
    for(var i = 0; i<nLength; i++)
    {
      var sAttrName = g_aSettings.searchData.global_attributes[i].attrName;
      if(sAttrName !== "NAME")
      {
        if(sQueryString.indexOf(sAttrName) < 0)
        {
          if(nLength > i && i !== 0)
          {
            sQueryString +=" OR ";
          }
          sQueryString += "("+sAttrName+": "+sPattern+")";
          aAttributes[sAttrName] = sPattern;
        }
      }
    }
    if(nLength > 0)
    {
      sQueryString += " OR ";
    }
    sQueryString+="NAME: "+sPattern+")";
  }
  
  return  {
            query: sQueryString,
            attributes: aAttributes
          };
};

/*
  Global function that performs a logout.
  
  \param bSilent If this is true, the user will not be asked whether or not unsaved changes
                 should be stored
*/
//--------------------------------------------------------------------
boc.ait.logout = function (bSilent)
//--------------------------------------------------------------------
{
  var bError = false;
  try
  {    
    /*
      Internal function that does the logout and then forwards to the login page
    */
    //--------------------------------------------------------------------
    function _ajaxDoLogout ()
    //--------------------------------------------------------------------
    {
      Ext.Ajax.request
      (
        {
          url:"proxy",
          params:
          {
            type: "logout"
          },
          callback: function()
          {
            maskWC (getString("ait_logout_msg"));
            boc.ait.forwardToLogin.call (this, true);
          },
          scope:this
        }
      );
    }
    
    // Check if there are open tabs - in that case we tell the main area to close them and afterwards
    // do the logout
    if ((typeof (g_aMain) === "object") && g_aMain.getMainArea ().getOpenTabs ().length > 0 && !bSilent)
    {
      g_aMain.getMainArea ().closeTabs
      (
        {
          scope: this, 
          callback:function (bContinue)
          {
            if (bContinue)
            {
              _ajaxDoLogout.call (this);
            }
          }
        }
      );
    }
    // Otherwise, directly logout
    else
    { 
      _ajaxDoLogout.call (this);
    }
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
      unmaskWC ();
    }
  }
};

/*
  Strips illegal special characters from a string and replaces them with question marks.
  
  returns the modified string
*/
boc.ait.stripIllegalCharacters = function (sString)
{
  return sString.replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/ig,'?');
};

boc.ait.getEnumVal = function (sConstraint, sLangConstraint, sVal)
{
  var aConstraints = sConstraint.split ("@");
  var aLangConstraints = sLangConstraint.split ("@");
  for (var i = 0; i < aConstraints.length;++i)
  {
    if (aConstraints[i] === sVal)
    {
      return aLangConstraints[i];
    }
  }
  
  return "";
};

boc.ait.getTimeFilterVal = function (aVal)
{
  if ((typeof aVal) === "number")
  {
    var aTimePeriod = g_aMain.getMenuBar().getTimeFilter().getTimePeriodForDate (aVal);
    if (aTimePeriod)
    {
      return aTimePeriod.label;
    }
  }
  return "";
};

/*
 * Exports the passed json datasets as either csv or pdf
 * 
 * \param aParams A dictionary like object containing the following parameters:
 * dataSets: The datasets to export exportType: The file type to export to
 * (either 'pdf' or 'csv')
 */
//--------------------------------------------------------------------
boc.ait.exportJSON = function (aParams)
//--------------------------------------------------------------------
{
  var aDataSets = aParams.dataSets;
  var sExportType = aParams.exportType;
  if (aDataSets.length === 0)
  {
    unmaskWC ();
    return;
  }

  var aDate = new Date ();
  var sDate = aDate.format (AIT_DATE_TIME_FORMAT);
  
  var sContentType = "application/pdf";
  if (sExportType === "csv")
  {
    sContentType = "text/csv";
  }
  boc.ait.doCustomReport
  (
    {
      reportMethod: "exportJSON",
      contentType: sContentType,
      params:
      (
        {
          dataSets: aDataSets,
          type: sExportType,
          date: aDate.getTime()
        }
      ),
      fileName:sDate+"-" + getString("ait_search_window_result")+"."+sExportType,
      title: getString("ait_search_window_result"),
      inline: false,
      scope:this,
      callback: function ()
      {
        unmaskWC ();
      }
    }
  );  
};

/*
 * Cuts off the title of a panel and adds 3 dots (ellipsis) if the title does
 * not fit the tab strip.
 * 
 * \param aPanel The tabpanel whose title should be truncated
 */
// --------------------------------------------------------------------
boc.ait.ellipsisTitle = function (aPanel)
// --------------------------------------------------------------------
{
  if (!aPanel.ownerCt || (typeof aPanel.ownerCt.getTabEl !== "function"))
  {
    return;
  }
  
  // Get the panel's title
  var sTitle = aPanel.title;
  aPanel.selector = Ext.fly(aPanel.ownerCt.getTabEl(aPanel)).dom;
  var aSpan = Ext.DomQuery.selectNode("span", aPanel.selector);
  
  // Make sure that the title is not bigger than 115 characters
  var MAX_WIDTH = 115;
  var sNewText = sTitle;
    
  for (var i = 0; i <= sTitle.length; i++)
  {
    sNewText = sTitle.substring(0, i);
    var nTextWidth = Ext.util.TextMetrics.measure(aSpan, sNewText).width;
    if (nTextWidth > MAX_WIDTH) 
    {
      sNewText = sTitle.substring(0, i - 3) + "...";
      break;
    }
  }
  
  aPanel.setTitle (sNewText);
};

/*
 Creates a copy of the passed elements and pastes them to the passed target group
 
 \param aParams A dictionary like object containing:
    artefactType: The artefactType of the tree to paste to, either AIT_ARTEFACT_OBJECT or AIT_ARTEFACT_DIAGRAM
    targetGroupId: The ID of the group to paste to
    elements: An array of objects consisting of artefactId and artefactType. Those elements will be copied.
*/
// --------------------------------------------------------------------
boc.ait.pasteArtefactsToGroup = function (aParams)
// --------------------------------------------------------------------
{
  checkParam (aParams, "object");
  checkParam (aParams.artefactType, "number");
  checkParam (aParams.targetGroupId, "string");
  checkParam (aParams.elements, Array);
  
  maskWC ();
  
  var aCallback = aParams.callback;
  var aScope = aParams.scope || this;
  var bError = false;
  try
  {  
    // Do an Ajax request to do the copy/pasting on the aserver
    Ext.Ajax.request
    (
      {
        url: "proxy",
        params:
        {
          type: "copyPasteArtefacts",
          params: Ext.encode
          (
            {
              artefactType: aParams.artefactType,
              targetGroupId: aParams.targetGroupId,
              elements: aParams.elements
            }
          )
        },
        success: function (aResponse, aOptions)
        {
          var aData = Ext.util.JSON.decode(aResponse.responseText);
          if (aData.error)
          {
            showErrorBox (aData.errString);
            unmaskWC ();
            return;
          }
          if (aData.errString)
          {
            showInfoBox (aData.errString);
          }
          
          // Fire an event that the artefacts were copied and pasted. Currently we don't have any
          // parameters for that event but the artefacttype of the tree to paste to
          g_aEvtMgr.fireEvent ("axw.after.artefacts.pasted", {artefactType: aParams.artefactType});
          
          // Call the callback defined for when the paste action finishes
          if (typeof aCallback == "function")
          {
            aCallback.call(aScope, true, aData.payload);
          }
          
          unmaskWC ();
        }
      }
    );
  }
  catch (aEx)
  {
    bError = true;
    throw aEx;
  }
  finally
  {
    if (bError)
    {
      unmaskWC ();
    }
  }
};

/*
 Opens the dialog showing all the stored search queries of the current user.
*/
// --------------------------------------------------------------------
boc.ait.showStoredSearchQueryMgtDialog = function (aParams)
// --------------------------------------------------------------------
{
  maskWC ();
  new boc.ait.search.SearchQueryDialog (aParams);
};

/*
 Returns the html string that is shown on the login page and on the idm page if the server is not done initializing yet
*/
// --------------------------------------------------------------------
boc.ait.getServerInitStateAsHTML = function ()
// --------------------------------------------------------------------
{
  return "<table style='text-align:center;width:100%;'>"+
          "<tr>"+
            "<td>&nbsp;</td>"+
            "<td width='480'>"+
                getString("ait_webclient_not_initialized") +
            "</td>"+
            "<td>&nbsp;</td>"+
          "</tr>"+
          "<tr>"+
            "<td>&nbsp;</td>"+
            "<td width='480'id='status_td'></td>"+
            "<td>&nbsp;</td>"+
          "</tr>"+
          "<tr><td></td><td width='480'>&nbsp;</td><td></td></tr>"+
          "<tr>"+
            "<td>&nbsp;</td>"+
            "<td width='480'>"+
              getString("ait_webclient_update_interval").replace(/%UPDATE_INTERVAL%/g, "<span id='ait_login_page_init_interval_msg'>&nbsp;</span>") +
            "</td>"+
            "<td>&nbsp;</td>"+
          "</tr>"+
          "<tr>"+
            "<td>&nbsp;</td>"+
            "<td width='480' id='ait_login_page_init_updating_indicator'>"+
            "</td>"+
            "<td>&nbsp;</td>"+
          "</tr>"+
        "</table>";
};

/*
  Returns whether or not the browser supports canvas.
*/
// --------------------------------------------------------------------
com.boc.axw.isCanvasSupported = function()
// --------------------------------------------------------------------
{
  var aElem = document.createElement ('canvas');
  // Check if the browser supports canvas. We use the widely accepted double ! here. This always returns
  // a value of type boolean unlike new Boolean (..) which creates an object.
  var bCanvasSupported = !!(aElem.getContext && aElem.getContext('2d'));
  aElem = null;
  return bCanvasSupported;
};

// NOTE FBA:AXW-80716 HTML report does not visualize colors: Since we do not support color rendering in the
// html report, this function also check if the group only contains the color control and returns that the
// group is empty
com.boc.axw.isGroupEmpty = function (aGroup)
{
  var bIsEmpty = true;
  if ((!aGroup.children || aGroup.children.length === 0))
  {
    return true;
  }
  for (var i = 0; i < aGroup.children.length; ++i)
  {
    var sType = aGroup.children[i].type;
    var nControlType = aGroup.children[i].ctrltype ? aGroup.children[i].ctrltype.toLowerCase () : "";
    if ((sType === "attribute" && nControlType !== "color") || sType === "relation")
    {
      return false;
    }
    if (bIsEmpty)
    {
      bIsEmpty = com.boc.axw.isGroupEmpty (aGroup.children[i]);
    }
    else
    {
      return false;
    }
  }
  return bIsEmpty;
};