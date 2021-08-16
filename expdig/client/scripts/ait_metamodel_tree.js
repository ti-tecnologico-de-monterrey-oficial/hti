/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.MetaModelTree class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');


/*
    Implementation of the class boc.ait.MetaModelTree.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.MetaModelTree = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:

  var that = this;
  // Initialize the config object if necessary
  aConfig = aConfig || {};

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      // If no title was passed, use a default title
      if (aConfig.title === undefined || aConfig.title === null)
      {
        aConfig.title = 'Metamodel:';
      }
      /*aConfig.tbar = new Ext.Toolbar
      (
        {
          style:"border-left-width:0px;border-right-width:0px;border-top-width:0px;background:transparent;",
          items:[aConfig.title]
        }
      )*/

      //aConfig.title = "&nbsp;";

      // An object that specifies restrictions for the returned metamodel, such as the
      // class and model type ids that are allowed to be shown.
      var aRestriction =
      {
        classIds: aConfig.classIds,
        mtIds: aConfig.mtIds
      };

      aConfig.rootVisible = false;
      // If the tree should be filled immediately, use an asynchronous treeloader
      if (aConfig.fillInitially)
      {
        aConfig.loader = new Ext.tree.TreeLoader
        (
          {
            dataUrl: 'proxy',
            baseParams:
            {
              type: 'metamodel',
              params: Ext.encode
              (
                {
                  restriction: aRestriction
                }
              )
            }
          }
        );
      }
      else
      {
        aConfig.loader = new Ext.tree.TreeLoader();
      }
      aConfig.preloadChildren = false;

      // Set the tree's root node
      aConfig.root = new Ext.tree.AsyncTreeNode
      (
        {
          text: 'Root',
          id: 'root'
        }
      );

      // Add a listener to the tree's selection model so it forwards its selectionchange event
      aConfig.selModel = new Ext.tree.DefaultSelectionModel
      (
        {
          listeners:
          {
            selectionchange: function (aSelModel, aNode)
            {
              that.fireEvent('selectionchange', aNode);
            }
          }
        }
      );

      aConfig.listeners = aConfig.listeners || {};

      // If no listener was defined for the click event, we
      // Add a new one that prevents selecting folders
      // Only leafs may be selected
      if (!aConfig.listeners.click)
      {
        aConfig.listeners.click = function (aNode)
        {
          return aNode.isLeaf();
        };
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  /*
      Protected method that is called when the meta model tree has finished loading.
      Scope is the store that called this function.

      May throw an exception.
  */
  //--------------------------------------------------------------------
  function onTreeLoaded ()
  //--------------------------------------------------------------------
  {
    // Get the root node
    var aRoot = that.getRootNode();
    var sIconURL = boc.ait.getIconPath ();

    var aData = this.reader.jsonData;
    var aNodes = [];
    // Iterate through the data and create nodes accordingly
    for (var i = 0; i < aData.length;++i)
    {
      var aObj = aData[i];

      for (var j = 0; j < aObj.children.length;++j)
      {
        var aChild = aObj.children[j];
        aChild.icon = sIconURL + aChild.icon;
        aChild.iconCls = "ait_metamodel_tree_node_img";
      }
     
      var aNode = new Ext.tree.AsyncTreeNode
      (
        {
          text: aObj.text,
          id: aObj.id,
          icon: sIconURL+aObj.icon,
          iconCls: "ait_metamodel_tree_node_img",
          children: aObj.children
        }
      );
      
      aNodes.push (aNode);

      aRoot.appendChild (aNode);
    }
    
    that.fireEvent("load", aNodes);
  }

  // Protected members

  /*
      Protected function that returns the nodes selected in the metamodel tree

      May throw an exception.

      \retval An array containing the nodes selected in the tree (only one node can be selected).
  */
  //--------------------------------------------------------------------
  this._getSelectedNodes = function ()
  //--------------------------------------------------------------------
  {
    return [this.getSelectionModel().getSelectedNode()];
  };

  // Call to the constructor function to build the object
  buildObject();


  // Call to the superclass' constructor
  boc.ait.MetaModelTree.superclass.constructor.call (this, aConfig);
  var sIconURL = boc.ait.getIconPath ();

  this.on("append", function (aTree, aParentNode, aNode)
    {
      aNode.icon = sIconURL + aNode.icon;
      return true;
    }
  );


  /*
      Protected method that loads the metamodel into the tree on demand

      May throw an exception.
  */
  //--------------------------------------------------------------------
  this._load = function ()
  //--------------------------------------------------------------------
  {
    // Create a new instance of JsonStore to receive the diagram info data from the server
    var aStore = new Ext.data.JsonStore
    (
      {
        autoDestroy:true,
        url: 'proxy',
        baseParams:
        {
          type: 'metamodel',
          params:Ext.encode
          (
            {
              restriction:
              {
                classIds: aConfig.classIds,
                mtIds: aConfig.mtIds
              }
            }
          )
        },
        // Use a new JsonReader as reader for the store
        reader: new Ext.data.JsonReader()
      }
    );

    // Load the store and set a callback function
    aStore.load
    (
      {
        callback: onTreeLoaded
      }
    );
  };
};

// boc.ait.MetaModelTree is derived from Ext.tree.TreePanel
Ext.extend
(
  boc.ait.MetaModelTree,
  Ext.tree.TreePanel,
  {
    /*
        Public method that returns the nodes selected in the tree

        May throw an exception.

        \retval An array with the selected nodes
    */
    //--------------------------------------------------------------------
    getSelectedNodes : function ()
    //--------------------------------------------------------------------
    {
      return this._getSelectedNodes();
    },

    /*
        Public function that loads the metamodel into the tree on demand

        May throw an exception.
    */
    //--------------------------------------------------------------------
    load : function ()
    //--------------------------------------------------------------------
    {
      this._load();
    }
  }
);

// Register the metamodeltree's xtype
Ext.reg("boc-metamodeltree", boc.ait.MetaModelTree);