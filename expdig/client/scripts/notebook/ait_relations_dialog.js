/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.RelationsDialog class.

**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace("boc.ait.notebook");

/*
    Implementation of the class boc.notebook.RelationsDialog. This class
    implements the dialog that is used to create relation targets inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.RelationsDialog = function (aConfig)
//--------------------------------------------------------------------
{
  // Reference to self
  var that = this;
  aConfig = aConfig || {};

  // private members
  var m_aBaseTargets = null;
  var m_aCurTargets = null;
  var m_aRelTree = null;
  var m_sRelClassName = "";
  var m_aAddedRelsList = null;
  var m_aOkButton = null;
  var m_aNotebook = null;
  var m_aOnOkCallBack = null;
  var m_aScope = null;
  var m_aEntries = null;
  var m_aTargetInformation = null;
  var m_aSearchResult = null;
  var m_aTreeStore = null;
  var m_aFoundObjectsArray = null;
  var m_aTreePanel = null;
  var m_sNameOfClassToCreate = "";
  var m_sNameOfClassToDelete = "";
  var m_sTargetClassName = "";
  var m_aSearchTextField = null;
  var m_aShowTreeButton = null;
  var m_aRefreshTreeButton = null;
  var m_aRemoveTargetButton = null;
  var m_aDeleteTargetButton = null;
  var m_aAllowedDeletableClasses = null;
  var m_aAllowedCreatableClasses = null;
  var m_nMaxTrgOccurrances = null;
  var m_aCreateObjectButton = null;
  var m_nTargetArtefactType = AIT_ARTEFACT_OBJECT;
  var m_aCheckboxSelectionModelTree = null;
  var m_aCheckboxSelectionModelSearchResult = null;

  var m_aChangedRelationInfo = null;

  function modifyRelationInformation (aTargets, bAdd)
  {
    for (var i = 0; i < aTargets.length;++i)
    {
      var sId = aTargets[i].id;
      m_aChangedRelationInfo.removeKey (sId);
      var bAddToRelInformation = bAdd;
      for (var j = 0; j < m_aBaseTargets.length;++j)
      {
        if (m_aBaseTargets[j].id === sId)
        {
          bAddToRelInformation = !bAdd;
          break;
        }
      }


      if (bAddToRelInformation)
      {
        var aTargetInfo = aTargets[i].info;
        aTargetInfo.fromInstId = aConfig.incoming === true ? aTargets[i].info.artefactId : m_aNotebook.getArtefactId ();
        if (sId.indexOf("ext-gen") === -1)
        {
          aTargetInfo.fromEpId = aConfig.incoming === true ? sId : undefined;
          aTargetInfo.toEpId = aConfig.incoming === true ? undefined : sId;
        }
        aTargetInfo.toInstId = aConfig.incoming === true ? m_aNotebook.getArtefactId () : aTargets[i].info.artefactId;
        aTargetInfo.fromArtefactType = aConfig.incoming === true ? aTargetInfo.artefactType : this.notebook.getArtefactType ();
        aTargetInfo.toArtefactType = aConfig.incoming === true ? this.notebook.getArtefactType () : aTargetInfo.artefactType;
        delete aTargetInfo.artefactType;


        aTargetInfo.added = bAdd;
        m_aChangedRelationInfo.add
        (
          sId,
          aTargetInfo
        );
      }
    }
  }

  this._addTargets = function (aTargets)
  {
    modifyRelationInformation.call (this, aTargets, true);
  };

  this._removeTargets = function (aTargets)
  {
    modifyRelationInformation.call (this, aTargets, false);
  };

  // Constants that represent the status of the tree panel. It can either
  // display the tree to pick targets for the current relation from
  // Or a search result
  var DISPLAY_TREE = 0;
  var DISPLAY_SEARCH = 1;

  // Holds the current status of the tree panel
  // By default the tree panel shows the tree
  var m_nDisplayMode = DISPLAY_TREE;


  /*
      Private function that is called when a search request returns results.
  */
  //--------------------------------------------------------------------
  var onSearchComplete = function (aSearchParams)
  //--------------------------------------------------------------------
  {
    try
    {
      // Change the dialog's display mode to the search mode
      m_nDisplayMode = DISPLAY_SEARCH;

      // If the tree already displays a search result, remove it
      if (m_aSearchResult)
      {
        m_aTreePanel.remove(m_aSearchResult);
      }

      // Create a new search result and pass it the data to display
      m_aSearchResult = new boc.ait.search.SearchResult
      (
        {
          // Pass the retrieved json Data as result data
          //resultData : this.reader.jsonData,
          anchor:'100% 100%',
          renderName : that._renderName,
          nameCellClick: Ext.emptyFn,
          singleSelect: m_nMaxTrgOccurrances === 1,
          sm: m_aCheckboxSelectionModelSearchResult,
          searchParams: aSearchParams,
          additionalResultColumns: [m_aCheckboxSelectionModelSearchResult]
        }
      );

      // Create a handler for when a row in the treecontrol is double clicked
      m_aCheckboxSelectionModelSearchResult.on
      (
        'rowselect',
        that.doAddTargets,
        // Scope is the current dialog
        that
      );

          // Create a handler for when a row in the treecontrol is double clicked
      m_aCheckboxSelectionModelSearchResult.on
      (
        'rowdeselect',
        //that.doRemoveSelectedRelationsFromList,
        function (aSelModel, nRowIndex, aRecord)
        {
          var aRecordsToDeselect = [];
          var aStore = m_aAddedRelsList.getStore()
          for (var i = 0; i < aStore.getCount();++i)
          {
            var aRec = aStore.getAt(i);
            if (aRec.get("artefactId") === aRecord.get("id"))
            {
              aRecordsToDeselect[aRecordsToDeselect.length] = aRec
            }
          }
          if (aRecordsToDeselect.length === 0)
          {
            return;
          }

          this.removeNodesFromAddedRelsList (false, aRecordsToDeselect);
        },
        // Scope is the current dialog
        that
      );


      // Add an event handler to the search result that checks for every record to load if
      // it is already contained in the added relations list. if this is the case,
      // do not show the record in the search result
      m_aSearchResult.getGridControl().store.on("load",
        function (aSearchResultStore, aRecords)
        {
          try
          {
            m_aCheckboxSelectionModelSearchResult.suspendEvents ();
            var aExistingRecords = m_aAddedRelsList.getStore().getRange();
            // Iterate through the records and check if the current
            // record is already a target for the current relation
            // If so, we remove it from the store so it can't be added as target again.
            for (var i = 0; i < aRecords.length;++i)
            {
              var aRecord = aRecords[i];
              for (var j = 0; j < aExistingRecords.length;++j)
              {
                var aAddedRel = aExistingRecords[j];
                if (aAddedRel.get("artefactId") == aRecord.get("id"))
                {
                  // Remove the record from the store´
                  var aMatchingRecord = aSearchResultStore.getById(aRecord.get("id"));
                  m_aCheckboxSelectionModelSearchResult.selectRecords ([aMatchingRecord], true);
                  break;
                }
              }
            }
            m_aCheckboxSelectionModelSearchResult.resumeEvents ();
          }
          catch (aEx)
          {
            displayErrorMessage (aEx);
          }
        }
      );

      // Add the search result to the tree panel and refresh the tree panel's layout.
      m_aTreePanel.add (m_aSearchResult);

      m_aTreePanel.doLayout();
    }
    finally
    {
      m_aTreePanel.body.unmask();
    }
  }


  /*
      Private function that performs a search for potential targets for the current relation.
      and displays the results in a grid.
  */
  //--------------------------------------------------------------------
  var doSearch = function ()
  //--------------------------------------------------------------------
  {
    var bEx = false;
    try
    {
      // Get the search string
      var sVal = escapeSearchString(m_aSearchTextField.getValue());
      // If no search string was provided, return
      if (sVal == "")
      {
        return;
      }

      m_aTreePanel.body.mask(getString("ait_loading"), 'x-mask-loading');

      // Hide the relations tree and disable the tree's refresh button
      m_aRelTree.hide();
      m_aRefreshTreeButton.disable();

      // Construct the query string. We want to search for the provided string
      // In the name and the description attribute.
      var sQueryString = "AND ((ATTR_DESCRIPTION: " +sVal+ " OR DESCRIPTION:"+sVal+") OR NAME: " + sVal+")";

      if (aConfig.reflexive !== true)
      {
        sQueryString += " AND (NOT ID:"+m_aNotebook.getArtefactId()+") ";
      }

      if (m_nTargetArtefactType == AIT_ARTEFACT_OBJECT)
      {
        sQueryString = "TYPE:repoinst "+sQueryString;
      }
      else
      {
        sQueryString = "TYPE:model "+sQueryString;
      }
      // Iterate through the target information for the current relation. The target
      // Information holds data about the possible target classes.
      // We only want to search for objects of classes that can be targets for the current
      // relation
      for (var i = 0; i < m_aTargetInformation.length;++i)
      {
        // We want to get a query like this:
        // TYPE:repoinst AND (DESCRIPTION: %VAL% OR NAME: %VAL) AND
        // (CLASS: %CLASS1% OR CLASS: %CLASS2% OR ... OR CLASS: %CLASSN%)

        // If we are at the beginning of the array, add an ADD clause
        if (i==0)
        {
          sQueryString+=" AND (";
        }
        // Otherwise, add an OR clause
        else
        {
          sQueryString+=" OR ";
        }
        sQueryString+="CLASS:"+m_aTargetInformation[i].idClass;
        // Close the bracket
        if (i == m_aTargetInformation.length-1)
        {
          sQueryString+=")";
        }
      }

      aSearchParams =
      {
        url: 'proxy',
        type:'search',
        searchid: 'relationscontrol',
        params:
        {
          relations: [],
          query: sQueryString
        }
      };
      onSearchComplete (aSearchParams);

      // Now enable the show tree button that allows us to switch back to the target tree
      m_aShowTreeButton.enable();
    }
    catch (aEx)
    {
      bEx = true;
      displayErrorMessage (aEx);
    }
    finally
    {
      if (bEx)
      {
        m_aTreePanel.body.unmask();
      }
    }
  };


  /*
    Private function that creates the tree panel and its content
  */
  //--------------------------------------------------------------------
  setupTreePanel = function ()
  //--------------------------------------------------------------------
  {
    // Create a field in which the user can enter his search query
    m_aSearchTextField = new Ext.form.TextField
    (
      {
        emptyText: getString("ait_notebook_relcontrol_search_watermark")
      }
    );

    // Add a handler for the text field's render event that
    // listens to the enter key and starts a search request
    m_aSearchTextField.on("render", function ()
      {
        var aKeyMap = new Ext.KeyMap
        (
          m_aSearchTextField.getEl(),
          {
            key: Ext.EventObject.ENTER,
            fn: doSearch,
            scope: that
          }
        );
      }
    );

    var aClasses = [];
    for (var i = 0; i < m_aTargetInformation.length;++i)
    {
      aClasses[i] = m_aTargetInformation[i].id;
    }

    // Create the tree that will show the possible relation targets
    m_aRelTree = new boc.ait.Tree
    (
      {
        header: false,
        artefactType:m_nTargetArtefactType,
        classes : aClasses,
        anchor:'100% 100%',
        sm: m_aCheckboxSelectionModelTree,
        additionalColumns:[m_aCheckboxSelectionModelTree],
        singleSelection: m_nMaxTrgOccurrances === 1,
        // Provide an optional tree config for the treecontrol in the relations tree
        treeConfig:
        {
          // Disable the tree's context menu
          listeners:
          {
            contextmenu: Ext.emptyFn
          }
        },
        ignoredElements: aConfig.reflexive !== true ? [m_aNotebook.getArtefactId ()] : null
      }
    );

    m_aRelTree.getTreeControl().getStore().on("load", function ()
      {
        that.show();
      }
    );

    // Create a toolbar icon that allows the user to refresh the target tree
    m_aRefreshTreeButton = new Ext.Toolbar.Button
    (
      {
        iconCls: 'ait_refresh',
        scope: m_aRelTree,
        tooltip: getString("ait_tools_explorer_tip_refresh"),
        handler: m_aRelTree.refresh
      }
    )

    // Create the items for the tree panel's toolbar
    var aTreeToolBarItems =
    [
      new Ext.form.Label
      (
        {
          text:getString("ait_notebook_relcontrol_referencable_objects"),
          cls:'ait_tbar_text'
        }
      ),
      {xtype: 'tbfill'}
    ];

    // If the web client is configured so searching is allowed, add
    // the search text field, a search toolbar button and the
    // show tree button
    if (g_aSettings.allowSearching)
    {
      aTreeToolBarItems[aTreeToolBarItems.length] = m_aSearchTextField;
      aTreeToolBarItems[aTreeToolBarItems.length] = new Ext.Toolbar.Button
        (
          {
            iconCls: 'ait_search',
            tooltip: getString("ait_tools_explorer_tip_search"),
            handler: doSearch
          }
        );

      // Create a show tree toolbar button that allows the user to show
      // the target tree when the search result is being displayed
      m_aShowTreeButton = new Ext.Toolbar.Button
      (
        {
          text: getString("ait_notebook_relcontrol_show_tree"),
          disabled: true,
          scope: this,
          // Add a handler for the button that hides the search result and shows the target tree instead
          handler: function (aBtn)
          {
            if (m_nDisplayMode == DISPLAY_SEARCH)
            {
              m_aSearchResult.hide();
              m_aRelTree.show();
              m_aRefreshTreeButton.enable();
              m_nDisplayMode = DISPLAY_TREE;
            }
            aBtn.disable();
          }
        }
      );

      aTreeToolBarItems[aTreeToolBarItems.length] = m_aShowTreeButton
    };
    // Add the refresh toolbar button
    aTreeToolBarItems[aTreeToolBarItems.length] = m_aRefreshTreeButton;
    // Create the tree panel's toolbar
    var aTreeToolBar = new Ext.Toolbar (aTreeToolBarItems);

    // Create the tree panel that holds the toolbar, the target tree
    // and the search elements
    m_aTreePanel = new Ext.Panel
    (
      {
        //anchor:'100% 50%',
        region:'north',
        split:true,
        height:200,
        layout: 'anchor',
        title: '',
        autoScroll: true,
        tbar: aTreeToolBar,
        items:
        [
          m_aRelTree
        ]
      }
    )

    // Store the target tree's store in a private variable
    m_aTreeStore = m_aRelTree.getTreeControl().store;

    // Create a handler for when the selection in the relations tree changes
    m_aRelTree.on
    (
      "selectionchange",
      that.onTreeSelectionChange,
      // Scope is the current dialog
      that
    );

    // Create a handler for when a row in the treecontrol is double clicked
    m_aRelTree.getTreeControl().getSelectionModel().on
    (
      'rowselect',
      that.doAddTargets,
      // Scope is the current dialog
      that
    );

    // Create a handler for when a row in the treecontrol is double clicked
    m_aRelTree.getTreeControl().getSelectionModel().on
    (
      'rowdeselect',
      //that.doRemoveSelectedRelationsFromList,
      function (aSelModel, nRowIndex, aRecord)
      {
        var aRecordsToDeselect = [];
        var aStore = m_aAddedRelsList.getStore()
        for (var i = 0; i < aStore.getCount();++i)
        {
          var aRec = aStore.getAt(i);
          if (aRec.get("artefactId") === aRecord.get("id"))
          {
            aRecordsToDeselect[aRecordsToDeselect.length] = aRec
          }
        }
        if (aRecordsToDeselect.length === 0)
        {
          return;
        }

        this.removeNodesFromAddedRelsList (false, aRecordsToDeselect);
      },
      // Scope is the current dialog
      that
    );

    // Create a handler for when new records are loaded in the relations tree's store
    m_aRelTree.getTreeControl().store.on
    (

      /*
          Function that is called whenever new records are loaded into the store
          \param aStore The store that holds the records
          \param aRecords The newly added records
      */
      //--------------------------------------------------------------------
      'load', function ( aStore, aRecords)
      //--------------------------------------------------------------------
      {
        m_aRelTree.getTreeControl().getSelectionModel().suspendEvents ();
        // Iterate through the records, check if the current record is a leaf
        // and if this record is already a target for the current relation
        // If so, we remove it from the store so it can't be added as target again.
        for(var i = 0; i < aRecords.length;++i)
        {
          var aRecord = aRecords[i];
          if (aRecord.get("_is_leaf"))
          {
            try
            {
              var aExistingRecords = m_aAddedRelsList.getStore().getRange();
              for (var j = 0; j < aExistingRecords.length;++j)
              {
                var aAddedRel = aExistingRecords[j];
                if (aAddedRel.get("artefactId") == aRecord.get("id"))
                {
                  // Select the record in the tree control
                  m_aRelTree.getTreeControl().getSelectionModel().selectRecords([aRecord], true);
                  break;
                }
              }
            }
            catch (aEx)
            {
              throw aEx;
            }
          }
        }
        // Refresh the treecontrol's view
        m_aRelTree.getTreeControl().view.refresh();
        m_aRelTree.getTreeControl().getSelectionModel().resumeEvents ();
      }
    );
  }


  /*
    Private function that creates the dialog's added relation targets list
  */
  //--------------------------------------------------------------------
  setupAddedRelsList = function ()
  //--------------------------------------------------------------------
  {
    if (m_aTargetInformation.length == 1)
    {
      m_sTargetClassName = m_aTargetInformation[0].name;
    }
    else
    {
      m_sTargetClassName = getString("ait_notebook_relcontrol_tip_reltarget");
    }
    // Create a toolbar button that allows the user to remove a selected relation target
    m_aRemoveTargetButton = new Ext.Toolbar.Button
    (
      {
        tooltip: getString("ait_notebook_relcontrol_tip_delete").replace(/%RELATION_TARGET%/, m_sTargetClassName),
        handler: that.doRemoveSelectedRelationsFromList,
        scope: that,
        disabled: true,
        iconCls: 'ait_remove_relation'
      }
    );

    // Create the items for the target list's toolbar
    var aAddedRelListToolBarItems =
    [
      new Ext.form.Label
      (
        {
          text:getString("ait_notebook_relcontrol_ref_targets"),
          cls:'ait_tbar_text'
        }
      ),
      {xtype: 'tbfill'}
    ];

    // Get the allowed creatable classes for the relations dialog
    // For the user it has to be possible to create new objects and directly
    // add them to the targets of the current relation.
    // However, only if the classes that are possible targets for the relation
    // are also contained in the creatableClasses configured for the web client, they
    // can be instantiated here.
    m_aAllowedCreatableClasses = [];
    m_aAllowedDeletableClasses = [];
    // Check if the web client is configured to provide the possibility to create new objects

    // Iterate through the relation's target information
    for (var i = 0; i < m_aTargetInformation.length;++i)
    {
      // If creatable classes were defined for the web client we iterate through them
      for (var j = 0; g_aSettings.allowCreatingNewObjects && g_aSettings.creatableClasses && j < g_aSettings.creatableClasses.length;++j)
      {
        // If the current possible target class for the relation matches the current
        // configured creatable class, we add the class to the creatable classes for the dialog
        if (m_aTargetInformation[i].id == g_aSettings.creatableClasses[j])
        {
          m_aAllowedCreatableClasses[m_aAllowedCreatableClasses.length] = g_aSettings.creatableClasses[j];
          // If there is only one allowed creatable class, we change the tooltip of the create new object
          // dialog so it displays "Create new %CLASS_NAME%" instead of "Create new object".
          if (m_aAllowedCreatableClasses.length == 1)
          {
            m_sNameOfClassToCreate = m_aTargetInformation[i].name;
          }
          else
          {
            // Otherwise, use the default tooltip
            m_sNameOfClassToCreate = getString("ait_notebook_relcontrol_tip_create_target_default");
          }
          break;
        }
      }

      for ( var j = 0; g_aSettings.deletableClasses && j < g_aSettings.deletableClasses.length;++j)
      {
        if (m_aTargetInformation[i].id == g_aSettings.deletableClasses[j])
        {
          m_aAllowedDeletableClasses[m_aAllowedDeletableClasses.length] = g_aSettings.deletableClasses[j];
          if (m_aAllowedDeletableClasses.length == 1)
          {
            m_sNameOfClassToDelete = m_aTargetInformation[i].name;
          }
          else
          {
            // Otherwise, use the default tooltip
            m_sNameOfClassToDelete = getString("ait_notebook_relcontrol_tip_reltarget");
          }
          break;
        }
      }
    }

    // If there are allowed creatable classes, create the 'create new object' button
    // and add it to the toolbar
    if (m_aAllowedCreatableClasses.length > 0)
    {
      m_aCreateObjectButton = new Ext.Toolbar.Button
        (
          {
            tooltip: getString("ait_notebook_relcontrol_tip_create_target").replace(/%CLASS_NAME%/, m_sNameOfClassToCreate),
            handler: that.doCreateTargetInstance,
            scope: that,
            iconCls: 'ait_newobject'
          }
        )

      aAddedRelListToolBarItems[aAddedRelListToolBarItems.length] = m_aCreateObjectButton
    }
    // Add the remove target button to the toolbar
    aAddedRelListToolBarItems[aAddedRelListToolBarItems.length] = m_aRemoveTargetButton;

    if (m_aAllowedDeletableClasses.length > 0)
    {
      // Create a toolbar button that allows the user to remove a selected relation target
      // and delete the target instance from the repository
      m_aDeleteTargetButton = new Ext.Toolbar.Button
      (
        {
          iconCls: 'ait_delete_relation',
          handler: that.doDeleteTargetInstance,
          tooltip: getString("ait_notebook_relcontrol_tip_delete_target").replace(/%RELATION_TARGET%/, m_sNameOfClassToDelete),
          scope: that,
          disabled: true
        }
      )
      aAddedRelListToolBarItems[aAddedRelListToolBarItems.length] = m_aDeleteTargetButton;
    }

    // Create the toolbar for the target list
    var aAddedRelListToolbar = new Ext.Toolbar
    (
      aAddedRelListToolBarItems
    );

    function renderName (sValue, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
    {
      var sPre = "";

      if (aRecord.get("broken") === true)
      {
        sPre="<img src='images/broken.png' class='ait_broken_reference_grid'/>&nbsp;";
      }
      return sPre + boc.ait.htmlEncode (sValue);
    };

    function renderIcon (sValue, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
    {
      if (aMetadata.renderInSupportDialog)
      {
        return sVal;
      }

      // Use the blank image url as the standard overlay for the modeltype, folder or class icon
      var sSrc = Ext.BLANK_IMAGE_URL;
      // If the current record is not editable, we want to overlay its icon with a lock

      // Render leaf nodes
      aMetadata.attr="style='background:url("+boc.ait.getIconPath()+aRecord.data.iconUrl+") center center transparent no-repeat;'";

      return "<span style='background:url("+sSrc+") 6px center transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
    };

    //aAddedRelListToolbar.cls = 'ait_relcontrol_tbar';

    // Create the listbox that will hold all the existing targets for the relation
    m_aAddedRelsList = new boc.ait.util.ListBox
    (
      {
        readerId: "id",
        fields:
        [
          {name:'text'},
          {name:'id'},
          {name:'broken'},
          {name:'artefactType'},
          {name:'iconUrl'},
          {name:'classId'},
          {name:"idClass_lang"},
          {name:"artefactId"}
        ],
        columns :
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
          {id:'text', header:'Name', sortable: true, dataIndex: 'text', renderer: renderName}
        ],
        //anchor:'100% 50%',
        region:'center',
        title: '',
        header:false,
        data: m_aEntries,
        singleSelect: false,
        tbar: aAddedRelListToolbar
      }
    );


    // Add an eventlistener for the target list that enables the remove target button
    // when an entry in the list is selected.
    m_aAddedRelsList.on("click", function ()
      {
        if(!m_aAddedRelsList.getSelectionModel().hasSelection())
        {
          return;
        }

        m_aRemoveTargetButton.enable();
        if (m_aDeleteTargetButton)
        {
          if (!g_aSettings.deletableClasses)
          {
            return;
          }
          var bEnabled = true;

          if(!m_aAddedRelsList.getSelectionModel().hasSelection())
          {
            return;
          }
          var aRecords = m_aAddedRelsList.getStore().getRange();
          // Iterate through the targets of the relation
          for (var i = 0; i < aRecords.length;++i)
          {
            var aRecord = aRecords[i];
            var bFound = false;
            for (var j = 0; g_aSettings.deletableClasses && j < g_aSettings.deletableClasses.length;++j)
            {
              if (g_aSettings.deletableClasses[j] == aRecord.get("classId"))
              {
                bFound = true;
                break;
              }
            }
            if (!bFound)
            {
              return;
            }
          }

          m_aDeleteTargetButton.enable();
        }
      }
    );

    m_aAddedRelsList.on("render", function (aList)
      {
        var canDrop = function (aDraggedRecords, aTarget)
        {
          var aRecords = m_aAddedRelsList.getStore().getRange();
          if ((aRecords.length + aDraggedRecords.length) > m_nMaxTrgOccurrances && m_nMaxTrgOccurrances !== 0 && m_nMaxTrgOccurrances !== -1)
          {
            return false;
          }

          if (!aList.getEl().contains(aTarget))
          {
            return false;
          }
          var bDropAllowed = aConfig.reflexive === true;
          for (var i = 0; i < aDraggedRecords.length;++i)
          {
            if (!aDraggedRecords[i].get("_is_leaf"))
            {
              return false;
            }
            var bAllowedAsTarget = false;

            for (var j = 0; j < m_aTargetInformation.length;++j)
            {
              if (m_aTargetInformation[j].id == aDraggedRecords[i].get("classId"))
              {
                bAllowedAsTarget = true;
              }
            }

            if (!bAllowedAsTarget)
            {
              return false;
            }

            if (aConfig.reflexive !== true)
            {
              if (aDraggedRecords[i].get("id") !== m_aNotebook.getArtefactId())
              {
                bDropAllowed = true;
              }
            }
          }
          return bDropAllowed;
        };

        var sDDGroupID = "treeDrag";
        var aDropZone = new Ext.dd.DropZone(aList.body,
          {
            ddGroup: sDDGroupID,
            notifyOver: function(aDragSource, aEvent, aData)
            {
              var sCls = aList.dropNotAllowed;

              var aDraggedRecords = aDragSource.dragData.selections;

              if  ( canDrop(aDraggedRecords, aEvent.getTarget()) )
              {
                sCls = Ext.dd.DropZone.prototype.dropAllowed;
              }
              return setDragStyle(sCls);
            },

            notifyOut : function (aDragSource, aEvent, aData)
            {
              return setDragStyle(aList.dropNotAllowed);
            },


            notifyDrop: function(aDragSource, aEvent, aData)
            {
              var aDraggedRecords = aDragSource.dragData.selections;
              if ( canDrop(aDraggedRecords, aEvent.getTarget()))
              {
                aList.body.mask(getString("ait_loading"), 'x-mask-loading');
                try
                {
                  var aRecords = m_aAddedRelsList.getStore().getRange ();

                  for (var i = 0; i < aDraggedRecords.length;++i)
                  {
                    if (aConfig.reflexive !== true && aDraggedRecords[i].get("id") === m_aNotebook.getArtefactId())
                    {
                      continue;
                    }

                    var bContinue = false;
                    for (var j = 0; j < aRecords.length;++j)
                    {
                      if (aRecords[j].get("artefactId") == aDraggedRecords[i].get("id"))
                      {
                        bContinue = true;
                        break;
                      }
                    }
                    if (bContinue)
                    {
                      continue;
                    }

                    var aMatchingRecord = that.getRelTree().getTreeControl().store.getById(aDraggedRecords[i].get("id"));
                    if (aMatchingRecord)
                    {
                      m_aCheckboxSelectionModelTree.selectRecords ([aMatchingRecord], true);
                    }
                    else
                    {
                      var aRecordToAdd = aDraggedRecords[i].copy();
                      aRecordToAdd.set("id", Ext.id());
                      aRecordToAdd.set("artefactId", aDraggedRecords[i].get("id"));
                      that.addTargetToAddedRelsList (aRecordToAdd);

                      that._addTargets
                      (
                        [
                          {
                            id:aRecordToAdd.get("id"),
                            info:
                            {
                              artefactId: aRecordToAdd.get("artefactId"),
                              artefactType: aRecordToAdd.get("artefactType")
                            }
                          }
                        ]
                      );
                    }

                    if (m_aSearchResult)
                    {
                      var aMatchingSearchRecord = m_aSearchResult.getGridControl().store.getById(aDraggedRecords[i].get("id"));
                      if (aMatchingSearchRecord)
                      {
                        m_aCheckboxSelectionModelSearchResult.suspendEvents ();
                        m_aCheckboxSelectionModelSearchResult.selectRecords([aMatchingSearchRecord], true);
                        m_aCheckboxSelectionModelSearchResult.resumeEvents ();
                      }
                    }
                  }
                }
                finally
                {
                  aList.body.unmask();
                }
              }
            }
          }
        );
        aList.dropZone = aDropZone;
      }
    );
  }

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  buildObject = function ()
  //--------------------------------------------------------------------
  {
    // Dialog parameters
    aConfig.layout = 'border';
    aConfig.width = 600;
    aConfig.height = 500;
    aConfig.closeAction = 'close';
    aConfig.plain = true;
    aConfig.modal = false;

    // Make sure the dialog's header is always visible
    aConfig.constrainHeader = true;

    m_aOnOkCallBack = aConfig.okCallBack;
    m_aScope = aConfig.scope || this;
    m_aNotebook = aConfig.notebook;
    m_sRelClassName = aConfig.relClass || "";
    m_aEntries = aConfig.entries;
    m_aTargetInformation = aConfig.targetInformation;
    m_nMaxTrgOccurrances = aConfig.maxTrgOccurrances;

    var selectCallback = function (aRecord)
    {
      var aRecords = m_aAddedRelsList.getStore().getRange ();
      for (var i = 0; i < aRecords.length;++i)
      {
        if (aRecords[i].get("id") === aRecord.get("id"))
        {
          return true;
        }
      }
      if (m_nMaxTrgOccurrances === -1 || m_nMaxTrgOccurrances === 0)
      {
        return true;
      }
      return (m_nMaxTrgOccurrances === -1 || m_nMaxTrgOccurrances === 0) || aRecords.length < m_nMaxTrgOccurrances;
    }

    m_aCheckboxSelectionModelTree = new boc.ait.util.CheckboxSelectionModel
                                        (
                                          {
                                            header: "<div>&#160;</div>",
                                            selectCallback: selectCallback
                                          }
                                        );
    m_aCheckboxSelectionModelSearchResult = new boc.ait.util.CheckboxSelectionModel
                                                (
                                                  {
                                                    header: "<div>&#160;</div>",
                                                    selectCallback: selectCallback
                                                  }
                                                );


    m_aAllowedCreatableClasses = null;
    m_nTargetArtefactType = aConfig.targetArtefactType;
    m_aBaseTargets = aConfig.baseTargets;
    m_aCurTargets = aConfig.curTargets;

    if (aConfig.baseModifications)
    {
      m_aChangedRelationInfo = aConfig.baseModifications;
    }
    else
    {
      m_aChangedRelationInfo = new Ext.util.MixedCollection ();
    }


    // Setup the dialog's tree panel
    setupTreePanel ();

    // Setup the dialog's list with already added relation targets
    setupAddedRelsList ();

    // Create a close button for the dialog
    m_aOkButton = new Ext.Button
    (
      {
        text: getString('ait_ok'),
        minWidth: 80,
        handler: that.doOk,
        scope: that
      }
    );

    // Add the items to the dialog
    aConfig.items =
    [
      m_aTreePanel,
      m_aAddedRelsList
    ];

    // Add the buttons to the dialog
    aConfig.buttons =
    [
      m_aOkButton
    ];
  }


  /*
      Private function that calls the callback passed to this dialog from
      the calling component and passes an array with all the relation targets
      currently displayed in the relations window.

      \param sRelInstID [optional] A relation instance id to assign to relation targets
                  that were just created in this dialog.
  */
  //--------------------------------------------------------------------
  transferRelationTargets = function (aCreatedRelationsData)
  //--------------------------------------------------------------------
  {
    var aRecordData = transformRecordsToData (m_aAddedRelsList.getStore().getRange());

    // Call the callback function
    m_aOnOkCallBack.call(m_aScope, aRecordData, false, m_aChangedRelationInfo);
    // Close the dialog.
    this.close();
  };


  /*
      Protected function that returns the ok button
      \retval The dialog's ok button
  */
  //--------------------------------------------------------------------
  this._getOkButton = function ()
  //--------------------------------------------------------------------
  {
    return m_aOkButton;
  };


  /*
      Protected function that returns the relations tree
      \retval The relations tree
  */
  //--------------------------------------------------------------------
  this._getRelTree = function()
  //--------------------------------------------------------------------
  {
    return m_aRelTree;
  };

  /*
      Protected function that returns the listbox with the added relation targets.
      \retval The target list box.
  */
  //--------------------------------------------------------------------
  this._getAddedRelsList = function ()
  //--------------------------------------------------------------------
  {
    return m_aAddedRelsList;
  };

  /*
      Protected function that returns the notebook for which the current rel control is defined.
      \retval The notebook.
  */
  //--------------------------------------------------------------------
  this._getNotebook = function ()
  //--------------------------------------------------------------------
  {
    return m_aNotebook;
  };

  /*
      Protected function that is called when the changes in the relations dialog are confirmed.
  */
  //--------------------------------------------------------------------
  this._doOk = function ()
  //--------------------------------------------------------------------
  {
    that.getEl().mask(getString("ait_loading"), 'x-mask-loading');
    var bError = false;
    try
    {
      // Transfer the added targets from the relations dialog to the relations control
      transferRelationTargets.apply(this, [null]);
    }
    catch (aEx)
    {
      bError = true;
      displayErrorMessage (aEx);
    }
    finally
    {
      if (bError)
      {
        that.getEl().unmask();
      }
    }
  };


  /*
      Protected function adds selected targets to the added targets list.
  */
  //--------------------------------------------------------------------
  this._doAddTargets = function (aSelModel, nRowIndex, aRecord)
  //--------------------------------------------------------------------
  {
    try
    {
      // If the number of added targets already equals the number of maximum targets, we return
      if (m_aAddedRelsList.getStore().getRange() >= m_nMaxTrgOccurrances && m_nMaxTrgOccurrances !== 0 && m_nMaxTrgOccurrances !== -1)
      {
        return;
      }

      if (m_aAddedRelsList.getStore().findBy( function (aRec, sId)
                                              {
                                                if (aRec.get("artefactId") === aRecord.get("id"))
                                                {
                                                  return true;
                                                }
                                                return false;
                                              }
                                              ) === -1)
      //if (Ext.isEmpty(m_aAddedRelsList.getStore().getById(aRecord.get("id"))))
      {
        var aRecordToAdd = aRecord.copy();
        aRecordToAdd.set("id", Ext.id());
        aRecordToAdd.set("artefactId", aRecord.get("id"));
        this.addTargetToAddedRelsList (aRecordToAdd);

        this._addTargets
        (
          [
            {
              id: aRecordToAdd.get("id"),
              info:
              {
                artefactId: aRecord.get("id"),
                artefactType: aRecord.get("artefactType")
              }
            }
          ]
        );
      }

      this._evaluateCardinalities ();
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }

  /*
    Protected function adds a node to the added targets list.
    \param aNode The node to add to the list.
  */
  //--------------------------------------------------------------------
  this._addTargetToAddedRelsList = function (aRecord)
  //--------------------------------------------------------------------
  {
    try
    {
      // Make sure that only leaf nodes can be added

        // Get the record from the tree's store

      if (m_nDisplayMode === DISPLAY_SEARCH)
      {
        var aTreeRecord = this.getRelTree().getTreeControl().store.getById(aRecord.get("artefactId"));
        if (aTreeRecord)
        {
          m_aCheckboxSelectionModelTree.suspendEvents ();
          m_aCheckboxSelectionModelTree.selectRecords ([aTreeRecord], true);
          m_aCheckboxSelectionModelTree.resumeEvents ();
        }
      }

      var aRecCopy = aRecord.copy();

      // Append the new node to the target list
      //this.getAddedRelsList().getStore().addSorted (aRecCopy);
      this.getAddedRelsList().getStore().add ([aRecCopy]);
      this.getAddedRelsList().getStore().sort("text", "ASC");
      //this.getAddedRelsList().getView().refresh (false);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
    Private function that renders the name column
    \param sValue The value to render
    \param aMetadata Metadata for the cell
    \param aRecord The record for the current row.
  */
  //--------------------------------------------------------------------
  this._renderName = function (sValue, aMetadata, aRecord)
  //--------------------------------------------------------------------
  {
    return sValue;
  }

  /*
      Protected function that removes the selected targets from the relations list.
      \param bRemoveTrgFromRepo [optional] If this is true, the targets that are removed
              are also deleted in the repository
  */
  //--------------------------------------------------------------------
  this._removeNodesFromAddedRelsList = function (bRemoveTrgFromRepo, aRecords)
  //--------------------------------------------------------------------
  {
    try
    {
      // Get the target list's root noce
      var nLength = aRecords.length;
      // Iterate through the selected nodes
      for (var i = nLength-1; i >= 0;--i)
      {
        var aRecord= aRecords[i];
        that._removeTargets
        (
          [
            {
              id:aRecord.get("id"),
              info:
              {
                artefactId: aRecord.get("artefactId"),
                artefactType: aRecord.get("artefactType")
              }
            }
          ]
        );


        // Remove the current node from the added targets list

        for (var j = 0; j < m_aAddedRelsList.getStore().getCount();++j)
        {
          var aRecToRemove = m_aAddedRelsList.getStore().getAt(j);
          if (aRecToRemove.get("id") === aRecord.get("id"))
          {
            m_aAddedRelsList.getStore().remove(aRecToRemove);
            m_aAddedRelsList.getStore().sort ("text", "ASC");
          }
        }

        var aRelTree = this.getRelTree();
        var aStore = aRelTree.getTreeControl().store;
        var aRecordToRemove = aStore.getById(aRecord.get("artefactId"));

        if (aRecordToRemove && m_aAddedRelsList.getStore().findBy (function(aRec, sId)
                                                                   {
                                                                     if (aRec.get("artefactId") === aRecordToRemove.get("id"))
                                                                     {
                                                                       return true;
                                                                     }
                                                                     return false;
                                                                   }) === -1)
        {
          m_aCheckboxSelectionModelTree.deselectRow (aStore.indexOf(aRecordToRemove));
        }

        var aSearchRecordToRemove = null;
        if (m_aSearchResult)
        {
          aSearchRecordToRemove = m_aSearchResult.getGridControl().store.getById (aRecord.get("artefactId"));
          if (!bRemoveTrgFromRepo && aSearchRecordToRemove && m_aAddedRelsList.getStore().findBy (function(aRec, sId)
                                                                   {
                                                                     if (aRec.get("artefactId") === aSearchRecordToRemove.get("id"))
                                                                     {
                                                                       return true;
                                                                     }
                                                                     return false;
                                                                   }) === -1)
          {
            m_aCheckboxSelectionModelSearchResult.deselectRow (m_aSearchResult.getGridControl().store.indexOf(aSearchRecordToRemove));
          }
        }

        // If the targets should not also be removed from the repository, we have to
        // add them to the target tree and the search result again
        if (bRemoveTrgFromRepo)
        {
          if (aSearchRecordToRemove)
          {
            m_aSearchResult.getGridControl().store.remove (aSearchRecordToRemove);
            m_aSearchResult.getGridControl().store.sort ("text", "ASC");
          }
        }
      }
      // Disable the remove target button
      m_aRemoveTargetButton.disable();
      if (m_aDeleteTargetButton)
      {
        m_aDeleteTargetButton.disable();
      }
      that.body.unmask ();
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }


  /*
      Protected function that creates a new target instance
      \param aEvent The event that was raised
      \param aSrcEl The element that raised the event
  */
  //--------------------------------------------------------------------
  this._doCreateTargetInstance = function (aEvent, aSrcEl)
  //--------------------------------------------------------------------
  {
    try
    {
      var that = this;

      var aNewObjectDialogParams =
      {
        // Make the new dialog modal
        modal: true,
        title: getString("ait_new_object_title").replace(/%CLASS_NAME%/, m_sNameOfClassToCreate),
        targetGroupID: m_aNotebook.getParentId(),
        // Pass the allowed creatable classes
        classIDs : m_aAllowedCreatableClasses,
        scope: that,
        caller: that,
        // Pass a callback to the dialog that
        // adds the newly created object to the relation dialog's target list
        callback: function (aCreatedInstance)
        {
          var sNewId = Ext.id();
          this._addTargets
          (
            [
              {
                id: sNewId,
                info:
                {
                  artefactId:aCreatedInstance.id,
                  artefactType: AIT_ARTEFACT_OBJECT
                }
              }
            ]
          );
          aCreatedInstance.artefactId = aCreatedInstance.id;
          aCreatedInstance.id = sNewId;
          this.getAddedRelsList().getStore().loadData([aCreatedInstance], true);
          this._evaluateCardinalities ();
        }
      };

      g_aEvtMgr.fireEvent("beforeopennewobjectdialog", aNewObjectDialogParams);

      // Create a new instance of the new object dialog
      var aCreateNewObjectDialog = new boc.ait.NewObjectDialog (aNewObjectDialogParams);
      // Show the dialog
      aCreateNewObjectDialog.show (aSrcEl);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };


  /*
    Protected function that removes a target from the target list and also deletes it in
    the repository - not implemented yet
    \param aEvent The event that was raised
    \param aSrcEl The element that raised the event
  */
  //--------------------------------------------------------------------
  this._doDeleteTargetInstance = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      Ext.Msg.confirm
      (
        getString("ait_menu_main_delete"),
        getString("ait_menu_main_query_delete_multiple"),
        // Callback that is called when the user picks an option
        function (sResult)
        {
          if (sResult == "no")
          {
            return;
          }
          var aRecords = m_aAddedRelsList.getSelectedElements ();
          var aDeletedInstIDs = [];
          var nLength = aRecords.length;
          for (var i = 0; i < nLength;++i)
          {
            aDeletedInstIDs[i] = aRecords[i].get("artefactId");
          }


          // Get the selected node and its type

          var nArtefactType = AIT_ARTEFACT_OBJECT;

          // Start a new ajax call to delete the selected artefact on the server
          Ext.Ajax.request
          (
            {
              url:"proxy",
              method:"POST",
              params:
              {
                type: "delete",
                params: Ext.encode
                (
                  {
                    artefactInfo: aDeletedInstIDs,
                    artefactType: nArtefactType
                  }
                )
              },
              // We use the tree as scope for the callbacks
              scope: this,
              // On success we check the return object
              success: function (aResponse, aOptions)
              {
                doAfterDelete (aResponse, aOptions);
                that._doRemoveSelectedRelationsFromList (true);
              },
              // On failure we undo the change to the node's name
              failure: Ext.emptyFn
            }
          );
        },
        this
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };


  /*
      Protected function that removes the selected targets from the target list
      \param bRemoveTrgFromRepo If this is true, the selected targets are also
            deleted in the repository
  */
  //--------------------------------------------------------------------
  this._doRemoveSelectedRelationsFromList = function (bRemoveTrgFromRepo, bla, aRecord)
  //--------------------------------------------------------------------
  {
    var that = this;
    // get the currently selected nodes from the added targets list
    var aRecords = m_aAddedRelsList.getSelectedElements();
    if (aRecords.length == 0)
    {
      return;
    }

    this.body.mask(getString("ait_loading"), 'x-mask-loading');
    var bError = false;
    try
    {
      that.removeNodesFromAddedRelsList (bRemoveTrgFromRepo, aRecords);
      this._evaluateCardinalities ();
    }
    catch (aEx)
    {
      bError = true;
      throw aEx;
    }
    finally
    {
      if (bError )
      {
        this.body.unmask ();
      }
    }
  }

  /*
      Public function that is called when the selection in the relations tree control
      changes. Sets the enabled status of the add button.
      \param aTree The tree whose selection changed
      \param aSelModel The tree's selection Model
      \retval The notebook
  */
  //--------------------------------------------------------------------
  this._onTreeSelectionChange = function (aTree, aSelModel)
  //--------------------------------------------------------------------
  {
    var aNode = aSelModel.getSelected();
    var bDisable = true;
    // If the selected node is a leaf, enable the button, otherwise
    // disable it.
    if (aNode && aNode.get("_is_leaf"))
    {
      bDisable = false;
    }
    if (this.getAddedRelsList().root.childNodes.length >= m_nMaxTrgOccurrances && m_nMaxTrgOccurrances !== 0 && m_nMaxTrgOccurrances !== -1)
    {
      bDisable = true;
    }
  };

  this._evaluateCardinalities = function ()
  {
    var bDisable = false;
    if (m_aAddedRelsList.getStore().getRange() >= m_nMaxTrgOccurrances && m_nMaxTrgOccurrances !== 0 && m_nMaxTrgOccurrances !== -1)
    {
      bDisable = true;
    }

    if (m_aCreateObjectButton)
    {
      m_aCreateObjectButton.setDisabled (bDisable);
    }
  };

  // Build the object
  buildObject ();

  // Call to the superclass' constructor
  boc.ait.notebook.RelationsDialog.superclass.constructor.call(this, aConfig);

  this._evaluateCardinalities ();
}

// boc.ait.notebook.RelationsDialog is derived from Ext.Window
Ext.extend
(
  boc.ait.notebook.RelationsDialog,
  Ext.Window,
  {
    /*
        Public function that returns the dialog's ok button
        \retval The dialog's ok button.
    */
    //--------------------------------------------------------------------
    getOkButton : function ()
    //--------------------------------------------------------------------
    {
      return this._getOkButton()
    },

    /*
        Public function that returns the dialog's relations tree
        \retval The dialog's relations tree.
    */
    //--------------------------------------------------------------------
    getRelTree : function ()
    //--------------------------------------------------------------------
    {
      return this._getRelTree();
    },

    /*
        Public function that returns the dialog's target list
        \retval The dialog's target list
    */
    //--------------------------------------------------------------------
    getAddedRelsList : function ()
    //--------------------------------------------------------------------
    {
      return this._getAddedRelsList();
    },

    /*
        Public function that returns the notebook the rel control belongs to.
        \retval The notebook
    */
    //--------------------------------------------------------------------
    getNotebook : function ()
    //--------------------------------------------------------------------
    {
      return this._getNotebook();
    },

    /*
        Public function adds selected targets to the added targets list.
    */
    //--------------------------------------------------------------------
    doAddTargets : function (aSelModel, nRowIndex, aRecord)
    //--------------------------------------------------------------------
    {
      this._doAddTargets(aSelModel, nRowIndex, aRecord);
    },

    /*
        Public function adds a node to the added targets list.
        \param aNode The node to add to the list.
    */
    //--------------------------------------------------------------------
    addTargetToAddedRelsList : function (aNode)
    //--------------------------------------------------------------------
    {
      this._addTargetToAddedRelsList (aNode);
    },


    /*
        Public function that removes the selected targets from the relations list and
        from the repository, if necessary
    */
    //--------------------------------------------------------------------
    doRemoveSelectedRelationsFromList: function (bDummy, aDummy, aRecord)
    //--------------------------------------------------------------------
    {
      this._doRemoveSelectedRelationsFromList (false, aDummy, aRecord);
    },


    /*
      Protected function that removes a target from the target list and also deletes it in
      the repository - not implemented yet
      \param aEvent The event that was raised
      \param aSrcEl The element that raised the event
    */
    //--------------------------------------------------------------------
    doDeleteTargetInstance : function ()
    //--------------------------------------------------------------------
    {
      this._doDeleteTargetInstance ();
    },


    /*
        Public function that removes the selected targets from the relations list.
    */
    //--------------------------------------------------------------------
    removeNodesFromAddedRelsList : function (bRemoveTrgFromRepo, aRecords)
    //--------------------------------------------------------------------
    {
      this._removeNodesFromAddedRelsList (bRemoveTrgFromRepo, aRecords);
    },

    /*
      Public function that is called when the user presses ok.
    */
    //--------------------------------------------------------------------
    doOk : function ()
    //--------------------------------------------------------------------
    {
      this._doOk();
    },



    /*
        Public function that creates a new target instance
        \param aEvent The event that was raised
        \param aSrcEl The element that raised the event
    */
    //--------------------------------------------------------------------
    doCreateTargetInstance: function (aEvent, aSrcEl)
    //--------------------------------------------------------------------
    {
      this._doCreateTargetInstance();
    },

    /*
        Public function that is called when the selection in the relations tree control
        changes. Sets the enabled status of the add button.
        \param aTree The tree whose selection changed
        \param aSelModel The tree's selection Model
        \retval The notebook
    */
    //--------------------------------------------------------------------
    onTreeSelectionChange : function (aTree, aSelModel)
    //--------------------------------------------------------------------
    {
      return this._onTreeSelectionChange (aTree, aSelModel);
    }
  }
);

// Register the relations dialog's xtype
Ext.reg("boc-relationsdialog", boc.ait.notebook.RelationsDialog);