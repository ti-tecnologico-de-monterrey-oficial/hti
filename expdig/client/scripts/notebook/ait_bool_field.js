/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2009\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2009
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.BoolField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.BoolField. This class
    is used for showing boolean attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.BoolField = function (aConfig)
//--------------------------------------------------------------------
{
  /*
      Private method that is called when the field value's validity was checked
      \param aField The checked field
  */
  //--------------------------------------------------------------------
  var onCheck = function (aField)
  //--------------------------------------------------------------------
  {
    if (this.value != aField.getValue())
    {
      this.value = aField.getValue();
      this.valueChange (aField.getValue());
    }
  };

  Ext.apply (this, aConfig);

  aConfig.noTitle = true;

  aConfig.fieldClass = Ext.form.Checkbox;
  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";

  aConfig.fieldConf = aConfig.fieldConf || {};
  //aConfig.fieldConf.cls = aConfig.fieldConf.cls || "boc-notebook-field boc-notebook-singlelinefield";

  aConfig.fieldConf.boxLabel = this.data.classname;
  //aConfig.fieldConf.hideLabel = true;
  aConfig.fieldConf.autoWidth = true;
  aConfig.fieldConf.value = this.data.value.val == 1;
  aConfig.fieldConf.checked = this.value = aConfig.fieldConf.value;
  // Setup a listener for the field's change event
  aConfig.fieldConf.listeners =
  {
    scope: this,
    check: onCheck
  };


  boc.ait.notebook.BoolField.superclass.constructor.call (this, aConfig);

  this._getValueRep = function ()
  {
    return this.value == 1 ? getString("ait_bool_yes") : getString("ait_bool_no");
  };
};

// boc.ait.notebook.BoolField is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.BoolField,
  boc.ait.notebook.Field,
  {
    getValueRep : function ()
    {
      return this._getValueRep ();
    }
  }
);

// Register the boolfield's xtype
Ext.reg("boc-boolfield", boc.ait.notebook.BoolField);