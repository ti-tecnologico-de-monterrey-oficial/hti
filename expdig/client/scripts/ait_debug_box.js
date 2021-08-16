/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.DebugBox class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');


/*
    Implementation of the class boc.ait.DebugBox. This class contains a textarea
    where a developer can enter code and an execute button to execute the entered
    code.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.DebugBox = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var aTextArea = null;

  // Initialize the config object if necessary
  aConfig = aConfig || {};


  /*
      Private function that retrieves the text entered in the text area and tries to execute it
  */
  //--------------------------------------------------------------------
  var evalJS = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      var sVal = aTextArea.getValue();
      try
      {
        if (sVal === "dncornholio")
        {

          Ext.Msg.alert(getStandardTitle(), "God mode "+ (g_aSettings.godmode ? "de" : "") + "activated!");
          g_aSettings.godmode = !g_aSettings.godmode;
        }
        else
        {
          eval (sVal);
        }
      }
      catch (aEx)
      {
        displayErrorMessage (aEx);
      }
    }
    catch (aOuterEx)
    {
      displayErrorMessage (aOuterEx);
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
      // Set the title of the panel
      aConfig.title = 'Debug Box';

      aConfig.layout = 'border';
      aConfig.resizable = true;
      aConfig.split = true;
      aConfig.height = 200;

      // Create the text area in which the developer can enter JS code
      aTextArea = new Ext.form.TextArea
      (
        {
          region:'center',
          // Use class 'boc-notebook-field', so the textarea uses all the available horizontal space
          cls: 'boc-notebook-field',
          autoWidth:true
        }
      );

      // Create the execute button
      // Lazy instantiation
      var aExecuteButton =
      {
        xtype: 'button',
        handler: evalJS,
        text: 'Execute',
        region: 'south'
      };

      // Create the contained items of the debugbox
      aConfig.items =
      [
        aTextArea
      ];

      aConfig.buttons = [aExecuteButton];
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };


  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.DebugBox.superclass.constructor.call(this, aConfig);
};


// boc.ait.WebClient is derived from Ext.Panel
Ext.extend
(
  boc.ait.DebugBox,
  Ext.Panel,
  {}
);
// Register the debugbox' xtype
Ext.reg("boc-debugbox", boc.ait.DebugBox);