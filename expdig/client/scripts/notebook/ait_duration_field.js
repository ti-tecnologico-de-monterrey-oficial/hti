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
 * @class boc.ait.notebook.DurationField
 * Implementation of the class boc.notebook.DurationField. This class is used for 
 * showing UTC attribute values inside the notebook as Duration controls
 * @constructor {Object} The configuration object
 * @author MWh
 */
//--------------------------------------------------------------------
boc.ait.notebook.DurationField = function (aConfig)
//--------------------------------------------------------------------
{
  var that = this;
  
  Ext.apply (this, aConfig);
  
  this.value = this.data.value.val;
  
  aConfig.fieldConf = aConfig.fieldConf || {};
  
  aConfig.fieldClass = Ext.Container;
  aConfig.fieldConf.layout = "table";
  aConfig.fieldConf.defaults =
  {
    style:"margin-right:10px;",
    width:60,
    allowNegative:false,
    allowDecimals:false,
    allowBlank: false,
    enableKeyEvents: true
  };
  aConfig.fieldConf.layoutConfig =
  {
    // The total column count must be specified here
    columns: 5
  };

  var m_nUTCValue = this.value / 1000;
  var m_nYears = Math.floor (m_nUTCValue / (60 * 60 * 24 * 365));
  var m_nDays = Math.floor (m_nUTCValue / (60 * 60 * 24)) % 365;
  var m_nHours = Math.floor (m_nUTCValue / (60 * 60)) % 24;
  var m_nMinutes = Math.floor (m_nUTCValue / 60) % 60;
  var m_nSeconds = m_nUTCValue % 60;
  
  var m_aYearsBox = new Ext.form.NumberField
  (
    {
      maxValue:3000,
      value: m_nYears,
      listeners:
      {
        valid: onValid,
        scope:this
      }
    }
  );
  
  var m_aDaysBox = new Ext.form.NumberField
  (
    {
      maxValue:364,
      value: m_nDays,
      listeners:
      {
        valid: onValid,
        scope:this
      }
    }
  );
  
  var m_aHoursBox = new Ext.form.NumberField
  (
    {
      maxValue: 23,
      value: m_nHours,
      listeners:
      {
        valid: onValid,
        scope:this
      }
    }
  );
  
  var m_aMinutesBox = new Ext.form.NumberField
  (
    {
      maxValue: 59,
      value: m_nMinutes,
      listeners:
      {
        valid: onValid,
        scope:this
      }
    }
  );
  
  var m_aSecondsBox = new Ext.form.NumberField
  (
    {
      maxValue: 59,
      value: m_nSeconds,
      listeners:
      {
        scope:this,
        valid: onValid
      }
    }
  );
  
  aConfig.fieldConf.items = 
  [
    new Ext.BoxComponent({html:getString("ait_notebook_duration_years")}), 
    new Ext.BoxComponent({html:getString("ait_notebook_duration_days")}), 
    new Ext.BoxComponent({html:getString("ait_notebook_duration_hours")}), 
    new Ext.BoxComponent({html:getString("ait_notebook_duration_minutes")}),
    new Ext.BoxComponent({html:getString("ait_notebook_duration_seconds")}), 
    m_aYearsBox, 
    m_aDaysBox, 
    m_aHoursBox, 
    m_aMinutesBox, 
    m_aSecondsBox
  ];
  
  function onValid (aField, aOldVal, aNewVal)
  {
    var nYears = m_aYearsBox.getValue ();
    var nDays = m_aDaysBox.getValue ();
    var nHours = m_aHoursBox.getValue ();
    var nMinutes = m_aMinutesBox.getValue ();
    var nSeconds = m_aSecondsBox.getValue ();
    
    var nVal = (nSeconds + (nMinutes * 60) + (nHours * 60 * 60) + (nDays * 24 * 60 * 60) + (nYears * 365 * 24 * 60 * 60)) * 1000;
    
    if (nVal !== this.value)
    {
      this.value = nVal;
      this.valueChange (nVal);
    }
  }
  
  
  
  // Call the DurationField's superclass
  boc.ait.notebook.DurationField.superclass.constructor.call (this, aConfig);

  /*
    Protected function returns the field's current value serialized into a string

    \retval The string representation of the current value
  */
  //--------------------------------------------------------------------
  this._getValueRep = function ()
  //--------------------------------------------------------------------
  {
    //--------------------------------------------------------------------
    function num2str (x, l)
    //--------------------------------------------------------------------
    {
      // convert it explicitly to string object
      var s = "" + x;
      while (s.length < l)
      {
        s = "0" + s;
      }
      return s;
    }
    var nUTCValue = this.value / 1000;
    
    var nYears = Math.floor (nUTCValue / (60 * 60 * 24 * 365));
    var nDays = Math.floor (nUTCValue / (60 * 60 * 24)) % 365;
    var nHours = Math.floor (nUTCValue / (60 * 60)) % 24;
    var nMinutes = Math.floor (nUTCValue / 60) % 60;
    var nSeconds = nUTCValue % 60;  
    return nYears + ":" +num2str(nDays, 3)+ ":" +
           num2str(nHours, 2) + ":" +
           num2str(nMinutes, 2) + ":" +
           num2str(nSeconds, 2);
  };

  /*
    Protected function that returns wheter the field is currently valid
  */
  //--------------------------------------------------------------------
  this._isValid = function ()
  //--------------------------------------------------------------------
  {
    return m_bIsValid;
  };
};

// boc.ait.notebook.DurationField is derived from boc.ait.notebook.Field
Ext.extend
(
  boc.ait.notebook.DurationField,
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
Ext.reg("boc-durationfield", boc.ait.notebook.DurationField);