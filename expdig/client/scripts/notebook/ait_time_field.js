/* ***************************************************************************
 * \note Copyright
 * This file is part of ADOxx Web.\n 
 * (C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
 * All Rights Reserved\n 
 * Use, duplication or disclosure restricted by BOC Information Systems\n
 * Vienna, 1995 - 2011
 * **************************************************************************
*/


// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/**
 * @namespace boc.ait.notebook
 * @class boc.ait.notebook.TimeField
 * Implementation of the class boc.notebook.TimeField. This class
 * is used for showing UTC attribute values inside the notebook
 * as Time controls
 * @constructor {Object} The configuration object
 * @author MWh
 */
//--------------------------------------------------------------------
boc.ait.notebook.TimeField = function (aConfig)
//--------------------------------------------------------------------
{
  /*
      Private method that is called when the field's value was validated successfully
      \param aField The validated field (date or time)
  */
  //--------------------------------------------------------------------
  var onControlValid = function (aField)
  //--------------------------------------------------------------------
  {
    try
    {
      // Serialize the date into a string
      var sCurDate = aField.getRawValue();
      // If the current date is different from the last saved one, we have a value change
      if (sCurDate !== this.value )
      {
        var aParsedDate = Date.parseDate (sCurDate, AIT_TIME_FORMAT);
        if (!aParsedDate)
        {
          aField.markInvalid (getString("ait_notebook_invalid_time").replace(/%TIME%/g, sCurDate));
          aField.setRawValue (aField.getRawValue()); 
          return;
        }
        var aCurDate = new Date(0);
        aCurDate.setUTCHours (aParsedDate.getHours());
        aCurDate.setUTCMinutes (aParsedDate.getMinutes());
        aCurDate.setUTCSeconds (aParsedDate.getSeconds());
        
        // Pass the field's name and the values to the notebook
        var nVal = aCurDate.getTime();
        aField.startValue = nVal;
        this.valueChange (nVal);
        
        // Store the new date as the current one
        this.value = sCurDate;
      }      
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  Ext.apply (this, aConfig);

  // The main field class for this control is a panel
  aConfig.fieldClass = Ext.form.TimeField;

  // Do not mask the field when disabled
  aConfig.maskDisabled = false;
  aConfig.autoHeight = true;


  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";
  if (Ext.isGecko)
  {
    aConfig.bodyStyle+="padding-right:6px;";
  }
  
  aConfig.fieldConf = aConfig.fieldConf || {};
  
  // Enable key events so the controls throw the "keyup"-event
  aConfig.fieldConf.enableKeyEvents = true;

  // Is the field editable ?
  aConfig.fieldConf.disabled = !this.notebook.isEditable() || !this.data.editable;
  aConfig.fieldConf.validateOnBlur = false;
  // Setup a listener for the field's change event

  // Listeners for the date vield
  aConfig.fieldConf.listeners =
  {
    scope:this,
    change: function(aField, sNewVal, sOldVal)
    {
      if (sNewVal === "")
      {
        aField.setValue (sOldVal);
      }
    },
    valid: onControlValid
  };

  // The format for the date control
  aConfig.fieldConf.format = AIT_TIME_FORMAT;

  // Parse the date from the passed data object
  var aDate = new Date (this.data.value.val);
  var aUTCDate = new Date (0);
  aUTCDate.setHours (aDate.getUTCHours());
  aUTCDate.setMinutes (aDate.getUTCMinutes());
  aUTCDate.setSeconds (aDate.getUTCSeconds());
  aConfig.fieldConf.value = this.value = aUTCDate.format(AIT_TIME_FORMAT);
  
  aConfig.autoHeight = true;
  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";

  aConfig.fieldConf.layout = 'hbox';

  aConfig.fieldConf.header = false;


  // Call the TimeField's superclass
  boc.ait.notebook.TimeField.superclass.constructor.call (this, aConfig);

  /*
    Protected function returns the field's current value serialized into a string

    \retval The string representation of the current value
  */
  //--------------------------------------------------------------------
  this._getValueRep = function ()
  //--------------------------------------------------------------------
  {
    return this.value;
  };

  /*
    Protected function that validates the controls of this field
  */
  //--------------------------------------------------------------------
  this._validate = function ()
  //--------------------------------------------------------------------
  {
    // No code here, time field is not valid anymore anyway --> Class should be
    // removed anyway.
  };

  /*
    Protected function that returns wheter the field is currently valid
  */
  //--------------------------------------------------------------------
  this._isValid = function ()
  //--------------------------------------------------------------------
  {
    return false;
  };
};

// boc.ait.notebook.TimeField is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.TimeField,
  boc.ait.notebook.Field,
  {
    /*
      Public function that returns whether the field's value is a "no value"
    */
    //--------------------------------------------------------------------
    isNoValue: function ()
    //--------------------------------------------------------------------
    {
      return false;
    },

    /*
      Public function that validates the controls of this field
    */
    //--------------------------------------------------------------------
    validate : function ()
    //--------------------------------------------------------------------
    {
      this._validate ();
    },


    /*
      Public function that returns wheter the field is currently valid
    */
    //--------------------------------------------------------------------
    isValid: function ()
    //--------------------------------------------------------------------
    {
      return this._isValid ();
    }
  }
);

// Register the timefield's xtype
Ext.reg("boc-timefield", boc.ait.notebook.TimeField);