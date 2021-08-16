/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2010\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2010
**********************************************************************
\author MWh
This file contains the code for the boc.ait.filter.TimeFilterWidget
**********************************************************************
*/

// Create namespace boc.ait.filter
Ext.namespace("boc.ait.filter");


/*
    Implementation of the class boc.ait.menu.Menubar. This class is the menubar of the ADOit
    Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.filter.TimeFilterWidget = function (aConfig)
//--------------------------------------------------------------------
{
  try
  {
    /*
      Protected function that sets the filter's state

      \param aFilterValues A JS object containing two members:
              enabled: true if the filter is enabled, otherwise false
              filter: A number representing the filter date
    */
    //--------------------------------------------------------------------
    this._setFilter = function (aFilterValues)
    //--------------------------------------------------------------------
    {
      /*
        Inner function that sets the filter on the aserver via an Ajax Request
      */
      //--------------------------------------------------------------------
      function ajaxUpdateFilter ()
      //--------------------------------------------------------------------
      {
        m_aFilterState = aFilterValues;
        Ext.Ajax.request
        (
          {
            url:"proxy",
            method:"POST",
            params:
            {
              type: "filter",
              params: Ext.encode
              (
                aFilterValues
              )
            },
            scope: this,
            success: function()
            {
              // After the filter was set, refresh the object tree
              g_aMain.getTreeArea().getObjectTree().refresh();
              unmaskWC();
            }
          }
        );
      }

      // Check if there are open tabs in the main panel
      var aOpenTabs = g_aMain.getMainArea ().getOpenTabs ();
      // If there are open tabs, ask the user if he wants to proceed
      if (aOpenTabs.length > 0)
      {
        // Ask the user whether he wants to proceed
        Ext.Msg.confirm
        (
          getStandardTitle (),
          boc.ait.htmlEncode(getString ("ait_filter_change")).replace(/\n/g, "<br/>"),
          function (sResult)
          {
            // If he doesn't want to proceed, reset the filter
            if (sResult === "no")
            {
              resetFilter.call (this);
              return;
            }
            else
            {
              // If he wants to proceed, close the tabs in the main panel
              g_aMain.getMainArea ().closeTabs
              (
                {
                  scope: this,
                  /*
                    Anonymous callback function that is called by the closeTabs function

                    \param bResult This is true, if all tabs were closed correctly. It is false, if the
                                   tabs were not closed (e.g. because the user cancelled the closing process)
                  */
                  callback: function (bResult)
                  {
                    // If the tabs were closed, update the filter
                    if (bResult === true)
                    {
                      ajaxUpdateFilter.call (this);
                    }
                    // Otherwise, reset the filter
                    else
                    {
                      resetFilter.call (this);
                      return;
                    }
                  }
                }
              );
            }
          },
          this
        );
      }
      // If there are no open tabs, update the filter on the aserver
      else
      {
        ajaxUpdateFilter.call (this);
      }
    };

    /*
      Protected function that returns whether the filter is currently enabled

      \retval true if the filter is currently enabled, otherwise false
    */
    //--------------------------------------------------------------------
    this._isEnabled = function ()
    //--------------------------------------------------------------------
    {
      return m_aActivateFilterCheckbox.getValue ();
    };

    /*
      Returns the current filter value

      \retval A Date object containing the current filter value
    */
    //--------------------------------------------------------------------
    this._getFilter = function ()
    //--------------------------------------------------------------------
    {
      // If the filter is configured to show the utc field, simply return the picker's current value
      if (g_aSettings.filterSettings.filterType === FILTER_TYPE_UTC_VALUE)
      {
        return m_aFilterDatePicker.getValue ();
      }
      // For timer periods, get the picker's (=combobox) value and create a new date which is then
      // returned
      else if (g_aSettings.filterSettings.filterType === FILTER_TYPE_TIME_PERIOD)
      {
        return new Date (m_aFilterDatePicker.getValue());
      }
    };

    /*
      Protected function that returns the time period into which the passed date falls

      \param nDate The number of UTC milliseconds representing the desired date
      \retval The time period into which the passed date falls.
    */
    //--------------------------------------------------------------------
    this._getTimePeriodForDate = function (nDate)
    //--------------------------------------------------------------------
    {
      // Construct the found period which is by default a no value
      var aFoundPeriod =
      {
        label: "----",
        beginDate : -1,
        endDate: -1
      };

      // Iterate through the available periods
      for (var i = 0; i < g_aSettings.filterSettings.timePeriods.length;++i)
      {
        var aPeriod = g_aSettings.filterSettings.timePeriods[i];
        // If the current period's begin Date is smaller than the passed date, use the period
        if (aPeriod.beginDate <= nDate)
        {
          aFoundPeriod = aPeriod;
        }
      }

      // Return the found period
      return aFoundPeriod;
    };

    /*
      Protected function that constructs a store for comboboxes that should show
      the time periods.

      \param bIncludingNoValueField If this is true, then an extra entry for the "no value" is included
             in the store. By default this is false
      \retval An instance of Ext.data.Store to be used in a ComboBox
    */
    //--------------------------------------------------------------------
    this._getTimePeriodsStore = function (bIncludingNoValueField)
    //--------------------------------------------------------------------
    {
      var aPeriodsArr = [];

      // If the no value is to be included, the first entry is the no value
      if (bIncludingNoValueField === true)
      {
        aPeriodsArr[aPeriodsArr.length] = ["----", -1, -1];
      }

      // go through the time periods and add them to the periods arr that is used
      // as data basis for the store
      for (var i = 0; i < g_aSettings.filterSettings.timePeriods.length;++i)
      {
        var aPeriodObj = g_aSettings.filterSettings.timePeriods[i];
        aPeriodsArr[aPeriodsArr.length] = [aPeriodObj.label, aPeriodObj.beginDate, aPeriodObj.endDate];
      }



      // Create a store that holds the time periods data
      return aTimePeriodsStore = new Ext.data.SimpleStore
      (
        {
          autoDestroy:true,
          // There are two fields in the data used to fill the box: val and text
          fields: ['label', 'beginDate', 'endDate'],
          data: aPeriodsArr
        }
      );
    };


    var DATE_FORMAT = "d.m.Y";
    aConfig = aConfig || {};

    // Internal flag that remembers whether a date was just selected in the date picker
    var m_bFilterSelected = false;

    // The checkbox that enables or disables the time filter
    var m_aActivateFilterCheckbox = new Ext.form.Checkbox
    (
      {
        checked: g_aSettings.filterSettings.enabled
      }
    );

    // Apply a css class to the checkbox on render. This vertically centers the checkbox
    m_aActivateFilterCheckbox.on("render", function (aBox)
      {
        Ext.get(aBox.getEl().dom.parentNode.parentNode).addClass ("ait_timefilter_checkbox");

        // Add a tooltip to the checkbox on render
        new Ext.ToolTip
        (
          {
            target: aBox.getEl ().dom.parentNode.parentNode,
            autoHide:true,
            autoHeight:true,
            width: 250,
            trackMouse:true,
            html:getString("ait_time_filter_activation_desc"),
            dismissDelay: 0,
            hideDelay: 0,
            shadow: true
          }
        );
      }
    );

    // The current filter value, this is either the value in the filter settings retrieved from the
    // aserver or 0
    var nFilter = g_aSettings.filterSettings.filter || 0;

    var aFilterDate = null;

    // Construct the current filter date  based on the value of nFilter
    if (nFilter === 0)
    {
      aFilterDate = new Date();
    }
    else
    {
      aFilterDate = new Date(nFilter);
    }

    var m_aFilterDatePicker = null;

    // If we use a utc filter, the filter picker is a date field
    if (g_aSettings.filterSettings.filterType === FILTER_TYPE_UTC_VALUE)
    {
      // The Datefield that is used as date picker for the time filter
      m_aFilterDatePicker = new Ext.form.DateField
      (
        {
          value: aFilterDate,
          disabled: !g_aSettings.filterSettings.enabled,
          format: DATE_FORMAT,
          // Enable key events so we can listen to the keyup event
          enableKeyEvents : true
        }
      );


      // Add a select handler to the date picker
      m_aFilterDatePicker.on
      (
        "select",
        /*
          Anonymous function that handles the date picker's select event

          \param aDateField The changed field
          \param aDate The new value of the field
        */
        //--------------------------------------------------------------------
        function (aDateField, aDate)
        //--------------------------------------------------------------------
        {
          // If the filter is not enabled, ignore the event
          if (!this.isEnabled())
          {
            return;
          }
          // Set the internal flag that indicates that a value was selected to true, thus
          // making sure that the "change" event is ignored.
          m_bFilterSelected = true;
          onChange.call (this, aDate.getTime());
        },
        this
      );
    }

    // Otherwise, we use a combobox
    else if (g_aSettings.filterSettings.filterType === FILTER_TYPE_TIME_PERIOD)
    {
      // Prepare the time periods for usage, so that special characters and html tags are masked
      for (var i = 0; i < g_aSettings.filterSettings.timePeriods.length;++i)
      {
        var aPeriod = g_aSettings.filterSettings.timePeriods[i];
        aPeriod.label = boc.ait.htmlEncode (aPeriod.label);
      }
      var aTimePeriodsStore = this.getTimePeriodsStore ();
      // The dropdown box that is used as date picker for the time filter

      m_aFilterDatePicker = new Ext.form.ComboBox
      (
        {
          valueField: 'beginDate',
          displayField: 'label',
          mode: 'local',
          disabled: !g_aSettings.filterSettings.enabled,
          triggerAction: 'all',
          value: g_aSettings.filterSettings.filter,
          store: aTimePeriodsStore,
          editable: false,
          autoShow:true,
          // NECESSARY OR VISUALIZATION BUGS IN FF WILL APPEAR
          lazyInit: false
        }
      );

      // Add a select handler to the date picker
      m_aFilterDatePicker.on
      (
        "select",
        /*
          Anonymous function that handles the date picker's select event

          \param aDateField The changed field
          \param aDate The new value of the field
        */
        //--------------------------------------------------------------------
        function (aCombo, aRecord, nIndex)
        //--------------------------------------------------------------------
        {
          // If the filter is not enabled, ignore the event
          if (!this.isEnabled())
          {
            return;
          }

          // Set the internal flag that indicates that a value was selected to true, thus
          // making sure that the "change" event is ignored.
          m_bFilterSelected = true;

          // Set the raw value for the combo box so that html tags are not evaluated.
          aCombo.setRawValue (Ext.util.Format.htmlDecode (this.getTimePeriodForDate (aRecord.get("beginDate")).label));
          onChange.call (this, aRecord.get("beginDate"));
        },
        this
      );
    }




    // A struct that stores the internal filter state
    var m_aFilterState =
    {
      enabled: g_aSettings.filterSettings.enabled,
      filter: aFilterDate.getTime()
    }

    // Set the filter's layout to column
    aConfig.layout = "column";

    // Layouting
    aConfig.bodyStyle = "width:300px;background:transparent;border-color:black;padding:0px;padding-bottom:0px";
    aConfig.border = false;
    aConfig.bodyBorder = false;

    // The active label for display next to the checkbox
    var m_aActiveLabel = new Ext.Toolbar.TextItem
    (
      {
        style: "font-size:11px;margin-top:0px;margin-left:1px",
        text: getString("ait_time_filter_active")
      }
    );

    // Add a tooltip to the label on render
    m_aActiveLabel.on ("render", function (aL)
      {
        new Ext.ToolTip
        (
          {
            target: aL.getEl ().dom,
            autoHide:true,
            autoHeight:true,
            width: 250,
            trackMouse:true,
            html:getString("ait_time_filter_activation_desc"),
            dismissDelay: 0,
            hideDelay: 0,
            shadow: true
          }
        );
      }
    );

    // Add elements to the filter
    aConfig.items =
    [
      // The label "Time Filter"
      {
        xtype: "tbtext",
        style: "font-size:11px;margin-top:0px;",
        text: getString("ait_time_filter")
      },
      // The date picker
      m_aFilterDatePicker,
      // A spacer
      new Ext.BoxComponent
      (
        {
          autoEl:
          {
            tag:'div',
            style:'width:4px',
            html:"&nbsp;"
          }
        }
      ),
      // The checkbox
      m_aActivateFilterCheckbox,
      // The label "Aktiv"
      m_aActiveLabel
    ];

    // Call the superclass' constructor
    boc.ait.filter.TimeFilterWidget.superclass.constructor.call (this, aConfig);



    this.on ("afterlayout", function (aFilter)
      {
        aFilter.getEl ().select("div.x-clear").remove();
        if (m_aFilterDatePicker instanceof Ext.form.ComboBox)
        {
          m_aFilterDatePicker.setRawValue (Ext.util.Format.htmlDecode (this.getTimePeriodForDate (g_aSettings.filterSettings.filter).label));
        }
      }
    );


    /*
      Private internal function that is called when the date value of the time filter is changed

      \param aDate The new value
    */
    //--------------------------------------------------------------------
    var onChange = function (nDate)
    //--------------------------------------------------------------------
    {
      maskWCBlank ();
      var bError = false;
      try
      {
        // Set the filter to the new date
        this._setFilter
        (
          {
            filter: nDate
          }
        );
      }
      catch (aEx)
      {
        bError = true;
        throw aEx;
      }
      finally
      {
        if (bError)
        {
          unmaskWC ();
        }
      }
    }

    // Add an eventlistener for the keyup event
    m_aFilterDatePicker.on
    (
      "keyup",
      /*
        Anonymous function that sets the m_bFilterSelected to false
        That way, it is possible to realize when a value in the datepicker has changed
        after one was selected.
      */
      function (aField, aEvent)
      {

        if (aEvent.keyCode === 13)
        {
          var aDate = aField.getValue();
          // If the filter is not enabled, ignore the event
          if (!this.isEnabled())
          {
            return;
          }
          // Set the internal flag that indicates that a value was selected to true, thus
          // making sure that the "change" event is ignored.
          m_bFilterSelected = true;
          onChange.call (this, aDate.getTime());
        }
      },
      this
    );

    // Add a change handler to the timepicker
    m_aFilterDatePicker.on
    (
      "change",
      /*
        Anonymous function that handles the date picker's change event.
        The change event is ignored if a date was already selected before (controlled by the m_bFilterSelected flag)
        It is not ignored if the value of the date picker was changed by typing in a new value.

        \param aDateField The changed field
        \param aDate The new value of the field
      */
      //--------------------------------------------------------------------
      function (aDateField, aNewVal, aOldVal)
      //--------------------------------------------------------------------
      {
        // If the filter is not enabled, ignore the event
        if (!this.isEnabled())
        {
          return;
        }
        // If the filter was selected just before, ignore the event
        if (m_bFilterSelected)
        {
          m_bFilterSelected = false;
          return;
        }

        // Call the internal onChange function and pass the date
        onChange.call (this, aNewVal.getTime());
      },
      this
    );

    // Add an event listener for the checkbox' check event
    m_aActivateFilterCheckbox.on
    (
      "check",
      /*
        Anonymous function that handles the checkbox' check event

        \param aCheckbox The checked checkbox
      */
      //--------------------------------------------------------------------
      function (aCheckbox)
      //--------------------------------------------------------------------
      {
        maskWCBlank ();
        var bError = false;

        // Set the date picker's disabled state
        m_aFilterDatePicker.setDisabled (!aCheckbox.getValue());
        try
        {
          // Change filter's status
          this._setFilter
          (
            {
              enabled: aCheckbox.getValue(),
              filter: this.getFilter().getTime()
            }
          );
        }
        catch (aEx)
        {
          bError = true;
          throw aEx;
        }
        finally
        {
          if (bError)
          {
            unmaskWC ();
          }
        }
      },
      this
    );

    /*
      Private function that resets the filter
    */
    //--------------------------------------------------------------------
    function resetFilter ()
    //--------------------------------------------------------------------
    {
      // Suspend events for the date picker, so the value can be set without side effects
      m_aFilterDatePicker.suspendEvents ();
      // Set the picker's value to the last known value

      //m_aFilterDatePicker.setValue (new Date(m_aFilterState.filter));
      var aVal = m_aFilterState.filter;
      if (g_aSettings.filterSettings.filterType === FILTER_TYPE_TIME_PERIOD)
      {
        aVal = this.getTimePeriodForDate (aVal).beginDate;
      }
      else
      {
        aVal = new Date (aVal);
      }
      m_aFilterDatePicker.setValue(aVal);
      // Set the picker's disabled state
      m_aFilterDatePicker.setDisabled (!m_aFilterState.enabled);
      // Resume events
      m_aFilterDatePicker.resumeEvents ();
      // Suspend events for the checkbox, so the checked state can be set without side effects
      m_aActivateFilterCheckbox.suspendEvents ();
      // Set the checkbox' checked state
      m_aActivateFilterCheckbox.setValue (m_aFilterState.enabled);
      // Resume the events for the checkbox
      m_aActivateFilterCheckbox.resumeEvents ();
      unmaskWC ();
    }
  }
  catch (aEx)
  {
    alert(aEx);
  }
};

// The time filter widget is inherited from Ext.Panel
Ext.extend
(
  boc.ait.filter.TimeFilterWidget,
  Ext.Panel,
  {
    /*
      Public function that sets the filter's state

      \param aFilterValues A JS object containing two members:
              enabled: true if the filter is enabled, otherwise false
              filter: A number representing the filter date
    */
    //--------------------------------------------------------------------
    setFilter: function (aFilterValues)
    //--------------------------------------------------------------------
    {
      this._setFilter (aFilterValues);
    },

    /*
      Protected function that returns whether the filter is currently enabled

      \retval true if the filter is currently enabled, otherwise false
    */
    //--------------------------------------------------------------------
    isEnabled: function ()
    //--------------------------------------------------------------------
    {
      return this._isEnabled ();
    },

    /*
      Returns the current filter value

      \retval A Date object containing the current filter value
    */
    //--------------------------------------------------------------------
    getFilter: function ()
    //--------------------------------------------------------------------
    {
      return this._getFilter ();
    },

    /*
      Public function that returns the time period into which the passed date falls

      \param nDate The number of UTC milliseconds representing the desired date
      \retval The time period into which the passed date falls.
    */
    //--------------------------------------------------------------------
    getTimePeriodForDate : function (nDate)
    //--------------------------------------------------------------------
    {
      checkParam (nDate, "number");

      return this._getTimePeriodForDate (nDate);
    },

    /*
      Public function that constructs a store for comboboxes that should show
      the time periods.

      \param bIncludingNoValueField If this is true, then an extra entry for the "no value" is included
             in the store. By default this is false
      \retval An instance of Ext.data.Store to be used in a ComboBox
    */
    //--------------------------------------------------------------------
    getTimePeriodsStore : function (bIncludingNoValueField)
    //--------------------------------------------------------------------
    {
      checkParamNull (bIncludingNoValueField, "boolean");

      return this._getTimePeriodsStore (bIncludingNoValueField);
    }
  }
);

// Register the timefilter's xtype
Ext.reg("boc-timefilter", boc.ait.filter.TimeFilterWidget);