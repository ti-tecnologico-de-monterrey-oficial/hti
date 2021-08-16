Ext.namespace ("boc.ait.tests");

boc.ait.tests.testDiagramTreeExpand = function(aCfg)
{
  g_aMain.getTreeArea().getDiagramTree().show();
  var aTreeControl = g_aMain.getTreeArea().getDiagramTree().getTreeControl();
  var aStore = aTreeControl.store;

  var aRoots = aStore.getRootNodes();
  if (aRoots.length > 0)
  {
    var aRoot = aRoots[0];

    function doExpand ()
    {
      try
      {
        if (aCfg && aCfg.callback)
        {
          var aScope = aCfg.scope || this;
          aCfg.callback.call(aScope, null);
        }
      }
      finally
      {
        aStore.un("expandnode", doExpand);
      }
    }

    var bIsExpanded = aStore.isExpandedNode(aRoot);

    if (!bIsExpanded)
    {
      aStore.on("expandnode", doExpand);
    }
    aStore.expandNode (aRoot);
    if (bIsExpanded)
    {
      if (aCfg && aCfg.callback)
      {
        var aScope = aCfg.scope || this;
        aCfg.callback.call(aScope, null);
      }
    }
  }
}

boc.ait.tests.testObjectTreeExpand = function()
{
  g_aMain.getTreeArea().getObjectTree().show();
  var aTreeControl = g_aMain.getTreeArea().getObjectTree().getTreeControl();
  var aStore = aTreeControl.store;

  var aRoots = aStore.getRootNodes();
  if (aRoots.length > 0)
  {
    var aRoot = aRoots[0];
    aStore.expandNode (aRoot);
  }
}


boc.ait.tests.testOpenDiagramTreeNodes = function()
{
  var aTreeControl = g_aMain.getTreeArea().getDiagramTree().getTreeControl();
  var aStore = aTreeControl.store;

  var aRoots = aStore.getRootNodes();
  var nDiagramCnt = 0;
  if (aRoots.length > 0)
  {
    var aRoot = aRoots[0];

    var aChildren = aStore.getNodeChildren(aRoot);
    for (var i = 0; i < aChildren.length;++i)
    {
      var aChild = aChildren[i];
      if (aChild.get("_is_leaf"))
      {
        g_aMain.getMainArea().openDiagram(aChild.get("id"));
        ++nDiagramCnt;
      }
    }
    //boc.ait.tests.showStartPage.defer(2000, this);
  }
  return nDiagramCnt;
}

boc.ait.tests.testOpenObjectTreeNodes = function()
{
  var aTreeControl = g_aMain.getTreeArea().getObjectTree().getTreeControl();
  var aStore = aTreeControl.store;

  var aRoots = aStore.getRootNodes();
  if (aRoots.length > 0)
  {
    var aRoot = aRoots[0];

    var aChildren = aStore.getNodeChildren(aRoot);
    for (var i = 0; i < aChildren.length;++i)
    {
      var aChild = aChildren[i];
      if (aChild.get("_is_leaf"))
      {
        g_aMain.getMainArea().openNotebook(aChild.get("id"), AIT_ARTEFACT_OBJECT);
      }
    }
    boc.ait.tests.showStartPage.defer(2000, this);
  }
}


boc.ait.tests.testOpenObjectTreeNode = function(sIDClass, nIndex)
{
  var nIndex = nIndex || 0;
  var aTreeControl = g_aMain.getTreeArea().getObjectTree().getTreeControl();
  var aStore = aTreeControl.store;

  var aRoots = aStore.getRootNodes();
  if (aRoots.length > 0)
  {
    var aRoot = aRoots[0];

    var aChildren = aStore.getNodeChildren(aRoot);
    var nCnt = 0;
    for (var i = 0; i < aChildren.length;++i)
    {
      var aChild = aChildren[i];
      if (aChild.get("_is_leaf") && aChild.get("idClass") == sIDClass)
      {
        if (nCnt != nIndex)
        {
          ++nCnt;
          continue;
        }

        var aMainArea = g_aMain.getMainArea();
        aMainArea.openNotebook(aChild.get("id"), AIT_ARTEFACT_OBJECT);
        /*var aNB = Ext.getCmp("notebook-"+aChild.get("id"));
        aNB.switchMode(true);*/

        // Start an ajax request that passes the JSON encoded object containing
        // the changed values to the server saves them
        Ext.Ajax.request
        (
          {
            url:"proxy",
            method:"POST",
            params:
            {
              type: "savenotebook",
              params:Ext.encode
              (
                {
                  artefactType: AIT_ARTEFACT_OBJECT,
                  id: aChild.get("id"),
                  changes:
                  {
                    NAME: "aaaaChangedName"
                  }
                }
              )
            },
            // On success we show a message
            //success: aSuccessMsgFunction,
            // On failure we do nothing, our basex ajax extension handles ajax
            // errors
            failure: Ext.emptyFn
          }
        );
        return;

      }
    }
    boc.ait.tests.showStartPage.defer(2000, this);
  }
}


boc.ait.tests.showStartPage = function()
{
  var aMainArea = g_aMain.getMainArea();
  aMainArea.activate(aMainArea.getStartPage());
}

boc.ait.tests.closeAllOpenTabs = function ()
{
  var aMainPanel = g_aMain.getMainArea();

  aMainPanel.items.each(
    function (aItem)
    {
      if(aItem.initialConfig.closable)
      {
        aMainPanel.remove(aItem);
      }
    }
  );
}

boc.ait.tests.openAllNBs = function ()
{
  var aMainPanel = g_aMain.getMainArea();

  var aInsts = null;

  function openNB (nIndex)
  {
    if (aInsts && nIndex < aInsts.length)
    {
      aMainPanel.openNotebook(aInsts[nIndex].id, AIT_ARTEFACT_OBJECT);

      boc.ait.tests.closeAllOpenTabs.defer (200, this);
      openNB.defer (400, this, [++nIndex]);
    }
    else
    {
      boc.ait.tests.closeAllOpenTabs.defer (800, this);
    }
  }

  function successGetAllNBs (aResponse, aOptions)
  {
    var aRetObj = Ext.util.JSON.decode(aResponse.responseText);

    if (aRetObj.error)
    {
      // Show an error message
      showErrorBox(aRetObj.errString);
      // Undo the change in the tree
      return;
    }

    aInsts = aRetObj.payload;

    openNB.call (this, 0);
  }

  Ext.Ajax.request
  (
    {
      url:"proxy",
      method:"POST",
      params:
      {
        type: "testgetallobjects",
        params:Ext.encode
        (
          {}
        )
      },
      // On success we show a message
      success: successGetAllNBs,
      // On failure we do nothing, our basex ajax extension handles ajax
      // errors
      failure: Ext.emptyFn
    }
  );
}

boc.ait.tests.createBIAs = function ()
{
  var aMainPanel = g_aMain.getMainArea();

  var aInsts = null;

  function createBIA (nIndex)
  {
    if (aInsts && nIndex < aInsts.length)
    {
      var aViewConfig =
      {
        type: "view",
        webMethod: "bia",
        retrieverConfig :
        {
          url: 'proxy',
          baseParams:
          {
            configId: "{5e8325be-bd67-4531-9333-9351a03bfe36}"
          },
          // Use a new JsonReader as reader for the store
          reader: new Ext.data.JsonReader()
        },
        artefactInfo:
        {
          artefactType: AIT_ARTEFACT_OBJECT,
          artefactIds: [aInsts[nIndex].id]
        }
      };
      g_aMain.getMainArea().openView (aViewConfig);

      createBIA.defer (1000, this, [++nIndex]);
      boc.ait.tests.closeAllOpenTabs.defer (2000, this);
    }
    else
    {
      boc.ait.tests.closeAllOpenTabs.defer (2000, this);
    }
  }

  function successGetAllObjects (aResponse, aOptions)
  {
    var aRetObj = Ext.util.JSON.decode(aResponse.responseText);

    if (aRetObj.error)
    {
      // Show an error message
      showErrorBox(aRetObj.errString);
      // Undo the change in the tree
      return;
    }

    aInsts = aRetObj.payload;

    createBIA.call (this, 0);
    //alert(aInsts.length);
  }

  Ext.Ajax.request
  (
    {
      url:"proxy",
      method:"POST",
      params:
      {
        type: "testgetallobjects",
        params:Ext.encode
        (
          {
            classIds: ["{3e3fe953-44a2-4bc9-bc91-3cdf10f963c1}"]
          }
        )
      },
      // On success we show a message
      success: successGetAllObjects,
      // On failure we do nothing, our basex ajax extension handles ajax
      // errors
      failure: Ext.emptyFn
    }
  );
}


boc.ait.tests.openAllRootModelsRepeat = function ()
{
  boc.ait.tests.testDiagramTreeExpand
  (
    {
      callback:function ()
      {
        var nOpenedDiagrams = 0;
        var nDiagrams = 0;
        function _removeOpenedPanel (aPanel)
        {
          ++nOpenedDiagrams;
          if (nOpenedDiagrams === nDiagrams)
          {
            g_aEvtMgr.un("modelloaded", _removeOpenedPanel);
            boc.ait.tests.closeAllOpenTabs();

            boc.ait.tests.openAllRootModelsRepeat.defer(1000);
          }
        }

        g_aEvtMgr.on("modelloaded", _removeOpenedPanel);
        nDiagrams = boc.ait.tests.testOpenDiagramTreeNodes();
      }
    }
  )
}
