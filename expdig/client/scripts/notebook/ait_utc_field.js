/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2010\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2010
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.UTCField class.
**********************************************************************
*/


// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.UTCField. This class
    is used for showing number attribute values inside the notebook
    as UTC controls
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.UTCField = function (aConfig)
//--------------------------------------------------------------------
{
  var that = this;
  // The format for date values
  var DATE_FORMAT = "d.m.Y";

  // The format for time values
  var TIME_FORMAT = "H:i:s";

  // The no value masks for the controls
  var DATE_NOVAL_MASK = "--.--.----";
  var TIME_NOVAL_MASK = "--:--:--";
  var TIMEPERIOD_NOVAL_MASK = "----";


  // The format for datetime for comparing (necessary so that dates serialized as strings can be compared)
  // (e.g. 2000.01.01 20:01:01)
  var DATE_TIME_FORMAT_COMPARER = "Y.m.d H:i:s";
  // The format for date time for representation (e.g. 01.01.2000 20:01:01
  var DATE_TIME_FORMAT = DATE_FORMAT+" "+TIME_FORMAT;

  // The format currently used for representation
  var sUsedFormat = DATE_TIME_FORMAT;

  // The button to set the control to no_value
  var m_aNoValueButton = null;

  // Is the current value a no_value?
  var m_bNoValue = false;

  // Is the control currently valid?
  var m_bIsValid = true;
  // Is the field time filter relevant?
  var m_bTimeFilterRelevant = false;
  // Do we have to show the time control?
  var m_bShowTime = true;

  // Two flags that store internally which sub field was already validated. Only if both fields were validated,
  // The post valid-procedure is executed
  var m_bTimeValidated = false;
  var m_bDateValidated = false;

  // Get a reference to the time filter widget
  var m_aFilter = g_aMain.getMenuBar ().getTimeFilter ();


  /*
    Validator function that is called whenever the value in either the time or the date field is changed

    \param aVal The value to be validated
  */
  //--------------------------------------------------------------------
  var validator = function (aVal)
  //--------------------------------------------------------------------
  {
    // Check whether we are in the time control
    var bTimeControl = (this === m_aTimeControl);
    // Check whether the control is a combobox (= time period field)
    var bCombo = (this instanceof Ext.form.ComboBox);
    /*
      Private internal function that sets the flags indicating which control was already validated;
    */
    //--------------------------------------------------------------------
    setValidationStatus = function ()
    //--------------------------------------------------------------------
    {
      // If we are validating the time control, set the flag indicating that the time control was validated to true
      if (bTimeControl)
      {
        m_bTimeValidated = true;
      }
      // If we are validating the date control, set the flag indicating that the date control was validated to true
      else
      {
        m_bDateValidated = true;
      }
    }

    // If the control is currently set to no value...
    if (m_bNoValue)
    {
      // Set the validation status
      setValidationStatus.call (this);

      // Everything is valid, so we set the current control to valid as well
      m_bIsValid = true;
      // Return true, no value is always valid
      return true;
    }
    // If the control is not set to no value, we check whether the current format is
    // If the control is a combo box we can ignore this, as the user can't make any invalid entries
    if (!bCombo && !Date.parseDate(aVal, DATE_FORMAT) && !Date.parseDate(aVal, TIME_FORMAT))
    {
      m_bIsValid = false;
      var sErrString = getString("ait_invalid_utc_val");

      var aNow = new Date();
      return sErrString.
              replace (/%FORMAT%/g, bTimeControl ? TIME_FORMAT : DATE_FORMAT).
              replace (/%EXAMPLE%/g, bTimeControl ? aNow.format(TIME_FORMAT) : aNow.format (DATE_FORMAT))
    }

    // Set the validation status
    setValidationStatus.call (this);

    // Everything is valid, so we set the current control to valid as well
    m_bIsValid = true;
    return true;
  };

  /*
    Event listener for when the value in a control changes

    \param aField The control that changed.
    \param aNewValue The new value of the field
    \param aOldValue The old value of the field
  */
  //--------------------------------------------------------------------
  var onControlChange = function (aField, aNewValue, aOldValue)
  //--------------------------------------------------------------------
  {
    // Check if there is a filter and whether it is enabled. Also, only show a warning message if the
    // set values are valid (from date is before to date)
    if (m_aFilter && m_aFilter.isEnabled () && this.isValid ())
    {
      // If the current field is the min field and its value is bigger than the current timefilter
      // or if the current field is the max field and its value is smaller than the current time filter
      // ask the current user if he wants to proceed changing the value or redo his changes
      if  (this.data.noValueMax && this.getValAsDate ().getTime () < m_aFilter.getFilter ().getTime()
            ||
           !this.data.noValueMax && this.getValAsDate ().getTime () > m_aFilter.getFilter ().getTime()
          )
      {
        // Get the current date
        var aCurDate = this.getValAsDate ();
        // Get the current value depending on whether we are in a time period field or not
        var sCurVal = this.isTimePeriodField() ? m_aFilter.getTimePeriodForDate(aCurDate.getTime()).label + " ("+ aCurDate.format(DATE_FORMAT)+")": aCurDate.format(sUsedFormat);

        Ext.Msg.confirm
        (
          getStandardTitle (),
          boc.ait.htmlEncode
          (
            getString("ait_utc_val_no_longer_in_time_filter").
              replace(/%ATTR_NAME%/g, this.getLangName()).
              replace(/%CLASS_NAME%/g, this.notebook.getData ().classname).
              replace(/%VALUE%/g, sCurVal).
              replace(/%INST_NAME%/g, this.notebook.getData ().name)
          ).replace (/\n/g, "<br/>"),
          function (sResult)
          {
            // If the user does not want to proceed with the changes, redo them
            if (sResult === "no")
            {
              if (aOldValue instanceof Date || (typeof aOldValue) === "number")
              {
                m_aDateControl.setValue (aOldValue);
              }
              else if (aOldValue === "")
              {
                this.setNoValue ();
              }
            }
          },
          this
        );
      }
    }
  };

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
      // Workaround for a strange bug in Ext JS where the value of the combo box is the combo's label
      // instead of the begindate...
      if (this.isTimePeriodField() && (typeof m_aDateControl.getValue()) !== "number")
      {
        // Set the raw value to the label value. This has to be done to do correct masking
        // of html tags
        m_aDateControl.setRawValue(Ext.util.Format.htmlDecode(aField.getValue()));
        return;
      }

      // If the current value is a no value, we show the appropriate no value mask
      if (m_bNoValue)
      {
        // If we have a date control and it is rendered, set the no value mask
        if (m_aDateControl && m_aDateControl.rendered)
        {
          if (!this.isTimePeriodField ())
          {
            m_aDateControl.setRawValue (DATE_NOVAL_MASK);
          }
        }
        // If we have a time control and it is rendered, set the no value mask
        if (m_aTimeControl && m_aTimeControl.rendered)
        {
          m_aTimeControl.setRawValue (TIME_NOVAL_MASK);
        }
        return;
      }

      // If we have a time control and the time was not validated, return
      if (m_aTimeControl && !m_bTimeValidated)
      {
        return;
      }
      // If we have a date control and the time was not validated, return
      if (m_aDateControl && !m_bDateValidated)
      {
        return;
      }

      var aCorrField = null;

      // Get the current value as date
      var aCurDate = this.getValAsDate ();

      // Get the correct date if we are in a time period field
      if (this.isTimePeriodField())
      {
        aCurDate = new Date(m_aFilter.getTimePeriodForDate (aCurDate.getTime()).beginDate);
      }
      // If the field is time filter relevant
      if (this.isTimeFilterRelevant())
      {
        // .. get the corresponding field (the min field)
        aCorrField = this.notebook.getTimeFilterField (!this.data.noValueMax);
        // If the current field is treated as the max value field
        if (this.data.noValueMax)
        {
          // If the corresponding field has a value
          if (aCorrField && !aCorrField.isNoValue())
          {
            var aCorrDate = aCorrField.getValAsDate();
            if (this.isTimePeriodField())
            {
              aCorrDate = new Date(m_aFilter.getTimePeriodForDate (aCorrDate.getTime()).beginDate);
            }

            // Check whether the value in the current field is smaller than the one in the corr field (max <= min --> must not be)
            if (aCurDate.format(DATE_TIME_FORMAT_COMPARER) < aCorrDate.format(DATE_TIME_FORMAT_COMPARER))
            {
              var sCurVal = this.isTimePeriodField() ? m_aFilter.getTimePeriodForDate(aCurDate.getTime()).label + " ("+ aCurDate.format(DATE_FORMAT)+")": aCurDate.format(DATE_TIME_FORMAT);
              var sCorrVal = this.isTimePeriodField () ? m_aFilter.getTimePeriodForDate (aCorrDate.getTime()).label + " ("+aCorrDate.format(DATE_FORMAT)+")": aCorrDate.format(DATE_TIME_FORMAT);
              // Mark the controls as invalid
              m_aDateControl.markInvalid
              (
                getString("ait_no_value_too_small").
                  replace(/%ATTR_NAME%/g, this.data.classname).
                  replace(/%CUR_VALUE%/g, sCurVal).
                  replace(/%CORR_VALUE%/g, sCorrVal).
                  replace(/%CORR_ATTR_NAME%/g, aCorrField.getLangName())
              );
              if (m_aTimeControl)
              {
                m_aTimeControl.markInvalid
                (
                  getString("ait_no_value_too_small").
                    replace(/%ATTR_NAME%/g, this.data.classname).
                    replace(/%CUR_VALUE%/g, aCurDate.format(DATE_TIME_FORMAT)).
                    replace(/%CORR_VALUE%/g, aCorrField.getValAsDate().format(DATE_TIME_FORMAT)).
                    replace(/%CORR_ATTR_NAME%/g, aCorrField.getLangName())
                );
              }
              m_bIsValid = false;
              return;
            }
          }
        }
        else
        {
          // If the corresponding field has a value
          if (aCorrField && !aCorrField.isNoValue())
          {
            var aCorrDate = aCorrField.getValAsDate();
            // Get the correct date if we are in a time period field
            if (this.isTimePeriodField())
            {
              aCorrDate = new Date(m_aFilter.getTimePeriodForDate (aCorrDate.getTime()).beginDate);
            }

            // Check whether the value in the current field is bigger than the one in the corr field (min >= max --> must not be)
            if ((!this.isTimePeriodField() && aCurDate.format(DATE_TIME_FORMAT_COMPARER) >= aCorrDate.format(DATE_TIME_FORMAT_COMPARER))
                ||
                (this.isTimePeriodField() && aCurDate.format(DATE_TIME_FORMAT_COMPARER) > aCorrDate.format(DATE_TIME_FORMAT_COMPARER))
               )
            {
              var sCurVal = this.isTimePeriodField() ? m_aFilter.getTimePeriodForDate(aCurDate.getTime()).label + " ("+ aCurDate.format(DATE_FORMAT)+")": aCurDate.format(DATE_TIME_FORMAT);
              var sCorrVal = this.isTimePeriodField () ? m_aFilter.getTimePeriodForDate (aCorrDate.getTime()).label + " ("+aCorrDate.format(DATE_FORMAT)+")": aCorrDate.format(DATE_TIME_FORMAT);

              // Mark the controls as invalid
              m_aDateControl.markInvalid
              (
                getString("ait_no_value_too_big").
                  replace(/%ATTR_NAME%/g, this.data.classname).
                  replace(/%CUR_VALUE%/g, sCurVal).
                  replace(/%CORR_VALUE%/g, sCorrVal).
                  replace(/%CORR_ATTR_NAME%/g, aCorrField.getLangName())
              );
              if (m_aTimeControl)
              {
                m_aTimeControl.markInvalid
                (
                  getString("ait_no_value_too_big").
                    replace(/%ATTR_NAME%/g, this.data.classname).
                    replace(/%CUR_VALUE%/g, aCurDate.format(DATE_TIME_FORMAT)).
                    replace(/%CORR_VALUE%/g, aCorrField.getValAsDate().format(DATE_TIME_FORMAT)).
                    replace(/%CORR_ATTR_NAME%/g, aCorrField.getLangName())
                );
              }
              m_bIsValid = false;
              return;
            }
          }
        }
      }


      // Serialize the date into a string
      var sCurDate = aCurDate.format(sUsedFormat);

      // If the current date is different from the last saved one, we have a value change
      if (sCurDate !== this.value || this.isNoValue())
      {
        // Pass the field's name and the values to the notebook
        var nVal = aCurDate.getTime();

        this.valueChange (nVal);
      }

      // Store the new date as the current one
      this.value = sCurDate;

      // Reset the flags controlling the validation behavior
      m_bTimeValidated = false;
      m_bDateValidated = false;

      // If there is a corrfield (time filter relevant) which is invalid, we re validate it, it might be valid now
      // (e.g. when the max field was smaller before and is now bigger).
      if (aCorrField && !aCorrField.isValid ())
      {
        aCorrField.validate ();
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
    Listener for the focus event of a control
  */
  //--------------------------------------------------------------------
  var onControlFocus = function (aField)
  //--------------------------------------------------------------------
  {
    // If the current value is a no value, we have to set a value on focus
    if (m_bNoValue)
    {
      // We don't have "no value" anymore
      m_bNoValue = false;
      // Enable the no value button
      m_aNoValueButton.enable ();

      // Get the current date and time to set for the fields
      var aNewDate = new Date();
      // Check if we are time filter relevant
      if (this.isTimeFilterRelevant())
      {
        // Get the corresponding field, and if it does have a value, take it, increase
        // the days by one (or decrease, depending on whether we are in the max or min field)
        // , then set the modified date as the current value of the current field.
        var aCorrField = this.notebook.getTimeFilterField (!this.data.noValueMax);
        if (!aCorrField.isNoValue())
        {
          aNewDate = aCorrField.getValAsDate();

          aNewDate.setDate(aNewDate.getDate() + (this.data.noValueMax ? 1 : -1));
        }
      }

      // Set the current time as the value for date and time control
      //var aNow = new Date();
      m_aDateControl.setValue (aNewDate);
      if (m_aTimeControl)
      {
        m_aTimeControl.setValue (aNewDate);
      }
      // Validate the date time field
      this.validate ();
    }
  };

  /*
    Listener for the select event of the date control combo box
  */
  //--------------------------------------------------------------------
  var onTimePeriodSelect = function (aCombo, aRecord, nIndex)
  //--------------------------------------------------------------------
  {
    // If the combo's value is lower than 0, the value was set to no value
    if (aCombo.getValue() < 0)
    {
      this.setNoValue ();
    }
    else
    {
      m_bNoValue = false;
      // Set the raw value of the combobox so that html tags are masked correctly
      aCombo.setRawValue (Ext.util.Format.htmlDecode(m_aFilter.getTimePeriodForDate (aCombo.getValue()).label));
      this.validate ();
    }
  };

  /*
    Listener for the select event of a control
  */
  //--------------------------------------------------------------------
  var onControlSelect = function (aField, aDate)
  //--------------------------------------------------------------------
  {
    // We don't have "no value" anymore
    m_bNoValue = false;
    // Validate the date time field
    this.validate ();
  };

  /*
    Listener for the key event of a control
  */
  //--------------------------------------------------------------------
  var onControlKeyup = function (aField)
  //--------------------------------------------------------------------
  {
    // We don't have "no value" anymore
    m_bNoValue = false;
    // Validate the date time field
    this.validate ();
  };

  Ext.apply (this, aConfig);

  // The main field class for this control is a panel
  aConfig.fieldClass = Ext.Panel;


  // Do not mask the field when disabled
  aConfig.maskDisabled = false;
  aConfig.autoHeight = true;

  // Determine whether the current value is a no value
  if (this.data.value.isNoValue)
  {
    m_bNoValue = true;
  }

  // Determine whether the field is time filter relevant
  if (this.data.timeFilterRelevant)
  {
    m_bTimeFilterRelevant = true;
    this.notebook.setTimeFilterField (this, this.data.noValueMax);
  }

  // Determine whether we have to show the time field
  m_bShowTime = this.data.props && (this.data.props["WITHOUT_TIME"] !== "true");

  var aDateFieldConf = {};

  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";
  if (Ext.isGecko)
  {
    aConfig.bodyStyle+="padding-right:6px;";
  }

  // Enable key events so the controls throw the "keyup"-event
  aDateFieldConf.enableKeyEvents = true;

  // Is the field editable ?
  aDateFieldConf.disabled = !this.notebook.isEditable() || !this.data.editable;
  // Setup a listener for the field's change event

  // Listeners for the date vield
  aDateFieldConf.listeners =
  {
    scope:this,
    valid: onControlValid,
    change: onControlChange,
    focus: onControlFocus,
    select: onControlSelect,
    keyup: onControlKeyup
  };

  // The format for the date control
  aDateFieldConf.format = DATE_FORMAT;
  // The validator for the date control
  aDateFieldConf.validator = validator;
  // Overwrite the validateValue function
  aDateFieldConf.validateValue = function(value)
  {
    if (m_bNoValue)
    {
      return true;
    }
    return this.skipValidation || this.constructor.prototype.validateValue.call(this, value);
  };


  // Parse the date from the passed data object
  var aDate = new Date (this.data.value.val);
  aDateFieldConf.value = aDate.format(DATE_FORMAT);

  aDateFieldConf.fieldLabel = getString("ait_date");
  var m_aDateControl = null;


  // If we have a time period field, the date control is a combobox
  if (m_bTimeFilterRelevant && g_aSettings.filterSettings.filterType === FILTER_TYPE_TIME_PERIOD)
  {
    var aTimePeriodsStore = m_aFilter.getTimePeriodsStore (true);

    // Get the current time period
    var aValPeriod = m_aFilter.getTimePeriodForDate (this.data.value.val);
    // The dropdown box that is used as date picker for the value
    m_aDateControl = new Ext.form.ComboBox
    (
      {
        hideLabel: true,
        valueField: 'beginDate',
        displayField: 'label',
        mode: 'local',
        triggerAction: 'all',
        value: aValPeriod.beginDate,
        store: aTimePeriodsStore,
        editable: false,
        disabled: aDateFieldConf.disabled,
        autoShow:true,
        //autoWidth:true,
        width:150,
        listWidth:200,
        // NECESSARY OR VISUALIZATION BUGS IN FF WILL APPEAR
        lazyInit: false,
        listeners :
        {
          select: onTimePeriodSelect,
          valid: onControlValid,
          change: onControlChange,
          scope: this
        },
        validator: validator
      }
    );

  }
  // Otherwise, the date control is a date field
  else
  {
    m_aDateControl = new Ext.form.DateField (aDateFieldConf);
  }

  aConfig.autoHeight = true;
  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";

  aConfig.fieldConf = aConfig.fieldConf || {};
  aConfig.fieldConf.layout = 'hbox';
  aConfig.fieldConf.header = false;
  aConfig.fieldConf.disabled = false;


  aConfig.fieldConf.items =
  [
    m_aDateControl
    /*new Ext.Panel
    (
      {
        title:"test",
        border:false,
        layout:'form',
        labelAlign : "top",
        //autoHeight:true,
        height:500,
        width:800,
        items:
        [
          //m_aDateControl
          new Ext.Panel
          (
            {
              title:"BLAAAAAAAAAAAAAAAA"
            }
          )
        ]
      }
    )*/
  ];


  var m_aTimeControl = null;

  // If we have to show the time, we have to setup a time control - If the field is a time period field,
  // we never show the time field
  if (m_bShowTime && !m_bTimeFilterRelevant && g_aSettings.filterSettings.filterType !== FILTER_TYPE_TIME_PERIOD)
  {
    // Get the current value
    this.value = aDate.format (DATE_TIME_FORMAT);
    // Extend the format used in the datetime field
    sUsedFormat = DATE_TIME_FORMAT;

    var aTimeFieldConf = {};
    aTimeFieldConf.value = aDate;
    aTimeFieldConf.format = TIME_FORMAT;
    aTimeFieldConf.disabled = !this.notebook.isEditable() || !this.data.editable;
    aTimeFieldConf.fieldLabel = getString("ait_time");
    aTimeFieldConf.validator = validator;

    aTimeFieldConf.validateValue = function(value)
    {
      if (m_bNoValue)
      {
        return true;
      }
      return this.skipValidation || this.constructor.prototype.validateValue.call(this, value);
    }


    // Listeners for the timefield
    aTimeFieldConf.listeners =
    {
      scope:this,
      valid: onControlValid,
      focus: onControlFocus,
      select: onControlSelect,
      keyup: onControlKeyup
    };

    // Create the time control
    m_aTimeControl = new Ext.form.TimeField (aTimeFieldConf);

    aConfig.fieldConf.items[aConfig.fieldConf.items.length] =
    /*{
      title:"",
      border:false,
      layout:'form',
      labelAlign :'top',
      autoHeight:true,
      width: 200,
      items:
      [*/
        m_aTimeControl
    /*  ]
    }*/
  }
  // If we don't have to show the time field, we use the DATE_FORMAT
  else
  {
    var sAltVal = this.data.value.alternateValue;
    if (sAltVal)
    {
      this.value = sAltVal;
    }
    else
    {
      this.value = aDate.format(DATE_FORMAT);
    }
    sUsedFormat = DATE_FORMAT;
  }


  //var sButtonStyle = Ext.isIE ? "margin-top:28px" : "margin-top:18px";

  if (!aDateFieldConf.disabled && m_bTimeFilterRelevant && g_aSettings.filterSettings.filterType !== FILTER_TYPE_TIME_PERIOD)
  {
    // Create the button to reset the control's value to "no_value"
    m_aNoValueButton = new Ext.Button
    (
      {
        //text:'no_value',
        iconCls: 'ait_set_no_value',
        //style: sButtonStyle,
        tooltip:getString("ait_set_no_value"),
        /*
          Handler for the no value button. Sets the value back to "no value"
        */
        //--------------------------------------------------------------------
        handler: function()
        //--------------------------------------------------------------------
        {
          m_bNoValue = true;
          // Validate the current control
          this.validate ();
          // Set the raw value (=mask) for the controls
          m_aDateControl.setRawValue(DATE_NOVAL_MASK);
          if (m_aTimeControl)
          {
            m_aTimeControl.setRawValue (TIME_NOVAL_MASK);
          }

          if (this.isTimeFilterRelevant())
          {
            // Get a corresponding field, if we are time filter relevant
            var aCorrField = this.notebook.getTimeFilterField (!this.data.noValueMax);
            // If the corr field is invalid, revalidate it, it might have become valid
            if (!aCorrField.isValid())
            {
              aCorrField.validate ();
            }
          }

          // Do a value change
          this.valueChange (Date.parseDate (this.value, sUsedFormat).getTime());
          // Disable the no value button
          m_aNoValueButton.disable ();
        },
        scope: this,
        disabled: m_bNoValue
      }
    )

    aConfig.fieldConf.items[aConfig.fieldConf.items.length]=
    /*{
      title:"",
      border:false,
      layout:'form',
      labelAlign :'top',
      autoHeight:true,
      width: 200,
      items:
      [*/
        m_aNoValueButton
      /*]
    }*/
  }

  // Call the UTCField's superclass
  boc.ait.notebook.UTCField.superclass.constructor.call (this, aConfig);

  /*
    Protected update function that is called whenever the notebook mode (read/edit) is changed
    Loads new data into the control

    \param aData New data for the control
  */
  //--------------------------------------------------------------------
  this._update = function (aData)
  //--------------------------------------------------------------------
  {
    var aDate = new Date (aData.value.val);
    /*if (aData.value.isNoValue === 1)
    {
      //aDate = new Date (-1);
    }*/

    // If the field is a time period field, get the date from the time filter widget
    if (this.isTimePeriodField())
    {
      var aPeriod = m_aFilter.getTimePeriodForDate(aDate.getTime());
      m_aDateControl.setValue (aPeriod.beginDate);
    }
    else
    {
      // Set the data for the controls
      m_aDateControl.setValue (aDate);
    }
    if (m_aTimeControl)
    {
      m_aTimeControl.setValue (aDate);
    }

    this.value = aDate.format (sUsedFormat);
  };

  /*
    Protected function returns the field's current value serialized into a string

    \retval The string representation of the current value
  */
  //--------------------------------------------------------------------
  this._getValueRep = function ()
  //--------------------------------------------------------------------
  {
    var sVal = "";

    // If we are in a time period field, get the value from the time filter widget
    if (this.isTimePeriodField() && !this.isNoValue())
    {
      sVal = m_aFilter.getTimePeriodForDate (this._getValAsDate().getTime()).label;
    }
    else
    {
      sVal = this.value;
    }

    // If the value is a "no value" we show the appropriate mask
    if (this.isNoValue())
    {
      sVal = this.isTimePeriodField () ? TIMEPERIOD_NOVAL_MASK : DATE_NOVAL_MASK;
      if (m_bShowTime && !this.isTimePeriodField())
      {
        sVal += " "+TIME_NOVAL_MASK;
      }
    }

    return sVal;
  };

  /*
    Protected function that returns whether the field's value is a "no value"
  */
  //--------------------------------------------------------------------
  this._isNoValue = function ()
  //--------------------------------------------------------------------
  {
    return m_bNoValue;
  };

  /*
    Protected function that returns the current value of the field as date object

    \retval The current value of the field as Date
  */
  //--------------------------------------------------------------------
  this._getValAsDate = function ()
  //--------------------------------------------------------------------
  {
    // If the value is a "no_value", simply return the last valid date
    if (this.isNoValue())
    {
      return this.value;
    }

    var aDate = m_aDateControl.getValue();
    // Create the date value when we are in a time period field
    if (this.isTimePeriodField())
    {
      aDate = new Date (aDate);
      return aDate;
    }
    if (!aDate)
    {
      aDate = new Date(0);
    }

    var aTime = null;
    if (m_aTimeControl)
    {
      aTime = Date.parseDate (m_aTimeControl.getValue(), m_aTimeControl.initialConfig.format);
      if (!aTime)
      {
        aTime = Date.parseDate ("00:00:00", TIME_FORMAT);
      }
    }
    else
    {
      aTime = Date.parseDate ("00:00:00", TIME_FORMAT);
    }

    var aNewDate = new Date();

    aNewDate.setDate (aDate.getDate());
    aNewDate.setYear (aDate.getFullYear());
    aNewDate.setMonth (aDate.getMonth());
    aNewDate.setHours (aTime.getHours());
    aNewDate.setMinutes (aTime.getMinutes());
    aNewDate.setSeconds (aTime.getSeconds());
    aNewDate.setMilliseconds (aTime.getMilliseconds());



    return aNewDate;
  };

  /*
    Protected function that validates the controls of this field
  */
  //--------------------------------------------------------------------
  this._validate = function ()
  //--------------------------------------------------------------------
  {
    // Reset the flags controlling the validation behavior
    var m_bTimeValidated = false;
    var m_bDateValidated = false;

    // Validate the controls
    m_aDateControl.validate ();
    if (m_aTimeControl)
    {
      m_aTimeControl.validate ();
    }
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

  /*
    Protected function that sets the current field's value to the no value
  */
  //--------------------------------------------------------------------
  this._setNoValue = function ()
  //--------------------------------------------------------------------
  {
    m_bNoValue = true;
    // Validate the current control
    this.validate ();
    // Set the raw value (=mask) for the controls

    m_aDateControl.setRawValue(this.isTimePeriodField() ? TIMEPERIOD_NOVAL_MASK : DATE_NOVAL_MASK);
    if (m_aTimeControl)
    {
      m_aTimeControl.setRawValue (TIME_NOVAL_MASK);
    }

    if (this.isTimeFilterRelevant())
    {
      // Get a corresponding field, if we are time filter relevant
      var aCorrField = this.notebook.getTimeFilterField (!this.data.noValueMax);
      // If the corr field is invalid, revalidate it, it might have become valid
      if (aCorrField && !aCorrField.isValid())
      {
        aCorrField.validate ();
      }
    }

    // Do a value change
    this.valueChange (Date.parseDate (this.value, sUsedFormat).getTime());
    // Disable the no value button
    m_aNoValueButton.disable ();
  };

  /*
    Protected function that returns whether the control shows an attribute that is time filter relevant

    \retval true if the attribute is time filter relevant, otherwise false
  */
  //--------------------------------------------------------------------
  this._isTimeFilterRelevant = function ()
  //--------------------------------------------------------------------
  {
    return m_bTimeFilterRelevant;
  };

  /*
    Public function that returns whether the control shows time periods

    \retval true if the attribute shows time periods, otherwise false
  */
  //--------------------------------------------------------------------
  this._isTimePeriodField = function ()
  //--------------------------------------------------------------------
  {
    // The control is a time period field if it is time filter relevant and the filter type in the filter
    // settings has the right type
    return this.isTimeFilterRelevant() && g_aSettings.filterSettings.filterType === FILTER_TYPE_TIME_PERIOD;
  };
}

// boc.ait.notebook.DateField is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.UTCField,
  //Ext.form.DateField,
  boc.ait.notebook.Field,
  {
    /*
      Public function that returns whether the field's value is a "no value"
    */
    //--------------------------------------------------------------------
    isNoValue: function ()
    //--------------------------------------------------------------------
    {
      return this._isNoValue ();
    },


    /*
      Public function that returns the current value of the field as date object

      \retval The current value of the field as Date
    */
    //--------------------------------------------------------------------
    getValAsDate: function ()
    //--------------------------------------------------------------------
    {
      return this._getValAsDate ();
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
    },

    /*
      Public function that sets the current field's value to the no value
    */
    //--------------------------------------------------------------------
    setNoValue : function ()
    //--------------------------------------------------------------------
    {
      this._setNoValue ();
    },

    /*
      Public function that returns whether the control shows an attribute that is time filter relevant

      \retval true if the attribute is time filter relevant, otherwise false
    */
    //--------------------------------------------------------------------
    isTimeFilterRelevant : function ()
    //--------------------------------------------------------------------
    {
      return this._isTimeFilterRelevant ();
    },

    /*
      Public function that returns whether the control shows time periods

      \retval true if the attribute shows time periods, otherwise false
    */
    //--------------------------------------------------------------------
    isTimePeriodField : function ()
    //--------------------------------------------------------------------
    {
      return this._isTimePeriodField ();
    }
  }
);

// Register the datefield's xtype
Ext.reg("boc-utcfield", boc.ait.notebook.UTCField);