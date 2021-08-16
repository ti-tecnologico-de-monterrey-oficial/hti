/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.util.ListBox class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait.util');

/*
    Implementation of the class boc.ait.ListBox. Ext JS does not contain
    a listbox so this is basically a tree without hierarchy, without lines, that just
    lists elements in a flat list
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.util.ListBox = function (aConfig)
//--------------------------------------------------------------------
{
  // Initialize the config object if necessary
  aConfig = aConfig || {};
  var m_aData = aConfig.data;
  var m_aProxy = aConfig.proxy || new Ext.data.MemoryProxy ({});

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    if (Ext.isEmpty(aConfig.store))
    {

      aConfig.store = aConfig.store || new Ext.data.Store
      (
        {
          sortInfo: aConfig.sortInfo ||
          {
            field: "text",
            direction: "ASC"
          },
          autoDestroy: true,
          reader: new Ext.data.JsonReader
          (
            {
              id: aConfig.readerId || "id",
              fields: aConfig.fields ||
              [
                {name:'text'},
                {name:'id'}
              ]
            }
          ),
          proxy: m_aProxy
        }
      );
    }

    aConfig.colModel = new Ext.grid.ColumnModel
    (
      {
        columns: aConfig.columns ||
        [
          {id:'text', header:'Text', sortable: true, dataIndex: 'text'}
        ]
      }
    );

    aConfig.viewConfig = aConfig.viewConfig ||
    {
      forceFit: true
    };

    aConfig.sm = aConfig.sm || new Ext.grid.RowSelectionModel
    (
      {
        singleSelect: Ext.isEmpty(aConfig.singleSelect) ? true : aConfig.singleSelect
      }
    );

    aConfig.sm.on("rowselect", function (aSelModel, nRowIndex, aRecord)
      {
        this.fireEvent ("rowselect", this, nRowIndex, aRecord);
      },
      this
    );

    aConfig.sm.on("rowdeselect", function (aSelModel, nRowIndex, aRecord)
      {
        this.fireEvent ("rowdeselect", this, nRowIndex, aRecord);
      },
      this
    );
  };

  buildObject.call (this);

  // Call to the superclass' constructor
  boc.ait.util.ListBox.superclass.constructor.call(this, aConfig);

  if (aConfig.selection && Ext.isArray(aConfig.selection))
  {

    this.on ("viewready", function (aGrid)
      {
        aGrid.getSelectionModel().selectRows(aConfig.selection);

        function _focusSelectedRow ()
        {
          aGrid.getView().focusRow(aConfig.selection[0]);
          aGrid.enable ();
        }

        _focusSelectedRow.defer(100, aGrid.getView(), []);
      }
    );
  }

  this.on("render", function ()
    {
      this.getStore().loadData(m_aData);
    },
    this
  );

  this._getSelectedElements = function ()
  {
    return this.getSelectionModel ().getSelections();
  };

  this._selectAtIndex = function (nIndex)
  {
    this.getSelectionModel().selectRow (nIndex, false, false);
  };
};

// boc.ait.util.ListBox is derived from Ext.tree.TreePanel
Ext.extend
(
  boc.ait.util.ListBox,
  //Ext.tree.TreePanel,
  Ext.grid.GridPanel,
  {
    getSelectedElements : function ()
    {
      return this._getSelectedElements ();
    },

    selectAtIndex : function (nIndex)
    {
      this._selectAtIndex (nIndex);
    }
  }
);

// Register the listbox' xtype
Ext.reg("boc-listbox", boc.ait.util.ListBox);