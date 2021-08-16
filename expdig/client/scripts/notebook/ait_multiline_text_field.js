/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2009\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2009
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.MultiLineTextField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.TextField. This class
    is used for showing text attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.MultiLineTextField = function (aConfig)
//--------------------------------------------------------------------
{
  aConfig.fieldClass = Ext.form.TextArea;
  aConfig.fieldConf =
  {
    cls : "boc-notebook-field boc-textarea"
  };

  boc.ait.notebook.MultiLineTextField.superclass.constructor.call (this, aConfig);

  this._getValueRep = function ()
  {
    return boc.ait.htmlEncode (this.value).replace(/\n/g, "<br/>");
  };
};


// boc.ait.notebook.MultiLineTextField is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.MultiLineTextField,
  boc.ait.notebook.TextField,
  {
    getValueRep: function ()
    {
      return this._getValueRep();
    }
  }
);

// Register the textfield's xtype
Ext.reg("boc-multilinetextfield", boc.ait.notebook.MultiLineTextField);
