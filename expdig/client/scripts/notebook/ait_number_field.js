/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.NumberField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.NumberField. This class
    is used for showing number attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.NumberField = function (aConfig)
//--------------------------------------------------------------------
{
  /*
      Private method that is called when a keyup is happening in the text field.
      \param aField The changed field
      \param aEvent The triggered event
  */
  //--------------------------------------------------------------------
  var onKeyUp = function (aField, aEvent)
  //--------------------------------------------------------------------
  {
    if (this.value != aField.getRawValue())
    {
      this.value = aField.getValue();
      this.valueChange (aField.getValue());
    }
  };

  Ext.apply (this, aConfig);
  aConfig.fieldClass = Ext.form.NumberField;

  aConfig.fieldConf = aConfig.fieldConf || {};
  aConfig.fieldConf.cls = aConfig.fieldConf.cls !== undefined ?
    aConfig.fieldConf.cls
    :
    "boc-notebook-field boc-notebook-singlelinefield";

  aConfig.fieldConf.decimalPrecision = 6;
  aConfig.fieldConf.maxValue = aConfig.fieldConf.maxValue || 999999999999999;

  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";

  // Validator to make sure the value in the field is not smaller than the negative max value
  aConfig.fieldConf.validator = function (nVal)
  {
    nVal = Number(nVal);
    if (isNaN(nVal))
    {
      return false;
    }

    if (aConfig.data && aConfig.data.value.constraint && aConfig.data.value.constraint !== "")
    {
      var aConstraints = aConfig.data.value.constraint.split("@");
      var bValid = false;
      for (var i = 0; i < aConstraints.length;++i)
      {
        var sConstraint = aConstraints[i];
        var sLowerBoundary = sConstraint.substring (0, sConstraint.indexOf("<="));

        var sUpperBoundary = sConstraint.substring (sConstraint.lastIndexOf("<=")+2, sConstraint.length);
        var nLowerBoundary = 0;
        var nUpperBoundary = 0;
        if (sLowerBoundary !== "")
        {
          nLowerBoundary = Number(sLowerBoundary);
        }
        if (sUpperBoundary !== "")
        {
          nUpperBoundary = Number(sUpperBoundary);
        }

        if (nVal <= nUpperBoundary && nVal >= nLowerBoundary)
        {
          bValid = true;
        }
      }
      return bValid;
    }
    else
    {
      if (nVal < 0)
      {
        return nVal >= (aConfig.fieldConf.maxValue*(-1));
      }
      return true;
    }
  }


  aConfig.fieldConf.enableKeyEvents = true;
  /*aConfig.fieldConf.listeners =
  {
    valid: onValid,
    scope: this
  };*/

  if (!aConfig.forRecord)
  {
    this.value = aConfig.fieldConf.value = this.data.value.val;


    aConfig.fieldConf.listeners =
    {
      scope: this
    };
    aConfig.fieldConf.listeners.keyup = onKeyUp;
    aConfig.fieldConf.listeners.change = function (aField, sNewVal, sOldVal)
    {
      if (!aField.validateValue (this.value) || this.value.length === 0)
      {
        aField.setValue (sOldVal);
        this.value = sOldVal;
      }
      if (aField.getValue().length === 0)
      {
        aField.setValue(this.value);
      }
      // Make sure that only valid changes are stored
      if (sNewVal !== sOldVal && !isNaN(Number(sNewVal)) && sOldVal.length > 0)
      {
        this.valueChange (aField.getValue());
      }
    }
  }

  boc.ait.notebook.NumberField.superclass.constructor.call (this, aConfig);

  this._getValueRep = function ()
  {
    var sVal = this.value;
    if (this.data.idclass == "CREATION_DATE" || this.data.idclass == "DATE_OF_LAST_CHANGE")
    {
      var aDate = new Date (Number(sVal)*1000);
      sVal = aDate.format("d.m.Y H:i:s");
    }
    else
    {
      sVal = this.value;
    }

    return sVal;
  };

  this.__setValue = function (aVal)
  {
    if (!this.field.validateValue (aVal))
    {
      aVal = this.field.getValue();
    }
    this.field.setValue (aVal);

    boc.ait.notebook.NumberField.superclass.setValue.call (this, aVal);
  };
}

// boc.ait.notebook.NumberField is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.NumberField,
  //Ext.form.NumberField,
  boc.ait.notebook.Field,
  {
    getValueRep : function ()
    {
      return this._getValueRep ();
    },

    setValue : function (aVal)
    {
      this.__setValue (aVal);
    }
  }
);

// Register the numberfield's xtype
Ext.reg("boc-numberfield", boc.ait.notebook.NumberField);