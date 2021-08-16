/*********************************************************************
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2013\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2013
**********************************************************************
\author MWh
This file contains JS code for the tree component in the Web Client.
**********************************************************************
*/
Ext.namespace("boc.ait");
Ext.namespace("boc.ait._internal.renderers");
Ext.namespace("boc.ait._internal.columns");

boc.ait.Tree = function (aConfig)
{
  var m_nArtefactType = aConfig.artefactType;
  var m_aGrid = null;
  var m_aViewport = null;
  var m_aDataView = new Slick.Data.DataView();
  var m_bInitialized = false;
  var m_bIgnoreClick = false;
  var m_aOldOver = null;
  var m_aTreeBox = null;
  var m_aSearchTextField = null;
  var m_aSearchResult = null;
  var m_aShowTreeButton = null;
  var m_aRefreshButton = null;
  var m_aCreateObjectButton = null;
  var m_bShowRecycleBin = aConfig.showRecycleBin === true;
  
  var m_aElementsToCopy = null;
  
  var that = this;
  
  var m_nOldScrollPos = 0;
  
  // Flags that control the current display state of the tree
  // The tree can display either a tree or a search result
  var DISPLAY_TREE = 0;
  var DISPLAY_SEARCH = 1;
  var m_nDisplayMode = DISPLAY_TREE;
  
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
  function renderVisibleAttribute (nRowIdx, nColIdx, aVal, aColumnDef, aRecord)
  //--------------------------------------------------------------------
  {
    try
    {
      // If the value is a string, return it
      if((typeof aVal) !== "object")
      {
        return aVal;
      }
      var aAttrValInfo = boc.ait.getAttrValInfo (aVal, that.getArtefactType());

      // If we found no info about the current attribute, return an empty string
      if (!aAttrValInfo)
      {
        return "";
      }

      var sVal = aVal.value;
      // Depending on the attribute's type, the visualization changes
      switch (aAttrValInfo.attrtype)
      {
        case "ENUM":
          var nIdx = -1;
          var aIndConstraintVals = aAttrValInfo.constraintLangInd.split("@");
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
          
        case "UTC":
          if (aVal.noValue)
          {
            sVal = "";
            break;
          }
          var aDate = new Date(sVal);
          sVal = aDate.format("d.m.Y");
          break;
          
      }
      // Return the representation of the attribute value
      return sVal;
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
      throw aEx;
    }
  }
   
  // Get a configured double click handler for when the user double clicks an item in the tree
  // By default, the element's notebook is opened or in case of a model, the model is opened
  var m_fnDoubleClickHandler = aConfig.doubleClickHandler || function (aItem, aEvt, aArgs)
  {
    if (that.getArtefactType() === AIT_ARTEFACT_OBJECT)
    {
      g_aMain.getMainArea().openNotebook
      (
        aItem.id,
        that.getArtefactType ()
      );
    }
    else
    {
      g_aMain.getMainArea().openDiagram (aItem.id);
    }
  };

  var m_aEditedItem = null;

  var m_bLoadingNode = false;

  var m_aExpandTask = new Ext.util.DelayedTask
  (
    function (aRecord)
    {
      if (!aRecord.get("_empty"))
      {
        // Get the passed record's store
        //var aStore = aRecord.store;
        // Expand the node
        //aStore.expandNode (aRecord);
        //aStore.setActiveNode (aRecord);
      }
    }
  );

  aConfig.plugins = [boc.ait.plugins.Customizable];

  
  var aCommands =
  [
    "ait_menu_main_open_diagram",
    "ait_menu_main_open_model_editor",
    "ait_menu_main_open_notebook"
  ];
  
  if (!g_aSettings.offline)
  {
    aCommands.push ("ait_request_modelData");
  }
  aCommands = aCommands.concat
  (
    [
      "-",
      "ait_menu_main_used_in_models",
      "-",
      "ait_menu_main_create_folder",
      "ait_menu_main_create_object",
      "ait_menu_main_rename",
      "axw_menu_main_copy",
      "axw_menu_main_paste",
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
  );
  
  var m_aCtxMenu = new boc.ait.menu.Menu
  (
    {
      commands: aCommands
    }
  );


  // Add the visible attributes to the record template
  var m_aVisAttrs = boc.ait.getVisibleAttributes (aConfig.artefactType);

  var RecordTemplate = boc.ait.commons.getArtefactDataTemplate (m_nArtefactType, [{name: 'expanded', type:'bool'},{name: '_empty', type: 'bool'}]);
  
  // Required for backwards compatibility (ZIVIT uses this)
  var m_aTreeControlProps =
  {
    getTopToolbar : function ()
    {
      return that.getTopToolbar ();
    },
    store:
    {
      getById : function (sId)
      {
        return that._getNodeById (sId);
      },

      commitChanges : function ()
      {},

      on : function (sEventName, aFn, aScope)
      {
        return that.on (sEventName, aFn, aScope);
      },

      indexOf : function (aRecord)
      {
        return m_aDataView.getIdxById (aRecord.data.artefactId);
      }
    },

    getSelectionModel : function ()
    {
      return  {
                on: function (sEventName, aFn, aScope)
                {
                  return that.on (sEventName, aFn, aScope);
                }
              };
    },

    updateItem : function (aItem)
    {
      that.updateNode (aItem);
    },

    getColumnModel : function ()
    {
      return  {
                getColumnId : function(nColIdx)
                {
                  return m_aGrid.getColumns()[nColIdx].field;
                }
              };
    },

    getStore : function ()
    {
      return  {
                getAt : function (nRowIdx)
                {
                  //var aItem = m_aDataView.getItemByIdx (nRowIdx);
                  var aItem = m_aDataView.getItem (nRowIdx);
                  return new RecordTemplate (aItem, aItem.id);
                },

                on : function (sEvent, aFn, aScope)
                {
                  return that.on(sEvent, aFn, aScope);
                }
              };
    }
  };

  var TaskNameFormatter = function (nRow, nCell, aValue, aColumnDef, aNode)
  {
    var sSpacer = "<span style='display:inline-block;height:1px;width:" + (15 * aNode.indent) + "px'></span>";

    var sSrc = Ext.BLANK_IMAGE_URL;
    // If the current record is not editable, we want to overlay its icon with a lock
    if (!aNode.editable)
    {
      sSrc = 'images/lock.gif';
    }

    aValue = boc.ait.htmlEncode(aValue);
    
    if (!aNode._is_leaf)
    {
      var sExpand = "";
      var sFolderImg = "images/folder.gif";
      
      if (aNode._empty === true)
      {
        sExpand = "";
      } 
      else if (aNode._exp !== true)
      {
        sExpand = " expand";
      }
      else
      {
        sExpand = " collapse";
        sFolderImg = "images/folder-open.gif";
      }
        
      if (aNode.pool === true)
      {        
        return sSpacer + " <span class='toggle" + sExpand+"'>&nbsp;</span><img id='folder_icon' height='0' style='position:relative; display:inline-block;width:16px;height:18px;background:url(images/recyclebinopen.png) center center transparent no-repeat;' src='"+sSrc+"'>&nbsp;</img>&nbsp;"+aValue;
      }
      
      return sSpacer + " <span class='toggle" + sExpand+"'>&nbsp;</span><img id='folder_icon' height='0' style='position:relative; display:inline-block;width:16px;height:18px;background:url("+sFolderImg+") center center transparent no-repeat;' src='"+sSrc+"'>&nbsp;</img>&nbsp;"+aValue;
    }
    else
    {
      return sSpacer + " <span class='toggle'></span><img class='class_icon' ext:qtip='"+aNode.idClass_lang+"' height='0' style='position:relative; display:inline-block;width:16px;height:18px;background:url("+boc.ait.getIconPath ()+aNode.iconUrl+") center center transparent no-repeat;' src='"+sSrc+"'>&nbsp;</img>&nbsp;"+aValue;
    }
  };


  var BoolCellFormatter = function(nRow, nCell, aValue, aColumnDef, aDataContext)
  {
    //return aValue ? "<img src='scripts/slick/images/tick.png'>" : "";
    if (!aDataContext._is_leaf)
    {
      return "";
    }
    return aValue ? "<img src='images/row-check-checked.png'>" : "<img src='images/row-check-unchecked.png'>";
  };

  var m_aColumnsDef =
  [
    {id:"text", name: getString("axw_name"), field:"text", width:220, cssClass:"cell-title", formatter:TaskNameFormatter, editor:TextCellEditor, sortable:true}
  ];
  
  var m_aAdditionalCols = [];
  
  
  // Add columns for the additional visualized attributes
  for (var i = 0; m_aVisAttrs && i < m_aVisAttrs.length;++i)
  {
    var aVisAttr = m_aVisAttrs[i];
    
    m_aColumnsDef[m_aColumnsDef.length] =
    {
      id: "attr_"+aVisAttr.name.toLowerCase(),
      header: aVisAttr.classname,
      sortable:true,
      field: "attr_"+aVisAttr.name.toLowerCase(),
      formatter: renderVisibleAttribute
    };
  }

  if (aConfig.forRelControl)
  {
    m_aColumnsDef.push
    (
      {
        id:"checkrel", name:"&nbsp;", field:"checkrel", width:20, formatter:BoolCellFormatter
      }
    );
  }

  m_aTreeBox = new Ext.BoxComponent
  (
    {
      autoEl:
      {
        tag:"div",
        style:"height:100%;"
      }
    }
  );
  
  // Required for backwards compatibility (ZIVIT uses this)
  Ext.apply (m_aTreeBox, m_aTreeControlProps);
  
  var rendererToFormatter = function (nRow, nCell, aValue, aColumnDef, aNode)
  {
    if (aValue === null || aValue === undefined)
    {
      aValue = "";
    }
    if ((typeof aValue) !== "object")
    {
      aValue = String(aValue);
    }
    
    aValue.val = aValue.value;
    aValue.ind = aValue.constraintLangInd;
    var aMetadata =
    {
      _column: aColumnDef
    };
    return aColumnDef.renderer (aValue, aMetadata, new RecordTemplate (aNode, aNode.id), nRow, nCell, null);
  };
  
  for (i = 0; i < m_aColumnsDef.length;++i)
  {
    var aDef = m_aColumnsDef[i];
    if (aDef.header)
    {
      aDef.name = aDef.header;
    }
    if (aDef.renderer)
    {
      aDef.formatter = rendererToFormatter ;
    }
    
    if (aDef.width)
    {
      aDef.width*= 2;
    }
    if (aDef.id !== "text" && aDef.field !== "text" && aDef.dataIndex !== "text")
    {
      m_aAdditionalCols.push (aDef);
    }
    
    boc.ait._internal.renderers[aDef.id || aDef.field || aDef.dataIndex] = aDef.formatter;
    boc.ait._internal.columns[aDef.id || aDef.field || aDef.dataIndex] = aDef;
  }

  aConfig.bodyStyle = "padding:0px;margin:0px";

  // Array that will hold our toolbar items
  var aToolBarItems = [];

  // If we are in offline mode, we don't need a toolbar, there are no offline functions for the tree
  if (!g_aSettings.offline)
  {
    // If the tree should be searchable, we add extra controls to the toolbar of the tree
    if (aConfig.searchable)
    {
      // Create a search text field into which the user can type the query to search for
      m_aSearchTextField = new Ext.form.TextField
      (
        {
          emptyText: getString("ait_notebook_relcontrol_search_watermark")
        }
      );
      
      /*
        Private function that performs a search and shows the result
        in the tree area
      */
      //--------------------------------------------------------------------
      var _doSearch = function ()
      //--------------------------------------------------------------------
      {
        // Get the pattern to search for
        var sVal = escapeSearchString(m_aSearchTextField.getValue());
        // If no search string was provided, return
        if (sVal === "")
        {
          return;
        }
        
        // Get a querystring using all globally indexed fields for the current
        // artefact type
        var aQueryObj = boc.ait.getGlobalSearchQuery 
        (
          {
            pattern: sVal,
            artefactType: m_nArtefactType
          }
        );
        
        // Perform the search
        boc.ait.doSearch
        (
          {
            query: aQueryObj.query,
            maskElement: that.getEl().dom,
            callback: function (bSuccess, aResult)
            {
              var aData = {payload:{entries:aResult.entries}};
              
              // Hide the treebox
              m_aTreeBox.hide ();              
              // If there already is a search result, load the new data into it
              if (m_aSearchResult)
              {
                m_aSearchResult.loadData (aData);
                // Show the search result
                m_aSearchResult.setVisible (true);
              }
              else
              {
                var aSearchResCfg =
                {
                  renderName : function (sValue, aMetadata, aRecord)
                  {
                    return sValue;
                  },
                  nameCellClick: Ext.emptyFn,
                  doubleClickHandler: m_fnDoubleClickHandler,
                  anchor:"100% 100%",
                  filterFn: aConfig.filterFn,
                  scope: aConfig.scope,
                  additionalResultColumns: m_aAdditionalCols
                };
                
                Ext.apply (aSearchResCfg, aConfig.searchResConfig || {});

                aSearchResCfg.optimiseForSlickGrid = true;
                aSearchResCfg.resultData = {payload:{entries:aResult.entries}};

                // Otherwise create a new search result
                m_aSearchResult = new boc.ait.search.SearchResult (aSearchResCfg);
                m_aSearchResult.on("selectionchange", function ()
                  {
                    that.fireEvent
                    (
                      'selectionchange',
                      that,
                      {
                        getSelected : function ()
                        {
                          var aSelNodes = that.getSelectedNodes ();
                          if (aSelNodes.length === 0)
                          {
                            return null;
                          }
                          else
                          {
                            return aSelNodes[0];
                          }
                        }
                      }
                    );
                  }
                );
                that.add (m_aSearchResult);
              }
              that.doLayout ();
              m_nDisplayMode = DISPLAY_SEARCH;
              // Show the showtree button
              m_aShowTreeButton.enable ();
              // Hide the refresh button
              m_aRefreshButton.disable ();
              // If there is a create object button, disable it
              if (m_aCreateObjectButton)
              {
                m_aCreateObjectButton.disable ();
              }
            }//,
            //scope: this
          }
        );
      };
      
      // Add an event handler for the enter key in the search textfield
      m_aSearchTextField.on("afterrender", function (aField)
        {          
          new Ext.KeyMap
          (
            aField.getEl(),
            {
              key: Ext.EventObject.ENTER,
              fn: _doSearch,
              scope: that
            }
          );
        }
      );
      
      aToolBarItems.push (m_aSearchTextField);
      
      // Add a search button
      aToolBarItems.push 
      (
        new Ext.Toolbar.Button
        (
          {
            iconCls: 'ait_search',
            tooltip: getString("ait_tools_explorer_tip_search"),
            handler: _doSearch,
            scope:this
          }
        )
      );
      // Add a show tree button that switches back to the tree view
      m_aShowTreeButton = new Ext.Toolbar.Button
      (
        {
          text: getString("ait_notebook_relcontrol_show_tree"),
          // Disable the button by default. If the search control is used primarily in the relations dialogue,
          // enable the button
          disabled: true,
          scope: this,
          // Add a handler for the button that hides the search result and shows the target tree instead
          handler: function (aBtn)
          {
            if (m_nDisplayMode === DISPLAY_SEARCH)
            {
              m_aSearchResult.hide();

              // If the relation target tree is not rendered yet (meaning the search view is shown primarily)
              // we have to add the relations tree, then do a relayout of the tree panel
              // Otherwise, we simply set the reltree's visibility to true
              m_aTreeBox.setVisible (true);
              if (!m_aTreeBox.rendered)
              {
                that.add (m_aTreeBox);
              }
              m_aRefreshButton.enable();
              if (m_aCreateObjectButton)
              {
                m_aCreateObjectButton.enable ();
              }
              m_nDisplayMode = DISPLAY_TREE;
              that.doLayout ();
            }
            aBtn.disable();
          }
        }
      );
      aToolBarItems.push (m_aShowTreeButton);
    }
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

    if (m_nArtefactType == AIT_ARTEFACT_OBJECT  &&
        g_aSettings.creatableClasses            &&
        g_aSettings.creatableClasses.length > 0 &&
        g_aSettings.allowCreatingNewObjects     &&
        aConfig.newObjectTool)
    {
      // Create the new object tool
      m_aCreateObjectButton = new Ext.Toolbar.Button
      (
        {
          iconCls: 'ait_newobject',
          tooltip: getString("ait_tools_explorer_tip_create_object"),
          handler: that.openCreateNewObjectDialog,
          scope: that
        }
      );
      
      aToolBarItems.push (m_aCreateObjectButton);
    }

    // Create the refresh toolbar item
    m_aRefreshButton = new Ext.Toolbar.Button
    (
      {
        iconCls: 'ait_refresh',
        tooltip: getString("ait_tools_explorer_tip_refresh"),
        scope: that,
        handler: that.refresh
      }
    );
    aToolBarItems.push (m_aRefreshButton);
  }

  var nMod = 1;
  var sField = "text";

  function comparer (a, b)
  {
    if (a.indent !== b.indent)
    {
      return (a.indent - b.indent) * nMod;
    }
    if (!a._is_leaf && b._is_leaf)
    {
      return -1 * nMod;
    }
    else if (a._is_leaf && !b._is_leaf)
    {
      return 1 * nMod;
    }
    
    if (a.pool && !b.pool)
    {
      return 1 * nMod;
    }
    else if (!a.pool && b.pool)
    {
      return -1 * nMod;
    }

    var s1,s2;
    s1 = a[sField];//.toLowerCase();
    s2 = b[sField];//.toLowerCase();
    if (typeof s1 === "object")
    {
      s1 = s1.val;
    }

    if (typeof s2 === "object")
    {
      s2  = s2.val;
    }

    if (typeof s1 === "string")
    {
      s1 = germanize(s1.toLowerCase ());
    }

    if (typeof s2 === "string")
    {
      s2 = germanize(s2.toLowerCase ());
    }



    return s1 > s2 ? 1 : (s1 < s2 ? -1 : 0);
  }

  function doLiveTreeSort (aItems)
  {
    function getTreeStructure (aParent, nItemIdx, nParentIdx, aRecords)
    {
      for (var i = nItemIdx; i < aItems.length;++i)
      {
        if (aItems[i]._parent === aParent.id)
        {
          aItems[i].parent = nParentIdx;
          aItems[i]._visible = true;
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
    if (nMod === -1)
    {
      aItems.reverse();
    }

    aItems.sort(comparer);


    if (nMod === -1)
    {
      aItems.reverse();
    }

    for (var i = 0; i < aItems.length;++i)
    {
      if (aItems[i].indent === 0)
      {
        aRecords.push (aItems[i]);
        aItems[i].parent = null;
        getTreeStructure (aItems[i], i, aRecords.length-1, aRecords);
      }
    }

    m_aDataView.setItems (aRecords, "id");
  }
  
  /*
    Private function that iterates through passed folders and checks whether
    any of them are empty. If they are empty, it is ensured that they are
    visualized correctly in the tree.
    
    \param aFolderMap A js hashmap containing the ids of folders
  */
  //--------------------------------------------------------------------
  var checkAndHandleEmptyGroups = function (aFolderMap)
  //--------------------------------------------------------------------
  {
    // Iterate through all parent ids in the paret
    for (var sFolderId in aFolderMap)
    {
      // Get the folder
      var aFolder = m_aDataView.getItemById (sFolderId);
      if (!aFolder)
      {
        continue;
      }
      // Get the folder's children
      var aChildren = that.getChildNodes (aFolder, false);
      // If the folder is empty, make sure that it is visualized correctly
      if (aChildren.length === 0)
      {
        aFolder._empty = true;
        aFolder._loaded = true;
        m_aDataView.updateItem (aFolder.id, aFolder);
      }
    }
  };
    
  /*
    Inner function that is executed when elements are pasted to the tree.
    Currently this only refreshes the tree, have to wait for a platform CR
    to be finished to beef up this method.
    
    \params aParams An object containing parameters for this function:
      artefactType: The artefactType of the tree to paste into
  */
  //--------------------------------------------------------------------
  var onArtefactsPasted = function (aParams)
  //--------------------------------------------------------------------
  {
    // If the current artefacttype does not match the passed artefacttype, return here
    if (that.getArtefactType () !== aParams.artefactType)
    {
      return;
    }
    
    that.refresh ();
  };

  var onInstancesDeleted = function (aDeletedInstanceIDs, sNewParentId)
  {
    // Create a parent map to store all parents that were modified by the deletion of instances
    var aParentMap = {};
    // Get the active tree's store
    for (var i = 0; i < aDeletedInstanceIDs.length;++i)
    {
      var aNode = m_aDataView.getItemById (aDeletedInstanceIDs[i]);
      if (aNode)
      {
        // Add the current node's parent to the parent map
        aParentMap[aNode._parent] = true;
        if (g_aSettings.useRecycleBin)
        {
          aNode._parent = sNewParentId;
        }
        else
        {
          m_aDataView.deleteItem (aNode.id);
        }
      }
    }
    doLiveTreeSort ( m_aDataView.getItems ());
    
    // Check and handle all empty parents in the parent map
    checkAndHandleEmptyGroups (aParentMap);
  };
  
  g_aEvtMgr.on("instancesdeleted", onInstancesDeleted);
  
  // Create a new event listener for when artefact are pasted to the tree
  g_aEvtMgr.on("axw.after.artefacts.pasted", onArtefactsPasted);
  
  if (m_nArtefactType === AIT_ARTEFACT_OBJECT)
  {
    that._onInstanceCreated = function(aCreatedInst)
    {
      if (!m_aDataView)
      {
        return;
      }
      
      var aPInfo = aCreatedInst.parentInformation;
      // Check if a parent information was provided for the created instance
      while (aPInfo)
      {
        // Get the current parent information
        var aParentParent = m_aDataView.getItemById (aPInfo._parent);
        if (aParentParent)
        {
          var aCurParent = m_aDataView.getItemById (aPInfo.id);
          // If the current parent is already contained in the tree, break.
          if (aCurParent)
          {
            break;
          }
          // Otherwise, add the parent to the tree
          var nParentIdx = m_aDataView.getIdxById (aParentParent.id); 
          aPInfo.indent = aParentParent.indent+1;
          aPInfo._is_leaf = false;
          aPInfo.artefactType = AIT_ARTEFACT_OBJECT_GROUP;
          
          if (aParentParent._empty)
          {
            aParentParent._empty = false;
            aParentParent._loaded = false;
            aParentParent._exp = false;
            m_aDataView.updateItem (aParentParent.id, aParentParent);
          }
          else if (aParentParent._exp || aParentParent._loaded)
          {
            m_aDataView.insertItem (nParentIdx+1, aPInfo);
            doLiveTreeSort (m_aDataView.getItems ());
          }
          break;
        }
        aPInfo = aPInfo.parentInformation;
      }
      var aParent = m_aDataView.getItemById (aCreatedInst._parent);
      if (!aParent)
      {
        return;
      }

      var bIsLoaded = (aParent._loaded) === true && (aParent._empty === false);
      
      function addInst ()
      {
        if (aParent._loaded !== true)
        {
          return;
        }
        
        var nParentIdx = m_aDataView.getIdxById (aParent.id);
        
        aCreatedInst.indent = aParent.indent+1;
        aCreatedInst._is_leaf = true;
        aCreatedInst.artefactType = AIT_ARTEFACT_OBJECT;
        m_aDataView.insertItem (nParentIdx + 1, aCreatedInst);
        doLiveTreeSort (m_aDataView.getItems ());
      }
      if (!bIsLoaded)
      {
        if (aParent._empty)
        {
          aParent._loaded = false;
          aParent._exp = false;
        }
        aParent._empty = false;
        that._expandNode (aParent);
      }
      else if (aParent._exp !== true)
      {
        // Expand the parent folder
        that._expandNode (aParent, addInst);
      }
      else
      {
        addInst ();
      }
    };
    
    g_aEvtMgr.on("instancecreated", that._onInstanceCreated, that);
  }

  // Create the toolbar only if we have toolbar items and no header is to be shown for this tree
  if (aToolBarItems.length > 0 && aConfig.header !== false)
  {
    aConfig.tbar = new Ext.Toolbar (aToolBarItems);
  }

  aConfig.items = m_aTreeBox;

  var bDblClick = false;
  var sOldText = "";
  
  function _processTreeData (aRoot, aNodes, aOptions)
  {
    that.fireEvent ("beforeload", that, aOptions);

    var aItems = m_aDataView.getItems ();

    var nItemIdx = m_aDataView.getIdxById(aRoot.id);

    aNodes.sort(comparer);

    var nInsertIdx = nItemIdx+1;
    for (var i = nInsertIdx; i < aItems.length;++i)
    {
      if (aItems[i]._is_leaf || aItems[i].indent <= aRoot.indent)
      {
        nInsertIdx = i;
        break;
      }
    }

    for (i = aNodes.length-1; i >= 0;--i)
    {
      aNodes[i].parent = nItemIdx;
    }


    var aPre = aItems.slice (0, nInsertIdx);
    var aPost = aItems.slice (nInsertIdx, aItems.length);


    aItems = aPre.concat(aNodes).concat(aPost);

    aRoot._exp = !aRoot._exp;
    aRoot._loaded = true;

    that.fireEvent ("load", that, aItems, aOptions);
    m_aDataView.setItems (aItems);
    m_aDataView.updateItem (aRoot.id, aRoot);
  }
  
  function _loadOfflineFolderData (aRoot)
  {
    loadOfflineData.defer
    (
      20,
      window,
      [
        {url:'../data/group_'+aRoot.artefactId.replace(/[\{\}]/g, "")+'_'+g_aSettings.lang+'.ajson', loaded: false},
        /*
          Callback function that is called when the json file for the current group
          is loaded.
        */
        function ()
        {
          var aNodes = (aRoot.artefactType === AIT_ARTEFACT_DIAGRAM_GROUP) ? g_aOfflineData.modelGroups[aRoot.artefactId] : g_aOfflineData.objectGroups[aRoot.artefactId];
          m_bLoadingNode = true;
          try
          {
            _processTreeData.call (that, aRoot, aNodes, null);
          }
          finally
          {
            m_bLoadingNode = false;
          }
        }
      ]
    );
  }

  this._expandNode = function (aRoot, aCallback, aScope)
  {
    aScope = aScope || this;

    aRoot = m_aDataView.getItemById (aRoot.id);
    
    if (aRoot._exp !== true && aRoot._loaded !== true && aRoot._empty !== true)
    {
      if (m_bLoadingNode)
      {
        return;
      }

      var nRow = m_aDataView.getRowById (aRoot.id);
      var aCell = m_aGrid.getCellNode (nRow, 0);

      var aSpan = $("#folder_icon", aCell);
      aSpan.addClass ('boc-folder-loading');
      
      if (g_aSettings.offline)
      {
        // If we are in offline mode, we have to load additional records from the offline data source
        // (= JSON files)
        if(g_aSettings.offline)
        {
          // Ignore the nodes on root level as they are already loaded
          if (aRoot.artefactId !== null )
          {
            // Ignore already loaded nodes
            if (!aRoot._loaded)
            {
              _loadOfflineFolderData.defer (20, this, [aRoot]);

              // Return false so that the expanding is cancelled. This is required because we first
              // have to load the offline data (assynchronously)
              return false;
            }
          }
        }
        return;
      }
      Ext.Ajax.request
      (
        {
          url:"proxy",
          method:"POST",
          params:
          {
            type: "livetoc",
            params:Ext.encode
            (
              {
                artefactType: m_nArtefactType,
                refresh: false,
                forRelClassInfo: aConfig.forRelClassInfo,
                groupId: aRoot.id,
                indent: aRoot.indent+1,
                hideLeafs: aConfig.hideLeafs,
                classes: aConfig.classes,
                showRecycleBin: m_bShowRecycleBin,
                ignoredElements: aConfig.ignoredElements
              }
            )
          },
          scope:this,
          success: function (aResponse, aOptions)
          {
            try
            {
              m_bLoadingNode = true;
              _processTreeData.call (this, aRoot, Ext.decode (aResponse.responseText).payload, aOptions);
            }
            catch (aEx)
            {
              displayErrorMessage (aEx);
            }
            finally
            {
              m_bLoadingNode = false;
            }

            if (aCallback)
            {
              aCallback.call (this, new RecordTemplate (aRoot, aRoot.id));
            }
          },
          failure: function (aResponse)
          {
            m_bLoadingNode = false;
            m_aDataView.updateItem (aRoot.id, aRoot);
          }
        }
      );
    }
    else
    {
      aRoot._exp = !aRoot._exp;
      aRoot._loaded = true;
      aRoot._empty = false;

      m_aDataView.updateItem(aRoot.id, aRoot);

      if (aCallback)
      {
        aCallback.call (aScope);
      }
    }
  };
  
  /*
    Private function that activates edit mode for the currently selected tree cell.
    Makes sure that edit mode is stopped after the editor loses the focus
  */
  //--------------------------------------------------------------------
  function editActiveTreeCell ()
  //--------------------------------------------------------------------
  {
    // Start editing the active cell
    m_aGrid.editActiveCell();
    // Get the editor element
    var aEditor = Ext.DomQuery.selectNode("input.editor-text", m_aViewport.dom);
    // Attach a blur event handler to the editor
    Ext.get(aEditor).on("blur", function ()
      {
        var aCtrl = m_aGrid.getEditController ();
        if (aCtrl)
        {
          aCtrl.commitCurrentEdit ();
        }
      }
    );
  }
  
  function onRowsChangedHandler (aEvt, aArgs)
  {
    m_aGrid.invalidateRows(aArgs.rows);
    m_aGrid.render();
  }

  function fillTree (aData)
  {
    if (m_bInitialized)
    {
      m_aGrid.invalidateAllRows ();
      doLiveTreeSort ([]);
      doLiveTreeSort (aData);
      m_aGrid.render ();
      that.getEl().unmask ();
      return;
    }

    var data = aData;

    var options =
    {
      enableColumnReorder: false,
      forceFitColumns:true,
      multiSelect:true,
      editable: false,
      autoEdit:false,
      //enableAddRow: true,
      enableCellNavigation: true,
      asyncEditorLoading: false
    };


    function myFilter(aItem)
    {
      if (aItem.parent !== null)
      {
        //var parent = data[item.parent];
        var aParent = m_aDataView.getItemById (aItem._parent);

        while (aParent)
        {
          if (aParent._exp !== true)
          {
            return false;
          }

          aParent = m_aDataView.getItemById(aParent._parent);
        }
      }

      // Execute a custom filter function if one was passed
      if (typeof aConfig.filterFn === "function")
      {
        var aScope = aConfig.filterScope || that;
        return aConfig.filterFn.call (aScope, aItem);
      }

      return true;
    }


    // initialize the model
    if (m_bInitialized)
    {
      m_aGrid.setData (data, true);
      that.fireEvent ("load", that, data);
    }
    m_aDataView.beginUpdate();
    m_aDataView.setFilter(myFilter);
    m_aDataView.setItems(data);
    doLiveTreeSort (data);
    m_aDataView.endUpdate();
    
    // initialize the grid
    if (!m_bInitialized)
    {
      m_aGrid = new Slick.Grid(m_aTreeBox.getEl().dom, m_aDataView, m_aColumnsDef, options);
      
      m_aViewport = Ext.get(m_aGrid.getCanvasNode().parentNode);
      
      // Fix for CR 053882 - Only relevant for IE8, here we have to store the last scroll position
      if (Ext.isIE8)
      {
        m_aViewport.on("scroll", function ()
          {
            m_nOldScrollPos = m_aViewport.dom.scrollTop;
          }
        );
      }
      //var aPicker = new Slick.Controls.ColumnPicker(m_aColumnsDef, m_aGrid, options);
      var aSelMod = new Slick.RowSelectionModel ();
      m_aGrid.setSelectionModel(aSelMod);

      m_aGrid.onSelectedRowsChanged.subscribe
      (
        function (aEvt, aArgs)
        {
          that.fireEvent
          (
            'selectionchange',
            that,
            {
              getSelected : function ()
              {
                var aSelNodes = that.getSelectedNodes ();
                if (aSelNodes.length === 0)
                {
                  return null;
                }
                else
                {
                  return aSelNodes[0];
                }
              }
            }
          );
        }
      );

      var aCanvas = $("div.grid-canvas", m_aTreeBox.getEl().dom);
      aCanvas.unbind("draginit dragstart dragend drag");

      var canDrop = function (aDragData, aOverRecord)
      {
        if (g_aSettings.allowMoving === false)
        {
          return false;
        }
        if (aDragData.grid !== m_aGrid)
        {
          return false;
        }
        if (!aOverRecord)
        {
          return false;
        }

        if ( aOverRecord.get("_is_leaf") || aOverRecord.get("pool"))
        {
          return false;
        }
        if ( Ext.isEmpty(aOverRecord) )
        {
          return true;
        }
        
        var aRec = null;
        var aDraggedRecords = aDragData.selections;
        for (var i = 0; i < aDraggedRecords.length;++i)
        {
          aRec = aDraggedRecords[i];
          if (aRec.get("pool"))
          {
            return false;
          }

          if (aRec.get("_parent") === aOverRecord.get("id"))
          {
            return false;
          }
          if (aRec.get("id") === aOverRecord.get("id"))
          {
            return false;
          }
        }

        if  ( aOverRecord.isNew )
        {
          return false;
        }

        var aParentList = [];

        var aCurRec = aOverRecord.data;


        while (aCurRec.parent !== null)
        {
          var aParent = m_aDataView.getItemById(aCurRec._parent);
          aParentList.push (aParent);
          aCurRec = aParent;
        }


        for (i = 0; i < aDraggedRecords.length;++i)
        {
          aRec = aDraggedRecords[i];
          if (aRec.get("_is_leaf"))
          {
            continue;
          }

          for (var j = 0; j < aParentList.length;++j)
          {
            if (aParentList[j].id === aRec.get("id"))
            {
              return false;
            }
          }
        }
        
        return true;
      };

      // Fix for CR #052309
      var aViewport = Ext.DomQuery.selectNode ("div.slick-viewport", m_aTreeBox.getEl().dom);
      aViewport.ddScrollConfig =
      {
        vthresh: 20,
        hthresh: -1,
        increment: 75,
        frequency : 200
      };
      Ext.dd.ScrollManager.register (aViewport);
      
      
        m_aTreeBox.dragZone = new Ext.dd.DragZone
      (
        m_aTreeBox.getEl(),
        {
          ddGroup: aConfig.forRelControl ? "relTreeDrag":"treeDrag",


          //      On receipt of a mousedown event, see if it is within a draggable element.
          //      Return a drag data object if so. The data object can contain arbitrary application
          //      data, but it should also contain a DOM element in the ddel property to provide
          //      a proxy to drag.
          getDragData: function(aEvt)
          {
            if (aEvt.ctrlKey || aEvt.shiftKey)
            {
              return;
            }
            var aCell = m_aGrid.getCellFromEvent (aEvt);

            if (!aCell || aCell.cell !== 0)
            {
              return;
            }

            var aSourceEl = m_aGrid.getCellNode ( aCell.row, 0);
            if (aSourceEl.firstChild && aSourceEl.firstChild.nodeName.toLowerCase() === "input")
            {
              return;
            }

            var aRecs = that.getSelectedNodes ();
            if (aRecs.length === 0 || !Ext.get(aSourceEl).hasClass("selected"))
            {
              m_bIgnoreClick = true;

              m_aGrid.setSelectedRows([aCell.row]);
              m_aGrid.setActiveCell (aCell.row, 0);
              aRecs = that.getSelectedNodes ();
            }

            if (aRecs.length === 0)
            {
              return;
            }
            var aTags = [];

            for (var i = 0; i < aRecs.length;++i)
            {
              aTags[i] =
              {
                tag:'p',
                html:aRecs[i].get("text")
              };
            }

            var aDragElement = Ext.DomHelper.createDom
            (
              {
                tag: 'div',
                children:aTags
              }
            );
            aDragElement.id = Ext.id();
            m_aTreeBox.dragData =  
            {
              sourceEl: aSourceEl,
              repairXY: Ext.fly(aSourceEl).getXY(),
              ddel: aDragElement,
              selections: aRecs,
              grid: m_aGrid,
              params: {tree:that}
            };
            
            return m_aTreeBox.dragData;
          },

          //      Provide coordinates for the proxy to slide back to on failed drag.
          //      This is the original XY coordinates of the draggable element.
          getRepairXY: function()
          {
            return this.dragData.repairXY;
          }
        }
      );

      if (!aConfig.forRelControl && !g_aSettings.offline)
      {
        new Ext.dd.DropTarget(m_aTreeBox.getEl(),
        {
          ddGroup: "treeDrag",

          notifyOut: function ()
          {
            // Cancel any expand task when an element is dragged out of the tree
            m_aExpandTask.cancel ();
          },

          notifyOver: function(aDragSource, aEvent, aData)
          {
            var sCls = Ext.dd.DropZone.prototype.dropNotAllowed;

            var aTarget = aEvent.getTarget();
            var aCell = m_aGrid.getCellFromEvent(aEvent);
            if(!aCell)
            {
              return;
            }

            var nRowIndex = aCell.row;

            var aNode = m_aDataView.getItem (nRowIndex);
            var aOverRecord = new RecordTemplate (aNode, aNode.id);
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
            
            var aCell = m_aGrid.getCellFromEvent (aEvent);
            if (!aCell)
            {
              return;
            }
            var nRowIndex = aCell.row;

            var aNode = m_aDataView.getItem (nRowIndex);
            var aOverRecord = new RecordTemplate (aNode, aNode.id);


            if ( canDrop(aDragSource.dragData, aOverRecord))
            {
              var aDropFn = function()
              {
                // Get the owner container of the tree
                var aOwner = m_aTreeBox.ownerCt;

                // Mask the owner's body
                aOwner.body.mask(getString("ait_loading"), 'x-mask-loading');

                var sParentId = aOverRecord.get('id');
                var aArtefacts = [];
                for (var i = 0; i < aDraggedRecords.length;++i)
                {
                  var aDraggedRecord = aDraggedRecords[i];
                  var aOldParent =
                  {
                    id: aDraggedRecord.get("_parent")
                  };
                  aArtefacts[aArtefacts.length] =
                  {
                    artefactID: aDraggedRecord.get("id"),
                    oldParent: aOldParent,
                    artefactType: (aDraggedRecord.get("_is_leaf") ? m_nArtefactType : (m_nArtefactType == AIT_ARTEFACT_OBJECT ? AIT_ARTEFACT_OBJECT_GROUP : AIT_ARTEFACT_DIAGRAM_GROUP))
                  };
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
                            id: sParentId
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

                        var aNewParent = m_aDataView.getItemById (aRetObj.payload.id);
                        var nNewParentIdx = m_aDataView.getIdxById (aNewParent.id);
                        
                        // Create a parent container that contains all parents manipulated by the drag/drop operation
                        var aParentMap = {};
    
                        for (var i = 0; i < aDraggedRecords.length;++i)
                        {
                          // Add the current node's parent to the parent map
                          aParentMap[aDraggedRecords[i].get("_parent")] = true;
                          aDraggedRecords[i].set("_parent", aRetObj.payload.id);
                          var aDraggedNode = m_aDataView.getItemById(aDraggedRecords[i].get("id"));
                          m_aDataView.deleteItem (aDraggedNode.id);

                          // Make sure the dragged records' new parent is not marked empty
                          aNewParent._empty = false;
                          aDraggedNode.parent = m_aDataView.getIdxById(aOverRecord.id);
                          aDraggedNode.indent = aNewParent.indent+1;
                          aDraggedNode._parent = aRetObj.payload.id;

                          m_aDataView.insertItem (nNewParentIdx+1, aDraggedNode);
                        }
                        m_aDataView.updateItem (aNewParent.id, aNewParent);

                        doLiveTreeSort (m_aDataView.getItems ());
                        // Check and handle all empty parents in the map
                        checkAndHandleEmptyGroups (aParentMap);
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
              };

              //var bExpanded = aStore.isExpandedNode(aOverRecord);
              if ( aNode._exp !== true)
              {
                this.expandAndApply(aNode, aDropFn);
              }
              else
              {
                aDropFn();
              }
              return true;
            }
          },

          expandAndApply: function(aNode, aDropFn)
          {
            if ( !aNode)
            {
              aDropFn();
              return;
            }
            // Special handling when a CR 048552 is already loaded but not expanded. The tree grid in this case
            // does not call the expandnodecallback, so we call the dropFn here explicitly.
            //if (aStore.isLoadedNode (aRecord))
            if (aNode._loaded)
            {
              aDropFn ();
            }
            else
            {
              that._expandNode (aNode, aDropFn);
            }
          }
        }
        );
      }

      // wire up model events to drive the m_aGrid
      m_aDataView.onRowCountChanged.subscribe
      (
        function(e,args)
        {
          m_aGrid.updateRowCount();
          m_aGrid.render();
        }
      );

      m_aDataView.onRowsChanged.subscribe (onRowsChangedHandler);

      m_aGrid.onSort.subscribe
      (
        function(e, data)
        {
          nMod = data.sortAsc ? 1 : -1;
          sField = data.sortCol.field;

          doLiveTreeSort (m_aDataView.getItems());
        }
      );

      m_aGrid.onContextMenu.subscribe
      (
        function (aEvt, aArgs)
        {
          var aCell = m_aGrid.getCellFromEvent (aEvt);
          if (!aCell)
          {
            return false;
          }
          var nRow = aCell.row;

          var aNode = m_aGrid.getCellNode (nRow, 0);
          if (!Ext.get(aNode).hasClass("selected"))
          {
            m_aGrid.setSelectedRows([nRow]);
            m_aGrid.setActiveCell (nRow, 0);
          }

          try
          {
            // Only continue if we need a context menu
            if (aConfig.showContextMenu)
            {
              //var aSelectionModel = m_aTreeControl.getSelectionModel();
              //if (!aSelectionModel.isSelected (nRowIndex))
              //{
              //  aSelectionModel.selectRow (nRowIndex);
              //}
              // Create a new instance of the main menu
              //var aMainMenu = new boc.ait.menu.MainMenu();
              // Get the actual menu from the mainmenu object
              //var aMenu = aMainMenu.getInnerMenu();
              var aMenu = m_aCtxMenu.menu;
              
              m_aCtxMenu.setContext (that.getSelectedNodes ());
              m_aCtxMenu.setParams ("ownerComp", that);

              aMenu.showAt([aEvt.clientX, aEvt.clientY]);
            }
          }
          catch (aEx)
          {
            displayErrorMessage (aEx);
          }

          aEvt.preventDefault ();
          return false;
        }
      );

      m_aGrid.onDblClick.subscribe
      (
        function (aEvt, aArgs)
        {
          bDblClick = true;

          var aItem = m_aDataView.getItem (aArgs.row);
          if (aItem._is_leaf && !aConfig.forRelControl)
          {
            var aRecord = new RecordTemplate (aItem, aItem.id);
            m_fnDoubleClickHandler.call (that, aRecord, aEvt, aArgs);
          }
          else if (!aItem._is_leaf && !aItem._empty)
          {
            that._expandNode (aItem);
          }          
        }
      );

      m_aGrid.onBeforeEditCell.subscribe
      (
        function (e,args)
        {
          if ($(e.target).hasClass("toggle"))
          {
            return false;
          }
        }
      );

      m_aGrid.onBeforeCellEditorDestroy.subscribe
      (
        function (aEvt, aArgs)
        {
          // Return if there is no owner container anymore
          if (!that.ownerCt)
          {
            return;
          }
          // CR 052656:
          // We excplicitly set the edited item to null after it is being edited (see below)
          // So, if there is no current edited item, we return here
          if (!m_aEditedItem)
          {
            return;
          }
          var aItem = m_aEditedItem;
          try
          {

            var sText = aArgs.editor.getValue ();
            
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
              aItem.text = sOldText;
              that.updateNode ({id:aItem.id, data:aItem});
              // Unmask the catalog tabs
              that.ownerCt.body.unmask ();
            };

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

              aItem.text = sText;

              that.updateNode ({id:aItem.id, data:aItem});
              //m_aTreeControl.store.commitChanges();
              // Unmask the catalog tabs
              that.ownerCt.body.unmask ();
            };
            
            if (sText === sOldText)
            {
              return;
            }

            // Fix for CR #052213 - If no name is entered during a rename, reset the value of the
            // node to the node's old name
            if (sText === "")
            {
              showErrorBox (getString("ait_tree_no_empty_name"));
              aItem.text = sOldText;
              that.updateNode ({id:aItem.id, data:aItem});
              return;
            }
            
            sText = boc.ait.stripIllegalCharacters (sText);


            that.ownerCt.body.mask(getString("ait_loading"), 'x-mask-loading');

            var bError = false;
            try
            {
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
                        targetType: aItem.artefactType,
                        id: aItem.id,
                        val: sText
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
            }
            catch (aEx)
            {
              displayErrorMessage (aEx);
              bError = true;
            }
            finally
            {
              if (bError)
              {
                that.ownerCt.body.unmask ();
              }
            }
          }
          finally
          {
            m_aGrid.getOptions().editable = false;
            // CR 052656:
            // After editing the item is done, we set the current edited item to null to avoid
            // editing a wrong element
            m_aEditedItem = null;
          }
        }
      );

      m_aGrid.onCellChange.subscribe
      (
        function(e,args)
        {
          m_aDataView.updateItem(args.item.id,args.item);
        }
      );

      m_aGrid.onClick.subscribe
      (
        function(aEvt,aArgs)
        {
          var aItem = m_aDataView.getItem (aArgs.row);

          if ($(aEvt.target).hasClass("toggle"))
          {
            if (aItem && !aItem._empty)
            {
              that._expandNode (aItem);
            }
            aEvt.stopPropagation();
            aEvt.stopImmediatePropagation ();
            aEvt.preventDefault();
            return;
          }
          else if (aArgs.cell !== 0 /*|| aConfig.forRelControl*/)
          {
            m_aTreeBox.fireEvent ("cellclick", m_aTreeBox, aArgs.row, aArgs.cell, aEvt);
            return;
          }
          else if (aItem)
          {
            if (m_bIgnoreClick)
            {
              m_bIgnoreClick = false;
              return;
            }
            var aSelRows = m_aGrid.getSelectedRows();
            if (aSelRows.length === 1 && aSelRows[0] === aArgs.row && !g_aSettings.offline)
            {
              var doEdit = function  ()
              {
                if (bDblClick)
                {
                  var turnOffDblClick = function()
                  {
                    bDblClick = false;
                  };

                  window.setTimeout(turnOffDblClick, 200);
                  return;
                }

                aEvt.stopPropagation();

                aEvt.stopImmediatePropagation();
                aEvt.preventDefault();
                if (!aItem.editable || !g_aSettings.allowRenaming || aItem.pool)
                {
                  return;
                }

                m_aGrid.getOptions().editable = true;
                try
                {
                  sOldText = aItem.text;
                  m_aEditedItem = aItem;
                  editActiveTreeCell ();
                }
                catch (aEx)
                {
                  m_aGrid.getOptions().editable = false;
                }
              };
              window.setTimeout(doEdit, 200);
            }
          }
        }
      );

      m_aGrid.onKeyDown.subscribe
      (
        function (aEvt, aArgs)
        {
          if (aConfig.forRelControl || g_aSettings.offline)
          {
            return;
          }

          var aSel = that.getSelectedNodes ();

          if (aSel.length < 1)
          {
            return;
          }
          var aNode = aSel[0].data;
          var nRow = m_aDataView.getIdxById (aNode.id);

          var aSourceEl = m_aGrid.getCellNode ( nRow, 0);
          if (aSourceEl && aSourceEl.firstChild && aSourceEl.firstChild.nodeName.toLowerCase() === "input")
          {
            // Fix for CR #055168 - Not possible to use arrow keys (left/right) when input field is active
            switch (aEvt.keyCode)
            {
              case 27:
                  aNode.text = sOldText;
                  that.updateNode ({id:aNode.id, data:aNode});
                  break;
              case 37:
              case 39:
                aEvt.stopImmediatePropagation();
                break;
            }
            return;
          }
          
          // Handle copy command
          if (aEvt.keyCode === 67 && aEvt.ctrlKey) // CTRL - C -> Copy
          {
            if (boc.ait.checkCopyFn (that))
            {
              that.setElementsToCopy (aSel);
            }
          }
          
          // The following options are only valid, if there is exactly one element selected
          if (aSel.length !== 1)
          {
            return;
          }
          
          // Handle paste command
          if (aEvt.keyCode === 86 && aEvt.ctrlKey) // CTRL - V -> Paste
          {
            if (boc.ait.checkPasteFn (that))
            {
              // Do the actual copy/pasting of elements
              boc.ait.pasteArtefactsToGroup
              (
                {
                  artefactType: that.getArtefactType (),
                  targetGroupId: aSel[0].get ("artefactId"),
                  elements: that.getElementsToCopy ()
                }
              );
            }
            return;
          }
          
          switch (aEvt.keyCode)
          {
            // Handle F2 --> Rename
            case 113:
              if (!aNode.editable || !g_aSettings.allowRenaming || aNode.pool)
              {
                return;
              }
              m_aGrid.getOptions().editable = true;
              try
              {
                sOldText = aNode.text;
                m_aEditedItem = aNode;
                editActiveTreeCell();
              }
              catch (aEx)
              {
                m_aGrid.getOptions().editable = false;
              }
              break;
              
            // Handle KEY_RIGHT
            case 39:
              if (!aNode._is_leaf && aNode._exp !== true && aNode._empty !== true)
              {
                that._expandNode (aNode);
              }
              break;
              
            // Handle KEY_LEFT
            case 37:
              if (!aNode._is_leaf && aNode._exp === true)
              {
                that._expandNode (aNode);
              }
              break;
            
            // Handle ENTER
            case 13:
              if (aNode._is_leaf)
              {
                if (aNode.artefactType === AIT_ARTEFACT_DIAGRAM)
                {
                  g_aMain.getMainArea().openDiagram (aNode.id);
                }
                else
                {
                  g_aMain.getMainArea().openNotebook (aNode.id, AIT_ARTEFACT_OBJECT);
                }
              }
              else if (!aNode._is_leaf && aNode._empty !== true)
              {
                that._expandNode (aNode);
              }
              break;
              
            // Handle DELETE
            case Ext.EventObject.DELETE:                
              if (aConfig.editable === true && com.boc.axw.tree.TreeCommands.isDeleteAllowedInTree ())
              {
                com.boc.axw.tree.TreeCommands.onDeleteHandler.call
                (
                  {
                    getContext: function ()
                    {
                      return that.getSelectedNodes();
                    }
                  }
                );
              }
              break;
          }
          
          // Fix for CR #052197 - Prevent the default behavior when pressing one of the arrow keys
          if(Ext.isIE)
          {
            switch (aEvt.keyCode)
            {
              case 0:
              case 37:
              case 38:
              case 39:
              case 40:
                aEvt.originalEvent.returnValue = false;
                //IE7
                aEvt.preventDefault();
                break;
            }
          }
        }
      );
    }
    m_aGrid.setSortColumn ("text", true);
    m_bInitialized = true;
  }

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

  this._getArtefactType = function ()
  {
    return m_nArtefactType;
  };

  this._getColumnsDef = function ()
  {
    return m_aColumnsDef;
  };


  this._getTreeControl = function ()
  {
    // Required for backwards compatibility (ZIVIT uses this)
    return m_aTreeBox || m_aTreeControlProps;
  };

  aConfig.layout ="anchor";
  boc.ait.Tree.superclass.constructor.call (this, aConfig);

  // Remove all eventlisteners that were created for the current tree
  this.on("destroy", function (aTree)
    {
      // If the dataview is still available, we unsubscribe from its onrowschanged event
      if (m_aDataView)
      {
        m_aDataView.onRowsChanged.unsubscribe (onRowsChangedHandler);
      }
      
      g_aEvtMgr.un ("instancecreated", that._onInstanceCreated, that);
      g_aEvtMgr.un ("instancesdeleted", onInstancesDeleted, that);
      g_aEvtMgr.un ("axw.after.artefacts.pasted", onArtefactsPasted, that);
      if (m_aGrid)
      {
        m_aGrid.destroy ();
      }
    }
  );

  function getData (bRefresh)
  {
    var aNodes = null;
    if (bRefresh)
    {
      aNodes = that.getVisibleNodes ();
    }
    
    if (g_aSettings.offline)
    {
      fillTree.call(this, this.getArtefactType() === AIT_ARTEFACT_OBJECT ? g_aOfflineData.objecttreeData.data : g_aOfflineData.diagramtreeData.data);
      return;
    }
    Ext.Ajax.request
    (
      {
        url:"proxy",
        method:"POST",
        params:
        {
          type: "livetoc",
          params: Ext.encode
          (
            {
              artefactType: m_nArtefactType,
              refresh: bRefresh,
              nodes: aNodes,
              forRelClassInfo: aConfig.forRelClassInfo,
              classes: aConfig.classes,
              showRecycleBin: m_bShowRecycleBin,
              ignoredElements: aConfig.ignoredElements
            }
          )
        },
        success: function (aResponse, aOptions)
        {
          var aRetObj = Ext.decode (aResponse.responseText);
          that.fireEvent ("load", that, aRetObj.payload, aOptions);
          fillTree.call(this, aRetObj.payload);
        },
        failure: function (aResponse, aOptions)
        {
          m_aTreeBox.ownerCt.getEl().unmask ();
        },
        scope:this
      }
    );
  }


  this.on("render", function (aCmp)
    {
      aCmp.on("afterlayout", function ()
        {
          // If we have a grid, force a resize of the canvas and the grid columns
          if (m_aGrid)
          {
            m_aGrid.resizeCanvas();
            m_aGrid.autosizeColumns ();
            
            // Fix for CR 053882 - Only relevant for IE8, we scroll to the last scroll position after the layout was recreated
            if (m_aViewport && Ext.isIE8)
            {
              m_aViewport.scrollTo("top", m_nOldScrollPos);
            }
          }
        }
      );

      // Fix for CR #052197 - Prevent the default behavior when pressing one of the arrow keys
      aCmp.getEl().on("keydown", function (aEvt)
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
    },
    this
  );

  m_aTreeBox.on("render", function (aCmp)
    {
      aCmp.getEl().mask(getString('ait_loading'), 'x-mask-loading');

      var bError = false;
      try
      {
        getData.call (this, false);
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
          aCmp.getEl().unmask ();
        }
      }
    },
    this
  );
  
  m_aTreeBox.on("beforedestroy", function (aPanel)
    {
      aPanel.dragZone.getProxy().destroy ();
      aPanel.dragZone = null;
      delete aPanel.dragZone;
    }
  );


  /*
    Returns the nodes currently selected in the tree.
    If the tree currently displays a search result, the elements currently selected in
    the search result are returned.
  */
  //--------------------------------------------------------------------
  this._getSelectedNodes = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      if (m_nDisplayMode === DISPLAY_SEARCH)
      {
        return m_aSearchResult.getSelectedNodes ();
      }
      var aSelRows = m_aGrid.getSelectedRows ();
      var aRecords  = [];

      for (var i = 0; i < aSelRows.length;++i)
      {
        var aCurRow = m_aDataView.getItem (aSelRows[i]);
        if (aCurRow)
        {
          aRecords.push (new RecordTemplate(aCurRow, aCurRow.id));
        }
      }

      return aRecords;
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
      throw aEx;
    }
  };

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
          sTargetGroupID = aSelNodes[0].id;
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

  this._getIndex = function(sId)
  {
    return m_aDataView.getIdxById(sId);
  };

  this._refresh = function ()
  {
    // Check if the grid is already rendered, otherwise we have nothing to refresh - CR 052126
    if (this.rendered)
    {
      this.getEl().mask(getString("ait_loading"), 'x-mask-loading');
      //m_aGrid.invalidateAllRows ();
      getData.call (this, true);
      
      if (m_aViewport)
      {
        // After refreshing we scroll to the top position to avoid rendering problems.
        m_aViewport.scrollTo ("top", 0);
      }
    }
  };

  this._editNode = function (aNode)
  {
    if (aNode.data.editable === false || !g_aSettings.allowRenaming || aNode.pool)
    {
      return;
    }
    m_aGrid.setActiveCell (m_aDataView.getRowById(aNode.id), 0);
    m_aGrid.getOptions().editable = true;
    sOldText = aNode.data.text;
    m_aEditedItem = aNode.data;
    
    editActiveTreeCell ();
    
  };

  this._getNodeById = function (sId)
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

    return new RecordTemplate(aItem, aItem.id);
  };

  this._updateNode = function (aNode)
  {
    var sId = aNode.id;
    var aItem = m_aDataView.getItemById (sId);
    aNode = aNode.data || aNode;
    if (aItem && (aNode.indent === null || aNode.indent === undefined))
    {
      aNode.indent = aItem.indent;      
    }
    m_aDataView.updateItem (sId, aNode);
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

            var aNewGroup = null;

            var aParentNode = m_aDataView.getItemById (aParentFolder.get("id"));

            // If the parent folder is currently empty, set it to not empty and
            // refresh the view
            if (aParentFolder.get("_empty"))
            {
              aParentFolder.set("_empty", false);
              m_aDataView.updateItem (aParentNode.id, aParentNode);
            }

            var bIsLoaded = aParentNode._loaded === true;

            function afterExpandNode ()
            {
              // Create a new group record
              aNewGroup = new RecordTemplate (aRetObj.payload, aRetObj.payload.id);
              aNewGroup.data.indent = aParentNode.indent+1;
              if (bIsLoaded)
              {
                // Add it to the store
                var aItems = m_aDataView.getItems ();
                aItems.splice(m_aDataView.getRowById (aParentNode.id)+1, 0, aNewGroup.data);
                doLiveTreeSort (aItems);
              }

              // Start editing
              that.editNode (aNewGroup);
            }

            if (aParentNode._exp !== true)
            {
              // Expand the parent folder
              that._expandNode (aParentNode, afterExpandNode);
            }
            else
            {
              afterExpandNode ();
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

  this._getChildNodes = function (aParentNode, bRecursive)
  {
    var aItems = m_aDataView.getItems ();
    var nParentIdx = m_aDataView.getIdxById(aParentNode.id);
    aParentNode = m_aDataView.getItemById (aParentNode.id);

    var aChildren = [];

    for (var i = nParentIdx;i < aItems.length;++i)
    {
      var aCurChild = aItems[i];
      if (aCurChild.data)
      {
        aCurChild = aCurChild.data;
      }
      if (aCurChild._parent === aParentNode.id)
      {
        aChildren.push (new RecordTemplate (aCurChild, aCurChild.id));
        if (bRecursive)
        {
          aChildren = aChildren.concat(this._getChildNodes (aCurChild));
        }
      }
    }

    return aChildren;
  };

  this._iterateChildNodes = function (aParentNode, bRecursive, aFunction, aScope)
  {
    aScope = aScope || this;
    var aItems = m_aDataView.getItems ();
    var nParentIdx = m_aDataView.getIdxById(aParentNode.id);
    aParentNode = m_aDataView.getItemById (aParentNode.id);

    for (var i = nParentIdx;i < aItems.length;++i)
    {
      var aCurChild = aItems[i];
      if (aCurChild._parent === aParentNode.id)
      {
        if (aFunction.call (aScope, aCurChild, aParentNode) === false)
        {
          return;
        }
        if (bRecursive)
        {
          this._iterateChildNodes (aCurChild, bRecursive, aFunction, aScope);
        }
      }
    }
  };

  this._getVisibleNodes = function ()
  {
    var aNodes = [];

    var aItems = m_aDataView.getItems ();

    var nIgnoreIndent = 0;
    var bMindIndent = false;

    for (var i = 0; i < aItems.length;++i)
    {
      var aNode = aItems[i];
      if (aNode.indent < nIgnoreIndent)
      {
        bMindIndent = false;
      }
      if (bMindIndent && aNode.indent >= nIgnoreIndent)
      {
        continue;
      }
      if (aNode._is_leaf)
      {
        continue;
      }
      if (aNode._exp !== true)
      {
        bMindIndent = true;
        nIgnoreIndent = aNode.indent+1;
        continue;
      }
      aNodes.push (aNode);
    }
    return aNodes;
  };

  this._getRootNodes = function ()
  {
    var aRoots = [];
    var aNodes = m_aDataView.getItems ();

    for (var i = 0; i < aNodes.length;++i)
    {
      if (aNodes[i].indent === 0)
      {
        aRoots.push (new RecordTemplate (aNodes[i], aNodes[i].id));
      }
    }

    return aRoots;
  };

  this._collapseNode = function (aNode)
  {
    aNode = m_aDataView.getItemById (aNode.id);
    aNode._exp = false;
    m_aDataView.updateItem (aNode.id, aNode);
  };

  this._getNodes = function ()
  {
    var aNodes = [];
    var aItems = m_aDataView.getItems ();

    for (var i = 0; i < aItems.length;++i)
    {
      aNodes.push (new RecordTemplate(aItems[i], aItems[i].id));
    }

    return aNodes;
  };
  
  this._getSearchResult = function ()
  {
    return m_aSearchResult;
  };
  
  this._getGrid = function ()
  {
    return m_aGrid;
  };
  
  /*
    Public function that stores an array of elements to copy in the tree
    \param aElementsToCopy The elements that will be stored in the tree
  */
  //--------------------------------------------------------------------
  this._setElementsToCopy = function (aElementsToCopy)
  //--------------------------------------------------------------------
  {
    m_aElementsToCopy = aElementsToCopy;
  };
  
  /*
    Public function that retrieves an array of elements to copy from the tree
  */
  //--------------------------------------------------------------------
  this._getElementsToCopy = function ()
  //--------------------------------------------------------------------
  {
    return m_aElementsToCopy;
  };
};

Ext.extend
(
  boc.ait.Tree,
  Ext.Panel,
  {
    getArtefactType: function ()
    {
      return this._getArtefactType ();
    },

    getSelectedNodes : function ()
    {
      return this._getSelectedNodes ();
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

    getIndex : function (sId)
    {
      return this._getIndex (sId);
    },

    refresh : function ()
    {
      this._refresh ();
    },

    editNode : function (aNode)
    {
      this._editNode (aNode);
    },

    getNodeById : function (sId)
    {
      return this._getNodeById (sId);
    },

    getTreeControl : function ()
    {
      return this._getTreeControl ();
    },

    updateNode : function (aNode)
    {
      this._updateNode (aNode);
    },

    createFolder : function (aParentNode)
    {
      this._createFolder (aParentNode);
    },

    getChildNodes : function (aParentNode, bRecursive)
    {
      return this._getChildNodes (aParentNode, bRecursive);
    },

    iterateChildNodes : function (aParentNode, bRecursive, aFunction, aScope)
    {
      this._iterateChildNodes (aParentNode, bRecursive, aFunction, aScope);
    },

    getVisibleNodes : function ()
    {
      return this._getVisibleNodes ();
    },

    getContextMenu : function ()
    {
      return this._getContextMenu ();
    },

    getColumnsDef : function ()
    {
      return this._getColumnsDef ();
    },

    getRootNodes : function ()
    {
      return this._getRootNodes ();
    },

    expandNode : function (aNode, aCallback, aScope)
    {
      return this._expandNode (aNode, aCallback, aScope);
    },

    collapseNode : function (aNode)
    {
      return this._collapseNode (aNode);
    },

    getNodes : function ()
    {
      return this._getNodes ();
    },

    // Required for backwards compatibility (ZIVIT uses this)
    sortData : function ()
    {},

    // Required for backwards compatibility (ZIVIT uses this)
    data : {items:[]},
    
    getSearchResult : function ()
    {
      return this._getSearchResult ();
    },
    
    getGrid: function ()
    {
      return this._getGrid ();
    },

    /*
      Public function that stores an array of elements to copy in the tree
      \param aElementsToCopy The elements that will be stored in the tree
    */
    //--------------------------------------------------------------------
    setElementsToCopy : function (aElementsToCopy)
    //--------------------------------------------------------------------
    {
      checkParam (aElementsToCopy, Array);
      this._setElementsToCopy (aElementsToCopy);
    },
    
    /*
      Public function that retrieves an array of elements to copy from the tree
    */
    //--------------------------------------------------------------------
    getElementsToCopy : function ()
    //--------------------------------------------------------------------
    {
      return this._getElementsToCopy ();
    }
  }
);