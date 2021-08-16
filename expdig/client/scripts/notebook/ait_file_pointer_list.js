/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2010\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2010
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.FilePointerList class.

**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.FilePointerList. This class
    is used for showing filepointer lists in the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.FilePointerList = function (aConfig)
//--------------------------------------------------------------------
{
  Ext.apply (this, aConfig);

  var that = this;

  this.value = this.data.value;

  aConfig.fieldConf = aConfig.fieldConf || {};

  aConfig.hideTBar = aConfig.header === false;

  // Create the field's store
  aConfig.fieldConf.store = new Ext.data.JsonStore
  (
    {
      autoDestroy:true,
      fields: [{name:'value'},{name:"id"}],
      reader: new Ext.data.JsonReader ()
    }
  );

  // Construct the data entries for the store from the field's data
  var aDataEntries = [];

  for (var i = 0; this.data.value.rows && i < this.data.value.rows.length;++i)
  {
    if (this.data.value.rows[i].deleted)
    {
      continue;
    }

    aDataEntries[aDataEntries.length] =
    {
      value: this.data.value.rows[i].values[0].value,
      id: this.data.value.rows[i].id
    }
  }

  // Create listeners for the filepointer list
  aConfig.fieldConf.listeners =
  {
    // The scope for all listeners is the filepointerlist
    scope: this,
    /*
      Handler for the afterEdit Event

      \param aParams A params object that contains the new value of the field and the edited record
    */
    //--------------------------------------------------------------------
    afterEdit : function (aParams)
    //--------------------------------------------------------------------
    {
      // Iterate through the rows in the filepointer
      for (var i = 0; i < this.value.rows.length;++i)
      {
        var aRowObj = this.value.rows[i];
        // If the current row is the edited one, modify the internal value of the filepointer
        if (aRowObj.id === aParams.record.get("id"))
        {
          aRowObj.values[0] = {value:aParams.value, modified: true};
          break;
        }
      }

      // Commit the changes to the record
      aParams.record.commit ();

      // Call the superclass' valueChange method, so the notebook realizes that there was a change
      boc.ait.notebook.FilePointerList.superclass.valueChange.call (this, this.value);
    }
  };


  // Load the data from the data entries
  aConfig.fieldConf.store.loadData (aDataEntries);

  /*
    Private function that renders an entry in the filepointer list

    \param aVal The value of the current cell
  */
  //--------------------------------------------------------------------
  function renderFilePointer (aVal)
  //--------------------------------------------------------------------
  {
    return boc.ait.transformFileReferenceToLink (aVal);
  }

  // Create the columns for the filepointer list
  aConfig.fieldConf.columns =
  [
    {
      id:'value',
      header:getString("ait_file_pointer_header"),
      sortable: true,
      dataIndex: 'value',
      // The editor is a simple textfield
      editor: new Ext.form.TextField ({selectOnFocus:true}),
      renderer: renderFilePointer,
      defaultValue:
      {
        value:
        {
          value:""
        }
      }
    }
  ];

  // Call the filepointer list's superclass
  boc.ait.notebook.FilePointerList.superclass.constructor.call (this, aConfig);


  /*
    Returns the values readmode representation

    \retval A readmode representation of the value
  */
  //--------------------------------------------------------------------
  this._getValueRep = function (aMetadata)
  //--------------------------------------------------------------------
  {
    var sVal = "";
    // Iterate through all rows in the filepointer list
    for (var i = 0; this.data.value.rows && i < this.data.value.rows.length;++i)
    {
      var sFileVal = this.data.value.rows[i].values[0].value;
      if (g_aSettings.offline)
      {
        sFileVal = sFileVal.replace(/\".*\" \"/, "");
        if (sFileVal.length > 1)
        {
          sFileVal = sFileVal.substring(0, sFileVal.length-1);
        }
      }
      sVal+=boc.ait.transformFileReferenceToLink (sFileVal)+"</br>";
    }
    return sVal;
  };


  /*
    Updates the field, whenever there is a switch between read and edit mode

    \param aAttrData The updated data for the field
  */
  //--------------------------------------------------------------------
  this._update = function (aAttrData)
  //--------------------------------------------------------------------
  {
    this.data = aAttrData;
    this.value = this.data.value;

    var aDataEntries = [];

    // Construct the data entries of the filepointer list from the passed attribute data
    for (var i = 0; i < this.value.rows.length;++i)
    {
      aDataEntries[i] =
      {
        value: this.value.rows[i].values[0].value,
        id: this.value.rows[i].id
      }
    }

    // Load the data from the data entries
    this.field.store.loadData (aDataEntries);
  };
};

// boc.ait.notebook.FilePointerList extends boc.ait.notebook.ComplexAttrTable
Ext.extend
(
  boc.ait.notebook.FilePointerList,
  boc.ait.notebook.ComplexAttrTable,
  {
    /*
      Returns the values readmode representation

      \retval A readmode representation of the value
    */
    //--------------------------------------------------------------------
    getValueRep : function (aMetadata)
    //--------------------------------------------------------------------
    {
      return this._getValueRep (aMetadata);
    }
  }
)

// Register the record's xtype
Ext.reg("boc-filepointerlist", boc.ait.notebook.FilePointerList);