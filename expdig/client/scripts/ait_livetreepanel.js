/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2015\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2015
**********************************************************************
\author MWh
This file contains the code for the boc.ait.LiveTreePanel class.
**********************************************************************
*/

Ext.namespace ("boc.ait");

boc.ait.LiveTreePanel = function (aConfig)
{
  var m_aDiagramTree = null;
  var m_aObjectTree = null;
  var m_aInnerTabPanel = null;
  var m_aNavigatorPanel = null;

  aConfig.layout = "border";

  var aItems = [];

  if (g_aSettings.showDiagrams !== false && (!g_aSettings.offline || g_aOfflineData.diagramtreeData.data.length > 0))
  {
    // Create a new tree instance to display diagrams
    m_aDiagramTree = new boc.ait.Tree
    (
      {
        showContextMenu: true,
        editable:true,
        showRecycleBin: g_aSettings.useRecycleBin,
        //searchable:true,
        artefactType: AIT_ARTEFACT_DIAGRAM,
        title: getString("ait_tools_explorer_diagrams")
      }
    );

    //m_aDiagramTree.getTreeControl().on("rowdblclick", onDblClick);
    aItems[aItems.length] = m_aDiagramTree;
  }

  if (!g_aSettings.offline || g_aOfflineData.objecttreeData.data.length > 0)
  {
    // Create a new tree instance to display objects
    m_aObjectTree = new boc.ait.Tree
    (
      {
        showContextMenu: true,
        editable:true,
        showRecycleBin: g_aSettings.useRecycleBin,
        //searchable: true,
        artefactType: AIT_ARTEFACT_OBJECT,
        newObjectTool: true,
        title: getString("ait_tools_explorer_objects")
      }
    );

    aItems[aItems.length] = m_aObjectTree;
  }

  var nActiveTab = (g_aSettings.defaultTree == AIT_ARTEFACT_OBJECT) ? 1 : 0;
  if (!m_aDiagramTree)
  {
    nActiveTab = 0;
  }

  m_aInnerTabPanel = new Ext.TabPanel
  (
    {
      items:aConfig.collapsed ? undefined : aItems,
      activeTab: nActiveTab,
      layoutOnTabChange: true,
      cls : 'explorer-panel',
      region:"center"
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
        title: getString("axw_navigator_title"),
        region:'south',
        height:200,
        split:true,
        collapsible: true
      }
    );
    aConfig.items[aConfig.items.length] = m_aNavigatorPanel;
  }

  boc.ait.LiveTreePanel.superclass.constructor.call (this, aConfig);

  if (this.collapsed)
  {
    this.on("expand", function (aPanel)
      {
        if (m_aInnerTabPanel.items && m_aInnerTabPanel.items.getCount() === 0)
        {
          m_aInnerTabPanel.add (aItems);
          m_aInnerTabPanel.setActiveTab (nActiveTab);
        }
      },
      this
    );
  }

  // After resizing the window or the navigator, we check if the tab panel still has its minimum size
  this.on("afterlayout", function (aPanel)
    {
      if (m_aInnerTabPanel && m_aNavigatorPanel)
      {
        // If the height of the inner tab panel is < 200 but the navigator panel takes up more than 50 pixels
        // reduce the navigator's size
        if (m_aInnerTabPanel.getHeight() < 200 && m_aNavigatorPanel.getHeight() > 50)
        {
          // The new size of the navigator is the current height of the navigator minus what is missing from the tab panel's height
          // to 200 pixels. The minimum height for the navigator is 50 pixels
          m_aNavigatorPanel.setHeight (Math.max (50, m_aNavigatorPanel.getHeight() - (200 - m_aInnerTabPanel.getHeight())));
          // Do a flat recalculation of the layout for the tree panel.
          aPanel.doLayout (true);
        }
      }
    }
  );

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
  };

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
  };

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
  };

  this._getNavigator = function ()
  {
    return m_aNavigatorPanel;
  };

  this._getInnerPanel = function ()
  {
    return m_aInnerTabPanel;
  };
};

Ext.extend
(
  boc.ait.LiveTreePanel,
  Ext.Panel,
  {
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

    getNavigator : function()
    {
      return this._getNavigator ();
    },

    getInnerPanel : function ()
    {
      return this._getInnerPanel ();
    },

    // Override for Panel.setWidth that is required if an AL wants to change the
    // width of the tree before it is fully rendered -> CR 054067
    setWidth: function (nWidth)
    {
      boc.ait.LiveTreePanel.superclass.setWidth.call (this, nWidth);
      this.ownerCt.doLayout (true);
    }
  }
);

Ext.reg("boc-treepanel", boc.ait.LiveTreePanel);
