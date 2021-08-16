/*
 * LiveGrid
 * 
 */
 
Ext.namespace("gdascola.ux"); 

/**
 * @class gdascola.ux.LiveGrid
 * @extends gdascola.ux.SlickBox
 * LiveGrid is a grid component to represent data in a tabular format of rows and columns. 
 * @author GDa
 * @version 0.1
 * @constructor
 * Create a new LiveGrid.
 * @param {Object} aConfig The configuration object
 * 
 */
gdascola.ux.LiveGrid = function(aConfig) {
  
	// private variables
  var m_aDataView = new Slick.Data.DataView();
  var m_sSortField;
  var m_nSortMod;
  
  // Options for SlickGrid  
  if (!aConfig.options)
  {
    aConfig.options = {};
  }
  
  /**
   * @cfg {Boolean} forceFitColumns Specify true to have the column 
   * widths re-proportioned at all times. Default to true.
   */
  if(aConfig.forceFitColumns === undefined)
  {
    aConfig.options.forceFitColumns = true;
  }
  else
  {
    aConfig.options.forceFitColumns = aConfig.forceFitColumns;
  }

  /**
   * @cfg {Boolean} enableCellNavigation If true, keyboard navigation is enabled. 
   * Default to true.
   */
  if(aConfig.enableCellNavigation === undefined)
  {
    aConfig.options.enableCellNavigation = true;
  }
  else
  {
    aConfig.options.enableCellNavigation = aConfig.enableCellNavigation;
  }

  /**
   * @cfg {Boolean} enableColumnReorder If true, users are allowed to reorder the columns.
   * Default to false.
   */
  if(aConfig.enableColumnReorder === undefined)
  {
    aConfig.options.enableColumnReorder = false;
  }
  else
  {
    aConfig.options.enableColumnReorder = aConfig.enableColumnReorder;
  }
    
  /**
   * @cfg {Boolean} editable If true, users are allowed to modify cell values.
   * Default to false.
   */
  if(aConfig.editable === undefined)
  {
    aConfig.options.editable = false;
  }
  else
  {
    aConfig.options.editable = aConfig.editable;
  }
    
  /**
   * @cfg {Boolean} autoEdit If true, when a cell is selected the edit mode for that
   * cell is automatically activated. Default to false.
   */
  if(aConfig.autoEdit === undefined)
  {
    aConfig.options.autoEdit = false;
  }
  else
  {
    aConfig.options.autoEdit = aConfig.autoEdit;
  }
  
  // END options for SlickGrid  

  // Use that object to refer this   
  var that = this;   
    
  /*
   * Callback invoked right after data are loaded from the server
   * 
   * @param aRecords Array of loaded records
   * @param aOptions Options object from the load call
   * @param bSuccess Boolean success indicator
   * 
   */
  function insertItems(aRecords, aOptions, bSuccess)
  {
    var aItems = [];
    for(var i = 0; i < aRecords.length; i++)
    {
      var aDataRecord = aRecords[i].data;       
      aItems.push(aDataRecord);
    }
    
    m_aDataView.beginUpdate();
    m_aDataView.setItems(aItems);
    m_aDataView.endUpdate();
      
    var aOwner = this.ownerCt;
    aOwner.body.unmask();
  }      
    
  /*
   * Comparer function for the sorting functionality
   */
  function comparer(a,b) {
    var x = a[m_sSortField], y = b[m_sSortField];
    return (x == y ? 0 : (x > y ? 1 : -1));
  }
    
  /*
   * This method sorts the grid
   */
  this._doLiveGridSort = function(aItems)
  {
      
    var bAscending;

    if (m_nSortMod === -1)
    {
      bAscending = false;
    }
    if (m_nSortMod === 1)
    {
      bAscending = true;
    }       

    m_aDataView.sort(comparer, bAscending);
  };
  
  // onSort event handler
  this._onSortHandler = function(aEvt, aArgs) 
  {      
    m_nSortMod = aArgs.sortAsc ? 1 : -1;
    m_sSortField = aArgs.sortCol.field;
           
    that._doLiveGridSort(m_aDataView.getItems());      
  };
  
  /*
   * Protected method that builds a tree.
   * 
   * @param aGrid A reference to the grid encapsulated by the SlickBox component
   */ 
  this._buildLiveGrid = function(aGrid) 
  {
    // Get a reference to the DataView
    m_aDataView = aGrid.getData();    
    
    // Add the others filters
    /*for(var i = 0; i < m_aGridFiltersChain.length; i++)
    {
      this.addFilter(m_aGridFiltersChain[i]);
    }*/
    
    // Loading data from url
    var sUrl = this.getUrl();
    if(aConfig.data === undefined && sUrl !== undefined)
    {
     
      // Set the options for the load method called on the Store
      var sType = "loadonce";
      
      var aOptions = 
      {
        params: 
        { 
          type: sType
        },
        callback: insertItems,
        scope: this,
        add: false
      };
     
      // Load the data from the given url
      var aStore = this.getStore();
      aStore.load (aOptions);
      
      // Show the loading mask
      var aOwner = this.ownerCt;
      aOwner.body.mask(getString("ait_loading"), "x-mask-loading");      
    }   
  
    // Set the selection model
    aGrid.setSelectionModel(new Slick.RowSelectionModel());
    
    // Bind onSortHandler to the onSort event
    aGrid.onSort.subscribe(this._onSortHandler);
  };    
  
  // Invoke the superclass constructor
  gdascola.ux.LiveGrid.superclass.constructor.call(this, aConfig);
    
};

// The class gdascola.ux.LiveTree entends the class gdascola.ux.SlickBox
Ext.extend(gdascola.ux.LiveGrid, gdascola.ux.SlickBox, {

      /*
       * Override the onRender method of SlickBox.
       */
      onRender : function()
      {
        // Invoke the superclass onRender method
        gdascola.ux.LiveGrid.superclass.onRender.apply(this, arguments);

        // Get an instance of the slick grid encapsulated in the SlickBox component
        var aGrid = this.getGrid();
       
        // Let's build the live grid
        this._buildLiveGrid(aGrid);
      },

      /*
       * Ovverride the destroy method of SlickBox.
       */
      onDestroy : function() 
      {     
        var aGrid = this.getGrid();
        
        // Unbind event handlers
        aGrid.onSort.unsubscribe(this._onSortHandler);  
        
        gdascola.ux.LiveGrid.superclass.onDestroy.apply(this, arguments);
      },
      
      /**
       * This method refreshes the Grid. Data are reloaded from the remote source.
       */
      refreshGrid : function()
      {
        return this._refreshGrid();
      }
});

// Bind the new class to an xtype to allow lazy instantiation
Ext.reg('livegrid', gdascola.ux.LiveGrid);
