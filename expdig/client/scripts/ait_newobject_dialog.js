/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.NewObjectDialog class that
is used to create new objects
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');

/*
    Implementation of the class boc.ait.NewObjectDialog.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.NewObjectDialog = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var that = this;
  // Initialize the config object if necessary
  aConfig = aConfig || {};

  var m_aNameBox = null;
  var m_aNamePanel = null;
  var m_aOKButton = null;
  var m_aCancelButton = null;
  var m_aMetaModelTree = null;
  var m_aGroupTree = null;
  var m_sTargetGroupID = null;
  var m_sClassId = null;
  var m_aCreatedCallback = null;
  var m_aScope = null;

  var m_aInnerPanel = null;



  /*
      Private function that is called whenever the selection in the trees
      or the value of the name field changes
  */
  //--------------------------------------------------------------------
  var doEnableDisable = function ()
  //--------------------------------------------------------------------
  {
    var sName = m_aNameBox.getValue();
    // If no name was entered, disable the ok button
    if (sName === null || sName === "")
    {
      m_aOKButton.disable();
      return false;
    }

    // Only check the selection of the metamodel tree if we do not already have a class id that was
    // passed to us
    if (m_sClassId === null || m_sClassId === undefined)
    {
      var aClassNode = m_aMetaModelTree.getSelectionModel().getSelectedNode();
      // If no class was selected, disable the ok button
      if (!aClassNode)
      {
        m_aOKButton.disable();
        return false;
      }
    }

    // Only check the selection of the target group tree if we do not already have a target group id that was
    // passed to us
    if (aConfig.showGroupTree !== false && (m_sTargetGroupID === null || m_sTargetGroupID === undefined))
    {
      var aGroupNodes = m_aGroupTree.getSelectedNodes();

      // If no target group was selected, disable the ok button
      if (aGroupNodes.length === 0 || aGroupNodes[0] === null)
      {
        m_aOKButton.disable();
        return false;
      }
    }
    // If all checks were passed, enable the ok button
    m_aOKButton.enable();
    return true;
  };

  /*
      Private callback function that is called when the object was succesfully created in the
      aserver.
  */
  //--------------------------------------------------------------------
  var doObjectCreated = function (bSuccess, aObject)
  //--------------------------------------------------------------------
  {
    try
    {
      // Variable that determines whether or not we close the dialog after the object was created
      var bCloseDialog = true;
      if (!bSuccess)
      {
        that.getEl().unmask ();
        // If the object was not created successfully, we don't close the dialog
        bCloseDialog = false;
      }
      
      // Call the callback defined for when the creation finishes
      if (typeof m_aCreatedCallback == "function")
      {
        // If the createobject callback returns false, we don't close the dialog
        bCloseDialog = bCloseDialog && m_aCreatedCallback.apply(m_aScope, [aObject]) !== false;
      }
      
      if (bCloseDialog)
      {
        // Close the dialog
        that.close();
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };


  /*
      Private function that is called when the ok button is clicked.
  */
  //--------------------------------------------------------------------
  var doOk = function ()
  //--------------------------------------------------------------------
  {
    that.getEl().mask(getString("ait_loading"), 'x-mask-loading');
    var bError = false;
    try
    {
      var sClassId = m_sClassId;
      if (!m_sClassId)
      {
        // Get the selected class
        var aClass = m_aMetaModelTree.getSelectedNodes()[0];
        // Get the selected class id - the id of the nodes in the metamodel tree
        // consists of the modeltype id, a colon and the class id
        sClassId = aClass.id.split(":")[1];
      }
      
      if (aConfig.showGroupTree !== false && (m_sTargetGroupID === null || m_sTargetGroupID === undefined))
      {
        var aGroup = m_aGroupTree.getSelectedNodes()[0];
        m_sTargetGroupID = aGroup.id;
      }
      var sName = m_aNameBox.getValue();
      
      var aCreationParams =
      {
        name: sName,
        targetGroupID: m_sTargetGroupID,
        targetGroupName: aConfig.targetGroupName,
        establishOwnership : aConfig.establishOwnership,
        // Only store in the default group, if no group can be selected here
        storeInDefaultGroup: !m_sTargetGroupID,
        classId: sClassId
      };


      var aAttributes = {};
      if (typeof aConfig.attributeRetriever === "function")
      {
        aAttributes = aConfig.attributeRetriever.call (aConfig.attributeRetrieverScope || this, aCreationParams);
      }


      aCreationParams.callback = doObjectCreated;
      
      var bStoreInDefaultGroup = aCreationParams.storeInDefaultGroup;
      if (!bStoreInDefaultGroup && !m_sTargetGroupID)
      {
        bStoreInDefaultGroup = true;
      }
      
      // Destroy the group tree to make sure that events are not fired more often than necessary when creating
      // the new object
      if (m_aGroupTree)
      {
        m_aGroupTree.destroy ();
      }
      // Create the artefact
      boc.ait.createArtefact
      (
        {
          name: sName,
          targetGroupID: m_sTargetGroupID,
          attributes:aAttributes,
          targetGroupName: aConfig.targetGroupName,
          establishOwnership : aConfig.establishOwnership,
          // Only store in the default group, if no group can be selected here
          //storeInDefaultGroup: (!sTrgGroupID && !m_aGroupTree && !m_aMetaModelTree),
          storeInDefaultGroup: bStoreInDefaultGroup,
          classId: sClassId,
          callback: doObjectCreated
        }
      );
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
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      m_sTargetGroupID = aConfig.targetGroupID;
      if (aConfig.classIDs && aConfig.classIDs.length == 1)
      {
        m_sClassId = aConfig.classIDs[0];
      }
      // The configuration's title should be the passed title, or by default
      // the string 'Create new Object'
      aConfig.title = aConfig.title || getString("ait_new_object_title").replace(/%CLASS_NAME%/, getString("ait_new_object_default"));
      aConfig.layout = 'border';

      aConfig.defaults =
      {
        style: 'padding: 5px;'
      };

      // Make sure the dialog's header is always visible
      aConfig.constrainHeader = true;

      m_aCreatedCallback = aConfig.callback;
      m_aScope = aConfig.scope || this;

      // Create a new textbox where the user can enter a name for the new class
      m_aNameBox = new Ext.form.TextField
      (
        {
          region: 'center',
          //cls: "boc-notebook-singlelinefield boc-notebook-field",
          listeners:
          {
            render: function ()
            {
              //m_aNameBox.getEl().dom.parentNode.style.paddingRight = "8pt";
              if (Ext.isIE8)
              {
                m_aNameBox.getEl().dom.parentNode.style.paddingTop= "1pt";
              }
            },
            valid: doEnableDisable
          }
        }
      );

      // If we weren't passed a single class id in which case we don't display
      // the class tree, we have to determine the classes of which objects can
      // be created by this dialog.
      // To do so, we have to take into account the classIDs passed to this dialog
      // (e.g. by the relations dialog) and the creatableClasses that were configured
      // in the Admin toolkit
      if (!m_sClassId)
      {
        var aCreatableClasses = [];
        // Check if we have configured creatable classes and passed classIds
        if (g_aSettings.creatableClasses && aConfig.classIDs)
        {
          // Iterate through the passed class ids
          for (var i = 0; i < aConfig.classIDs.length;++i)
          {
            // Iterate through the configured creatable Classes
            for (var j = 0; j < g_aSettings.creatableClasses.length;++j)
            {
              // Only if a classId was both passed to this dialog and is also contained
              // in the configured creatable classes, we add it to this dialog's
              // creatable classes
              if (g_aSettings.creatableClasses[j] == aConfig.classIDs[i])
              {
                aCreatableClasses[aCreatableClasses.length] = aConfig.classIDs[i];
                break;
              }
            }
          }
        }
        // If we only have creatable classes, those are the classes
        // that can be instantiated by this dialog
        else if (g_aSettings.creatableClasses)
        {
          aCreatableClasses = g_aSettings.creatableClasses;
        }

        // Create a new metamodel tree so the user can pick a class
        m_aMetaModelTree = new boc.ait.MetaModelTree
        (
          {
            title: getString("ait_new_object_class")+":",
            border: true,
            fillInitially: false,
            autoScroll: true,
            containerScroll: true,
            region: 'center',
            ddScroll: true,
            // Pass the classIds that can be instantiated to the metamodel dialog
            classIds: aCreatableClasses,
            listeners:
            {
              selectionchange: doEnableDisable
            }
          }
        );
      }
      // Put the target group in the east region by default
      var sGroupTreeRegion = "east";

      // If we do not have a metamodel tree, because there is only one class the user
      // can instantiate, move the target group tree to the center region
      if (!m_aMetaModelTree)
      {
        sGroupTreeRegion = "center";
      }
      // If we weren't passed a target group ID, we have to display a
      // tree in which the user can pick a target group for the new object
      if (aConfig.showGroupTree !== false && (m_sTargetGroupID === null || m_sTargetGroupID === undefined))
      {
        // Create a new tree so the user can select a targetgroup
        m_aGroupTree = new boc.ait.Tree
        (
          {
            title: getString("ait_new_object_trg_grp")+":",
            region: sGroupTreeRegion,
            width: 280,
            border: true,
            // Only allow single selection
            singleSelection: true,
            type: 'toc',
            // Show an object tree
            artefactType: AIT_ARTEFACT_OBJECT,
            // Do not show leafs
            hideLeafs : true,
            listeners:
            {
              selectionchange: doEnableDisable,
              refresh: doEnableDisable
            }
          }
        );
      }

      // By default, put the name panel in the north region
      var sNamePanelRegion = "north";
      // If we have neither a metamodel tree nor a group tree
      // we move the name panel to the center region
      if (!m_aMetaModelTree && !m_aGroupTree)
      {
        sNamePanelRegion = "center";
      }
      // Create a panel that will hold the name box
      m_aNamePanel = new Ext.Panel
      (
        {
          title: getString("ait_new_object_name")+":",
          border: false,
          hideLabel:false,
          labelAlign: 'top',
          cls: "ait_dialog_panel",
          layout: "fit",
          region: sNamePanelRegion,
          autoHeight: true,
          items:
          [
            m_aNameBox
          ]
        }
      );

      if (!m_aMetaModelTree && !m_aGroupTree)
      {
        aConfig.layout = 'form';
        aConfig.autoHeight = true;
        aConfig.items =
        [
          m_aNamePanel
        ];

        m_aInnerPanel = m_aNamePanel;
      }
      else
      {

        // Create the array that will hold the items of the inner panel
        var aInnerPanelItems =
        [
          m_aNamePanel
        ];

        // If we have a meta model tree, add it to the inner panel's items
        if (m_aMetaModelTree)
        {
          aInnerPanelItems[aInnerPanelItems.length] = m_aMetaModelTree;
        }
        // Otherwise, if we have a group tree, add it to the inner panel's items
        else if (m_aGroupTree)
        {
          aInnerPanelItems[aInnerPanelItems.length] = m_aGroupTree;
        }

        m_aInnerPanel = new Ext.Panel
        (
          {
            title : '',
            border:false,
            region:'center',
            layout: 'border',
            baseCls: 'ait_dialog_panel',
            style:"border-top:0px;",
            defaults:
            {
              //style: 'padding: 5px;'
            },
            items: aInnerPanelItems
          }
        );

        aConfig.items =
        [
          m_aInnerPanel
        ];

        // If we have both a metamodel tree and a group tree, add the group tree
        // directly to the configuration's items
        if (m_aMetaModelTree && m_aGroupTree)
        {
          aConfig.items[aConfig.items.length] = m_aGroupTree;
        }
      }

      aConfig.resizable = true;
      aConfig.autoDestroy = true;
      aConfig.closeAction = 'close';

      // Create the ok button
      m_aOKButton = new Ext.Button
      (
        {
          text: getString("ait_ok"),
          disabled: true,
          minWidth: 80,
          handler: doOk
        }
      );

      // Create the cancel button
      m_aCancelButton = new Ext.Button
      (
        {
          text: getString("ait_cancel"),
          minWidth: 80,
          handler: function ()
          {
            that.close();
          }
        }
      );

      // Setup the dialog's buttons
      aConfig.buttons =
      [
        m_aOKButton,
        m_aCancelButton
      ];

      aConfig.listeners =
      {
        render : function (aCmp)
        {
          // Create a KeyMap
          new Ext.KeyMap
          (
            aCmp.getEl(),
            {
              key: Ext.EventObject.ENTER,
              fn: function ()
              {
                //if (!m_aOKButton.disabled)
                if (doEnableDisable())
                {
                  doOk ();
                }
              }
            }
          );
        }
      };
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // Call to the constructor function to build the object
  buildObject();
  
  aConfig.defaultButton = m_aNameBox;
  // Call to the superclass' constructor
  boc.ait.NewObjectDialog.superclass.constructor.call(this, aConfig);

  // Specifiy the dialog's size
  if (m_aGroupTree && m_aMetaModelTree)
  {
    // Set the size of the dialog
    this.setSize (600, 400);
  }
  else if (m_aGroupTree || m_aMetaModelTree)
  {
    this.setSize (300, 400);
  }
  else
  {
    this.setSize(300, 150);
  }

  // If we have a group tree, add a class to its header
  if (m_aGroupTree)
  {
    /*
        Handler function for the grouptree's render event
        \param aCmp The grouptree
    */
    //--------------------------------------------------------------------
    m_aGroupTree.on("render", function (aCmp)
    //--------------------------------------------------------------------
      {
        aCmp.header.addClass ("boc-form-group");
      }
    );
  }

  // If we have a metamodel tree, add a class to its header and load its content
  if (m_aMetaModelTree)
  {
    /*
        Handler function for the metamodel tree's render event
        \param aCmp The metamodel tree
    */
    //--------------------------------------------------------------------
    m_aMetaModelTree.on("render", function (aCmp)
    //--------------------------------------------------------------------
      {
        aCmp.header.addClass ("boc-form-group");
        // Load the contents of the meta model tree
        m_aMetaModelTree.load();
      }
    );
  }

  /*
      Handler function for the namepanel's render event
      \param aCmp The name panel
  */
  //--------------------------------------------------------------------
  m_aNamePanel.on("render", function (aCmp)
  //--------------------------------------------------------------------
    {
      if (aCmp.header)
      {
        aCmp.header.addClass ("boc-form-group-no-border");
      }
    }
  );
  
  this._getNameBox = function ()
  {
    return m_aNameBox;
  };

  this._getGroupTree = function ()
  {
    return m_aGroupTree;
  };

  this._getMetaModelTree = function ()
  {
    return m_aMetaModelTree;
  };

  this._getInnerPanel = function ()
  {
    return m_aInnerPanel;
  };
};

// boc.ait.NewObjectDialog is derived from Ext.Window
Ext.extend
(
  boc.ait.NewObjectDialog,
  Ext.Window,
  {
    getNameBox: function ()
    {
      return this._getNameBox ();
    },

    getGroupTree: function ()
    {
      return this._getGroupTree ();
    },

    getMetaModelTree : function ()
    {
      return this._getMetaModelTree ();
    },

    getInnerPanel: function ()
    {
      return this._getInnerPanel ();
    }
  }
);

// Register the dialog's xtype
Ext.reg("boc-newobjectdialog", boc.ait.NewObjectDialog);