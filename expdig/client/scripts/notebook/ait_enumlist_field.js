/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.EnumListField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.EnumListField. This class
    is used for showing enumlist attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.EnumListField = function (aConfig)
//--------------------------------------------------------------------
{
  /*
      Private method that is called when the field's value changes
      \param aField The changed field
      \param aNewValue The new value of the field
      \param aOldValue The old value of the field
  */
  //--------------------------------------------------------------------
  var onCheck = function (aField)
  //--------------------------------------------------------------------
  {
    try
    {
      // If we have a new value (checkbox is checked)
      if (aField.getValue())
      {
        // We append the value of the field to the sData string
        if (m_sData.length > 0)
        {
          m_sData+="@";
        }
        m_sData+=aField.value;
      }
      // Otherwise we remove the field's value from the m_sData string
      else
      {
        // Replace the field's value with an empty string
        m_sData = m_sData.replace(aField.value, "");
        // Replace any leading and trailing @s as well as double @
        m_sData = m_sData.replace(/@@/g, "@");
        m_sData = m_sData.replace(/@$/, "");
        m_sData = m_sData.replace(/^@/, "");
      }

      // Pass the field's name and the values to the notebook
      this.valueChange (m_sData);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }

  Ext.apply (this, aConfig);

  // Initialize the config object if necessary
  aConfig = aConfig || {};


  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";
  if (Ext.isGecko)
  {
    aConfig.bodyStyle+="padding-right:6px;";
  }

  aConfig.fieldClass = Ext.Panel;

  aConfig.fieldConf = aConfig.fieldConf || {};


  aConfig.fieldConf.maskDisabled = false;
  aConfig.fieldConf.autoHeight = true;
  aConfig.fieldConf.title = '';
  aConfig.fieldConf.header = false;
  var sConstraint = this.data.value.constraint;
  var sInd = this.data.value.ind;
  var aIndData = sInd.split('@');

  var sValue = this.data.value.val;
  if (!sValue)
  {
    sValue = "";
  }
  // Get the constraint data
  var aConstraintData = sConstraint.split('@');
  // Get the values
  var aValData = sValue.split('@');

  // Initialize the string containing the checked status of the checkboxes
  var m_sData = "";
  var m_sReadModeRepresentation = "";
  var aItems = [];
  var nValIndex = 0;
  // Iterate through the constriant data
  for (var i = 0; i < aIndData.length;++i)
  {
    // We show a checked checkbox if the value contains the current language independent constraint
    // value
    var bChecked = sValue.indexOf(aIndData[i]) > -1;
    if (bChecked)
    {
      // If the checkbox is checked, we advance the value index and append
      // the current value to the m_sData string
      ++nValIndex;
      if (m_sData.length > 0)
      {
        m_sData+="@";
        m_sReadModeRepresentation+=", ";
      }
      m_sData+=aIndData[i];
      m_sReadModeRepresentation+=aConstraintData[i];
    }

    // Create a new checkbox representing the current entry
    // lazy instantiation
    var aCheckbox =
    {
      xtype: 'checkbox',
      boxLabel: aConstraintData[i],
      value: aIndData[i],
      // Do not show a label
      hideLabel:true,
      autoWidth:true,
      checked: bChecked,
      disabled: aConfig.disabled,
      // Setup a listener for the checkbox' change event
      listeners:
      {
        check: onCheck,
        scope: this
      }
    }
    // Add the new checkbox to the enumlist's items
    aItems[aItems.length] = aCheckbox;
  }

  var sInnerPanelBodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";
  if (Ext.isGecko)
  {
    //sInnerPanelBodyStyle+="padding-right:6px;";
  }

  aConfig.fieldConf.bodyStyle = sInnerPanelBodyStyle;


  var aInnerPanel = new Ext.Panel
  (
    {
      header: false,
      items: aItems.length > 0 ? aItems : null
    }
  );

  aConfig.fieldConf.items = aInnerPanel;

  // Call to the superclass' constructor
  boc.ait.notebook.EnumListField.superclass.constructor.call(this, aConfig);

  this._getValueRep = function ()
  {
    return m_sReadModeRepresentation;
  };

  this._update = function (aAttrData)
  {
    this.data = aAttrData;
    var sConstraint = this.data.value.constraint;
    var sInd = this.data.value.ind;
    var aIndData = sInd.split('@');

    var sValue = this.data.value.val;
    if (!sValue)
    {
      sValue = "";
    }
    // Get the constraint data
    var aConstraintData = sConstraint.split('@');
    // Get the values
    var aValData = sValue.split('@');

    // Initialize the string containing the checked status of the checkboxes
    m_sData = "";
    m_sReadModeRepresentation = "";
    var aItems = [];
    var nValIndex = 0;

    this.field.removeAll ();
    // Iterate through the constriant data
    for (var i = 0; i < aIndData.length;++i)
    {
      // We show a checked checkbox if the value contains the current language independent constraint
      // value
      var bChecked = sValue.indexOf(aIndData[i]) > -1;
      if (bChecked)
      {
        // If the checkbox is checked, we advance the value index and append
        // the current value to the m_sData string
        ++nValIndex;
        if (m_sData.length > 0)
        {
          m_sData+="@";
          m_sReadModeRepresentation+=", ";
        }
        m_sData+=aIndData[i];
        m_sReadModeRepresentation+=aConstraintData[i];
      }

      // Create a new checkbox representing the current entry
      // lazy instantiation
      var aCheckbox =
      {
        xtype: 'checkbox',
        boxLabel: aConstraintData[i],
        value: aIndData[i],
        // Do not show a label
        hideLabel:true,
        autoWidth:true,
        checked: bChecked,
        disabled: aConfig.disabled,
        // Setup a listener for the checkbox' change event
        listeners:
        {
          check: onCheck,
          scope: this
        }
      }
      // Add the new checkbox to the enumlist's items
      this.field.add(aCheckbox);
    }

    //this.field.add (aItems);
  };
};

// boc.ait.notebook.EnumListField is derived from Ext.form.FieldSet
Ext.extend
(
  boc.ait.notebook.EnumListField,
  boc.ait.notebook.Field,
  {
    getValueRep : function ()
    {
      return this._getValueRep ();
    },

    update: function (aAttrData)
    {
      this._update (aAttrData);
    }
  }
);
// Register the enumlistfield's xtype
Ext.reg("boc-enumlistfield", boc.ait.notebook.EnumListField);