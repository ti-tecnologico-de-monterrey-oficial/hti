/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.util.ExtendedEditBox class.
**********************************************************************
*/

Ext.namespace("boc.ait.util");

boc.ait.util.ExtendedEditBox = function (aConfig)
{
  aConfig = aConfig || {};
  var that = this;
  
  var m_aCloseButton = null;

  var m_aTextArea = null;

  if (aConfig.editable === true)
  {
    // Create a new text area to display the text created before.
    // We can't use Ext.Msg.show here, because this ignores our linebreaks for some reason...
    m_aTextArea = new Ext.form.TextArea
    (
      {
        value: aConfig.text !== null && aConfig.text !== undefined ? aConfig.text : '',
        disabled: aConfig.editable === false
      }
    );
  }
  else
  {
    var sVal = (aConfig.text !== null && aConfig.text !== undefined ? aConfig.text : '').replace(/\n/g, "<br/>");


    while (sVal.indexOf("/%{") > -1)
    {
      var nBegin = sVal.indexOf("/%{");
      var nEnd = sVal.indexOf("}%/");
      var sPre = sVal.substring (0, nBegin);
      var sJSON = sVal.substring(nBegin+2, nEnd+1);

      var aExpression = Ext.decode (sJSON);
      var sPost = sVal.substring(nEnd+3);

      var sFn = "g_aMain.getMainArea().openNotebook(\""+aExpression.id+"\", "+aExpression.artefactType+");";

      sVal =sPre+"<a href='#' onclick='"+sFn+"'>"+aExpression.text+"</a>"+sPost;
    }


    sVal = sVal.replace(/\\n/g, "<br/>");
    // Uncomment when going back to Ext 3.*
    m_aTextArea  = new Ext.form.DisplayField
    (
      {
        value: sVal,
        disabled: false,
        autoScroll:true,
        style:"padding:4px;"
      }
    );
  }

  // Create a new inner function that will be used to close the error window
  var closeWindowFunction = function ()
  {
    if (aConfig.callback && typeof aConfig.callback == "function")
    {
      aConfig.callback.apply(aConfig.scope || that, [m_aTextArea.getValue().replace(/<br\/>/g, "\n")]);
    }

    that.close();
  };

  aConfig.layout='fit';
  aConfig.width = 500;
  aConfig.height = 300;
  aConfig.constrainHeader = true;
  aConfig.title = aConfig.title || getStandardTitle ();
  //aConfig.title = getString("ait_error");

  aConfig.items=
  [
    m_aTextArea
  ];
  
  m_aCloseButton = new Ext.Button
  (
    // Only ok button, so the user can acknowledge and close the message
    {
      text:aConfig.buttonText || "OK",
      // The handler is the inner function we created before
      handler: closeWindowFunction
    }
  );
  aConfig.buttons=
  [
    m_aCloseButton
  ];

  aConfig.listeners =
  {
    render: function (aBox)
    {
      if (typeof aConfig.loadFunction == "function")
      {
        aConfig.loadFunction.apply (this);
      }
    }
  };

  // Call to the superclass' constructor
  boc.ait.util.ExtendedEditBox.superclass.constructor.call(this, aConfig);


  /*
    Protected method that returns the edit box' text area.

    \retval The text area.
  */
  //--------------------------------------------------------------------
  this._getTextArea = function ()
  //--------------------------------------------------------------------
  {
    return m_aTextArea;
  };

  this._setText = function (sText)
  {
    m_aTextArea.setValue (boc.ait.htmlEncode(sText).replace(/\n/g, "<br/>"));
  };
  
  this._getCloseButton = function ()
  {
    return m_aCloseButton;
  };
};

Ext.extend
(
  boc.ait.util.ExtendedEditBox,
  Ext.Window,
  {

    /*
      Public method that returns the edit box' text area.

      \retval The text area.
    */
    //--------------------------------------------------------------------
    getTextArea : function ()
    //--------------------------------------------------------------------
    {
      return this._getTextArea();
    },

    setText : function (sText)
    {
      this._setText (sText);
    },
    
    getCloseButton : function ()
    {
      return this._getCloseButton ();
    }
  }
);

