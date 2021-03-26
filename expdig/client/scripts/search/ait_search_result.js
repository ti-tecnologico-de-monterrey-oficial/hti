/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2010\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2010
**********************************************************************
\author MWh
This file contains the code for the boc.ait.search.SearchResult class.
**********************************************************************
*/

// Create namespace boc.ait.search
Ext.namespace('boc.ait.search');

/*
    Implementation of the class boc.ait.search.SearchResult. This class
    is used for showing search results in a resultgrid.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.search.SearchResult = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var that = this;

  var m_aStore = null;
  var m_aResultGrid = null;
  var m_aCtxMenu = null;
  var m_aSearchParams = null;

  // Initialize the config object if necessary
  aConfig = aConfig || {};

  /*
    Private function that renders the name column
    \param sValue The value to render
    \param aMetadata Metadata for the cell
    \param aRecord The record for the current row.
  */
  //--------------------------------------------------------------------
  this._renderName = aConfig.renderName || function (sVal, aMetadata, aRecord)
  //--------------------------------------------------------------------
  {
    // In case we want to render the metadata to a support dialog or if the metadata is empty (when
    // the grid is being grouped), we want to return the raw value for the cell
    if (aMetadata.renderInSupportDialog || isEmpty(aMetadata))
    {
      return boc.ait.htmlEncode (sVal, true);
    }

    return "<a class='ait_link' href='#'><b>"+boc.ait.htmlEncode (sVal, true)+"</b></a>";
  };

  /*
    Private function that renders the icon column
    \param sValue The value to render
    \param aMetadata Metadata for the cell
    \param aRecord The record for the current row.
  */
  //--------------------------------------------------------------------
  var renderIcon = function (sVal, aMetadata, aRecord)
  //--------------------------------------------------------------------
  {
    if (aMetadata.renderInSupportDialog)
    {
      return sVal;
    }

    // Use the blank image url as the standard overlay for the modeltype, folder or class icon
    var sSrc = Ext.BLANK_IMAGE_URL;
    // If the current record is not editable, we want to overlay its icon with a lock
    if (!aRecord.data.editable && !g_aSettings.offline)
    {
      sSrc = 'images/lock.gif';
    }

    var sIconPath = boc.ait.getIconPath ();
    if (g_aSettings.offline)
    {
      // Render leaf nodes
      aMetadata.attr="style='background:url("+sIconPath+aRecord.data.idClass.toUpperCase()+".tmp) center center transparent no-repeat;'";

    }
    else
    {
      // Render leaf nodes
      aMetadata.attr="style='background:url("+sIconPath+aRecord.data.iconUrl+") center center transparent no-repeat;'";
    }

    return "<span style='background:url("+sSrc+") 6px center transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
  }

  var renderDescription = function (sVal, aMetadata, aRecord)
  {
    if (sVal === undefined)
    {
      return '';
    }
    sVal = boc.ait.htmlEncode (sVal);
    if (aMetadata.renderInSupportDialog)
    {
      return sVal;
    }
    if (sVal.indexOf("\n") > -1)
    {
      return sVal.substring(0, sVal.indexOf("\n"));
    }
    else
    {
      return sVal;
    }
  };



  /*
    Private function that renders the status column
    \param sValue The value to render
    \param aMetadata Metadata for the cell
    \param aRecord The record for the current row.
  */
  //--------------------------------------------------------------------
  var renderStatus = function (sVal, aMetadata, aRecord)
  //--------------------------------------------------------------------
  {
    var sIconName = "status_green1.png";
    switch (sVal)
    {
      case "v0": sIconName = "status_grey2.png";break;
      case "v1": sIconName = "status_yellow2.png";break;
      case "v2": sIconName = "status_green2.png";break;
      case "v3": sIconName = "status_redcross2.png";break;
      default: return sVal;
    }

    return "<div style='width:100%; text-align:center;'><span style='0px background-position:50% 50%;background-image:url(images/"+sIconName+");background-repeat:no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>";
  }

  var renderAttribute = function (aVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
  {
    if ((typeof aVal === "object") && !(aVal instanceof Array))
    {
      return "<i style='color:gray'>"+getString(aVal.text)+"</i>";
    }

    return aVal;
  };


  /*
    Private function that builds the object. Serves as constructor
  */
  //--------------------------------------------------------------------
  function buildObject ()
  //--------------------------------------------------------------------
  {
    aConfig.titleCollapse = true;
    //aConfig.title = getString("ait_search_window_result");
    aConfig.collapsible = false;
    aConfig.border = false;
    aConfig.layout = 'fit';
    aConfig.region= 'center';
    aConfig.gridConfig = aConfig.gridConfig || {};
    m_aSearchParams = aConfig.searchParams;

    aConfig.plugins = [boc.ait.plugins.Customizable];

    // Create the result columns that are always shown
    var aResultColumns =
    [
      new Ext.grid.RowNumberer(),
      {
        id: "idClass_lang",
        header: getString("ait_search_result_type"),
        sortable: true,
        dataIndex: "idClass_lang",
        width:40,
        fixed: true,
        renderer: renderIcon,
        name: 'idClass_lang'
      },
      {
        id: "text",
        header: getString("ait_search_result_name"),
        sortable: true,
        dataIndex: "text",
        width: 75,
        renderer: that._renderName,
        name: "text"
      }
    ];


    var aFields = [];

    if (aConfig.showGlobalAttributes === true)
    {
      for (var i = 0; g_aSettings.searchData.global_attributes && i < g_aSettings.searchData.global_attributes.length;++i)
      {
        var aAttrParams = g_aSettings.searchData.global_attributes[i];
        // Ignore the Name column, as the name is already always shown by default anyway
        if (aAttrParams.attrName === "NAME")
        {
          continue;
        }

        var bShowColumn = true;
        for(var q=0; q<aResultColumns.length; ++q)
        {
          if (aResultColumns[q].id === "attr_"+aAttrParams.attrID)
          {
            bShowColumn = false;
            break;
          }
        }
        if(bShowColumn)
        {
          aResultColumns[aResultColumns.length] =
          {
            id: "attr_"+aAttrParams.attrID,
            header: aAttrParams.langName,
            sortable: true,
            renderer: renderAttribute,
            dataIndex: "attr_"+aAttrParams.attrID,
            name: "attr_"+aAttrParams.attrID
          };
          // Also add the id of the attribute to the fields for the store
          aFields[aFields.length] = "attr_"+aAttrParams.attrID;
        }
      }
    }
    else if (aConfig.showGlobalAttributes === undefined)
    {
      aResultColumns[aResultColumns.length] =
      {
        id: "attr_description",
        header: getString("ait_search_result_description"),
        sortable: true,
        dataIndex: "attr_description",
        renderer: renderDescription,
        width: 100/*,
        name: "description"*/
      }
    }

    // If we were passed additional result columns, add them
    if (aConfig.additionalResultColumns)
    {
      aResultColumns = aResultColumns.concat(aConfig.additionalResultColumns);
    }



    // Array to hold the visualized fields of the result
    aFields = aFields.concat
    (
      [
        {name:'idClass'},
        {name:'idClass_lang'},
        {name:'text', type:'string'},
        {name:'classId'},
        {name:'_is_leaf'},
        {name:'iconUrl'},
        {name:'id'},
        {name:'modelId'},
        {name:'_parent'},
        {name:'artefactType'},
        {name:'editable'}
      ]
    );

    // If we were passed additional fields, add them
    if (aConfig.additionalFields)
    {
      aFields = aFields.concat (aConfig.additionalFields);
    }

    if (aConfig.showGlobalAttributes === undefined)
    {
      aFields[aFields.length] = {name:"attr_description"};
    }

    /**
     * BufferedJsonReader derives from Ext.data.JsonReader and allows to pass
     * a version value representing the current state of the underlying data
     * repository.
     * Version handling on server side is totally up to the user. The version
     * property should change whenever a record gets added or deleted on the server
     * side, so the store can be notified of changes between the previous and current
     * request. If the store notices a version change, it will fire the version change
     * event. Speaking of data integrity: If there are any selections pending,
     * the user can react to this event and cancel all pending selections.
     */

    var aReaderConfig =
    {
      root            : 'payload.entries',
      totalProperty   : 'payload.cnt',
      id              : 'id',
      fields: aFields
    }
    var aReader = null;
    if (!g_aSettings.offline && aConfig.useLiveGrid)
    {
      aReader = new Ext.ux.grid.livegrid.JsonReader (aReaderConfig);
    }
    else
    {
      aReader = new Ext.data.JsonReader (aReaderConfig);
    }

    var aStoreConfig = null;

    if (!aConfig.resultData)
    {
      aStoreConfig =
      {
        autoLoad: true,
        //proxy: null,
        url: aConfig.searchParams.url,
        baseParams:
        {
          type: aConfig.searchParams.type,
          searchid: aConfig.searchParams.searchid,
          queryAServer: true,
          params: Ext.encode
          (
            aConfig.searchParams.params
          )
        },
        bufferSize : 60,
        sortInfo: {field:'text', direction: 'DESC'},
        reader: aReader
      };
    }
    else
    {
      aStoreConfig =
      {
        autoLoad:true,
        proxy : new Ext.data.MemoryProxy (aConfig.resultData),
        sortInfo: {field:'text', direction:'DESC'},
        reader: aReader
      }
    }

    aStoreConfig.destroy = true;


    if (!g_aSettings.offline && aConfig.useLiveGrid)
    {
      m_aStore = new Ext.ux.grid.livegrid.Store (aStoreConfig);
    }
    else
    {
      aStoreConfig.groupField = aConfig.groupField;
      m_aStore = new Ext.data.GroupingStore (aStoreConfig);
    }

    m_aStore.on("load", function(aStore, aRecords)
      {
        that.fireEvent("load", aStore, aRecords);
        if (!g_aSettings.offline && aConfig.useLiveGrid)
        {
          m_aStore.baseParams.queryAServer = false;
        }
        // Call the initialLoadCallback functionality
        if ((typeof aConfig.initialLoadCallback) === "function")
        {
          aConfig.initialLoadCallback.call(aConfig.scope || this);
        }
      }
    );

    m_aStore.on("loadexception", function (aStore, aOptions, aResponse, eError)
      {
        try
        {
          if (!this.reader.jsonData)
          {
            return;
          }
          if (this.reader.jsonData.error)
          {
            showErrorBox (this.reader.jsonData.errString);

            return;
          }
        }
        finally
        {
          that.fireEvent ("loadexception", aStore, aOptions, aResponse, eError);

          // Call the initialLoadCallback functionality
          if ((typeof aConfig.initialLoadCallback) === "function")
          {
            aConfig.initialLoadCallback.call(aConfig.scope || this);
          }
        }
      }
    );


    var aViewConfig =
    {
      nearLimit      : 20,
      forceFit: true,
      preserveCellWidths: true,
      loadMask :
      {
        msg : getString("ait_loading")
      }
    };

    var aView = null;
    if (!g_aSettings.offline && aConfig.useLiveGrid)
    {
      aView = new Ext.ux.grid.livegrid.GridView (aViewConfig);
    }
    else if (aConfig.groupField)
    {
      aViewConfig.hideGroupedColumn = true;
      aViewConfig.enableNoGroups = true;
      aViewConfig.groupRenderer = function (aVal, aUnused, aRecord, nRowIndex, nColIndex, aDS)
        {
          return "?";
        }
      aView = new Ext.grid.GroupingView (aViewConfig);
    }
    else
    {
      aView = new Ext.grid.GridView (aViewConfig);
    }

    var aSM = aConfig.sm;

    if (!aConfig.sm)
    {
      var aSMConfig =
      {
        singleSelect: aConfig.singleSelect === true,
        listeners:
        {
          selectionchange : function (aSelModel)
          {
            that.fireEvent('selectionchange', that, aSelModel);
          }
        }
      };

      if (!g_aSettings.offline && aConfig.useLiveGrid)
      {
        aSM = new Ext.ux.grid.livegrid.RowSelectionModel (aSMConfig);
      }
      else
      {
        aSM = new Ext.grid.RowSelectionModel (aSMConfig);
      }
    }

    var aGridConfig =
    {
      columns:aResultColumns,
      stripeRows: true,
      //title: aConfig.title || "",
      maskDisabled: false,
      layout:'fit',
      autoWidth:true,
      autoHeight:aConfig.gridConfig.autoHeight,
      autoScroll:true,
      border:false,
      autoExpandColumn: 'text',
      store: m_aStore,
      view: aView,
      sm: aSM
    };



    aGridConfig.listeners = aConfig.gridConfig.listeners || {};

    /*
      Handler for the 'render' event of the grid
      Ensures that the result grid is displayed correctly
      \param aGrid The rendered grid
    */
    //--------------------------------------------------------------------
    aGridConfig.listeners.render = aGridConfig.listeners.render || function (aGrid)
    //--------------------------------------------------------------------
    {
      try
      {
        aGrid.ownerCt.body.applyStyles("padding:0px;width:auto;");
        aGrid.body.applyStyles("padding:0px;width:auto;");
        Ext.get(aGrid.ownerCt.body.dom.parentNode).applyStyles("background-color:white;width:auto;");
        aGrid.ownerCt.body.applyStyles("width:auto;");

        // Workaround on IE6 to force the grid's size to be correctly recalculated
        //if (Ext.isIE6)
        //{
          aGrid.setWidth(1);
        //}
      }
      catch (aEx)
      {
        displayErrorMessage (aEx);
      }
    };

    aGridConfig.listeners.celldblclick = aGridConfig.listeners.celldblclick || function (aGrid, nRowIndex, nColIndex, aEvent)
      {
        var aStore = aGrid.getStore();
        // Get the clicked cell
        var aRecord = aStore.getAt (nRowIndex);  // Get the Record
        var aCM = aGrid.getColumnModel();
        var sFieldName = aCM.getDataIndex(nColIndex);
        var aColumn = aCM.getColumnById(sFieldName);
        var aDefaultVal = aColumn.defaultValue;
        var aVal = aRecord.get(sFieldName);
        var aRenderer = aCM.getRenderer (nColIndex);
        showExtendedEditBox(aRenderer (aVal, {renderInSupportDialog: true}, aRecord), aCM.getColumnHeader(nColIndex), false);
      };

    /*
      Handler for the 'rowcontextmenu' event of the grid. Displays
      a context menu for the current row.

      \param aGrid The grid on which the event was thrown
      \param nRowIndex The index of the event throwing row
      \param aEvt The thrown event
    */
    //--------------------------------------------------------------------
    aGridConfig.listeners.rowcontextmenu = aGridConfig.listeners.rowcontextmenu || function (aGrid, nRowIndex, aEvt)
    //--------------------------------------------------------------------
    {
      try
      {
        var aSelectionModel = aGrid.getSelectionModel();
        if (!aSelectionModel.isSelected (nRowIndex))
        {
          aSelectionModel.selectRow (nRowIndex);
        }
        m_aCtxMenu.setContext (aGrid.getSelectionModel().getSelections());
        // Get the actual menu from the mainmenu object
        var aMenu = m_aCtxMenu.menu;
        aMenu.showAt(aEvt.getXY());
        aEvt.stopEvent();
      }
      catch (aEx)
      {
        displayErrorMessage (aEx);
      }
    };

    if (!g_aSettings.offline && aConfig.useLiveGrid)
    {
      m_aResultGrid = new Ext.ux.grid.livegrid.GridPanel (aGridConfig);
    }
    else
    {
      m_aResultGrid = new Ext.grid.GridPanel (aGridConfig);
    }
    aConfig.items = m_aResultGrid;

    if (m_aSearchParams !== null && m_aSearchParams !== undefined)
    {
      for (var sAttrName in m_aSearchParams.params.attributes)
      {
        var sVal = m_aSearchParams.params.attributes[sAttrName];
        sVal = sVal.trim().replace(/\*/g, "").replace(/\"/, "").replace(/\'/, "");
        m_aSearchParams.params.attributes[sAttrName] = sVal;
      }
    }
    m_aResultGrid.on("cellclick", aConfig.nameCellClick || function (aGrid, nRowIndex, nColIndex, aEvt )
      {
        var aRecord = aGrid.getStore().getAt(nRowIndex);  // Get the Record

        //var aData = aRecord.get(sFieldName);
        var sFieldID = aGrid.getColumnModel().getColumnId(nColIndex);

        if (sFieldID === "text")
        {
          if (aRecord.get("artefactType") === AIT_ARTEFACT_DIAGRAM)
          {
            g_aMain.getMainArea().openDiagram (aRecord.get("id"), AIT_ARTEFACT_DIAGRAM);
          }
          else
          {
            g_aMain.getMainArea().openNotebook
            (
              aRecord.get("id"),
              AIT_ARTEFACT_OBJECT,
              false,
              m_aSearchParams && m_aSearchParams.params && m_aSearchParams.params.attributes ? m_aSearchParams.params.attributes : null
            );
          }
        }
      }
    );

    m_aCtxMenu = new boc.ait.menu.Menu
    (
      {
        commands : [
                    "ait_menu_main_open_diagram",
                    "ait_menu_main_open_model_editor",
                    "ait_menu_main_open_notebook",
                    "-",
                    "ait_menu_main_used_in_models",
                    "-",
                    {
                      cmdId: "ait_menu_main_views",
                      commands:
                      [
                        "ait_menu_main_show_bia"
                      ]
                    }
                   ]
      }
    );
    m_aCtxMenu.getContext = function ()
    {
      return that.getGridControl().getSelectionModel().getSelections();
    }

    if (m_aSearchParams && m_aSearchParams.params && m_aSearchParams.params.attributes)
    {
      m_aCtxMenu.setParams ({highlightParams: m_aSearchParams.params.attributes});
    }
  };

  this._getGridControl = function ()
  {
    return m_aResultGrid;
  };

  this._getContextMenu = function ()
  {
    return m_aCtxMenu;
  }
  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.search.SearchResult.superclass.constructor.call(that, aConfig);


  /*
      Protected function that loads the data into the search result
      and displays it.

      May throw an exception to the calling function.

      \param aData [optional] The data to load. If this is not provided, the data
              that was passed to the search result via the initial config is loaded.
    */
  //--------------------------------------------------------------------
  this._loadData = function(aData)
  //--------------------------------------------------------------------
  {
    if (aData)
    {
      // Load the data from the searchresult that was passed to us
      m_aStore.loadData(aData);
    }
    else
    {
      //m_aStore.loadData (aConfig.resultData);
      //m_aStore.load (function (){});
    }

    // Sort the data in the store by the name
    //aConfig.store.sort('text');
  };
}

// boc.ait.search.SearchResult is derived from Ext.grid.GridPanel
Ext.extend
(
  boc.ait.search.SearchResult,
  Ext.Panel,
  {

    /*
      Public function that loads the data into the search result
      and displays it.

      May throw an exception to the calling function.

      \param aData [optional] The data to load. If this is not provided, the data
              that was passed to the search result via the initial config is loaded.
    */
    //--------------------------------------------------------------------
    loadData : function (aData)
    //--------------------------------------------------------------------
    {
      checkParamNull (aData, "object");

      this._loadData (aData);
    },

    getGridControl : function ()
    {
      return this._getGridControl ();
    },

    getContextMenu : function ()
    {
      return this._getContextMenu ();
    }
  }
);

// Register the search result's xtype
Ext.reg("boc-searchResult", boc.ait.search.SearchResult);