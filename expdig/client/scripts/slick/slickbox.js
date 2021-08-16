/*
 * SlickBox 
 */

Ext.namespace("gdascola.ux");

/**
 * @class gdascola.ux.SlickBox
 * @extends Ext.BoxComponent
 * This class implements a component that wraps an instance of SlickGrid.<br />
 * @author GDa
 * @version 0.1
 * @constructor
 * Create a new SlickBox.
 * @param {Object} aConfig The configuration object
 * 
 */
gdascola.ux.SlickBox = function(aConfig) {

	// private variables
	var m_aGrid = null;
  var m_aStore = null;
  //var m_aFiltersChain = []; 
	
	// Properly set the autoEl configuration option fot the BoxComponent
	Ext.apply
  (
    this, 
    {
      autoEl : 
      {
        tag : "div",
        style : "height:100%"
      }
    }
  ); 

  /**
   * @cfg {Array} filtersChain An array of functions. Each function is a filter. 
   * Filters are applied one after another to each item of the grid. 
   * If all the filtering functions return true, the current item is displayed.
   */
  var m_aFiltersChain = aConfig.filtersChain || [];
	
  /**
   * @cfg {Ext.menu.Menu} contextMenu The Context Menu. 
   */
  var m_aContextMenu;
  if (aConfig.contextMenu !== null)
  {
    m_aContextMenu = aConfig.contextMenu;  
  }
  
  /**
   * @cfg {String} url The URL ot the remote data source.
   */
  var m_sUrl;
  if (aConfig.url !== undefined)
  {
    m_sUrl = aConfig.url;
  }
    
  /**
   * @cfg {Ext.data.JsonReader} jsonReader The data reader.
   */  
  var m_aJsonReader;  
  if (aConfig.jsonReader !== undefined)
  {
    m_aJsonReader = aConfig.jsonReader;   
  }
  
   
  /**
   * @cfg {Boolean} submitChanges If true, changes made by the user are 
   * submitted to the server. Default to false.
   */
  var m_bSubmitChanges;
  if (aConfig.submitChanges !== undefined)
  {
    m_bSubmitChanges = aConfig.submitChanges;
  }
  else
  {
    m_bSubmitChanges = false;
  }
	
	/**
	 * @cfg {Object} options Options for SlickGrid. 
	 */
  var m_aOptions; 
	if (aConfig.options !== undefined) 
  {
		m_aOptions = aConfig.options;
  }
	
	/**
	 * @cfg {Array} data The grid data. An array of objects. Each object is an item (a row) 
	 * of the grid. 
	 */	
	var m_aData = [];	
	if (aConfig.data !== undefined)
  {
		m_aData = aConfig.data;
  }
	
	/**
	 * @cfg {Array} columns The columns definition. 
	 */	
	var m_aColumnsDef = [];	
	if (aConfig.columns !== undefined)
  {
		m_aColumnsDef = aConfig.columns;
  }
		
	/**
	 * @cfg {Slick.Data.DataView} dataView A predefined DataView object. If this 
	 * option is not provided by the user, a DataView object is created by the 
	 * component during the render phase. 
	 */	
	var m_aDataView;	
	if(aConfig.dataView !== undefined)
  {
		m_aDataView = aConfig.dataView;
  }
		
	// Use "that" to reference "this" in a closure scope
	var that = this;	

  /*
   * The Main Filter
   * 
   * @argument {Object} aItem An item to filter
   * 
   * @return {Boolean} True if the item has to be displayed, false otherwise.
   * 
   */
  function mainFilter(aItem)
  {
    for(var i = 0; i < m_aFiltersChain.length; i++)
    {
      var aFilter = m_aFiltersChain[i];
      if(!aFilter(aItem))
      {
        return false;
      }
    }
    return true;
  }	
	
	/* 
	 * Protected method that returns the SlickGrid instance wrapped by the component.
	 * 
	 * @return {Slick.Grid} A SlickGrid instance.
	 * 
	 */	
	this._getGrid = function() 
	{
		return m_aGrid;
	};
	
	/*
	 * Getter method for the columns definition of the tree. 
	 * 
	 * @return A reference to the column defition of the tree
	 */	
	this._getColumns = function() 
	{
		return m_aGrid.getColumns();
	};

	/*
	 * Setter method for the columns definition of the grid. 
	 * 
	 * @argument aColumnsDef A columns definition
	 * 
	 */	
	this._setColumns = function(aColumnsDef) 
	{
		m_aGrid.setColumns(aColumnsDef);
	};
	
	/*
	 * Add a filter to the FiltersChain
	 * 
	 * @argument aFilter The Filter to add
	 * 
	 */
	this._addFilter = function(aFilter)
	{
		m_aFiltersChain.push(aFilter);
	};
	
  /*
   * 
   * Private method that submit changes made to a node
   * 
   * @argument aItem The modified item
   * @argument nCell The modified cell
   * 
   */
  function submitCellChanges(aItem, nCell)
  {
    // Get the name of the modified field
    var sFieldName = that.getColumns()[nCell].field;
      
    var aItemInfoObject = 
    {
      type: "edit",
      infos: { id: aItem.id, fieldName: sFieldName, fieldValue: aItem[sFieldName] }  
    };
      
    Ext.Ajax.request
    (
      {
        url: m_sUrl,
        jsonData: aItemInfoObject,
        success: function()
        {
          //console.log("Tree changes successfully submitted");
        }
      }
    );
  }	
  
	/*
	 * 
	 * Protected method that builds a grid.
	 * 
	 */	
	this._buildGrid = function() 
	{
    var groupItemMetadataProvider = null;
		// Initialize the model
		if (!m_aDataView)
		{			
			if (typeof Slick.Data.GroupItemMetadataProvider !== "undefined")
			{
        groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      
        m_aDataView = new Slick.Data.DataView
        (
          {
            groupItemMetadataProvider: groupItemMetadataProvider
          }
        );
			}
			else
		  {
        m_aDataView = new Slick.Data.DataView();
		  }
		}

    // Loading data from url
    if(aConfig.data === undefined && m_sUrl !== undefined)
    {
      if (m_aJsonReader === undefined)
      {
        // Define a reader 
        m_aJsonReader = new Ext.data.JsonReader();
      }

      // Define a Store
      m_aStore = new Ext.data.Store
      (
        {
          url: m_sUrl,
          reader: m_aJsonReader
        }
      );  
    } 
    
		// Initialize the grid
		m_aGrid = new Slick.Grid (this.el.dom, m_aDataView, m_aColumnsDef, m_aOptions);
		
		// Set the grouping information
		if (aConfig.groupingInformation)
    {
      m_aGrid.registerPlugin(groupItemMetadataProvider);
    }
      
    m_aGrid.onSelectedRowsChanged.subscribe
    (
      function (aEvt, aArgs)
      {
        that.fireEvent ("selectionchange", that, aArgs.rows, aEvt);
      }
    );
    
    m_aGrid.onDblClick.subscribe
    (
      function (aEvt, aArgs)
      {
        var nIdx = aArgs.row;
        var aItem = m_aDataView.getItem (nIdx);
        that.fireEvent("dblclick", that, nIdx, aItem, aEvt);
      }
    );
		
    m_aGrid.onBeforeEditCell.subscribe 
    (
      //! If the node is uneditable, the function returns false, true otherwise.
      function(aEvt, aArgs) 
      {
        if (aArgs.item.editable === false)
        {
          return false;
        }
        else
        {
          return true;
        }
      }
    );
     
    m_aGrid.onCellChange.subscribe (
       //! Update the data view and submit changes.
       function(e, args)
       {
         m_aDataView.updateItem(args.item.id, args.item);
          
         if(m_bSubmitChanges)
         {           
           submitCellChanges(args.item, args.cell);
         }
       }
    );		

		// Update the DataView
		m_aDataView.beginUpdate();
    m_aDataView.setItems(m_aData);
    m_aDataView.setFilter(mainFilter);
    
    // Grouping functionality for the LiveGrid
    if (aConfig.groupingInformation)
    {
      m_aDataView.groupBy
      (
        aConfig.groupingInformation.field,
        aConfig.groupingInformation.formatterFn,
        aConfig.groupingInformation.sortFn
      );
    }
    
    m_aDataView.endUpdate();
		
		// Unbind handlers for drag and drop events		
		var aCanvas = $("div.grid-canvas", this.getEl().dom);
    aCanvas.unbind("draginit dragstart dragend drag");
   
    // Context menu functionality
    if(m_aContextMenu !== undefined)
    {
      m_aGrid.onContextMenu.subscribe
      (
        //! On right click on a cell show a context menu
        function (aEvt, aArgs)
        {
          var aCell = m_aGrid.getCellFromEvent(aEvt);
      
          if (!aCell)
          {
            return false;
          }
        
          var nCell = aCell.cell;
          var nRow = aCell.row;
          //var aItem = m_aDataView.getItem(nRow);

          var aCellNode = m_aGrid.getCellNode(nRow, nCell);
          if (!Ext.get(aCellNode).hasClass("selected"))
          {
            // If the right-clicked cell is not selected select it
            m_aGrid.setSelectedRows([nRow]);          
          }
        
          // Set the clicked cell as active cell
          m_aGrid.setActiveCell(nRow, nCell);
               
          var aSelectedRows = m_aGrid.getSelectedRows();
          var aSelectedItems = [];
        
          for (var i = 0; i < aSelectedRows.length; i++)
          {
            var aItem = m_aDataView.getItemByIdx(aSelectedRows[i]);
            aSelectedItems.push(aItem);
          }
        
          if(m_aContextMenu)
          { 
             m_aContextMenu.contextRecords = aSelectedItems;
             m_aContextMenu.showAt([aEvt.clientX, aEvt.clientY]);
          }        
        
          aEvt.preventDefault();
          return true;
        }
      );
    }
   
    // Wire up model events to drive the grid
    m_aDataView.onRowCountChanged.subscribe(
      function(e, args) 
      {
          m_aGrid.updateRowCount();
          m_aGrid.render();
      }
    );

    m_aDataView.onRowsChanged.subscribe(
      function(e, args) 
      {
          m_aGrid.invalidateRows(args.rows);
          m_aGrid.render();
      }
    );
	};
	
  /*
   * Protected method that returns true if the submitChanges option is set to true, false otherwise. 
   * 
   * @return Boolean The boolean value of the submitChanges config option
   * 
   */
  this._areChangesSubmitted = function()
  {
    return m_bSubmitChanges;
  };

  /*
   * Protected method that returns the Url of the data server. 
   * 
   * @return String The Url of the data server
   * 
   */  
  this._getUrl = function()
  {
    return m_sUrl;
  };
  
  /*
   * Protected nethod that returns the Store. 
   * 
   * @return String The Store.
   * 
   */  
  this._getStore = function()
  {
    return m_aStore;
  };  
  
  /*
   * Protected method that set the data
   * 
   * @argument aData An array of data (items)
   * 
   */
  this._setData = function(aData)
  {
    m_aData = aData;

    m_aDataView.beginUpdate ();
    m_aGrid.invalidateAllRows ();
    m_aDataView.setItems(m_aData);
    m_aDataView.endUpdate();
    m_aGrid.render();
  };

  /*
   * Protected method that returns the data (items)
   * 
   * @return An array of data
   * 
   */  
  this._getData = function()
  {
    return m_aDataView.getItems();
  };

  this._updateItem = function(aItem)
  {
    m_aDataView.updateItem(aItem.id, aItem);
  };  
  
  /*
   * Protected method that returns the DataView
   * 
   * @return {array} The DataView
   * 
   */
  this._getDataView = function()
  {
    return m_aDataView;
  };
  
  this._addItem = function (aItem)
  {
    m_aDataView.addItem (aItem);
  };
  
  this._getSelectedItems = function ()
  {
    var aSelRows = m_aGrid.getSelectedRows ();
    
    var aItems = [];
    for (var i = 0; i < aSelRows.length;++i)
    {
      aItems[i] = m_aDataView.getItem (aSelRows[i]);
    }
    return aItems;
  };
  
  this._removeItems = function (aItems)
  {
    m_aDataView.beginUpdate ();
    for (var i = 0; i < aItems.length;++i)
    {
      m_aDataView.deleteItem (aItems[i].id);
    }
    m_aDataView.endUpdate ();
    var aSelRows = m_aGrid.getSelectedRows ();
    if (aSelRows && !m_aGrid.getData()[aSelRows[0]])
    {
      m_aGrid.setSelectedRows([]);
    }
  };
  
  this._getItemById = function (sId)
  {
    if (!m_aDataView)
    {
      return null;
    }
    var aItem = m_aDataView.getItemById (sId);
    if (!aItem)
    {
      return null;
    }

    return aItem;
  };
  
	// Invoke the superclass (BoxComponent) constructor
	gdascola.ux.SlickBox.superclass.constructor.call(this, aConfig);
  
  this._onDestroy = function ()
  {
    if (m_aGrid)
    {
      m_aGrid.destroy ();
    }
  };
};


Ext.extend
(
  gdascola.ux.SlickBox, Ext.BoxComponent, 
  {
    /** 
    * This method returns the SlickGrid object wrapped by the SlickBox component.
    * 
    * @return {Slick.Grid} A SlickGrid object.
    * 
    */ 
    getGrid : function() 
    {
      return this._getGrid();
    },
    
    /**
    * This method returns the current DataView.
    *  
    * @return {Slick.Data.DataView} The current DataView.
    */
    getDataView : function()
    {
      return this._getDataView();
    },

    /**
    * This method returns the columns definition of the grid. 
    * 
    * @return {Array} The columns defition of the grid.
    * 
    */
    getColumns : function() 
    {
      return this._getColumns();
    },

    /**
     * This method sets the columns definition of the grid.
     *  
     * @param {Array} aColumnsDef A columns definition.
     */
    setColumns : function(aColumnsDef) 
    {
      return this._setColumns(aColumnsDef);
    },			
    
    /**
     * This method returns true if the component submits the changes to the server.
     * 
     * @return {Boolean} True if the component submits the changes to the server.
     */
    areChangesSubmitted : function()
    {
       return this._areChangesSubmitted();
    },			
     
    /**
     * This method returns the URL of the remote data source.
     * 
     * @return {String} The URL of the remote data source.
     */  
    getUrl : function()
    { 
      return this._getUrl();
    },  
      
    /**
     * This method returns the Store object used to retrieve and store the data. 
     * 
     * @return {Ext.data.Store} The Store object used to retrieve and store the data.
     * 
     */  
    getStore : function()
    {
       return this._getStore();
    }, 
        
    /**
     * This method adds a filter to the Filters Chain.
     * 
     * @param {Function} aFilter The Filter to add. 
     */
    addFilter : function(aFilter)
    {
       return this._addFilter(aFilter);
    },

    /**
     * Set the data for the grid.
     * 
     * @param {Array} aData An array of objects where each object 
     * is an item (a row) of the grid.
     */
    setData : function(aData)
    {
        return this._setData(aData);   
    },

    /**
     * This method returns the data stored by the grid. 
     * 
     * @return {Array} An array of objects where each object 
     * is an item (a row) of the grid. 
     */
    getData : function()
    {
      return this._getData();
    },

    /**
    * This method updates a data item of the grid. 
    * 
    * @param {Object} aItem An item to update. 
    */
    updateItem : function(aItem)
    {
        return this._updateItem(aItem);
    },
    
    /* 
    * Override the onRender method of the BoxComponent.
    */
    onRender : function() 
    {
      // Invoke the onRender function of the BoxComponent
      gdascola.ux.SlickBox.superclass.onRender.apply(this, arguments);

      // Let's build the grid
      this._buildGrid();

      // Fix for CR #052197 - Prevent the default behavior when pressing one of the arrow keys
      this.getEl().on("keydown", function (aEvt)
        {
          switch (aEvt.keyCode)
          {
            case 0:
            case 37:
            case 38:
            case 39:
            case 40:
              aEvt.preventDefault();
              aEvt.stopPropagation ();
              break;
          }
        }
      );
      
      // Get a reference to the panel that holds the box
      //var container = gdascola.ux.SlickBox.superclass.findParentByType.call(this, "container");
      var container = this.ownerCt;
      var aGrid = this._getGrid();
      container.on("afterlayout", function() 
        {
          // If we have a grid, force a resize of the canvas
          // and the grid columns
          if (aGrid) 
          {
            // In Firefox, we have to first resize the
            // canvas, then autosize the columns
            // In IE, autosizing the columns is sufficient
            if (Ext.isGecko) 
            {
              aGrid.resizeCanvas();
            }
            aGrid.autosizeColumns();
          }
        }
      );
    },
    
    /*
    * Override the onDestroy method of the BoxComponent.
    */
    onDestroy : function()
    {
      this._onDestroy ();
      gdascola.ux.SlickBox.superclass.onDestroy.apply(this, arguments);
    },
    
    addItem : function (aItem)
    {
      this._addItem (aItem);
    },
    
    getSelectedItems : function ()
    {
      return this._getSelectedItems ();
    },
    
    removeItems : function (aItems)
    {
      this._removeItems (aItems);
    },

    getItemById : function (sId)
    {
      return this._getItemById (sId);
    }
  }
);

// Assign to the SlickBox an xtype name for lazy instantiation
Ext.reg('slickbox', gdascola.ux.SlickBox);
