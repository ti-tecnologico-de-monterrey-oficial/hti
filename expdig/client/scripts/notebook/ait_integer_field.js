/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.IntegerField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.IntegerField. This class
    is used for showing integer attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.IntegerField = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  // Initialize the config object if necessary
  aConfig = aConfig || {};

  // Initialize the config object if necessary


  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    try
    {
      aConfig.fieldConf = aConfig.fieldConf || {};
      aConfig.fieldConf.maxValue = aConfig.fieldConf.maxValue !== undefined ? aConfig.fieldConf.maxValue : 199999999;
        // Do not allow decimals for integer values
      aConfig.fieldConf.allowDecimals = false;
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.notebook.IntegerField.superclass.constructor.call(this, aConfig);
}

// boc.ait.notebook.IntegerField is derived from boc.ait.notebook.NumberField
Ext.extend
(
  boc.ait.notebook.IntegerField,
  boc.ait.notebook.NumberField,
  {}
);

// Register the integerfield's xtype
Ext.reg("boc-integerfield", boc.ait.notebook.IntegerField);