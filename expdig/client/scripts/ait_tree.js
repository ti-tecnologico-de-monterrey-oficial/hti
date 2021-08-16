/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.Tree class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');

/*
    Implementation of the class boc.ait.Tree. Trees can hold either the
    diagram or the object hierarchy of the repository.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.Tree = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var m_aTreeControl = null;
  var m_nArtefactType = -1;
  var m_bHideLeafs = false;
  var m_bSingleSelection = false;
  var m_bShowLogo = false;
  var m_aView = null;
  var m_aLogoArea = null;
  var m_aTreeRequestParams = null;
  var m_aCtxMenu = null;
  var m_bRefreshTOC = false;
  var m_bEditable = true;
  var m_aColumnsDef = null;

  // Drag and drop properties:
  // This property stores the last tree element that a node is dragged over
  var m_aOldOver = null;
  // Delayed expand task for dragndrop. This task expands the record passed
  // to the task function
  var m_aExpandTask = new Ext.util.DelayedTask (function (aRecord)
                        {
                          if (!aRecord.get("_empty"))
                          {
                            // Get the passed record's store
                            var aStore = aRecord.store;
                            // Expand the node
                            aStore.expandNode (aRecord);
                            aStore.setActiveNode (aRecord);
                          }
                        }
                      );

  var aTemplateConfig =
  [
    {name: 'text'},
    {name: 'idClass'},
    {name: 'classId'},
    {name: 'idClass_lang'},
    {name: 'id'},
    {name: 'expanded', type:'bool'},
    {name: '_parent'},
    {name: 'iconUrl'},
    {name: '_is_leaf', type: 'bool'},
    {name: '_empty', type: 'bool'},
    {name: 'type'},
    {name: 'artefactType'},
    {name: 'editable'},
    {name: 'artificial', type: 'bool'}
  ];

  // Add the visible attributes to the record template
  var m_aVisAttrs = boc.ait.getVisibleAttributes (aConfig.artefactType);
  for (var i = 0; m_aVisAttrs && i < m_aVisAttrs.length;++i)
  {
    var aVisAttr = m_aVisAttrs[i];
    for (var sId in aVisAttr)
    {
      aTemplateConfig[aTemplateConfig.length] = {
                                                  name: 'attr_'+aVisAttr[sId].name.toLowerCase()
                                                };
      break;
    }
  }

  // create the template record for the JSON Reader
  var m_aRecordTemplate = Ext.data.Record.create (aTemplateConfig);

  var that = this;

  var m_aSM = null;
  // Initialize the config object if necessary
  aConfig = aConfig || {};

  /*
      Private function that creates the tree control.
  */
  //--------------------------------------------------------------------
  var setupTreeControl = function ()
  //--------------------------------------------------------------------
  {
    /*
        Inner function that triggers the edit mode for the currently selected node
        \param aKey The pressed key
        \param aEvt The event object
    */
    //--------------------------------------------------------------------
    var aTriggerEdit = function (aKey, aEvent)
    //--------------------------------------------------------------------
    {
      // There is no editing tree nodes in offline mode
      if (g_aSettings.offline)
      {
        return;
      }
      // Retrieve the currently selected node
      var aNodes = that.getSelectedNodes();

      if (aNodes.length > 0)
      {
        var aNode = aNodes[0];
        m_aTreeControl.startEditing (m_aTreeControl.getStore().indexOf(aNode), 0);
      }
    }

    // Array that will hold our toolbar items
    var aToolBarItems = [];

    // If we are in offline mode, we don't need a toolbar, there are no offline functions for the tree
    if (!g_aSettings.offline)
    {
      // The first item in the toolbar is a spacer
      aToolBarItems[aToolBarItems.length] = {xtype: 'tbfill'};
      // Check if we need the search tool
      /*if (aConfig.searchTool && g_aSettings.allowSearching)
      {
        // Create the search tool
        aToolBarItems[aToolBarItems.length] = new Ext.Toolbar.Button
        (
          {
            iconCls: 'ait_search',
            tooltip: getString("ait_tools_explorer_tip_search"),
            handler: that._openSearchTab
          }
        )
      }*/

      // If we are working with the object tree, we have a configuration for creatable classes,
      // it is allowed in the settings to create objects and the tree is configured
      // to provide the possitibiltiy to create objects, we create the create object tool

      if (m_nArtefactType == AIT_ARTEFACT_OBJECT
            &&
          g_aSettings.creatableClasses
            &&
          g_aSettings.creatableClasses.length > 0
            &&
          g_aSettings.allowCreatingNewObjects
            &&
          aConfig.newObjectTool)
      {
        // Create the new object tool
        aToolBarItems[aToolBarItems.length] = new Ext.Toolbar.Button
        (
          {
            iconCls: 'ait_newobject',
            tooltip: getString("ait_tools_explorer_tip_create_object"),
            handler: that.openCreateNewObjectDialog,
            scope: that
          }
        );
      }

      // Create the refresh toolbar item
      aToolBarItems[aToolBarItems.length] = new Ext.Toolbar.Button
      (
        {
          iconCls: 'ait_refresh',
          tooltip: getString("ait_tools_explorer_tip_refresh"),
          scope: that,
          handler: that.refresh
        }
      );
    }

    // Create the toolbar only if we have toolbar items and no header is to be shown for this tree
    var aToolBar = null;
    if (aToolBarItems.length > 0 && aConfig.header !== false)
    {
      aToolBar = new Ext.Toolbar (aToolBarItems);
    }


    /*
        Inner function that is called for rendering the status column in the tree control
        \param sVal The value of the current cell
        \param aMetadata Metadata for the current cell
        \param aRecord The record to which the current cell belongs
    */
    //--------------------------------------------------------------------
    function renderStatus (sVal, aMetadata, aRecord)
    //--------------------------------------------------------------------
    {
      var sIconName = "status_green1.png";
      // Set the icon used based on sVal
      switch (sVal)
      {
        case "v0": sIconName = "status_grey2.png";break;
        case "v1": sIconName = "status_yellow2.png";break;
        case "v2": sIconName = "status_green2.png";break;
        case "v3": sIconName = "status_redcross2.png";break;
        default: return sVal;
      }
      // Return the html code for the current cell
      return "<div style='width:100%; text-align:center;'><span style='0px background-position:50% 50%;background-image:url(images/"+sIconName+");background-repeat:no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>";
    }

    /*
        Inner function that is called for rendering the name column in the tree control
        \param sVal The value of the current cell
        \param aMetadata Metadata for the current cell
        \param aRecord The record to which the current cell belongs

        \retval The value that is to be displayed in the grid
    */
    //--------------------------------------------------------------------
    function renderName (sVal, aMetadata, aRecord)
    //--------------------------------------------------------------------
    {
      //return "<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>"+sVal;
      // Use the blank image url as the standard overlay for the modeltype, folder or class icon
      var sSrc = Ext.BLANK_IMAGE_URL;
      // If the current record is not editable, we want to overlay its icon with a lock
      if (!aRecord.data.editable)
      {
        sSrc = 'images/lock.gif';
      }

      // Render leaf nodes
      if(aRecord.data._is_leaf)
      {
        aMetadata.attr="style='background:url(" + boc.ait.getIconPath ()+ aRecord.data.iconUrl+") 0 0 transparent no-repeat;'";

        return "<span style='background:url("+sSrc+") -5px -2px transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>"+boc.ait.htmlEncode(sVal);
      }
      else
      {
        // Render folder nodes
        var sFolderIcon = 'folder.gif';
        // Show a grey icon for virtual folders
        if (aRecord.data.artificial)
        {
          sFolderIcon = "folder-grey.gif";
        }
        // Check if the folder is currently expanded
        if (m_aTreeControl.store.isExpandedNode (aRecord) && !aRecord.get("_empty"))
        {
          sFolderIcon = 'folder-open.gif';
          // Show a grey icon for virtual folders
          if (aRecord.data.artificial)
          {
            sFolderIcon = 'folder-open-grey.gif';
          }
        }

        aMetadata.attr="id='ait_folder' style='background:url(images/"+sFolderIcon+") 0 0 transparent no-repeat;'";

        return "<span style='background:url("+sSrc+") -5px -2px transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>"+boc.ait.htmlEncode(sVal);
      }
    }

    /*
        Inner function that is called for rendering additional visible attributes
        \param sVal The value of the current cell (a complex value containing:
          val: The simple value
          id: The attribute definition id
          noValue: true if the value is a novalue, otherwise false
        \param aMetadata Metadata for the current cell
        \param aRecord The record to which the current cell belongs
        \param nRowIdx The row index
        \param nColIdx The column index
        \param aStore The store to which the record belongs

        \retval The value that is to be displayed in the grid
    */
    //--------------------------------------------------------------------
    function renderVisibleAttribute (aVal, aMetadata, aRecord, nRowIdx, nColIdx, aStore)
    //--------------------------------------------------------------------
    {
      // If the value is a string, return it
      if((typeof aVal) === "string")
      {
        return aVal;
      }
      var aAttrValInfo = boc.ait.getAttrValInfo (aVal, that.getArtefactType());

      // If we found no info about the current attribute, return an empty string
      if (!aAttrValInfo)
      {
        return "";
      }

      var sVal = aVal.val;

      // Depending on the attribute's type, the visualization changes
      switch (aAttrValInfo.attrtype)
      {
        case "ENUM":
        {
          var nIdx = -1;
          var aIndConstraintVals = aAttrValInfo.ind.split("@");
          var aConstraintVals = aAttrValInfo.constraint.split("@");
          for (var i = 0; i < aIndConstraintVals.length;++i)
          {
            if (aIndConstraintVals[i] === sVal)
            {
              nIdx = i;
              break;
            }
          }
          sVal = aConstraintVals[i];
          break;
        }
        case "UTC":
        {
          if (aVal.noValue)
          {
            sVal = "";
            break;
          }
          var aDate = new Date(sVal);
          sVal = aDate.format("d.m.Y");
        }
      }
      // Return the representation of the attribute value
      return sVal;
    }


    // Status variable that stores whether a cell was just clicked
    var bCellWasClicked = false;
    // Status variable that stores whether the selection in the tree has just changed
    var bSelectionChanged = false;


    /*
        Inner function that is called when the edit functionality for the name cell is called, i.e.
        every time the cell is clicked when it already was selected
        \param aGrid The grid to which the cell belongs
        \param nRowIndex The index of the cell's row
        \param nColIndex The index of the cell's column
        \param aEvt The fired event
    */
    //--------------------------------------------------------------------
    function beginEdit (aGrid, nRowIndex, nColIndex, aEvt)
    //--------------------------------------------------------------------
    {
      // If no cell was clicked before, ignore the event
      if (bCellWasClicked)
      {
        // If any button other than the left mouse button was clicked, ignore the event
        if(aEvt.button !== 0)
        {
          return;
        }

        var aTarget = aEvt.getTarget();
        // If the area before the name was clicked ('elbow'), ignore the event
        if (Ext.fly(aTarget).hasClass('ux-maximgb-treegrid-elbow-active'))
        {
          return;
        }
        // If the area before the name was clicked (the little plus), ignore the event
        else if (Ext.fly(aTarget).hasClass('ux-maximgb-treegrid-brditem'))
        {
          return;
        }

        // If the selection has not just changed (the current cell was clicked twice)
        // start editing the current row and always the first column (we always
        // want to edit the name)
        if (!bSelectionChanged)
        {
          this.startEditing(nRowIndex, 0);
        }
        // If we get here, we set the selection changed variable to false, because
        // at least now the cell was clicked once
        bSelectionChanged = false;
      }

      // Set the cellwasclicked variable back to false
      bCellWasClicked = false;
    }

    /*
        Inner function that changes the class of a folder to the passed class
        \param aRow The row that is affected
        \param sClass The class to which to change
    */
    //--------------------------------------------------------------------
    setFolderClass = function (aRow, sFolderClass, sFolderIcon)
    //--------------------------------------------------------------------
    {
      //  Get all folder child elements of the current row
      var aImgDOM  = Ext.DomQuery.selectNode("div#ait_folder", aRow);
      var aImg = Ext.get(aImgDOM);
      //aImgDOM.setAttribute("src", sFolderIcon);
      aImgDOM.style.backgroundImage = 'url('+sFolderIcon+')';
      // Remove all classes that show the collapsed, open or loading status
      aImg.removeClass(["boc-folder-closed","boc-folder-closed-virtual", "boc-folder-open","boc-folder-open-virtual", "boc-folder-loading"]);
      // Add the new class
      aImg.addClass(sFolderClass);

    };

    m_aTreeRequestParams =
    {
      artefactType: m_nArtefactType,
      hideLeafs: m_bHideLeafs,
      classes: aConfig.classes,
      node: {id: 'root', artificial: false},
      refreshTree: false
    };

    var aTreeStoreCfg =
    {
      pruneModifiedRecords: true,
      autoLoad: true,
      // Set the params for the toc request to the aserver
      baseParams:
      {
        type: 'toc'
      },
      sortInfo:{field: "text", direction: "ASC"},
      reader: new Ext.data.JsonReader
      (
        {
          id: 'id',
          root: 'data',
          totalProperty: 'total',
          successProperty: 'success'
        },
        m_aRecordTemplate
      ),
      // Create listeners for the treegrid
      listeners:
      {

        /*
            Handler function for the loadexception event - this is called when the script that
            retrieves the nodes for the next layer times out.
        */
        //--------------------------------------------------------------------
        loadexception: function()
        //--------------------------------------------------------------------
        {
          //  Get all folders that are currently loading
          var aDOMArr = Ext.DomQuery.select(".boc-folder-loading", that.getEl().dom);

          // Iterate through the loading elements, remove their loading symbol and replace it with
          // the closed folder icon.
          for (var i = 0; i < aDOMArr.length;++i)
          {
            var aImgDOM = aDOMArr[i];
            var aImg = Ext.get(aImgDOM);
            // Remove all classes that show the collapsed, open or loading status
            aImgDOM.style.backgroundImage = 'url(images/folder.gif)';
            aImg.removeClass(["boc-folder-loading"]);
            // Add the new class
            aImg.addClass("boc-folder-closed");
          }
        },
        /*
            Handler function for the beforeexpandnode event
            \param aStore The data store of the tree
            \param aRecord the expanded node
        */
        //--------------------------------------------------------------------
        beforeexpandnode: function (aStore, aRecord)
        //--------------------------------------------------------------------
        {
          function loadFolderData ()
            {
            var aRow = m_aView.getRow(aStore.indexOf(aRecord));
            var aImgDOM  = Ext.DomQuery.selectNode("div#ait_folder", aRow);
            var aImg = Ext.get(aImgDOM);

            if ( !aImg.hasClass("boc-folder-loading"))
              {
              loadFolderData.defer (20, window, []);
              return;
            }
            
            // Load the offline data for the current node
            loadOfflineData.defer
            (
              20,
              window,
              [
                  {url:'../data/group_'+aRecord.get("id").replace(/[\{\}]/g, "")+'_'+g_aSettings.lang+'.ajson', loaded: false},
                  /*
                    Callback function that is called when the json file for the current group
                    is loaded.
                  */
                  function ()
                  {
                  var aNewData = (aRecord.get("artefactType") === AIT_ARTEFACT_DIAGRAM_GROUP) ? g_aOfflineData.modelGroups[aRecord.get("id")] : g_aOfflineData.objectGroups[aRecord.get("id")]
                    var aRecords = [];
                    // Iterate through the added data, create new records and add them to the store
                    for (var i = 0; i < aNewData.length;++i)
                    {
                    if (aNewData[i] === undefined || aNewData[i] === null)
                    {
                      continue;
                    }

                      aRecords[i] = new m_aRecordTemplate(aNewData[i], aNewData[i].id);
                    }
                  aStore.add (aRecords);
                  var aSortState = aStore.getSortState();
                  aStore.sort(aSortState.field, aSortState.direction);

                    // Set the node loaded
                    aStore.setNodeLoaded (aRecord, true);
                    // Expand the node
                    aStore.expandNode (aRecord);
                  }
              ]
                );
          }

          //setFolderClass (m_aView.getRow (aStore.indexOf(aRecord)), "boc-folder-loading");
          // If we are in offline mode, we have to load additional records from the offline data source
          // (= JSON files)
          if(g_aSettings.offline)
          {
            // Ignore the nodes on root level as they are already loaded
            if (aRecord.get("id") !== null )
            {
              // Ignore already loaded nodes
              if (!aStore.isLoadedNode (aRecord))
              {
                setFolderClass (m_aView.getRow(aStore.indexOf(aRecord)), "boc-folder-loading");
                loadFolderData.defer (20, this, []);

                // Return false so that the expanding is cancelled. This is required because we first
                // have to load the offline data (assynchronously)
                return false;
              }
            }
          }

          // Set the cell was clicked status variable to false
          // We don't want the expansion of a node to trigger the editing of the cell
          bCellWasClicked = false;
          // Check whether the current node is loaded
          if (!aStore.isLoadedNode (aRecord))
          {
            setFolderClass (m_aView.getRow(aStore.indexOf(aRecord)), "boc-folder-loading");
          }


          /*
            Inner function that collapses all groups that are not ancestors of the
            current group to expand.
          */
          //--------------------------------------------------------------------
          collapseNonRelevantGroups = function ()
          //--------------------------------------------------------------------
          {
            // Get the store's ancestors and add the current record
            var aAncestors = aStore.getNodeAncestors (aRecord).concat(aRecord);
            // Iterate through the ancestors
            for (var i = 0; i < aAncestors.length;++i)
            {
              var aCurRecord = aAncestors[i];
              var aSiblings = null;
              var aParent = aStore.getNodeParent(aCurRecord);
              // Get the nodes on the current level. If we have a parent,
              // the nodes on the current node are the parent's children,
              // otherwise, they are the root nodes
              if (aParent)
              {
                aSiblings = aStore.getNodeChildren (aParent)
              }
              else
              {
                aSiblings = aStore.getRootNodes ();
              }

              // Go through all current nodes and collapse them
              for (var j = 0; j < aSiblings.length;++j)
              {
                if (aSiblings[j].get("id") !== aCurRecord.get("id"))
                {
                  aStore.collapseNode (aSiblings[j]);
                }
              }
            }
          };

          // Make sure only one group is expanded, if this is specified in the settings
          if (g_aSettings.allowOnlyOneExpandedGroup)
          {
            collapseNonRelevantGroups.defer (1, this);
          }
        },

        /*
            Handler function for the collapsenode event
            \param aStore The data store of the tree
            \param aRecord the expanded node
        */
        //--------------------------------------------------------------------
        collapsenode : function (aStore, aRecord)
        //--------------------------------------------------------------------
        {
          var sFolderImg = "images/folder.gif";
          var sCls = "boc-folder-closed";
          // Show a grey icon for virtual folders
          if (aRecord.data.artificial)
          {
            sFolderImg = "images/folder-grey.gif";
            sCls = "boc-folder-closed-virtual";
          }

          setFolderClass (m_aView.getRow(aStore.indexOf(aRecord)), sCls, sFolderImg);
          // Make sure the group is discarded, if this is specified in the web client settings
          if (g_aSettings.allowOnlyOneExpandedGroup)
          {
            aStore.removeNodeDescendants (aRecord);
            aStore.setNodeLoaded (aRecord, false);
          }
        },

        /*
            Handler function for the expandnode event
            \param aStore The data store of the tree
            \param aRecord the expanded node
        */
        //--------------------------------------------------------------------
        expandnode: function (aStore, aRecord)
        //--------------------------------------------------------------------
        {
          var sFolderImg = "images/folder-open.gif"
          var sCls = "boc-folder-open";
          // Show a grey icon for virtual folders
          if (aRecord.data.artificial)
          {
            sFolderImg = "images/folder-open-grey.gif";
            sCls = "boc-folder-open-virtual";
          }

          setFolderClass (m_aView.getRow(aStore.indexOf(aRecord)), sCls, sFolderImg);
        },

        load : function (aStore, aRecords, aOptions)
        {
          if (m_bRefreshTOC && !g_aSettings.offline)
          {
            // Retrieve the general web client settings from the server and store them in a jsonstore
            var aTempStore = new Ext.data.JsonStore
            (
              {
                url: 'proxy',
                baseParams:
                {
                  type: 'refreshTOC',
                  params: Ext.encode
                  (
                    {
                      type: that.getArtefactType ()
                    }
                  )
                },
                reader: new Ext.data.JsonReader()
              }
            );

            // Load the settings data
            aTempStore.load ();
            aTempStore.destroy();

            m_bRefreshTOC = false;
          }
        }
      },
      // Override for the sortData function so it always visualizes folders before leafs
      // This is from the extJS forum
      sortData : function(f, direction)
      {
        direction = direction || 'ASC';
        var st = this.fields.get(f).sortType;
        var fn = function(r1, r2)
        {
          var v1 = /*st*/(r1.data[f]), v2 = /*st*/(r2.data[f]);
          if ((typeof v1) === "object")
          {
            v1 = renderVisibleAttribute (v1).toLowerCase();
          }
          else
          {
            v1 = st(v1).toLowerCase();
          }
          if ((typeof v2) === "object")
          {
            v2 = renderVisibleAttribute (v2).toLowerCase();
          }
          else
          {
            v2 = st(v2).toLowerCase();
          }
          var bLeaf1 = r1.get("_is_leaf");
          var bLeaf2 = r2.get("_is_leaf");
          if (!bLeaf1 && bLeaf2)
          {
            if (direction == 'DESC')
              return 1;
            return -1;
          }
          if (bLeaf1 && !bLeaf2)
          {
            if (direction == 'DESC')
              return -1;
            return 1;
          }

          return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
        };
        this.data.sort(direction, fn);
        if(this.snapshot && this.snapshot != this.data)
        {
          this.snapshot.sort(direction, fn);
        }
        // ----- Modification start
        this.applyTreeSort();
        // ----- End of modification
      }
    };

    if (g_aSettings.offline)
    {
      if (m_nArtefactType == AIT_ARTEFACT_OBJECT)
      {
        aTreeStoreCfg.proxy = new Ext.data.MemoryProxy (g_aOfflineData.objecttreeData);
      }
      else
      {
        aTreeStoreCfg.proxy = new Ext.data.MemoryProxy (g_aOfflineData.diagramtreeData);
      }
    }
    else
    {
      aTreeStoreCfg.url = 'proxy';
    }
    aTreeStoreCfg.autoDestroy = true;

    // Create the tree store for our tree grid
    var aTreeStore = new Ext.ux.maximgb.tg.AdjacencyListStore (aTreeStoreCfg);

    aTreeStore.on("beforeload", function (aStore, aOptions)
      {
        if (m_aTreeRequestParams.refreshTree)
        {
          m_aTreeRequestParams.node = {id:"root", artificial: false};
        }
        else
        {
          m_aTreeRequestParams.node = {id: aOptions.params.anode || "root", artificial : false};
          var aRecord = aStore.getById(aOptions.params.anode);
          if (aRecord)
          {
            m_aTreeRequestParams.node.artificial = aRecord.get("artificial");
          }
        }

        m_aTreeRequestParams.sortDir = aStore.getSortState().direction;
        m_aTreeRequestParams.ignoredElements = aConfig.ignoredElements;

        //m_aTreeRequestParams.refreshTree = false;
        aStore.baseParams.params = Ext.encode (m_aTreeRequestParams);
      }
    );

    // Define the columns for the tree grid
    m_aColumnsDef =
    [
      {
        id:'text',
        header: "Name",
        //width: 160,
        autoWidth:true,
        sortable: true,
        dataIndex: 'text',
        // Create the editor text field for the name field
        editor: new Ext.form.TextField
        (
          {
            //autoWidth:true,
            //width: 160,
            selectOnFocus:true,
            listeners:
            {
              // When the editor field is shown, select the whole text
              show:function(aCmp)
              {
                aCmp.selectText();
              }
            }
          }
        ),
        // Use a special renderer for the name field
        renderer: renderName
      }/*,
      {
        id:"attr_a_valid_from",
        header:"Valid From",
        dataIndex:"attr_a_valid_from",
        sortable:true
      }*/
    ];

    //alert("columnslength pre: " + aColumns.length);

    // Add columns for the additional visualized attributes
    for (var i = 0; m_aVisAttrs && i < m_aVisAttrs.length;++i)
    {
      var aVisAttr = m_aVisAttrs[i];
      for (var sId in aVisAttr)
      {
        m_aColumnsDef[m_aColumnsDef.length] =
        {
          id: "attr_"+aVisAttr[sId].name.toLowerCase(),
          header: aVisAttr[sId].classname,
          sortable:true,
          dataIndex: "attr_"+aVisAttr[sId].name.toLowerCase(),
          renderer: renderVisibleAttribute
        };

        break;
      }
    }





    if (Ext.isArray (aConfig.additionalColumns) === true)
    {
      m_aColumnsDef = m_aColumnsDef.concat (aConfig.additionalColumns);
    }

    // If we are working within the object tree, also show the status column
    if (m_nArtefactType == AIT_ARTEFACT_OBJECT)
    {
      /*aColumns[aColumns.length] =
      {
        header: "Status",
        width: 20,
        //autoWidth:true,
        sortable: true,
        dataIndex: 'status',
        // Use a special renderer for the status field
        renderer: renderStatus
      };*/
    }

    var sTreeTitle = ' ';
    if (aConfig.header === false)
    {
      sTreeTitle = null;
    }

    // The size parameters for the tree
    var sAnchor = '100% 100%';
    // If we show a logo, we have to make room for the logo area
    if (m_bShowLogo)
    {
      sAnchor = '100% 100%';
    }

    m_aSM = aConfig.sm || new Ext.grid.RowSelectionModel
    (
      {
        // Set single or multiple selection
        singleSelect: m_bSingleSelection,
        // Do not move the editor through the rows when enter is pressed
        moveEditorOnEnter: false,
        listeners:
        {
          selectionchange : function (aSelModel)
          {
            bSelectionChanged = true;
            that.fireEvent('selectionchange', that, aSelModel);
          }
        }
      }
    );

    // create the tree control
    m_aTreeControl = new Ext.ux.maximgb.tg.EditorGridPanel
    (
      {
        //enableDragDrop:m_bEditable,
        //ddGroup: m_bEditable ? 'treeDrag' : undefined,
        containerScroll:true,
        // Show an effect on mouse over
        trackMouseOver: true,
        // Define auto edit
        clicksToEdit: 'auto',
        anchor:sAnchor,
        border:false,
        //autoScroll:true,
        layout: 'fit',
        store: aTreeStore,
        // Use the text column as master
        master_column_id : 'text',
        columns: m_aColumnsDef,
        stripeRows: true,
        // Customize the selection model so it fires its selectionChanged event through the tree
        sm: m_aSM,
        autoExpandColumn: 'text',
        bodyStyle: "padding-top:0px;padding-left:0px;width:100%;height:100%;overflow:auto;",
        title: sTreeTitle,
        tbar: aToolBar,
        header: false,
        onAutoEditClick : Ext.emptyFn,
        onCellDblClick: Ext.emptyFn,
        //ddGroup          : 'firstGridDDGroup',
        viewConfig:
        {
          forceFit: true
        },
        listeners:
        {
          // Add a handler for the before edit event, that stops the editing functionality if
          // the tree should not be editable
          beforeedit: function (aParamObject)
          {
            // Only allow editing if:
            // - The tree is editable
            // - Renaming is allowed
            // - The record to edit is editable
            // - We are not in a tree within the relations control
            // - The group is not artificial (not a virtual group with a name starting with PartNNN (<STARTELEMENT> - <ENDELEMENT>)

            return aConfig.editable === true && g_aSettings.allowRenaming === true && aParamObject.record.data.editable === true && m_bEditable && aParamObject.record.data.artificial !== true;
          },

          // Add a handler for the render event that makes sure
          // that the grid is sorted
          render: function (aGrid)
          {
            try
            {
              // Add styles so the Grid is properly placed without any whitespaces around the borders
              aGrid.ownerCt.body.applyStyles("padding:0px;");
              aGrid.body.applyStyles("padding:0px;");


              // Create an event handler that listens for when the user presses F2
              var aKeyMap = new Ext.KeyMap
              (
                aGrid.getEl(),
                [
                  {
                    key: 113,// F2 key = edit
                    fn: aTriggerEdit,
                    // The tree is the scope of the triggerEdit callback
                    scope: that
                  },
                  {
                    key: Ext.EventObject.DELETE,
                    fn: function ()
                    {
                      if (aConfig.editable === true && checkDelClickFn () === true)
                      {
                        onDeleteClick.call
                        (
                          {
                            getContext: function ()
                            {
                              return that.getSelectedNodes();
                            }
                          }
                        );
                      }
                    },
                    scope:that
                  },
                  {
                    key: Ext.EventObject.ENTER,
                    fn: function ()
                    {
                      if (aConfig.editable !== true)
                      {
                        return;
                      }
                      var aRecords = that.getSelectedNodes();
                      if (aRecords.length !== 1)
                      {
                        return;
                      }
                      var aRecord = aRecords[0];

                      var bLeaf = aRecord.get("_is_leaf");
                      if (bLeaf)
                      {
                        var sID = aRecord.get("id");
                        var aMainArea = g_aMain.getMainArea();
                        var nArtefactType = that.getArtefactType();

                        if (nArtefactType == AIT_ARTEFACT_OBJECT)
                        {
                          aMainArea.openNotebook (sID, nArtefactType);
                        }
                        // otherwise we open the diagram
                        else
                        {
                          aMainArea.openDiagram (sID);
                        }
                      }
                    },
                    scope:that
                  }
                ]
              );
            }
            catch (aEx)
            {
              displayErrorMessage (aEx);
            }
          },


          /*
              Handler function for the cellclick event
              \param aGrid The grid to which the cell belongs
              \param nRowIndex The index of the cell's row
              \param nColIndex The index of the cell's column
              \param aEvt The triggered event
          */
          //--------------------------------------------------------------------
          cellclick: function(aGrid, nRowIndex, nColIndex, aEvt)
          //--------------------------------------------------------------------
          {
            // In offline mode, there is no editing, so we return here
            if (g_aSettings.offline)
            {
              return;
            }
            // Set the cellwasclicked variable to true, so we can trigger tree editing
            // with a second click
            bCellWasClicked = true;
            // Start the beginEdit function with a delay of 500 so a double click won't
            // start the editing process but a second delayed click will.
            beginEdit.defer(500, aGrid, [aGrid, nRowIndex, nColIndex, aEvt]);
          },


          /*
              Handler function for the celldblclick event
          */
          //--------------------------------------------------------------------
          celldblclick: function ()
          //--------------------------------------------------------------------
          {
            // Set the cellwasclicked variable to false, so a double click cannot
            // trigger tree editing
            bCellWasClicked = false;
          },

          /*
              Handler function for the rowdblclick event
              \param aGrid The grid to which the cell belongs
              \param nRowIndex The index of the cell's row
              \param nColIndex The index of the cell's column
              \param aEvt The triggered event
          */
          //--------------------------------------------------------------------
          rowdblclick : function (aGrid, nRowIndex, nColIndex, aEvt)
          //--------------------------------------------------------------------
          {
            var aStore = aGrid.getStore();
            // Get the selected record
            var aRecord = aStore.getAt(nRowIndex);  // Get the Record

            // If the clicked record is a non-empty folder we expand
            // or collapse it on a double click
            if (!aRecord.get("_is_leaf") && !aRecord.get("_empty"))
            {
              if (aStore.isExpandedNode(aRecord))
              {
                aStore.collapseNode (aRecord);
              }
              else
              {
                aStore.expandNode(aRecord);
              }
            }
          },

          /*
              Handler function for the cellcontextmenu event
              \param aGrid The grid to which the cell belongs
              \param nRowIndex The index of the cell's row
              \param nColIndex The index of the cell's column
              \param aEvt The triggered event
          */
          //--------------------------------------------------------------------
          cellcontextmenu: function (aGrid, nRowIndex, nColIndex, aEvt)
          //--------------------------------------------------------------------
          {
            try
            {
              // Only continue if we need a context menu
              if (aConfig.showContextMenu)
              {
                var aSelectionModel = m_aTreeControl.getSelectionModel();
                if (!aSelectionModel.isSelected (nRowIndex))
                {
                  aSelectionModel.selectRow (nRowIndex);
                }
                // Create a new instance of the main menu
                //var aMainMenu = new boc.ait.menu.MainMenu();
                // Get the actual menu from the mainmenu object
                //var aMenu = aMainMenu.getInnerMenu();
                var aMenu = m_aCtxMenu.menu;

                m_aCtxMenu.setContext (that.getSelectedNodes());

                aMenu.showAt(aEvt.getXY());
                // Stop the propagation of the event
                aEvt.stopEvent();
              }
            }
            catch (aEx)
            {
              displayErrorMessage (aEx);
            }
          },
          validateedit : that._doEdit
        },
        root_title: 'Repository',
        // Override for the startEditing function so it correctly displays the editor field
        // This is from the extJS forum
        startEditing: function (row, col) {
          try
          {
            this.stopEditing();
            if (this.colModel.isCellEditable(col, row)) {
              this.view.ensureVisible(row, col, true);
              var r = this.store.getAt(row);
              var field = this.colModel.getDataIndex(col);
              var e = {grid: this, record: r, field: field, value: r.data[field], row: row, column: col, cancel: false};
              if (this.fireEvent("beforeedit", e) !== false && !e.cancel) {
                this.editing = true;

                var ed = this.colModel.getCellEditor(col, row);
                if (!ed.rendered) {
                  // Ugly fix for CR #049051
                  try
                  {
                    ed.render(this.view.getEditorParent(ed));
                  }
                  catch (aEx)
                  {
                    return;
                  }
                }
                (
                  function ()
                  {
                    ed.row = row;
                    ed.col = col;
                    ed.record = r;
                    ed.on("complete", this.onEditComplete, this, {single: true});
                    ed.on("specialkey", this.selModel.onEditorKey, this.selModel);
                    this.activeEditor = ed;
                    var v = this.preEditValue(r, field);

                    var dom = this.view.getCell(row, col);
                    var masterColumnIndex = this.colModel.findColumnIndex(this.master_column_id);

                    ed.startEdit(dom, v);
                  }.defer(50, this)
                );
              }
            }
          }
          catch (aEX)
          {
            alert("ex: " + aEX);
            displayErrorMessage (aEX);
          }
        }
      }
    );

    m_aTreeControl.on("render", function (aTree)
      {
        if (g_aSettings.offline)
        {
          return;
        }

        var aStore = aTree.getStore();
        var canDrop = function (aDragData, aOverRecord)
        {
          if (g_aSettings.allowMoving === false)
          {
            return false;
          }
          if (aDragData.grid !== aTree)
          {
            return false;
          }
          if (!aOverRecord)
          {
            return false;
          }
          if ( aOverRecord.get("_is_leaf"))
          {
            return false;
          }
          if (aOverRecord.get("artificial") === true)
          {
            return false;
          }
          if ( Ext.isEmpty(aOverRecord) )
          {
            return true;
          }

          var aDraggedRecords = aDragData.selections;
          for (var i = 0; i < aDraggedRecords.length;++i)
          {
            var aRec = aDraggedRecords[i];
            // Don't allow dragging of artificial folders
            if (aRec.data.artificial)
            {
              return false;
            }

            if (aStore.getNodeParent (aRec) === aOverRecord)
            {
              return false;
            }
            if (aRec === aOverRecord)
            {
              return false;
            }
          }

          if  ( aOverRecord.isNew )
          {
            return false;
          }

          for (var i = 0; i < aDraggedRecords.length;++i)
          {
            var nIndex = aStore.getNodeAncestors(aOverRecord).indexOf(aDraggedRecords[i]);
            if (nIndex >= 0)
            {
              return false;
            }
          }


          //return nIndex < 0;
          return true;
        };

        var sDDGroupID = "treeDrag";
        if (m_bEditable)
        {
          aTree.dragZone = new boc.ait.GridDragZone(aTree, {ddGroup: sDDGroupID, params:{tree:aTree}});

          // Register a scroll configuration for the dragzone, so the tree scrolls automatically,
          // when an item is dragged to the top or bottom of it.
          aTree.getView().scroller.ddScrollConfig =
          {
            vthresh: 20,
            hthresh: -1,
            increment: 75,
            frequency : 500
          };
          // Register the drag zone
          Ext.dd.ScrollManager.register (aTree.getView().scroller);
        }
        var aDropZone = new Ext.dd.DropTarget(aTree.getView().scroller,
          {
            ddGroup: sDDGroupID,

            notifyOut: function ()
            {
              // Cancel any expand task when an element is dragged out of the tree
              m_aExpandTask.cancel ();
            },

            notifyOver: function(aDragSource, aEvent, aData)
            {
              var sCls = aTree.dropNotAllowed;

              var aDraggedRecords = aDragSource.dragData.selections;


              var aTarget = aEvent.getTarget();

              var nRowIndex = aTree.getView().findRowIndex(aTarget);

              var aOverRecord = aTree.getStore().getAt(nRowIndex);
              // If the element was dragged above another element before, cancel a pending expand task
              if (m_aOldOver !== null && aTarget !== m_aOldOver)
              {
                m_aExpandTask.cancel ();
              }

              if  ( canDrop(aDragSource.dragData, aOverRecord) )
              {
                sCls = Ext.dd.DropZone.prototype.dropAllowed;

                // If the element was dragged above another element before (and we are now above a new element
                // for the first time), start a new expand task (thereby cancelling an old one)
                if (m_aOldOver !== null && aTarget !== m_aOldOver)
                {
                  m_aExpandTask.delay(1000, null, null, [aOverRecord]);
                }
              }
              m_aOldOver = aTarget;

              return setDragStyle(sCls);
            },

            notifyDrop: function(aDragSource, aEvent, aData)
            {
              var aDraggedRecords = aDragSource.dragData.selections;

              var aTarget = aEvent.getTarget();
              var nRowIndex = aTree.getView().findRowIndex(aTarget);

              var aOverRecord = aTree.getStore().getAt(nRowIndex);


              if ( canDrop(aDragSource.dragData, aOverRecord))
              {
                var aDropFn = function()
                {
                  // Get the owner container of the tree
                  var aOwner = aTree.ownerCt;

                  // Mask the owner's body
                  aOwner.body.mask(getString("ait_loading"), 'x-mask-loading');

                  var sParentId = aOverRecord.get('id');
                  var aArtefacts = [];
                  for (var i = 0; i < aDraggedRecords.length;++i)
                  {
                    var aDraggedRecord = aDraggedRecords[i];
                    var aParent = aTree.getStore().getById(aDraggedRecord.get("_parent"))
                    var aOldParent =
                    {
                      id: aDraggedRecord.get("_parent"),
                      artificial: false
                    }
                    if (aParent)
                    {
                      aOldParent.artificial = aParent.get("artificial");
                    }
                    aArtefacts[aArtefacts.length] =
                    {
                      artefactID: aDraggedRecord.get("id"),
                      oldParent: aOldParent,
                      artefactType: (aDraggedRecord.get("_is_leaf") ? m_nArtefactType : (m_nArtefactType == AIT_ARTEFACT_OBJECT ? AIT_ARTEFACT_OBJECT_GROUP : AIT_ARTEFACT_DIAGRAM_GROUP))
                    }
                  }

                  Ext.Ajax.request
                  (
                    {
                      url:"proxy",
                      method:"POST",
                      params:
                      {
                        type: "moveArtefact",
                        params: Ext.encode
                        (
                          {
                            artefacts: aArtefacts,
                            newParent:
                            {
                              id: sParentId,
                              artificial: aOverRecord.get("artificial")
                            }
                          }
                        )
                      },
                      // We use the tree as scope for the callbacks
                      scope: that,
                      // On success we check the return object
                      success: function (aResponse, aOptions)
                      {
                        try
                        {
                          // Decode the response Object
                          var aRetObj = Ext.util.JSON.decode(aResponse.responseText);
                          // Check if an error occurred (artefact does not exist, is locked, was deleted, ...)
                          if (aRetObj.error)
                          {
                            // Show an error message
                            showErrorBox(aRetObj.errString);
                            // Undo the change in the tree
                            return;
                          }

                          for (var i = 0; i < aDraggedRecords.length;++i)
                          {
                            aDraggedRecords[i].set(aStore.parent_id_field_name, aRetObj.payload.id);
                            // Make sure the dragged records' new parent is not marked empty
                            aStore.getNodeParent(aDraggedRecords[i]).set("_empty", false);
                          }


                          aTree.getSelectionModel().deselectRange();
                          aStore.commitChanges();
                          aStore.sort("text", "ASC");
                          aTree.getView().refresh(true);
                          aTree.getSelectionModel().selectRecords(aDraggedRecords, false);
                        }
                        finally
                        {
                          aOwner.body.unmask ();
                        }
                      },
                      // On failure we undo the change to the node's name
                      failure: function()
                      {
                        aOwner.body.unmask();
                      }
                    }
                  );
                }

                var bExpanded = aStore.isExpandedNode(aOverRecord);
                if ( !bExpanded )
                {
                  this.expandAndApply(aOverRecord, aDropFn);
                }
                else
                {
                  aDropFn();
                }
              }
            },

            expandAndApply: function(aRecord, aDropFn)
            {
              if ( !aRecord)
              {
                aDropFn();
                return;
              }

              var aStoreExpandNodeCallback = aStore.expandNodeCallback;

              aStore.expandNodeCallback = function(aRecord, aOptions, bSuccess)
              {
                aStoreExpandNodeCallback.apply(aStore, arguments);
                aDropFn();
              };
              aStore.expandNode(aRecord);
              aStore.setActiveNode(aRecord);

              aStore.expandNodeCallback = aStoreExpandNodeCallback;

              // Special handling when a CR 048552 is already loaded but not expanded. The tree grid in this case
              // does not call the expandnodecallback, so we call the dropFn here explicitly.
              if (aStore.isLoadedNode (aRecord))
              {
                aDropFn ();
              }
            }
          }
        );
        aTree.dropZone = aDropZone;
      }
    );

    // Store the tree's view in a private member variable
    m_aView = m_aTreeControl.getView();

    // Add the tree control to the tree's items
    aConfig.items =
    [
      m_aTreeControl
    ];

    if (m_bShowLogo)
    {
      /*m_aLogoArea = new Ext.Panel
      (
        {
          anchor:'100% 20%',
          bodyStyle: "border-left:0;border-right:0;border-bottom:0;background-position:center center;background-repeat:no-repeat;background-image:url(images/boc.png); margin:0px; padding:10px"
        }
      );

      aConfig.items[aConfig.items.length] = m_aLogoArea;*/
    }


  }

  onInstancesDeleted = function (aDeletedInstanceIDs)
  {
    // Get the active tree's store
    var aStore = m_aTreeControl.store;
    if (aStore === null || aStore === undefined)
    {
      return;
    }
    for (var i = 0; i < aDeletedInstanceIDs.length;++i)
    {
      var aNode = aStore.getById(aDeletedInstanceIDs[i]);
      if (aNode)
      {
        var aParent = aStore.getById(aNode.get("_parent"));
        // Remove the deleted node from the store
        aStore.remove (aNode);
        if (aParent && !aStore.hasChildNodes (aParent))
        {
          aParent.set("_empty", true);
        }
      }
    }
    if (m_aTreeControl.rendered)
    {
      m_aTreeControl.getView().refresh ();
    }
  };

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      if (!aConfig.title && (aConfig.header !== false))
      {
        aConfig.title = getString("ait_tools_explorer_diagrams");
        if (aConfig.artefactType == AIT_ARTEFACT_OBJECT)
        {
          aConfig.title = getString("ait_tools_explorer_objects");
        }
      }
      m_bRefreshTOC = aConfig.refreshTOCInitially;

      // Specifies whether the tree should show leafs or only folders
      m_bHideLeafs = aConfig.hideLeafs || false;
      // Should multiple selection be allowed?
      m_bSingleSelection = aConfig.singleSelection || false;

      // Should the tree also display a logo?
      m_bShowLogo = aConfig.showLogo;

      // Get the artefact type the tree should display
      m_nArtefactType = aConfig.artefactType;

      //aConfig.layout = 'anchor';

      //aConfig.layout = 'fit';
      aConfig.layout = 'anchor';
      aConfig.border = aConfig.border || false;

      aConfig.plugins = [boc.ait.plugins.Customizable];


      m_bEditable = Ext.isEmpty(aConfig.classes);


      // Setup the tree control
      setupTreeControl ();

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
                      "ait_menu_main_create_folder",
                      "ait_menu_main_create_object",
                      "ait_menu_main_rename",
                      "ait_menu_main_delete",
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


      if (m_nArtefactType === AIT_ARTEFACT_OBJECT)
      {
        g_aEvtMgr.on("instancesdeleted", onInstancesDeleted);

        that._onInstanceCreated = function(aCreatedInst)
        {
          var aStore = m_aTreeControl.store;
          if (aStore === null || aStore === undefined)
          {
            return;
          }

          var aParent = aStore.getById(aCreatedInst._parent);
          if (aParent)
          {
            aParent.set("_empty", false);
            //try
            m_aTreeControl.getView().refresh ();

            // Hack to avoid the error message in CR #048563
            //catch (aEx)
            //{}
          }

          // Reload the created object's parent node in the tree to visualize the
          // new object
          aStore.reload
          (
            {
              params:
              {
                anode: aCreatedInst._parent,
                params: Ext.encode
                (
                  {
                    refreshTree : true,
                    artefactType: that._getArtefactType(),
                    node:
                    {
                      id:aCreatedInst._parent
                    }
                  }
                )
              }
            }
            );
        }

        g_aEvtMgr.on("instancecreated", that._onInstanceCreated);
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }

  // protected members:
  /*
      Protected method that returns the tree's type
      \retval Either 'objects' or 'diagrams'
  */
  //--------------------------------------------------------------------
  this._getArtefactType = function ()
  //--------------------------------------------------------------------
  {
    return m_nArtefactType;
  }

  /*
      Protected method that refreshes the contents of the treecontrol.
  */
  //--------------------------------------------------------------------
  this._refresh = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      // Return if the current tree is not rendered yet - in this case we can't refresh and don't need to
      if (!this.rendered)
      {
        return;
      }
      // Get the owner container of the tree
      var aOwner = that.ownerCt;

      // Mask the owner's body
      aOwner.body.mask(getString("ait_loading"), 'x-mask-loading');

      m_aTreeRequestParams.node = {id:'root', artificial: false};

      m_aTreeRequestParams.src = 'refresh';
      m_aTreeRequestParams.refreshTree = true;

      var aNodes = [];
      if (!g_aSettings.collapseTreeOnRefresh)
      {
        for (var i = 0; i < m_aTreeControl.store.getCount();++i)
        {
          var aRecord = m_aTreeControl.store.getAt(i);
          if (m_aTreeControl.store.isExpandedNode (aRecord) && m_aTreeControl.store.isVisibleNode (aRecord))
          {
            aNodes[aNodes.length] =
            {
              id: aRecord.get("id"),
              artificial: aRecord.get("artificial")
            }
          }
        }
      }

      m_aTreeRequestParams.nodes = aNodes;
      m_aTreeControl.store.removeAll (true);
      m_aTreeControl.store.reload
      (
        {
          callback: function ()
          {
            m_aTreeControl.store.commitChanges();
            m_aTreeControl.view.refresh();

            for (var i = 0; i < this.reader.jsonData.data.length;++i)
            {
              var aCurEntry = this.reader.jsonData.data[i];
              if (aCurEntry.expanded)
              {
                var aRecord = m_aTreeControl.store.getById(aCurEntry.id);
                aRecord.ux_maximgb_treegrid_loaded = true;
                m_aTreeControl.store.expandNode (aRecord);
              }
            }


            that.fireEvent ('refresh');
            // Remove the load mask
            that._removeMask();
            m_aTreeRequestParams.refreshTree = false;
          },
          // Set the params for the toc request to the aserver
          params:
          {
            params: Ext.encode (m_aTreeRequestParams)
          }
        }
      );

    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
      that._removeMask ();
    }
  }

  /*
      Protected function that opens the search tab
  */
  //--------------------------------------------------------------------
  this._openSearchTab = function ()
  //--------------------------------------------------------------------
  {
    g_aMain.getMainArea().openSearchTab ();
  }

  /*
      Protected function that opens the create new object dialog
      \param aEvent The fired event
      \param aSrcEl The element that triggered the event
  */
  //--------------------------------------------------------------------
  this._openCreateNewObjectDialog = function (aEvent, aSrcEl)
  //--------------------------------------------------------------------
  {
    try
    {
      var sTargetGroupID = null;
      // If the dialog was called from within an object group's context menu
      // get its id and pass it as target group id to the dialog
      if (aSrcEl instanceof Ext.menu.Item)
      {
        // Get the selected nodes
        var aSelNodes = this.getSelectedNodes();
        if (aSelNodes.length == 1)
        {
          sTargetGroupID = aSelNodes[0].get("id");
        }
      }

      // Create a new instance of the dialog
      var aCreateNewObjectDialog = new boc.ait.NewObjectDialog
      (
        {
          // Make the new dialog modal
          modal: true,
          targetGroupID: sTargetGroupID,
          callback : that._openCreatedInstancesNotebook,
          scope: that
        }
      );
      // Show the dialog
      aCreateNewObjectDialog.show (aSrcEl);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  this._openCreatedInstancesNotebook = function(aCreatedInstance)
  {
    // Open the new object's notebook
    g_aMain.getMainArea().openNotebook (aCreatedInstance.id, AIT_ARTEFACT_OBJECT);
  };

  /* Protected method that is called when the user wants to edit a node in a tree.
      The method sends the new name of the edited element to the server

      \param aEditor The editor object that is used for editing
      \param sVal The new text value of the node
      \param sOldVal The old text value of the node
      \retval True if no error occurred and the new value does not equal the old value. Otherwise
              false, cancelling the edit process
  */
  //--------------------------------------------------------------------
  this._doEdit = function (aEvent)
  //--------------------------------------------------------------------
  {
    try
    {
      var sVal = aEvent.value;
      var sOldVal = aEvent.originalValue;
      // If the value was not changed by the editor, return false, so the edit process is stopped
      if (sVal === sOldVal)
      {
        return false;
      }

      if (sVal === "")
      {
        showErrorBox (getString("ait_tree_no_empty_name"));
        return false;
      }

      // Mask the owner's body
      that.ownerCt.body.mask(getString("ait_loading"), 'x-mask-loading');

      var aTree = aEvent.grid;
      var aNode = aEvent.record;
      var nTargetType = m_nArtefactType;
      // Check which tree we are currently editing and set the edit operation's target
      if (m_nArtefactType == AIT_ARTEFACT_DIAGRAM && !aNode.get("_is_leaf"))
      {
        nTargetType = AIT_ARTEFACT_DIAGRAM_GROUP;
      }
      else if (m_nArtefactType == AIT_ARTEFACT_OBJECT && !aNode.get("_is_leaf"))
      {
        nTargetType = AIT_ARTEFACT_OBJECT_GROUP;
      }

      /*
          Inner function that resets the text value of the edited node to the old text value
          \param aResponse The response object passed by the ajax requested that uses this method
                 as callback
          \param aOptions The options object passed by the ajax requested that uses this method
                 as callback
      */
      //--------------------------------------------------------------------
      var undoEditFunction = function (aResponse, aOptions)
      //--------------------------------------------------------------------
      {
        // Reject the changes in the tree's store
        m_aTreeControl.store.rejectChanges();
        // Unmask the catalog tabs
        that._removeMask ();
      }

      /*
          Is called when the request to edit a node was successfully passed to the server and
          we got an answer.
          \param aResponse The response object passed by the ajax requested that uses this method
                 as callback
          \param aOptions The options object passed by the ajax requested that uses this method
                 as callback
      */
      //--------------------------------------------------------------------
      var onSuccessFunction = function (aResponse, aOptions)
      //--------------------------------------------------------------------
      {

        // Decode the response Object
        var aRetObj = Ext.util.JSON.decode(aResponse.responseText);
        // Check if an error occurred (artefact does not exist, is locked, was deleted, ...)
        if (aRetObj.error)
        {
          // Show an error message
          showErrorBox(aRetObj.errString);
          // Undo the change in the tree
          undoEditFunction (aResponse, aOptions);
          return;
        }
        m_aTreeControl.store.commitChanges();
        // Unmask the catalog tabs
        that._removeMask ();
      }

      /*
          Inner function that resets the text value of the edited node to the old text value
          \param aResponse The response object passed by the ajax requested that uses this method
                 as callback
          \param aOptions The options object passed by the ajax requested that uses this method
                 as callback
      */
      //--------------------------------------------------------------------
      var undoEditFunction = function (aResponse, aOptions)
      //--------------------------------------------------------------------
      {
        m_aTreeControl.store.rejectChanges();
        // Unmask the catalog tabs
        that._removeMask ();
      }

      // Values containing percent signs cannot be transmitted and then correctly decoded, so we encode them
      // separately.

      // Start a new ajax call to send the changed value back to the server
      Ext.Ajax.request
      (
        {
          url:"proxy",
          method:"POST",
          params:
          {
            type: "edit",
            params: Ext.encode
            (
              {
                targetType: nTargetType,
                id: aNode.get("id"),
                val: sVal
              }
            )
          },
          // We use the tree as scope for the callbacks
          scope: that,
          // On success we check the return object
          success: onSuccessFunction,
          // On failure we undo the change to the node's name
          failure: undoEditFunction
        }
      );
      // Return true, thus continuing the edit process
      return true;
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
      return false;
    }
  }

  /* Protected method that returns the selected node of the tree control

      \retval The node currently selected in the tree control. null if more than one
              node is currently selected
  */
  //--------------------------------------------------------------------
  this._getSelectedNodes = function ()
  //--------------------------------------------------------------------
  {
    return m_aTreeControl.getSelectionModel().getSelections();
  }

  /* Protected method that removes the mask displayed over the tree's owner panel
  */
  //--------------------------------------------------------------------
  this._removeMask = function ()
  //--------------------------------------------------------------------
  {

    /*
        Inner function that removes the mask shown over the tree's owner
    */
    //--------------------------------------------------------------------
    var aRemoveMaskFunction = function ()
    //--------------------------------------------------------------------
    {
      // Get the tree's owner
      var aOwner = that.ownerCt;
      // Unmask the owner
      aOwner.body.unmask();
    }

    // Remove the mask after a short timeout
    setTimeout
    (
      aRemoveMaskFunction,
      250
    );
  }


  /* Protected method that returns the tree's tree control

    \retval The tree control
  */
  //--------------------------------------------------------------------
  this._getTreeControl = function()
  //--------------------------------------------------------------------
  {
    return m_aTreeControl;
  }

  /* Protected method that returns the tree's logo area

    \retval The logo area.
  */
  //--------------------------------------------------------------------
  this._getLogoArea = function ()
  //--------------------------------------------------------------------
  {
    return m_aLogoArea;
  };

  /*
    Protected function that retrieves the tree's context menu.

    \retval The tree's context menu
  */
  //--------------------------------------------------------------------
  this._getContextMenu = function ()
  //--------------------------------------------------------------------
  {
    return m_aCtxMenu;
  };

  /*
    Protected function that creates a new folder below the passed parent
    folder.

    \param aParentFolder The target folder for the new folder.
  */
  //--------------------------------------------------------------------
  this._createFolder = function (aParentFolder)
  //--------------------------------------------------------------------
  {
    this.ownerCt.body.mask();
    Ext.Ajax.request
    (
      {
        url:"proxy",
        method:"POST",
        params:
        {
          type: "createFolder",
          params: Ext.encode
          (
            {
              targetGroupId: aParentFolder.get("id"),
              //name: "dummdi",
              artefactType: this.getArtefactType() === AIT_ARTEFACT_OBJECT ? AIT_ARTEFACT_OBJECT_GROUP : AIT_ARTEFACT_DIAGRAM_GROUP
            }
          )
        },
        // We use the tree as scope for the callbacks
        scope: this,
        // On success we check the return object
        success: function (aResponse, aOptions)
        {
          try
          {
            // Decode the response Object
            var aRetObj = Ext.util.JSON.decode(aResponse.responseText);
            // Check if an error occurred (artefact does not exist, is locked, was deleted, ...)
            if (aRetObj.error)
            {
              // Show an error message
              showErrorBox(aRetObj.errString);
              // Undo the change in the tree
              return;
            }

            /*
              Private inner function that is called when nodes are loaded.
              It waits for the added group node and then triggers the edit field for it.
            */
            //--------------------------------------------------------------------
            var onLoadNode = function (aNodeStore, aRecords, nIndex)
            //--------------------------------------------------------------------
            {
              try
              {
                // Iterate through all records
                for (var i = 0; i < aRecords.length;++i)
                {
                  // If the current record's id equals the created folder's id, start editing
                  if (aRecords[i].get("id") === aRetObj.payload.id)
                  {
                    m_aTreeControl.startEditing (aNodeStore.indexOf(aRecords[i]), 0);
                    break;
                  }
                }
              }
              catch (aEx)
              {
                displayErrorMessage (aEx);
              }
              finally
              {
                // Unregister the load event handler
                aNodeStore.un("load", onLoadNode);
              }
            }

            var aStore = m_aTreeControl.getStore ();

            var aNewGroup = null;

            // If the parent folder is currently empty, set it to not empty and
            // refresh the view
            if (aParentFolder.get("_empty"))
            {
              aParentFolder.set("_empty", false);
              m_aTreeControl.getView().refresh ();
            }

            // Expand the parent folder
            aStore.expandNode (aParentFolder);

            // If the parent folder is not loaded yet,
            // create an event handler for the load event
            if (!aStore.isLoadedNode (aParentFolder))
            {
              aStore.on("load", onLoadNode);
            }
            // Else, create the node to add and
            // start editing
            else
            {
              // Create a new group record
              aNewGroup = new m_aRecordTemplate (aRetObj.payload, aRetObj.payload.id);
              // Add it to the store
              aStore.addSorted (aNewGroup);
              // Start editing
              m_aTreeControl.startEditing (aStore.indexOf(aNewGroup), 0);
            }
          }
          catch (aEx)
          {
            displayErrorMessage (aEx);
          }
          finally
          {
            this.ownerCt.body.unmask ();
          }
        }
      }
    );
  };

  /*
    Protected function that returns the columns definition for the tree.

    \retval An array containing the columns definition for the tree
  */
  //--------------------------------------------------------------------
  this._getColumnsDef = function ()
  //--------------------------------------------------------------------
  {
    return m_aColumnsDef;
  };

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.Tree.superclass.constructor.call(this, aConfig);

  // Remove the eventlistener when an instance is created
  this.on("destroy", function (aTree)
    {
      g_aEvtMgr.un("instancecreated", that._onInstanceCreated);
      g_aEvtMgr.un("instancesdeleted", onInstancesDeleted);
    }
  );
};

// boc.ait.Tree is derived from Ext.Panel
Ext.extend
(
  boc.ait.Tree,
  Ext.Panel,
  {
    // public members:

    /*
        Public method that returns the tree's type
        \retval Either 'objects' or 'diagrams'
    */
    //--------------------------------------------------------------------
    getArtefactType: function ()
    //--------------------------------------------------------------------
    {
      return this._getArtefactType();
    },

    /* Public method that returns the tree's tree control

      \retval The tree control
    */
    //--------------------------------------------------------------------
    getTreeControl : function()
    //--------------------------------------------------------------------
    {
      return this._getTreeControl();
    },

    /* Public method that returns the currently selected node in the tree control

      \retval The currently selected node in the tree control
    */
    //--------------------------------------------------------------------
    getSelectedNodes: function()
    //--------------------------------------------------------------------
    {
      return this._getSelectedNodes();
    },

    /* Public method that returns the editor of the tree control

      \retval The tree editor
    */
    //--------------------------------------------------------------------
    getEditor: function ()
    //--------------------------------------------------------------------
    {
      return this._getEditor();
    },

    /* Public method that opens the create new object dialog

      \param aEvent The event object
      \param aSrcEl The element that was clicked to trigger the event
    */
    //--------------------------------------------------------------------
    openCreateNewObjectDialog : function (aEvent, aSrcEl)
    //--------------------------------------------------------------------
    {
      checkParam (aEvent, "object");
      checkParam (aSrcEl, "object");

      this._openCreateNewObjectDialog (aEvent, aSrcEl);
    },


    /* Public method that refreshes the tree contents
    */
    //--------------------------------------------------------------------
    refresh: function ()
    //--------------------------------------------------------------------
    {
      this._refresh();
    },

    /* Public method that returns the tree's logo area

      \retval The logo area.
    */
    //--------------------------------------------------------------------
    getLogoArea : function ()
    //--------------------------------------------------------------------
    {
      return this._getLogoArea();
    },

    /*
      Public function that retrieves the tree's context menu.

      \retval The tree's context menu
    */
    //--------------------------------------------------------------------
    getContextMenu: function ()
    //--------------------------------------------------------------------
    {
      return this._getContextMenu ();
    },

    /*
      Public function that creates a new folder below the passed parent
      folder.

      \param aParentFolder The target folder for the new folder.
    */
    //--------------------------------------------------------------------
    createFolder : function (aParentFolder)
    //--------------------------------------------------------------------
    {
      return this._createFolder (aParentFolder);
    },

    /*
      Public function that returns the columns definition for the tree.

      \retval An array containing the columns definition for the tree
    */
    //--------------------------------------------------------------------
    getColumnsDef : function ()
    //--------------------------------------------------------------------
    {
      return this._getColumnsDef ();
    }
  }
);

// Register the tree's xtype
Ext.reg("boc-tree", boc.ait.Tree);

// Override for the treegrid grid view so that empty folders are displayed
// correctly and it is not possible to expand them.
Ext.override
(
  Ext.ux.maximgb.tg.GridView,
  {
    renderCellTreeUI : function(record, store)
    {
        var tpl = this.templates.treeui,
            line_tpl = this.templates.elbow_line,
            tpl_data = {},
            rec, parent,
            depth = level = store.getNodeDepth(record);

        tpl_data.wrap_width = (depth + 1) * 16;
        if (level > 0) {
            tpl_data.elbow_line = '';
            rec = record;
            left = 0;
            while(level--) {
                parent = store.getNodeParent(rec);
                if (parent) {
                    if (store.hasNextSiblingNode(parent)) {
                        tpl_data.elbow_line =
                            line_tpl.apply({
                                left : level * 16,
                                cls : 'ux-maximgb-tg-elbow-line'
                            }) +
                            tpl_data.elbow_line;
                    }
                    else {
                        tpl_data.elbow_line =
                            line_tpl.apply({
                                left : level * 16,
                                cls : 'ux-maximgb-tg-elbow-empty'
                            }) +
                            tpl_data.elbow_line;
                    }
                }
                else {
                    throw [
                        "Tree inconsistency can't get level ",
                        level + 1,
                        " node(id=", rec.id, ") parent."
                    ].join("");
                }
                rec = parent;
            }
        }
        if (store.isLeafNode(record)) {
            if (store.hasNextSiblingNode(record)) {
                tpl_data.cls = 'ux-maximgb-tg-elbow';
            }
            else {
                tpl_data.cls = 'ux-maximgb-tg-elbow-end';
            }
        }
        else
        {
          if (!record.get("_empty"))
          {
            tpl_data.cls = 'ux-maximgb-tg-elbow-active ';
          }
          else
          {
            tpl_data.cls = '';
          }
          if (store.isExpandedNode(record))
          {
            if (store.hasNextSiblingNode(record))
            {
              if (!record.get("_empty"))
              {
                tpl_data.cls += this.expanded_icon_class;
              }
              else
              {
                tpl_data.cls+='ux-maximgb-tg-elbow';
              }
            }
            else
            {
              if (!record.get("_empty"))
              {
                tpl_data.cls += this.last_expanded_icon_class;
              }
              else
              {
                tpl_data.cls+='ux-maximgb-tg-elbow-end';
              }
            }
          }
          else
          {
            if (store.hasNextSiblingNode(record))
            {
              if(!record.get("_empty"))
              {
                tpl_data.cls += this.collapsed_icon_class;
              }
              else
              {
                tpl_data.cls+='ux-maximgb-tg-elbow';
              }
            }
            else
            {
              if (!record.get("_empty"))
              {
                tpl_data.cls += this.last_collapsed_icon_class;
              }
              else
              {
                tpl_data.cls += 'ux-maximgb-tg-elbow-end';
              }
            }
          }
        }
        tpl_data.left = 1 + depth * 16;

        return tpl.apply(tpl_data);
    }
  }
);