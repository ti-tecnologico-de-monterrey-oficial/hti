/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2009\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2009
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.EnumField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.EnumField. This class
    is used for showing enum attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.EnumField = function (aConfig)
//--------------------------------------------------------------------
{
  /*
      Private method that is called when a value is selected in the dropdown box
      \param aField The changed field
      \param aRecord The changed record
      \param nIndex The index of the changed record in the field
  */
  //--------------------------------------------------------------------
  var onSelect = function (aField, aRecord, nIndex)
  //--------------------------------------------------------------------
  {
    try
    {
      if (this.value != aRecord.data.val)
      {
        this.value = aRecord.data.val;
        if (aConfig.suppressChangeEvent !== true)
        {
          this.valueChange (aRecord.data.val);
        }
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Private method that is called when the field is disabled
      Removes a class from the field. This workaround is necessary because in some
      browsers disabled elements are automatically hidden
  */
  //--------------------------------------------------------------------
  var onDisableFunction = function (aCmp)
  //--------------------------------------------------------------------
  {
    try
    {
      var aEl = aCmp.getEl().dom;
      var aParent = aEl.parentNode;
      var aParentEl = Ext.get(aParent);
      aParentEl.removeClass("x-item-disabled");
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  Ext.apply (this, aConfig);

  this.valArr = [];

  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";
  if (Ext.isGecko)
  {
    aConfig.bodyStyle+="padding-right:6px;";
  }

  aConfig.fieldClass = Ext.form.ComboBox;

  aConfig.fieldConf = aConfig.fieldConf || {};

  // Get the language independent constraint string
  var sInd = this.data.value.ind;
  // Get the language dependent constraint string
  var sConstraint = this.data.value.constraint;
  var aIndData = sInd.split('@');
  var aConstraintData = sConstraint.split('@');

        // Iterate over the constraint data
  for (var i = 0; i < aConstraintData.length;++i)
  {
    // Every entry in the data array is an array containing the entry's value
    // (v0,v1,v2, ...) and displayValue
    this.valArr[this.valArr.length] =
    [
      aIndData[i],
      aConstraintData[i]
    ];
  }
  try
  {

  if (this.notebook.isEditMode())
  {
    // As the combobox' store we use a stimple store
    aConfig.fieldConf.store = new Ext.data.SimpleStore
    (
      {
        autoDestroy:true,
        // There are two fields in the data used to fill the box: val and text
        fields: ['val','text'],
        data : this.valArr
      }
    );
  }
  }
  catch (aEx)
  {
    alert(Ext.encode(this.data));
    throw aEx;
  }
  // The value field of the box is the val field
  aConfig.fieldConf.valueField = 'val';
  // The display field of the box is the text field
  aConfig.fieldConf.displayField = 'text';
  // We are working in local mode, no data has to be loaded when we open the drop down box
  aConfig.fieldConf.mode = 'local';
  // We don't want to filter the contents of the dropdown box so we specify 'all' here
  aConfig.fieldConf.triggerAction = 'all';
  this.value = aConfig.fieldConf.value = this.data.value.val;

  // TODO: Find a way to adapt the field's width to the available width - for comboboxes
  // this does not work as with the other fields ...
  aConfig.fieldConf.width = 400;
  aConfig.fieldConf.listWidth = 400;
  // We don't want to make the dropdown editable, only mouse selection is possible
  aConfig.fieldConf.editable = false;


  if (!aConfig.forRecord)
  {

    // Setup a listener for the field's change event
    // and for the field's disable event
    aConfig.fieldConf.listeners =
    {
      scope: this,
      disable: onDisableFunction,
      select: onSelect,
      render :
        function (aBox)
        {
          aBox.getEl().dom.parentNode.style.paddingRight = "6pt";
        }
    }
  }

  boc.ait.notebook.EnumField.superclass.constructor.call (this, aConfig);

  this._getValueRep = function ()
  {
    var sVal = "";
    for (var i = 0; i < this.valArr.length;++i)
    {
      var sKey = this.valArr[i][0];
      if (sKey == this.value)
      {
        sVal = this.valArr[i][1];
        break;
      }
    }

    var sNoEntryString = getString("ait_no_entry");
    if (sVal.toLowerCase() == sNoEntryString.toLowerCase())
    {
      sVal = "<div>"+sNoEntryString+"</div>";
    }
    return sVal;
  };
}

// boc.ait.notebook.EnumField is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.EnumField,
  boc.ait.notebook.Field,
  //Ext.form.ComboBox,
  //Ext.Panel,
  {
    getValueRep : function ()
    {
      return this._getValueRep ();
    }
  }
);
// Register the enumfield's xtype
Ext.reg("boc-enumfield", boc.ait.notebook.EnumField);