/*
 * LiveTree 
 */

Ext.namespace("gdascola.ux");

/**
 * @class gdascola.ux.LiveTree 
 * @extends gdascola.ux.SlickBox
 * LiveTree provides tree-structured graphical representation of tree-structured data. 
 * @author GDa
 * @version 0.1
 * @constructor
 * Create a new LiveTree.
 * @param {Object} aConfig The configuration object
 */
gdascola.ux.LiveTree = function(aConfig) 
{
	// private variables
	var m_aGrid;
	var m_aDataView = new Slick.Data.DataView();
	var m_aFormatter;
	var m_nSortMod; // sorting mode: 1 Ascending, -1 Descending
	var m_sSortField; 
	 
	/**
	 * @cfg {Boolean} lazyLoading If true, children of a folder are retrieved once from the remote source 
	 * only when that folder is actually expanded by the user. Default to false.
	 */
	var m_bLoadOnce;
	if (aConfig.lazyLoading !== undefined)
  {
    m_bLoadOnce = !aConfig.lazyLoading;
  }
	else 
  {
    m_bLoadOnce = true;
  }
	 
	// If a custom reader isn't specified, a reader for the default tree is defined
  if(aConfig.jsonReader === undefined)
  {
    aConfig.jsonReader = new Ext.data.JsonReader
    (
      {
        idProperty: 'id',
        root: 'payload',
        totalProperty: 'totalrows',
    
        fields: 
        [
          {name: 'id', mapping: 'id'},
          {name: '_parent', mapping: '_parent'},
          {name: 'indent', mapping: 'indent'},
          {name: '_is_leaf', mapping: '_is_leaf'},
          {name: '_is_empty', mapping: '_is_empty'},
          {name: 'editable', mapping: 'editable'},
          {name: 'title', mapping: 'title'},
          {name: 'iconUrl', mapping: 'iconUrl'}
        ]       
      }
    );
  }	 
		 
	// Fields values for the default column
	var m_sColumnId;
	var m_sColumnName;
	var m_sColumnField;
	var m_sColumnCssClass;
	var m_bSortable;
  // END declaring fields value for the default column
	
	// Set the fields values of the default column
	
	/**
	 * @cfg {String} columnId The id of the column (Default Tree). This option should be 
	 * specified only when the default tree is used. Default to "title".
	 */
	if (aConfig.columnId !== undefined)
  {
		m_sColumnId = aConfig.columnId;
  }
	else
  {
		m_sColumnId = "title";
  }

	/**
	 * @cfg {String} columnName The column name showed in the column header (Default Tree). This option should be 
   * specified only when the default tree is used. Default to "Title".
	 */
	if (aConfig.columnName !== undefined)
  {
		m_sColumnName = aConfig.columnName;
  }
	else
  {
		m_sColumnName = "Title";
  }
 
	/**
   * @cfg {String} columnField The name of the field of the data store containing the values for the tree column (Default Tree). This option should be 
   * specified only when the default tree is used. Default to "title".
	 */	
	if (aConfig.columnField !== undefined)
  {
		m_sColumnField = aConfig.columnField;
  }
	else
  {
		m_sColumnField = "title";
  }

  /**
   * @cfg {String} columnCssClass A CSS class name used to style the column (Default Tree). This option should be 
   * specified only when the default tree is used. Default to "cell-title".
   */
	if (aConfig.columnCssClass !== undefined)
  {
		m_sColumnCssClass = aConfig.columnCssClass;
  }
	else
  {
		m_sColumnCssClass = "cell-title";
  }
		
	/**
	 * @cfg {Boolean} sortable If true, the user is allowed to sort the tree (Default Tree). This option should be 
   * specified only when the default tree is used. Default to true.
	 */
	if (aConfig.sortable !== undefined)
  {
		m_bSortable = aConfig.sortable;
  }
	else
  {
		m_bSortable = true;
  }
		
	/**
	 * @cfg {String} closedFolderIconUrl Path to the icon for the closed folders (Default Tree). This option should be 
   * specified only when the default tree is used.
	 */
	var m_sClosedFolderIconUrl = "./images/folder-closed.png";
	if(aConfig.closedFolderIconUrl !== undefined)
  {
		m_sClosedFolderIconUrl = aConfig.closedFolderIconUrl;
  }

  /**
   * @cfg {String} openFolderIconUrl Path to the icon for the open folders (Default Tree). This option should be 
   * specified only when the default tree is used.
   */
	var m_sOpenFolderIconUrl = "./images/folder-open.png";
	if (aConfig.openFolderIconUrl !== undefined)
  {
		m_sOpenFolderIconUrl = aConfig.openFolderIconUrl;		
  }
	// END setting fields values for the default column
		
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
		
  /**
   * @cfg {Boolean} enableDD If true, Drag'n'Drop is enabled. 
   */
	var m_bEnableDD;	
	if(aConfig.enableDD === undefined)
  {
    m_bEnableDD = true;
  }
	else
  {
    m_bEnableDD = aConfig.enableDD;	
  }
		
	/*
	 * Default formatter for the tree columns.
	 * 
	 * @param nRow The row number
	 * @param nCell The cell number
	 * @param aValue The value of the name field of the column
	 * @param aColumnDef The columns definition 
	 * @param aNode A node of the tree
	 * 
	 * @return A format for the column
	 */	
	var m_aDefaultTreeFormatter = function(nRow, nCell, aValue, aColumnDef,	aNode) 
	{
		var sSpacer = "<span style='display:inline-block;height:1px;width:"	+ (15 * aNode.indent) + "px'></span>";
		var sSrc = Ext.BLANK_IMAGE_URL;
		
		// If the current record is not editable, we want to overlay its icon with a lock
    if (!aNode.editable)
    {
      sSrc = './images/lock.gif';
    }

		if (!aNode._is_leaf) 
    {
			if (aNode._is_empty === true)
			{
				return sSpacer + " <span class='toggle'></span><img id='folder_icon' height='0' style='position:relative; top:3px; left:3px; display:inline-block;width:16px;height:18px;background:url(" + m_sClosedFolderIconUrl + ") center center transparent no-repeat;' src='"+sSrc+"'>&nbsp;</img>&nbsp;"+aValue;
			}
			if (aNode._collapsed)
			{
				// If a node is not a leaf and is collapsed a folder icon and a plus sign will be displayed
				//return sSpacer + " <span class='toggle expand'>&nbsp;</span><img id='folder_icon' height='0' style='position:relative; top:3px; display:inline-block;width:16px;height:18px;background:url(images/folder.gif) center center transparent no-repeat;' src='"+sSrc+"'>&nbsp;</img>&nbsp;"+aValue;
				return sSpacer + " <span class='toggle expand'></span><img id='folder_icon' height='0' style='position:relative; top:3px; left:3px; display:inline-block;width:16px;height:18px;background:url(" + m_sClosedFolderIconUrl + ") center center transparent no-repeat;' src='"+sSrc+"'>&nbsp;</img>&nbsp;"+aValue;
			}			
			else
			{
				// If a nod is not a leaf and is expandend a folder icon and a minus sign will be displayed
				return sSpacer + " <span class='toggle collapse'></span><img id='folder_icon' height='0' style='position:relative; top:3px; left:3px; display:inline-block;width:16px;height:18px;background:url("+ m_sOpenFolderIconUrl +") center center transparent no-repeat;' src='"+sSrc+"'>&nbsp;</img>&nbsp;"+aValue;
			}
		} 
		else
		{
			// If a node is a leaf its specific icon will be displayed
			return sSpacer + " <span class='toggle'></span><img height='0' style='position:relative; top:3px; left:3px; display:inline-block;width:16px;height:18px;background:url(" + aNode.iconUrl + ") center center transparent no-repeat;' src='"+sSrc+"'>&nbsp;</img>&nbsp;"+aValue;
		}
	};

	/*
	 * Default filter for the tree.
	 * 
	 * @param aItem An item (a node of the tree)
	 */
	var m_aDefaultTreeFilter = function(aItem) 
	{
		if (aItem._parent !== null) 
    {
			var aParent = m_aDataView.getItemById(aItem._parent);
			
      while (aParent) 
      {
				if (aParent._collapsed)
        {
					return false;
        }

				aParent = m_aDataView.getItemById(aParent._parent);
			}
		}
    
		return true;
	};
	
	// Set the TreeFilter
  if (!aConfig.filtersChain)
  {
    aConfig.filtersChain = [];
    aConfig.filtersChain.push(m_aDefaultTreeFilter);
  }
  else
  {
    aConfig.filtersChain.splice(0, 0, m_aDefaultTreeFilter);
  }
  
	// Set the default column formatter
	if (aConfig.formatter === undefined) 
  {
		m_aFormatter = m_aDefaultTreeFormatter;
	} 
  else 
  {
		m_aFormatter = aConfig.formatter;
	}

	// Define the default column for the tree
	var m_aDefaultTreeColumn = 
  [
    {
      id : m_sColumnId,
      name : m_sColumnName,
      field : m_sColumnField,
      cssClass : m_sColumnCssClass,
      formatter : m_aFormatter,
      sortable : m_bSortable,
      editor:TextCellEditor
    }
  ];
  
  /*
	 * Comparer function needed by the sorting algorithm
	 * 
	 * @param aFirstNode An item (a node of the tree)
	 * @param aSecondNode An item (a node of the tree)
	 * 
	 * @return  a negative number if aFirstNode should come before aSecondNode, 
	 *          a zero if aFirstNode and aSecondNode are equal
	 *          a positive number if aFirstNode should come after aSecondNode
	 * 
	 */
	function comparer(aFirstNode, aSecondNode)
  {
    if (aFirstNode.indent !== aSecondNode.indent)
    {
      return (aFirstNode.indent - aSecondNode.indent) * m_nSortMod;
    }
    if (!aFirstNode._is_leaf && aSecondNode._is_leaf)
    {
      return -1 * m_nSortMod;
    }
    else if (aFirstNode._is_leaf && !aSecondNode._is_leaf)
    {
      return 1 * m_nSortMod;
    }

    var s1,s2;
    s1 = aFirstNode[m_sSortField];//.toLowerCase();
    s2 = aSecondNode[m_sSortField];//.toLowerCase();
      
    var str1, str2;
    if (typeof s1 === "object")
    {
      str1 = s1.val;
    }

    if (typeof s2 === "object")
    {
      str2  = s2.val;
    }

    if (typeof s1 === "string")
    {
      str1 = (''+s1).toLowerCase();
      str2 = (''+s2).toLowerCase();
    }

    return str1 > str2 ? 1 : (str1 < str2 ? -1 : 0);
  }

	// If the user doesn't passes in his own columns definition, use the default tree column
	if (aConfig.columns === undefined)
  {
		aConfig.columns = m_aDefaultTreeColumn;
  }

  // Use that object to refer this 
  var that = this;

  /*
	 * Implementation of the sorting algorithm
	 * 
	 * @param aItems The tree data
	 * 
	 */
  this._doLiveTreeSort = function(aItems)
  {
    function getTreeStructure (aParent, nItemIdx, nParentIdx, aRecords)
    {
      for (var i = nItemIdx; i < aItems.length;++i)
      {
        if (aItems[i]._parent === aParent.id)
        {
          aItems[i].indent = aParent.indent+1;
          aRecords.push (aItems[i]);
          if (aItems[i]._is_leaf || aItems[i]._empty)
          {
            continue;
          }
          getTreeStructure (aItems[i], i, aRecords.length-1, aRecords);
        }
      }
    }

    var aRecords = [];
    //if (typeof data !== "undefined" && data.sortAsc === false)
    if (m_nSortMod === -1)
    {
        aItems.reverse();
    }

    try 
    {
      aItems.sort(comparer);
    }
    catch(e) 
    {
      alert(e.message);
    }

    if (m_nSortMod === -1)
    {
      aItems.reverse();
    }

    for (var i = 0; i < aItems.length;++i)
    {
      if (aItems[i].indent === 0)
      {
        aRecords.push (aItems[i]);
        getTreeStructure (aItems[i], i, aRecords.length-1, aRecords);
      }
    }

    m_aDataView.beginUpdate();
    m_aDataView.setItems(aRecords, "id");
    m_aDataView.endUpdate();
  };
  
  // onClick Event Handler: expand or collapse a node when the user click on it
  this._onClickHandler = function(e, args)
  {
    if ($(e.target).hasClass("toggle")) 
    {
      var item = m_aDataView.getItem(args.row);
      var bWasCollapsed = item._collapsed;
      if (item) 
      {
        if (!item._collapsed)
        {
          item._collapsed = true;
        }
        else
        {
          item._collapsed = false;
        }
        
        m_aDataView.beginUpdate();  
        m_aDataView.updateItem(item.id, item);
        m_aDataView.endUpdate();
      }
      
      // Load the children of the clicked node                   
      if ( that.getUrl() !== undefined && !m_bLoadOnce && !item._loaded && !item._is_empty && bWasCollapsed)
      {
        that._loadNode(item.id);
      }
      
      e.stopImmediatePropagation();
    }
  };
    
  // onSort Event Handler: sort the tree when the user click on a sortable column
  this._onSortHandler =  function(e, data)
  { 
    m_nSortMod = data.sortAsc ? 1 : -1;
    m_sSortField = data.sortCol.field;

    that._doLiveTreeSort(m_aDataView.getItems());
  };
  
  /*
   * Callback invoked after data are loaded from the remote store
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
      var aNode = aRecords[i].data;
      if(!aNode._is_leaf && !aNode._is_empty)
      {
        aNode._collapsed = true;
        if(aOptions.params.type == "lazy")
        {
          aNode._loaded = false;
        }
      }
      if(!aNode._is_leaf && aNode._is_empty)
      {
        aNode._collapsed = false;
        if(aOptions.params.type == "lazy")
        {
          aNode._loaded = true;
        }
      }
      
      aItems.push(aNode);
    }
  
    m_aDataView.beginUpdate();
    m_aGrid.invalidateAllRows();
    m_aDataView.setItems(aItems);
    m_aDataView.endUpdate();
    m_aGrid.render();
    
    if(m_nSortMod !== "undefined")
    {
      that._doLiveTreeSort(m_aDataView.getItems());
    }
    
    var aOwner = this.ownerCt;
    aOwner.body.unmask();
  }
  
  /*
   * Protected method to refresh the tree (reload data from the remote store)
   */
  this._refreshTree = function()
  {
    // Loading data from url
    var sUrl = this.getUrl();
    if(aConfig.data === undefined && sUrl !== undefined)
    {
      // Set the options for the load method called on the Store
      var sType;
      if (m_bLoadOnce === true)
      {
        sType = "loadonce";
      }
      else
      {
        sType = "lazy";  
      }
      
      var options = 
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
      aStore.load(options);
      
      // Show the loading mask
      var aOwner = this.ownerCt;
      aOwner.body.mask("Loading...", "x-mask-loading");
    }
  };
  
	/*
	 * Protected method that builds a tree.
	 * 
	 * @param aGrid A reference to the grid encapsulated by the SlickBox component
	 */	
  this._buildTree = function (aGrid) 
  {    
    m_aGrid = aGrid;
    
    // Get a reference to the DataView
    m_aDataView = aGrid.getData();
        
    // Loading data from url
    var sUrl = this.getUrl();
    if (aConfig.data === undefined && sUrl !== undefined)
    {
     
      // Set the options for the load method called on the Store
      var sType;
      if (m_bLoadOnce === true)
      {
        sType = "loadonce";
      }
      else
      {
        sType = "lazy";  
      }
      
      var options = 
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
      aStore.load(options);
      
      // Show the loading mask
      var aOwner = this.ownerCt;
      aOwner.body.mask("Loading...", "x-mask-loading");      
    }
  
    // Set selection model (RowSelectionModel)
    aGrid.setSelectionModel(new Slick.RowSelectionModel());
    
    /*
     * Callback invoked when the children of a loaded node have to be added to the tree
     * 
     * @param aRecords An Array of Records loaded
     * @param aOptions Options object from the load call
     * @param bSuccess Boolean success indicator
     * 
     */
    function insertChildren(aRecords, aOptions, bSuccess)
    {
      var aChildren = [];
      
      // Peraphs the parent node was dropped elsewhere before loading. We have to update the children indentation.
      // If the parent node wasn't dropped elsewhere, the update operation takes no effect.
      var aOldParentNode = aRecords[0].data;
      var nOldParentIndent = aOldParentNode.indent;
      
      var aNewParentNode = m_aDataView.getItemById(aOldParentNode.id);
      var nNewParentIndent = aNewParentNode.indent;
      var nNewParentIdx = m_aDataView.getIdxById(aOldParentNode.id);
      
      var i = 0;
      
      for(i = 1; i < aRecords.length; i++)
      {
        var aNode = aRecords[i].data;
        aNode.indent = (aNode.indent - nOldParentIndent) + nNewParentIndent;
        if(!aNode._is_leaf && !aNode._is_empty)
        {
          aNode._collapsed = true;
          aNode._loaded = false;
        }
        if(!aNode._is_leaf && aNode._is_empty)
        {
          aNode._collapsed = false;
          if(aOptions.params.type == "lazy")
          {
            aNode._loaded = true;
          }
        }        
      
        aChildren.push(aNode);
      }
    
      for(i = 0; i < aChildren.length; i++)
      {
        m_aDataView.insertItem(nNewParentIdx + 1 + i, aChildren[i]);
      }
        
      aNewParentNode._loaded = true;
      m_aDataView.updateItem(aNewParentNode.id, aNewParentNode);
      
      if (m_nSortMod !== undefined)
      {
        that._doLiveTreeSort(m_aDataView.getItems());
      }           
    }
    
    /*
     * Protected method that loads a node
     * 
     * @param sNodeId The id of the node to be loaded
     * 
     */
    this._loadNode = function(sNodeId)
    {
      // Set the options for the load method called on the Store
      var options = 
      {
        params: 
        { 
          type: "lazy",
          id: sNodeId
        },
        callback: insertChildren,
        scope: this,
        add: false
      };
      
      var aStore = this.getStore();
      aStore.load(options);
      
      // Show the spinning wheel 
      var nRow = m_aDataView.getRowById(sNodeId);
      var aCell = aGrid.getCellNode(nRow, 0);
      var aImg = $("#folder_icon", aCell);
      aImg[0].setAttribute("src", Ext.BLANK_IMAGE_URL);
      aImg.addClass('folder-loading');
    };
        
    // Bind the onClick event to onCLickHandler
    aGrid.onClick.subscribe(this._onClickHandler);
    
    // Bind the onSort event to onSortHandler
    aGrid.onSort.subscribe(this._onSortHandler);	
    
    // Add Drag and Drop functionality to the tree
    if (m_bEnableDD)
    {
      // Let's link a drag zone to the tree
      // sTextField is the field of the dataset linked to the first column. Usually it contains 
      // the "name" of each node and this name will be displayed in the proxy for each dragged row
      var sTextField = (this.getColumns())[0].field;
      var aEl = gdascola.ux.SlickBox.superclass.getEl.call(this);
      new gdascola.ux.dd.LiveTreeDragZone (aEl.dom, 
        {
          ddGroup : 'treeGroup',
          scroll : false,
          grid: aGrid,
          textField: sTextField
        }
      );
      
      // Let's link a drop target to the tree
      new gdascola.ux.dd.LiveTreeDropTarget (aEl.dom, 
        {
          ddGroup : 'treeGroup',
          overClass : 'dd-over',
          livetree: this,
          grid: aGrid
        }
      );
    }
  };
	
	/*
   * Protected method that returns a sub-tree given the node id of the sub-tree root
   *
   * @param sNodeId: The id of the sub-tree root node
   *
   * @return The sub-tree (an array of nodes)
   *
   */
  this._getSubTree = function(sNodeId)
  {
    var aSubTree = [];
    var aRootNode = m_aDataView.getItemById(sNodeId);
    aSubTree.push(aRootNode);
    var aItems = m_aDataView.getItems();
    if(aItems.length > 0)
    {			
      for(var i = m_aDataView.getIdxById(sNodeId) + 1; i < aItems.length; i++)
      {	
        if(aItems[i].indent > aRootNode.indent) 
        {
          aSubTree.push(aItems[i]);
        }
        else
        {
          break;
        }
      }
      
    }
    return aSubTree;
  }; 

  /*
   * Protected method that returns the sorting metod
   * 
   * @return Number The sorting method
   */
  this._getSortMod = function()
  {
    return m_nSortMod;
  };

  /*
   * Protected method that returns the sorting field
   * 
   * @return String The sorting field
   */
  this._getSortField = function()
  {
    return m_sSortField;
  };

  /*
   * Protected method that returns True if we are loading all the data at once, False otherwise
   */
  this._getLoadOnce = function()
  {
    return m_bLoadOnce;
  };
   
  // Invoke the superclass constructor
  gdascola.ux.LiveTree.superclass.constructor.call(this, aConfig);
};

// The class gdascola.ux.LiveTree entends the class gdascola.ux.SlickBox
Ext.extend (gdascola.ux.LiveTree, gdascola.ux.SlickBox, 
{
  /*
   * Override the onRender function of SlickBox.
   */
  onRender : function()
  {
    // Invoke the superclass onRender method
    gdascola.ux.LiveTree.superclass.onRender.apply(this, arguments);

    // Get an instance of the slick grid encapsulated in the SlickBox component
    var aGrid = this.getGrid();
   
    // Let's build the tree
    this._buildTree(aGrid);
  },

  /* 
   * Ovverride the destroy function of SlickBox.
   */
  onDestroy : function() 
  {			
    var aGrid = this.getGrid();
    
    // Unbind handlers
    aGrid.onClick.unsubscribe(this._onClickHandler);
    aGrid.onSort.unsubscribe(this._onSortHandler);  
    
    gdascola.ux.LiveTree.superclass.onDestroy.apply(this, arguments);
  },

  /**
   * This method returns a sub-tree given the id of the root
   * 
   * @param {String} sNodeId The id of the sub-tree root node. 
   * @return {Array} The sub-tree (an array of objects where each object is a node).
   * 
   */
  getSubTree : function(sNodeId)
  {
    return this._getSubTree(sNodeId);
  },

  /**
   * This method refreshes the Tree (data are reloaded from the remote source).
   */
  refreshTree : function()
  {
    return this._refreshTree();
  }		
}
);

// Bind the new class to an xtype to allow lazy instantiation
Ext.reg('livetree', gdascola.ux.LiveTree);
