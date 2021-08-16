/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2016\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2016
**********************************************************************
\author MWh
This file contains the code for the boc.ait.EventManager class
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait');
Ext.namespace ("com.boc.axw.events");

// Event that is triggered when the middle mouse button is clicked
com.boc.axw.events.MOUSE_CLICK_MIDDLE = "com.boc.axw.events.MOUSE_CLICK_MIDDLE";

/*
    Implementation of the class boc.ait.EventManager. This class
    is used for managing global events in the ADOit Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.EventManager = function (aConfig)
//--------------------------------------------------------------------
{
  // Instantiate the config object if necessary
  aConfig = aConfig || {};


  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    try
    {

    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.EventManager.superclass.constructor.call(this, aConfig);
};

// boc.ait.EventManager is derived from Ext.util.Observable
Ext.extend
(
  boc.ait.EventManager,
  Ext.util.Observable,
  {
    // Necessary public property for all subclasses of Observable
    events: {}
  }
);

// Register the eventmanager's xtype
Ext.reg("boc-evtmgr", boc.ait.EventManager);