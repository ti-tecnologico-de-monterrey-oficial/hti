/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2013\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2013
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.Record class.

**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.Record. This class
    is used for showing record attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.Record = function (aConfig)
//--------------------------------------------------------------------
{
  function renderInterref (aVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
  {
    return that.renderInterref.apply(that, [aVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore]);
  };

  function renderString (sVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
  {
    if (sVal !== null && sVal !== undefined)
    {
      return boc.ait.htmlEncode (sVal).replace(/\n/g, "<br/>");
    }
    return "";
  }

  function renderEnum (sVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
  {
    var aColumn = m_aColumns[nColIndex];

    var aDefaultVal = aColumn.defaultValue;

    var aIndConstraintArr = aDefaultVal.value.ind.split("@");
    var aConstraintArr = aDefaultVal.value.constraint.split("@");

    for (var i = 0; i < aIndConstraintArr.length;++i)
    {
      if (aIndConstraintArr[i] == sVal)
      {
        return aConstraintArr[i];
      }
    }
    return sVal;
  }

  function renderEnumList (sVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
  {
    var aColumn = m_aColumns[nColIndex];

    var aDefaultVal = aColumn.defaultValue;

    var aIndConstraintArr = aDefaultVal.value.ind.split("@");
    var aConstraintArr = aDefaultVal.value.constraint.split("@");

    var sLangVal = "";

    var aValArr = sVal.split("@");

    for (var i = 0; i < aValArr.length;++i)
    {
      for (var j = 0; j < aIndConstraintArr.length;++j)
      {
        if (aValArr[i] === aIndConstraintArr[j])
        {
          sLangVal+=aConstraintArr[j];
          break;
        }
      }
      if (i < (aValArr.length-1))
      {
        sLangVal+=", ";
      }
    }

    return sLangVal;
  }


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
      if (aNewValue == "")
      {
        aNewValue = 0;
        aField.setValue(0);
      }
      // Pass the field's name and the values to the notebook
      that.notebook.onAttrChange(that.name, aNewValue, aOldValue)
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }

  function doAfterRowModify ()
  {
    if (this.m_aAddButton)
    {
      this.m_aAddButton.enable ();
    }
    if (this.m_aRemoveButton && that.field.getSelectionModel().getSelectedCell())
    {
      this.m_aRemoveButton.enable ();
    }
    that.body.unmask();
  }

  function doBeforeRowModify ()
  {
    if (this.m_aAddButton)
    {
      this.m_aAddButton.disable ();
    }
    if (this.m_aRemoveButton)
    {
      this.m_aRemoveButton.disable ();
    }
    that.body.mask(getString("ait_loading"), 'x-mask-loading');
  }

  Ext.apply (this, aConfig);

  var that = this;

  var m_aColumns = [];
  var m_bEditable = true;

  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";

  //aConfig.fieldClass = Ext.grid.EditorGridPanel;

  aConfig.fieldConf = aConfig.fieldConf || {};

  // Create arrays to hold the data entries and the columns
  var aDataEntries = [];
  var aFields = [];
  // Get the columns of the record from the passed data.
  var aRecordColumns = this.data.value.columns;

  // Iterate through the record columns
  for (var i = 0; i < aRecordColumns.length;++i)
  {
    var aColumn = aRecordColumns[i];
    //aColumn.defaultVal.value.val = 0;
    // Add a new column
    m_aColumns[i] =
    {
      id: aColumn.id,
      header: aColumn.name,
      sortable: true,
      dataIndex: aColumn.id,
      name: aColumn.name,
      type: aColumn.type,
      defaultValue: aColumn.defaultVal
    };

    aFields [i] = aColumn.id;

    switch (aColumn.type)
    {
      case "TEXT":
      case "STRING":
      case "LONGSTRING":
        m_aColumns[i].editor = new Ext.form.TextField ({selectOnFocus:true});
        m_aColumns[i].renderer = renderString;
        break;
      case "UTC":
        m_aColumns[i].renderer = that.renderUTC;
        m_aColumns[i].editor = new boc.ait.notebook.FormUTCField
        (
          {
            format: "d.m.Y H:i:s"
          }
        );
        break;
      case "FILE_POINTER":
        m_aColumns[i].renderer = boc.ait.transformFileReferenceToLink;
        m_aColumns[i].editor = new Ext.form.TextField ({selectOnFocus:true});
        break;
      case "INTERREF":
        m_aColumns[i].renderer = renderInterref;
        break;
      case "ENUM":
        m_aColumns[i].renderer = renderEnum;

        m_aColumns[i].editor = new boc.ait.notebook.EnumField
        (
          {
            forRecord: true,
            notebook:this.notebook,
            data: aColumn.defaultVal,
            fieldConf:
            {
              cls:''
            }
          }
        ).field;
        break;
      case "DOUBLE":
      case "NUMBER":
        m_aColumns[i].editor = new Ext.form.NumberField ({selectOnFocus:true});
        break;
      case "INTEGER":
        m_aColumns[i].editor = new boc.ait.notebook.IntegerField
          (
            {
              forRecord: true,
              fieldConf:
              {
                cls: '',
                selectOnFocus:true
              }
            }
          ).field;
          //m_aColumns[i].editor = new Ext.form.NumberField();
        break;
    }
  }

  aFields[aFields.length] = "id";


  // Get the rows from the passed value
  var aRows = this.data.value.rows;
  this.value = this.data.value;

  if (aRows)
  {
    // Iterate through the rows
    for (var i = 0; i < aRows.length;++i)
    {
      var aRow = aRows[i];
      if (aRow.deleted)
      {
        continue;
      }
      // Create a new data array representing the cells in the row
      var aDataArray = [];
      // Iterate through the cells in the current row
      for (var j = 0; j < aRow.values.length;++j)
      {
        aDataArray[m_aColumns[j].dataIndex] = aRow.values[j].value;
      }
      aDataArray["id"] = aRow.id;

      aDataEntries[aDataEntries.length] = aDataArray;
    }
  }

  // Use a simple store as base for the record grid
  var aStore = new Ext.data.JsonStore
  (
    {
      autoDestroy:true,
      fields: aFields,
      reader: new Ext.data.JsonReader()
    }
  );

  // Load the data from the data entries
  aStore.loadData(aDataEntries);

  aConfig.fieldConf.store = aStore;
  aConfig.fieldConf.columns = m_aColumns;


  // Setup a listener for the record's render event
  aConfig.fieldConf.listeners =
  {
    beforeEdit: function (aParams)
    {
      // Don't allow editing if the record is not editable
      if (!that.data.editable)
      {
        return false;
      }
      return true;
    },

    afterEdit : function (aParams)
    {
      var aCM = aParams.grid.getColumnModel();
      var sFieldName = aCM.getDataIndex(aParams.column);
      var aColumn = aCM.getColumnById(sFieldName);
      var nValColumnIndex = -1;
      for (var i = 0; i < m_aColumns.length;++i)
      {
        if (m_aColumns[i].id === sFieldName)
        {
          nValColumnIndex = i;
          break;
        }
      }

      switch (aColumn.type)
      {
        case "UTC":
          aParams.value = aParams.value.getTime();
          break;
        default :
          if (typeof aParams.value === "string")
          {
            aParams.value = aParams.value.replace(/[\x01-\x08\x0b\x0c\x0e-\x1f]/ig,'?');
          }
      }
      for (var i = 0; i < that.value.rows.length;++i)
      {
        var aRowObj = that.value.rows[i];
        if (aRowObj.id === aParams.record.get("id"))
        {
          aRowObj.values[nValColumnIndex] = {value:aParams.value, modified: true};
          break;
        }
      }
      aParams.record.commit ();

      boc.ait.notebook.Record.superclass.valueChange.call (that, that.value);
    },
    celldblclick: function (aGrid, nRowIndex, nColIndex, aEvent)
    {
      if (!that.data.editable)
      {
        return;
      }


      var aStore = aGrid.getStore();
      // Get the clicked cell
      var aRecord = aStore.getAt (nRowIndex);  // Get the Record
      var aCM = aGrid.getColumnModel();
      var sFieldName = aCM.getDataIndex(nColIndex);
      var aColumn = aCM.getColumnById(sFieldName);
      var nValColumnIndex = -1;
      for (var i = 0; i < m_aColumns.length;++i)
      {
        if (m_aColumns[i].id === sFieldName)
        {
          nValColumnIndex = i;
          break;
        }
      }

      var aVal = aRecord.get (sFieldName);
      var aDefaultVal = aColumn.defaultValue;

      var aRenderer = aCM.getRenderer (nColIndex);
      var aEditBox = null;

      switch (aColumn.type)
      {
        case "INTERREF":
          var aNodeArray = [];

          // Iterate through the current targets of the relations control
          // and add the targets as nodes in the list
          for (var i = 0; i < aVal.length;++i)
          {
            var aTargetObj = aVal[i];
            aNodeArray[aNodeArray.length] =
            {
              text: aTargetObj.text,
              id: aTargetObj.id,
              artefactId: aTargetObj.artefactId,
              leaf: true,
              artefactType: aTargetObj.artefactType,
              attr_description: aTargetObj.attr_description,
              idclass: aTargetObj.idclass,
              iconUrl: aTargetObj.iconUrl,
              parent: aTargetObj.parent,
              classId: aTargetObj.classId,
              broken: aTargetObj.broken,
              status: aTargetObj.status,
              uiProvider: boc.ait.RelControlTreeNodeUI
            }
          }

          var aBaseTargets = [];
          var aBaseModifications = new Ext.util.MixedCollection ();
          for (var i = 0; i < that.value.rows.length;++i)
          {
            var aRowObj = that.value.rows[i];
            if (aRowObj.id === aRecord.get("id"))
            {
              var aCell = aRowObj.values [nValColumnIndex];
              if (aCell.modified === true)
              {
                var aModifications = aCell.modifications;
                for (var j = 0; aModifications && j < aModifications.length;++j)
                {
                  var aMod = aModifications[j];
                  aBaseModifications.add (aMod.id, {artefactType: aMod.artefactType, added: aMod.create});
                }
              }
              aBaseTargets = aCell.value;
              break;
            }
          }

          var aWin = new boc.ait.notebook.RelationsDialog
          (
            {
              title: aDefaultVal.relClass + " - " + getString ("ait_notebook_relwindow_title"),
              baseTargets: aBaseTargets,
              artefactID : that.notebook.artefactId,
              notebook: that.notebook,
              // Pass the relation class that the control is working with
              relClass: aDefaultVal.relClassInd,
              targetInformation: aDefaultVal.trgInformation,
              targetArtefactType: aDefaultVal.targetArtefactType,
              maxTrgOccurrances: aDefaultVal.maxOccurrances,
              // Pass a callback to be called when the dialog is closed
              scope: that,
              // Pass the entries currently displayed in the relations control
              entries: aNodeArray,
              baseModifications: aBaseModifications,
              // Optionally information about the record the relations control is contained in is sent
              recordInformation:
                {
                  recordName: that.name,
                  rowID: aRecord.get("id"),
                  colID: aColumn.id
                },
              okCallBack: function (aAddedRecords, bAppend, aChangedRelInformation)
              {
                doBeforeRowModify ();

                aRecord.set(aColumn.id, []);
                aRecord.set(aColumn.id, aAddedRecords);

                var aRelArr = [];
                aChangedRelInformation.eachKey (function (sId, aChangedRel)
                  {
                    aRelArr[aRelArr.length] =
                    {
                      id: sId,
                      toArtefactType: aChangedRel.toArtefactType,
                      fromArtefactType: aChangedRel.fromArtefactType,
                      toInstId: aChangedRel.toInstId,
                      fromInstId: aChangedRel.fromInstId,
                      create: aChangedRel.added
                    };

                  }
                );
                if (aRelArr.length > 0)
                {
                  aRowObj.values[nValColumnIndex].modified = true;
                  aRowObj.values[nValColumnIndex].modifications = aRelArr;
                }

                boc.ait.notebook.Record.superclass.valueChange.call (that, that.value);
                aRecord.commit ();
                that.field.getView().refresh ();


                doAfterRowModify ();
              }
            }
          );
          aWin.show();
          break;
        default:
          return;
      }
      if (aEditBox)
      {
        aEditBox.show();
      }
    }
  }


  boc.ait.notebook.Record.superclass.constructor.call (this, aConfig);

  this._getValueRep = function (aMetadata)
  {
    aMetadata.textAlign = "below";

    var aTitleRow =
    {
      tag:'tr',
      cls: 'ait_readmode_notebook_table_hd',
      children:[]
    };
    for(var i = 0; i < this.value.columns.length;++i)
    {
      aTitleRow.children[i] =
      {
        tag:'td',
        valign:'top',
        html:this.value.columns[i].name
      };
    }

    var aTableRows = [aTitleRow];
    // Get the rows from the passed value
    var aRows = this.value.rows;

    var aRecordVal =
    {
      tag:'table'
    };

    //function iterateRecords (aRecord, nIndex, nTotalCnt)
    function iterateRecords (aRows)
    {

      for (j = 0; j < aRows.length;++j)
      {
        var aRecord = aRows[j];

        var aRow =
        {
          tag:'tr',
          //cls: 'ait_readmode_notebook',
          children:[]
        };
        // Create a new data array representing the cells in the row
        var aDataArray = [];

        for (var i = 0; i < m_aColumns.length;++i)
        {
          var aCol = m_aColumns[i];
          var aVal = aRecord.values[i].value;

          switch (aCol.type)
          {
            case "BOOL":
              aVal = (aVal === "1") ? getString("ait_bool_yes") : getString("ait_bool_no");
              break;
            case "UTC":
              aVal = that.renderUTC (aVal);
              break;
            case "ENUM":
              aVal = renderEnum (aVal, null, that, nIndex, i);
              break;
            case "ENUMLIST":
              aVal = renderEnumList (aVal, null, that, nIndex, i);
              break;
            case "INTERREF":
              aVal = renderInterref (aVal, null, that, nIndex, i);
              break;
            case "FILE_POINTER":
              aVal = boc.ait.transformFileReferenceToLink (aVal);
              break;
            default:
              aVal = (typeof aVal == "string") ? boc.ait.htmlEncode (aVal).replace(/\n/g, "<br/>") : aVal
              break;
          }
          if (aVal.length == 0)
          {
            aVal = "&nbsp;";
          }


          if (aMetadata && aMetadata.highlightParams)
          {
            var sVal = aMetadata.highlightParams[this.name]
            if (typeof sVal === "string")
            {
              if (sVal === "")
              {
                continue;
              }
              var sString = aVal;
              var sModified = "";
              var sPost = "";
              var bDidReplacing = false;
              while (sString.toLowerCase().indexOf(sVal.toLowerCase()) > -1)
              {
                bDidReplacing = true;
                var nIndex = sString.toLowerCase().indexOf (sVal.toLowerCase());
                var sPre = sString.substring (0, nIndex);
                var sMatchedValue = sString.substring (nIndex, nIndex + sVal.length);
                sPost = sString.substring (nIndex + sVal.length);
                sModified+= sPre+"<span style='color:red;'>"+sMatchedValue+"</span>";
                sString = sPost;
              }

              if (bDidReplacing)
              {
                sModified+=sPost;

                aVal = sModified;
              }
            }
          }

          aRow.children[i] =
          {
            tag:'td',
            cls: 'ait_readmode_notebook_table_val',
            style: 'vertical-align: text-top;',
            valign:'top',
            html: String(aVal)
          };
        }
        aTableRows[aTableRows.length] = aRow;
      }
    }

    if (this.data.value.rows && this.data.value.rows.length > 0)
    {
      iterateRecords.call (this, this.data.value.rows);

      aRecordVal.cls = 'ait_readmode_notebook_table';
      aRecordVal.children = aTableRows;
    }
    else
    {
      aRecordVal.children =
      [
        {
          tag:'tr',
          children:
          [
            {
              tag:'td',
              html:"<div>"+getString('ait_no_entry')+"</div>"
            }
          ]
        }
      ]
    }

    return aRecordVal;
  };

  this._update = function (aAttrData)
  {
    this.data = aAttrData;

    var aDataEntries = [];
    // Get the rows from the passed value
    var aRows = this.data.value.rows;
    this.value = this.data.value;

    if (aRows)
    {
      // Iterate through the rows
      for (var i = 0; i < aRows.length;++i)
      {
        var aRow = aRows[i];
        // Create a new data array representing the cells in the row
        var aDataArray = [];
        // Iterate through the cells in the current row
        for (var j = 0; j < aRow.values.length;++j)
        {
          aDataArray[m_aColumns[j].dataIndex] = aRow.values[j].value;
        }
        aDataArray["id"] = aRow.id;

        aDataEntries[i] = aDataArray;
      }
    }

    // Load the data from the data entries
    this.field.store.loadData(aDataEntries);
  };
};

// boc.ait.notebook.Record is derived from Ext.grid.GridPanel
Ext.extend
(
  boc.ait.notebook.Record,
  boc.ait.notebook.ComplexAttrTable,
  {
    renderUTC: function (sVal, aMetadata, aRecord)
    {
      var aDate = new Date();
      aDate.setTime(sVal);
      return aDate.format("d.m.Y H:i:s");
    },

    renderInterref : function (aVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
    {
      var sVisualization = "";

      for (var i = 0; i < aVal.length;++i)
      {
        var sText = boc.ait.htmlEncode (aVal[i].text);
        if(aVal[i].broken !== true)
        {
          if(g_aSettings.offline && aVal[i].trgmissing)
          {
            sVisualization+=sText+'<br/>';
          }
          else
          {
            sVisualization+='<a class=\'ait_link\' href=\'#\' onclick=\'g_aMain.getMainArea().openNotebook("'+aVal[i].artefactId+'",'+aVal[i].artefactType+');\'>'+sText+'</a><br/>';
          }
        }
        else
        {
          sVisualization+='<img src=\'images/broken.png\' class=\'ait_broken_reference_readmode\'/>&nbsp;'+sText+'<br/>';
        }
      }
      return sVisualization;
    },

    renderEnum : function (aVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
    {
      aVal = aRecord.defaultValue;

      var aIndConstraintArr = aVal.value.ind.split("@");
      var aConstraintArr = aVal.value.constraint.split("@");
      var sVal = aVal.value.value;
      for (var i = 0; i < aIndConstraintArr.length;++i)
      {
        if (aIndConstraintArr[i] == sVal)
        {
          return aConstraintArr[i];
        }
      }
      //return aVal.value.val;
      return sVal;
    },

    getValueRep : function (aMetadata)
    {
      return this._getValueRep (aMetadata);
    }
  }
)

// Register the record's xtype
Ext.reg("boc-record", boc.ait.notebook.Record);
