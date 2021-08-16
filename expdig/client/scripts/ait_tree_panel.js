/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.TreePanel class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');


/*
    Implementation of the class boc.ait.TreePanel. This is the panel that holds
    the diagram and the object tree in the web client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.TreePanel = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var m_aObjectTree = null;
  var m_aDiagramTree = null;
  var m_aInnerTabPanel = null;
  var m_aNavigatorPanel = null;

  var that = this;

  // Initialize the config object if it wasn't passed
  aConfig = aConfig || {};


  var onDblClick = function (aGrid, nRowIndex, nColIndex, aEvt)
  {
    var aStore = aGrid.getStore();
    var aRecord = aStore.getAt(nRowIndex);  // Get the Record

    var bLeaf = aRecord.get("_is_leaf");
    if (bLeaf)
    {
      var sID = aRecord.get("id");
      var aMainArea = g_aMain.getMainArea();
      var nArtefactType = that.getActiveTree().getArtefactType();

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
  }


  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      var aItems = [];
      if (g_aSettings.showDiagrams !== false && (!g_aSettings.offline || g_aOfflineData.diagramtreeData.data.length > 0))
      {
        // Create a new tree instance to display diagrams
        m_aDiagramTree = new boc.ait.Tree
        (
          {
            artefactType: AIT_ARTEFACT_DIAGRAM,
            editable: true,
            autoWidth:true,
            showContextMenu: true,
            searchTool: true,
            showLogo: true,
            refreshTOCInitially: true
          }
        );

        m_aDiagramTree.getTreeControl().on("rowdblclick", onDblClick);
        aItems[aItems.length] = m_aDiagramTree;
      }

      if (!g_aSettings.offline || g_aOfflineData.objecttreeData.data.length > 0)
      {
        // Create a new tree instance to display objects
        m_aObjectTree = new boc.ait.Tree
        (
          {
            artefactType: AIT_ARTEFACT_OBJECT,
            editable: true,
            autoWidth:true,
            showContextMenu: true,
            searchTool: true,
            newObjectTool: true,
            showLogo: true,
            refreshTOCInitially: true
          }
        );


        m_aObjectTree.getTreeControl().on("rowdblclick", onDblClick);
        aItems[aItems.length] = m_aObjectTree;
      }

      // User anchor layout
      //aConfig.layout='anchor';
      aConfig.layout ='border';

      aConfig.floatable = false;
      aConfig.useSplitTips = true;

      var nActiveTab = (g_aSettings.defaultTree == AIT_ARTEFACT_OBJECT) ? 1 : 0;
      if (!m_aDiagramTree)
      {
        nActiveTab = 0;
      }

      // Create a new tabpanel that will hold the two trees
      m_aInnerTabPanel = new Ext.TabPanel
      (
        {
          activeTab: nActiveTab,
          layoutOnTabChange: true,
          border:false,
          //anchor:'100% 100%',
          region:'center',
          items: aItems
        }
      );

      if (g_aSettings.defaultTree == AIT_ARTEFACT_DIAGRAM)
      {
        //m_aInnerTabPanel.setActiveTab (m_aDiagramTree);
      }
      else
      {
        //m_aInnerTabPanel.setActiveTab (m_aObjectTree);
      }

      m_aInnerTabPanel.on("tabchange", function (aTabPanel, aTab)
        {
          aTab.doLayout ();
        }
      );

      // If we are in IE, we have to make sure that the trees resize properly when we resize the
      // tool panel
      //if (Ext.isIE)
      {
        /*
            Inner function that resizes the contents of the passed treepane..
            This is necessary because in internet explorer the contents of the tree paneldoes not resize properly.
            \param aTree The boc.ait.Tree to resize.
        */
        //--------------------------------------------------------------------
        function resizeTree (aTree)
        //--------------------------------------------------------------------
        {
          if (aTree.rendered)
          {
            var nWidth = that.getSize().width-1;
            aTree.getTreeControl().setWidth(nWidth);
            if (aTree.getLogoArea())
            {
              aTree.getLogoArea().setWidth(nWidth);
            }
          }
        }

        if (m_aObjectTree)
        {
          // Properly resize the tree contents of the objects and the diagrams tree
          m_aObjectTree.on("resize", resizeTree);
        }
        if (m_aDiagramTree)
        {
          m_aDiagramTree.on("resize", resizeTree);
        }
      }

      var m_aDiagramBox = new Ext.BoxComponent
      (
        {
          xtype:'box',
          autoEl:
          {
            tag:'div'
          }
        }
      );

      aConfig.items =
      [
        m_aInnerTabPanel
      ];
      if (!g_aSettings.offline)
      {
        m_aNavigatorPanel = new boc.ait.views.Navigator
        (
          {
            title:'Navigator',
            region:'south',
            height:200,
            split:true,
            collapsible: true
          }
        );
        aConfig.items[aConfig.items.length] = m_aNavigatorPanel;
      }

      aConfig.listeners =
      {
        resize:
        {
          fn: function(p)
          {
            if(g_aMain)
            {
              /*var aMainArea = g_aMain.getMainArea();
              var aTab = aMainArea.getActiveTab();
              aMainArea.doLayout.defer(1, aMainArea);
              aTab.doLayout.defer(1, aTab);*/
            }
          }
        },
        collapse:
        {
          fn: function(p)
          {
            if(g_aMain)
            {
              /*var aMainArea = g_aMain.getMainArea();
              var aTab = aMainArea.getActiveTab();
              aMainArea.doLayout.defer(1, aMainArea);
              aTab.doLayout.defer(1, aTab);*/
            }
          }
        }
      }

    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }

  // protected members:

  /*
      Protected method that returns the currently active tree
      \retval The currently active tree in the treepanel
  */
  //--------------------------------------------------------------------
  this._getActiveTree = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      return m_aInnerTabPanel.getActiveTab();
    }
    catch (aEx)
    {
      displayErrorMessage ( aEx);
    }
  }

  /*
      Protected method that returns the diagramtree
      \retval The tree containing the diagrams
  */
  //--------------------------------------------------------------------
  this._getDiagramTree = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      return m_aDiagramTree;
    }
    catch (aEx)
    {
      displayErrorMessage ( aEx);
    }
  }

  /*
      Protected method that returns the objecttree
      \retval The tree containing the objects
  */
  //--------------------------------------------------------------------
  this._getObjectTree = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      return m_aObjectTree;
    }
    catch (aEx)
    {
      displayErrorMessage ( aEx);
    }
  }

  this._getNavigator = function ()
  {
    return m_aNavigatorPanel;
  }

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.TreePanel.superclass.constructor.call(this, aConfig);

}


// boc.ait.TreePanel is derived from Ext.Panel
Ext.extend
(
  boc.ait.TreePanel,
  Ext.Panel,
  {
    // public members.

    /*
        Public method that returns the currently active tree
        \retval The currently active tree in the treepanel
    */
    //--------------------------------------------------------------------
    getActiveTree : function()
    //--------------------------------------------------------------------
    {
      return this._getActiveTree ();
    },

    /*
        Public method that returns the diagramtree
        \retval The tree containing the diagrams
    */
    //--------------------------------------------------------------------
    getDiagramTree : function ()
    //--------------------------------------------------------------------
    {
      return this._getDiagramTree ();
    },

    /*
        Public method that returns the objecttree
        \retval The tree containing the objects
    */
    //--------------------------------------------------------------------
    getObjectTree : function ()
    //--------------------------------------------------------------------
    {
      return this._getObjectTree();
    },

    getNavigator : function ()
    {
      return this._getNavigator ();
    }
  }
);
// Register the treepanel's xtype.
Ext.reg("boc-treepanel", boc.ait.TreePanel);