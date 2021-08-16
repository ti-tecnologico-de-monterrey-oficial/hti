/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2009\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2009
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.TextField class.
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
boc.ait.notebook.TextField = function (aConfig)
//--------------------------------------------------------------------
{
  var that = this;
  Ext.apply (this, aConfig);

  /*
      Private method that is called when the field value's validity was checked
      \param aField The checked field
  */
  //--------------------------------------------------------------------
  var onValid = function (aField)
  //--------------------------------------------------------------------
  {
    if (m_sOriginalValue != aField.getValue())
    {
      this.value = aField.getValue();
      this.valueChange (aField.getValue());
    }
    else
    {
      //this.notebook.rmAttrChange (this.name);
    }
  }

  /*
      Private method that is called when the field value's validity was checked
      \param aField The checked field
  */
  //--------------------------------------------------------------------
  var onChange = function (aField, sNewVal, sOldVal)
  //--------------------------------------------------------------------
  {
    if (sNewVal == "")
    {
      showErrorBox (getString("ait_error_empty_name"));
      this.valueChange (sOldVal);
      this.value = sOldVal;
      aField.setValue(sOldVal);
    }
  }

  aConfig.fieldConf = aConfig.fieldConf ||
  {
    cls: "boc-notebook-field boc-notebook-singlelinefield"
  };

  aConfig.fieldConf.enableKeyEvents = true;
  aConfig.fieldConf.listeners =
  {
    valid: onValid,
    scope: this
  };

  var m_sOriginalValue = null;
  this.value = aConfig.fieldConf.value = m_sOriginalValue = this.data.value.val;

  if(this.data.ctrltype == "NAME")
  {
    aConfig.fieldConf.listeners.change = onChange;
  }

  aConfig.fieldClass = aConfig.fieldClass || Ext.form.TextField;

  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";

  aConfig.fieldConf.listeners.render = aConfig.fieldConf.listeners.render ||
      function (aBox)
      {
        //aBox.getEl().dom.parentNode.style.paddingRight = "6pt";
        that.notebook.on("save", function ()
          {
            m_sOriginalValue = that.value;
          }
        );
      };



  this.value = this.data.value.val;

  boc.ait.notebook.TextField.superclass.constructor.call (this, aConfig);

  this._update = function (aData)
  {
    m_sOriginalValue = aData.value.val;
    this.field.setValue (aData.value.val);
    this.value = aData.value.val;
  }
}

// boc.ait.notebook.TextField is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.TextField,
  //Ext.form.TextArea,
  //Ext.form.TextField,
  //Ext.Panel,
  boc.ait.notebook.Field,
  {}
);

// Register the textfield's xtype
Ext.reg("boc-textfield", boc.ait.notebook.TextField);