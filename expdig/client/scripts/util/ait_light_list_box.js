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
boc.ait.util.LightListBox = function (aConfig)
//--------------------------------------------------------------------
{
  // Initialize the config object if necessary
  aConfig = aConfig || {};
  var m_aData = aConfig.data;
  var m_aProxy = aConfig.proxy || new Ext.data.MemoryProxy ({});
  var m_aStore = null;

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    if (Ext.isEmpty(aConfig.store))
    {
      m_aStore = aConfig.store || new Ext.data.Store
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
              idProperty: aConfig.readerId || "id",
              fields: aConfig.fields || [
                                          {name:'text'},
                                          {name:'id'}
                                        ]
            }
          ),
          proxy: m_aProxy
        }
      );
    }

    aConfig.store = m_aStore;

    /*aConfig.colModel = new Ext.grid.ColumnModel
    (
      {
        columns: aConfig.columns ||
        [
          {id:'text', header:'Text', sortable: true, dataIndex: 'text'}
        ]
      }
    );*/

    //aConfig.emptyText = 'No images to display';
    aConfig.columns = aConfig.columns ||
      [
        {
          id:'text',
          header:'Text',
          sortable: true,
          dataIndex: 'text',
          tpl:"{[boc.ait.htmlEncode(values.text)]}"
        }
      ];
    
    var aCols = boc.ait.clone (aConfig.columns);
    
    var nTotalWidth = 0;
    var i = 0;
    for (i = 0; i < aCols.length;++i)
    {
      if ((typeof aCols[i].width) === "number")
      {
        nTotalWidth += aCols[i].width;
      }
      else
      {
        nTotalWidth += 50;
      }
    }
    
    for (i = 0; i < aCols.length;++i)
    {
      var aCol = aCols[i];
      if (aCol.editWidth)
      {
        aCol.width = aCol.editWidth;
      }
      else
      {
        var nColWidth = aCol.width || 50;
        aCol.width = (nColWidth / nTotalWidth);
      }
      
      if (!aCol.tpl)
      {
        if (aCol.formatter)
        {
          aCol.tpl = "{[boc.ait._internal.renderers['"+ (aCol.id || aCol.field || aCol.dataIndex) + "'](values._row, values._col, values."+(aCol.id || aCol.field || aCol.dataIndex)+", boc.ait._internal.columns['"+(aCol.id || aCol.field || aCol.dataIndex)+"'], values)]}";
        }
      }
    }
    
    aConfig.columns = aCols;
    
    aConfig.tpl = new Ext.XTemplate
    (
      '<tpl for="rows">',
        '<tpl exec="values._row = xindex;"></tpl>',
        '<tpl exec="values._col = xcount;"></tpl>',
        '<tpl exec="values._parentTpl = parent;"></tpl>',
        '<dl>',
          '<tpl for="parent.columns">',
          '<dt style="width:{[values.width*100]}%;text-align:{align};">',
          '<em unselectable="on"<tpl if="cls"> class="{cls}</tpl>">',
            '{[values.tpl.apply(parent)]}',
          '</em></dt>',
          '</tpl>',
          '<div class="x-clear"></div>',
        '</dl>',
      '</tpl>'
    );
    
    /*aConfig.viewConfig = aConfig.viewConfig ||
    {
      forceFit: true
    };*/

    /*aConfig.sm = aConfig.sm || new Ext.grid.RowSelectionModel
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
    );*/
  };

  //aConfig.singleSelect = true;
  //aConfig.multiSelect = Ext.isEmpty(aConfig.singleSelect) ? false : !aConfig.singleSelect;

  buildObject.call (this);


  m_aStore.loadData(m_aData);
  aConfig.data = null;
  delete aConfig.data;

  aConfig.autoScroll = true;

  // Call to the superclass' constructor
  boc.ait.util.LightListBox.superclass.constructor.call(this, aConfig);
  
  this._getAllRecords = function ()
  {
    return m_aStore.getRange ();
  };
};

// boc.ait.util.LightListBox is derived from Ext.tree.TreePanel
Ext.extend
(
  boc.ait.util.LightListBox,
  Ext.list.ListView,
  {
    getAllRecords : function ()
    {
      return this._getAllRecords();
    },
    
    getSelectedElements : function ()
    {
      return this.getSelectedRecords ();
    },

    selectAtIndex : function (nIndex)
    {
      this._selectAtIndex (nIndex);
    }
  }
);

// Register the listbox' xtype
Ext.reg("boc-lightlistbox", boc.ait.util.LightListBox);