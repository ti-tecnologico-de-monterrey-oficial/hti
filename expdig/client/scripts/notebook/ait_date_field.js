/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.DateField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.DateField. This class
    is used for showing date attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.DateField = function (aConfig)
//--------------------------------------------------------------------
{
  Ext.apply (this, aConfig);

  /*
      Private method that is called when the field's value changes
      \param aField The changed field
      \param aNewValue The new value of the field
      \param aOldValue The old value of the field
  */
  //--------------------------------------------------------------------
  var onChange = function (aField, aNewValue, aOldValue)
  //--------------------------------------------------------------------
  {
    try
    {
      var sValue = "";
      var nDate = aNewValue.getDate();
      // Build a string representation of the date
      sValue += nDate < 10 ? "0"+nDate:nDate;
      sValue += ".";
      var nMonth = aNewValue.getMonth() + 1;
      sValue += nMonth < 10 ? "0"+nMonth:nMonth;
      sValue += ".";
      sValue += aNewValue.getFullYear();

      // Pass the field's name and the values to the notebook
      this.valueChange (sValue);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }

  /*
      Private method that is called when the field's value changes
      \param aField The changed field
      \param aNewValue The new value of the field
      \param aOldValue The old value of the field
  */
  //--------------------------------------------------------------------
  var onValid = function (aField)
  //--------------------------------------------------------------------
  {
    try
    {
      var sValue = "";
      var aNewValue = aField.getValue();
      var nDate = aNewValue.getDate();

      // Build a string representation of the date
      sValue += nDate < 10 ? "0"+nDate:nDate;
      sValue += ".";
      var nMonth = aNewValue.getMonth() + 1;
      sValue += nMonth < 10 ? "0"+nMonth:nMonth;
      sValue += ".";
      sValue += aNewValue.getFullYear();

      var sValFormatted = aNewValue.format(aField.initialConfig.format);
      if (this.value == sValFormatted)
      {
        return;
      }

      // Pass the field's name and the values to the notebook
      this.notebook.onAttrChange(this.name, sValue, null);
      this.value = sValFormatted;
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }


  /*
      Private method that is called when the field is disabled
      Removes a class from the field. This workaround is necessary because in some
      browsers disabled elements are automatically hidden
  */
  //--------------------------------------------------------------------
  var onDisableFunction = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      var aEl = that.getEl().dom;
      var aParent = aEl.parentNode;
      var aParentEl = Ext.get(aParent);
      aParentEl.removeClass("x-item-disabled");
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }


  aConfig.fieldClass = Ext.form.DateField;

  aConfig.fieldConf = aConfig.fieldConf || {};
  aConfig.fieldConf.format = "Y.m.d";



  var aDate;
  if (Ext.isNumber (this.data.value.val))
  {
    aDate = new Date(this.data.value.val);
  }
  else if (Ext.isString (this.data.value.val))
  {
    aDate = new Date();
    var aDateTimeArr = this.data.value.val.split(" ");
    var aDateArr = aDateTimeArr[0].split(".");
    if (g_aSettings.offline)
    {
      aDate.setYear (aDateArr[2]);
      aDate.setMonth (aDateArr[1]-1);
      aDate.setDate (aDateArr[0]);
    }
    else
    {
      aDate.setYear (aDateArr[0]);
      aDate.setMonth (aDateArr[1]-1);
      aDate.setDate (aDateArr[2]);
    }
  }
  else
  {
    aDate = new Date ();
  }

  aConfig.fieldConf.value = this.value = aDate.format(aConfig.fieldConf.format);


  aConfig.fieldConf.fieldLabel = this.data.classname;
  aConfig.fieldConf.autoWidth = true;
  aConfig.fieldConf.autoShow = true;

  aConfig.fieldConf.listeners =
  {
    //change: onChange,
    valid: onValid,
    disable: onDisableFunction,
    scope: this
  }

  aConfig.autoWidth = true;


  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";


  // Call to the superclass' constructor
  boc.ait.notebook.DateField.superclass.constructor.call(this, aConfig);

  this._update = function (aAttrData)
  {
    this.data = aAttrData;
    var aDateTimeArr = this.data.value.val.split(" ");
    var aDateArr = aDateTimeArr[0].split(".");
    //var aDate = new Date(aDateArr[2], aDateArr[1]-1, aDateArr[0]);
    var aDate = new Date();
    if (g_aSettings.offline)
    {
      aDate.setYear (aDateArr[2]);
      aDate.setMonth (aDateArr[1]-1);
      aDate.setDate (aDateArr[0]);
    }
    else
    {
      aDate.setYear (aDateArr[0]);
      aDate.setMonth (aDateArr[1]-1);
      aDate.setDate (aDateArr[2]);
    }
  };
}

// boc.ait.notebook.DateField is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.DateField,
  //Ext.form.DateField,
  boc.ait.notebook.Field,
  {}
)
// Register the datefield's xtype
Ext.reg("boc-datefield", boc.ait.notebook.DateField);