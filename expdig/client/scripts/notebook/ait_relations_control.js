/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2010\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2010
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.RelationsControl class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.RelationsControl. This class
    is used for showing relations inside the notebook.

    !Important: Handling of references to diagrams is not handled correctly at the moment
    The following of existing references to diagrams can be done, but new references
    to diagrams cannot be created.

    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.RelationsControl = function (aConfig)
//--------------------------------------------------------------------
{
  var that = this;

  var m_aRelWin = null;
  var m_sRelClassName = null;
  var m_sRelClassId = null;
  var m_aTargetInformation = null;
  var m_bIncoming = false;
  // An array containing the already created relation targets
  var m_aRelationTargets = null;
  var m_nMaxTrgOccurrances = null;
  var m_sInstanceParentID = null;
  var m_aRemoveButton = null;
  var m_aAddButton = null;
  var m_aFollowButton = null;
  var m_aCreateObjectButton = null;
  var m_aDeleteTargetButton = null;
  var m_aAllowedCreatableClasses = null;
  var m_aAllowedDeletableClasses = null;
  var m_sNameOfClassToCreate = "";
  var m_sNameOfClassToDelete = "";
  var m_sTargetClassName = "";

  var m_aChangedRelationInfo = new Ext.util.MixedCollection ();

  //aConfig.bodyStyle = "border:1px solid black;padding-left:0px;padding-top:0px;padding-right:2px;padding-bottom:8px;border-color:rgb(181, 184, 200);";


  function modifyRelationInformation (aTargets, bAdd)
  {
    for (var i = 0; i < aTargets.length;++i)
    {
      var sId = aTargets[i].id;
      m_aChangedRelationInfo.removeKey (sId);
      var bAddToRelInformation = bAdd;
      for (var j = 0; j < that.data.targets.length;++j)
      {
        if (that.data.targets[j].id === sId)
        {
          bAddToRelInformation = !bAdd;
          break;
        }
      }

      if (bAddToRelInformation)
      {
        var aTargetInfo = aTargets[i].info;
        aTargetInfo.fromInstId = this.data.incoming === true ? aTargets[i].info.artefactId : this.notebook.getArtefactId ();
        if (sId.indexOf("ext-gen") === -1)
        {
          aTargetInfo.fromEpId = this.data.incoming === true ? sId : undefined;
          aTargetInfo.toEpId = this.data.incoming === true ? undefined : sId;
        }
        aTargetInfo.toInstId = this.data.incoming === true ? this.notebook.getArtefactId () : aTargets[i].info.artefactId;
        aTargetInfo.fromArtefactType = this.data.incoming === true ? aTargetInfo.artefactType : this.notebook.getArtefactType ();
        aTargetInfo.toArtefactType = this.data.incoming === true ? this.notebook.getArtefactType () : aTargetInfo.artefactType;
        delete aTargetInfo.artefactType;
        aTargetInfo.added = bAdd;
        m_aChangedRelationInfo.add
        (
          sId,
          aTargetInfo
        );
      }
    }

    this._onRelChange ();
    //this.notebook.onRelChange (m_sRelClassId, m_aChangedRelationInfo);
  }

  this._addTargets = function (aTargets)
  {
    modifyRelationInformation.call (this, aTargets, true);
  };

  this._removeTargets = function (aTargets)
  {
    modifyRelationInformation.call (this, aTargets, false);
  };

  /*
      Protected method that returns the relation targets displayed in this control.
      \retval An array of relation targets.
  */
  //--------------------------------------------------------------------
  this._getRelationTargets = function ()
  //--------------------------------------------------------------------
  {
    return m_aRelationTargets;
  };

  /*
      Protected method that returns the parent group id of the current instance
      (for which we opened the notebook)
      \retval The id of the group in which the current instance lies.
  */
  //--------------------------------------------------------------------
  this._getParentID = function()
  //--------------------------------------------------------------------
  {
    return m_sInstanceParentID;
  };

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
        targetGroupID: that.getParentID(),
        // Pass the allowed creatable classes
        classIDs : m_aAllowedCreatableClasses,
        scope: that,
        caller: that,
        // Pass a callback to the dialog that
        // adds the newly created object to the relation dialog's target list
        callback: function (aCreatedInstance)
        {
          this.getEl().mask(getString("ait_loading"), 'x-mask-loading');
          var bError = false;
          try
          {
            var aAddedRels =
            [
              {
                id:aCreatedInstance.id,
                artefactType: AIT_ARTEFACT_OBJECT
              }
            ];

            that._addTargets ([{id:Ext.id(), info:{artefactId:aCreatedInstance.id, artefactType: AIT_ARTEFACT_OBJECT}}]);
            aCreatedInstance.artefactId = aCreatedInstance.id;
            aCreatedInstance.artefactType = AIT_ARTEFACT_OBJECT;

            that.showAddedTargets ([aCreatedInstance], true);
            this.getEl().unmask ();
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
              this.getEl().unmask ();
            }
          }
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
      bError = true;
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
          deleteRelation.apply(that, [true]);
        },
        this
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  this._evaluateCardinalities = function ()
  {
    var bMaxReached = false;
    if (m_aRelationTargets.length >= m_nMaxTrgOccurrances && m_nMaxTrgOccurrances !== 0 && m_nMaxTrgOccurrances !== -1)
    {
      bMaxReached = true;
    }

    if (m_aAddButton)
    {
      m_aAddButton.setDisabled (bMaxReached);
    }
    if (m_aCreateObjectButton)
    {
      m_aCreateObjectButton.setDisabled (bMaxReached);
    }

    var aRecords = that.field.getSelectedRecords();
    if (aRecords.length == 0)
    {
      if (m_aRemoveButton)
      {
        m_aRemoveButton.disable ();
      }
      if (m_aDeleteTargetButton)
      {
        m_aDeleteTargetButton.disable();
      }
    }
  };

  /*
      Protected method that sets the current relation targets of the rel control
      \param aRelationTarget An array of relation targets
  */
  //--------------------------------------------------------------------
  this._setRelationTargets = function (aRelationTargets)
  //--------------------------------------------------------------------
  {
    m_aRelationTargets = aRelationTargets;
    this.data.targets = aRelationTargets;
  };

  /*
      Protected method that follows the reference to the selected node (opens
      the diagram or object)
      \param aNode The relation target to follow
  */
  //--------------------------------------------------------------------
  this._followReference = function (aRecord)
  //--------------------------------------------------------------------
  {
    if (aRecord.get("broken") === true)
    {
      return;
    }

    var nArtefactType = aRecord.get("artefactType");
    if (nArtefactType === AIT_ARTEFACT_OBJECT)
    {
      g_aMain.getMainArea().openNotebook(aRecord.get("artefactId"), nArtefactType);
    }
    else if (nArtefactType === AIT_ARTEFACT_DIAGRAM)
    {
      g_aMain.getMainArea().openDiagram(aRecord.get("artefactId"), nArtefactType);
    }
    else if (nArtefactType === AIT_ARTEFACT_MODINST)
    {
      g_aMain.getMainArea().openNotebook(aRecord.get("artefactId"), nArtefactType, false, null, null, aRecord.get("modelId"));
    }
  }

  /*
      Private function that is called when a relation or relation target is deleted

      \param bRemoveTrgFromRepo If true, the selected target is also removed from the repository
  */
  //--------------------------------------------------------------------
  var deleteRelation = function (bRemoveTrgFromRepo, aRecords)
  //--------------------------------------------------------------------
  {
    that.getEl().mask(getString("ait_loading"), 'x-mask-loading');
    var bError = false;
    try
    {
      // If there were no records passed, we take the selected records
      if (Ext.isEmpty(aRecords))
      {
        // Get the currently selected targets
        aRecords = that.field.getSelectedRecords();
      }
      if (aRecords.length === 0)
      {
        that.getEl().unmask ();
        return;
      }

      var nOwnerIndex = -1;
      var aTargets = [];
      // Iterate through the selected nodes and concatenate them into a
      // comma separated string.
      for (var i = 0; i < aRecords.length;++i)
      {
        var aRecord = aRecords[i];

        aTargets[aTargets.length] =
        {
          id: aRecord.get("id"),
          artefactID: aRecord.get("artefactId"),
          artefactType: aRecord.get("artefactType")
        }

        // If we are in an ownership relation and the target we want to delete
        // is the current user, we store the index of the target
        if (that.data.ownerShipRel && aRecord.id == g_aSettings.user.ID)
        {
          nOwnerIndex = i;
        }
      }

      // If we found ourselves as target to delete in the ownership relation
      // we have to query the user whether he wants to proceed
      if (nOwnerIndex > -1)
      {
        Ext.Msg.confirm
        (
          getStandardTitle (),
          getString("ait_query_delete_owner"),
          // Callback that is called when the user picks an option
          function (sResult)
          {
            // If the user does not want to proceed, remove the user entry
            // from the targets to remove
            if (sResult === "no")
            {
              aTargets.splice(nOwnerIndex, 1);
            }
            // If we still have targets, remove them
            if (aTargets.length > 0)
            {
              deleteRelationAjax.apply(that, [bRemoveTrgFromRepo, aTargets]);
            }
            // Otherwise, return
            else
            {
              that.getEl().unmask();
              return;
            }
          },
          this
        );
      }
      else
      {
        deleteRelationAjax (bRemoveTrgFromRepo, aTargets);
      }
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
        that.getEl().unmask ();
      }
    }
  };

  /*
      Private function that removes the passed targets from the relation

      \param bRemoveTrgFromRepo If true, the selected targets are also removed from the repository
      \param aTargets The array of targets to remove from the relation
  */
  //--------------------------------------------------------------------
  var deleteRelationAjax = function (bRemoveTrgFromRepo, aTargets)
  //--------------------------------------------------------------------
  {
    var bError = true;
    try
    {
      for (var i = 0; i < aTargets.length;++i)
      {
        that._removeTargets
        (
          [
            {
              id:aTargets[i].id,
              info:
              {
                artefactId:aTargets[i].artefactID,
                artefactType:aTargets[i].artefactType
              }
            }
          ]
        );
      }

      var aRecords = that.field.getSelectedRecords ();
      var aDeletedInstIDs = [];
      var nLength = aRecords.length;
      for (var i = nLength-1; i >= 0;--i)
      {
        aDeletedInstIDs[i] = aRecords[i].get("artefactId");
        //that.field.getRootNode().removeChild(aNodes[0]);
        //that.field.getStore().remove (aRecords[i]);
      }

      that.field.getStore().remove(aRecords);



      m_aRelationTargets = [];
      var aRecords = that.field.getStore().getRange ();
      // Iterate through the remaining nodes, create an array
      // containing their necessary data and store it in the config
      // so it can be passed to the relations dialog on demand
      for (var i = 0; i < aRecords.length;++i)
      {
        m_aRelationTargets[i] = aRecords[i].data;
      }
      that.data.targets = m_aRelationTargets;

      if (bRemoveTrgFromRepo)
      {
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
              that._evaluateCardinalities();
            },
            // On failure we undo the change to the node's name
            failure: Ext.emptyFn
          }
        );
      }
      else
      {
        that._evaluateCardinalities();
      }
      m_aFollowButton.disable ();
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
        that.getEl().unmask();
      }
    }
  }

  /*
    Private function that shows the relations dialog
  */
  //--------------------------------------------------------------------
  var showRelWindow = function()
  //--------------------------------------------------------------------
  {
    maskWC ();
    try
    {
      var bWasExisting = false;
      // create the window on the first click and reuse it on subsequent clicks
      if(!m_aRelWin)
      {
        // Create anew reference to the relations dialog
        m_aRelWin = new boc.ait.notebook.RelationsDialog
        (
          {
            baseTargets: that.data.targets || [],
            title: that.data.relClass + " - " + getString ("ait_notebook_relwindow_title"),
            // Pass reference to self
            notebook: that.notebook,
            artefactID : that.notebook.artefactId,
            // Pass the relation class that the control is working with
            relClass: m_sRelClassId,
            incoming: that.data.incoming,
            targetInformation: m_aTargetInformation,
            targetArtefactType: that.data.targetArtefactType,
            maxTrgOccurrances: m_nMaxTrgOccurrances,
            // Pass a callback to be called when the dialog is closed
            okCallBack: that.showAddedTargets,
            scope: that,
            // Pass the entries currently displayed in the relations control
            entries: m_aRelationTargets,
            // Optionally information about the record the relations control is contained in is sent
            recordInformation: aConfig.recordInformation,
            baseModifications: m_aChangedRelationInfo,
            reflexive: that.data.reflexive
          }
        );
      }
      else
      {
        bWasExisting = true;
      }

      // Add a handler for when the relations dialog is closed
      m_aRelWin.on
      (
        "close",
        function ()
        {
          m_aRelWin = null;
          // Make sure the notebook is unmasked again
          that.notebook.body.unmask();
        }
      );
      m_aRelWin.on("show", function ()
        {
          unmaskWC.defer(that, 10);
          // Mask the notebook
          that.notebook.body.mask ();
        }
      );
      // Show the relations window.
      if (bWasExisting)
      {

        m_aRelWin.show(this);
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
      unmaskWC();
    }
  }


  Ext.apply (this, aConfig);

  aConfig.disabled = (!this.notebook.isEditable() && !aConfig.editable) || !this.data.editable;

  aConfig.fieldClass = boc.ait.util.LightListBox;
  //aConfig.layout='anchor';
  aConfig.fieldConf = aConfig.fieldConf || {};
  //aConfig.fieldConf.anchor = "100% 100%";
  aConfig.fieldConf.maskDisabled = false;
  aConfig.fieldConf.noTitle = (aConfig.noTitle === true);

  aConfig.fieldConf.reserveScrollOffset = true;

  aConfig.fieldConf.height = 80;
  aConfig.fieldConf.style ="border:1px solid rgb(181,184,200);";

  aConfig.fieldConf.autoScroll = true;

  aConfig.fieldConf.enableDragDrop = !aConfig.disabled;
  aConfig.fieldConf.ddGroup = aConfig.disabled ? undefined : 'relControlDrag';

  aConfig.fieldConf.singleSelect = true;
  aConfig.fieldConf.multiSelect = true;

  aConfig.fieldConf.fields =
  [
    {name:'text'},
    {name:'id'},
    {name:'artefactId'},
    {name:'broken'},
    {name:'artefactType'},
    {name:'iconUrl'},
    {name:'classId'},
    {name:"idClass_lang"},
    {name:"_is_leaf"},
    {name:"modelId"}
  ];

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
    aMetadata.attr="style='background:url("+boc.ait.getIconPath ()+aRecord.data.iconUrl+") center center transparent no-repeat;'";

    return "<span style='background:url("+sSrc+") 6px center transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
  };

  aConfig.fieldConf.columns =
  [
    {
      id: "idClass_lang",
      header: getString("ait_search_result_type"),
      sortable: true,
      dataIndex: "idClass_lang",
      width:.05,
      fixed: true,
      //tpl:"<span style='background:url("+Ext.BLANK_IMAGE_URL+") 6px center transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>",
      tpl:"<span style='padding-bottom:3px;background:url("+boc.ait.getIconPath ()+"{iconUrl}) 2px center transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>",
      name: 'idClass_lang'
    },
    {
      id:'text',
      header:'Name',
      sortable: true,
      dataIndex: 'text',
      tpl:'<span><tpl if="broken == true"><img src="images/broken.png" class="ait_broken_referencee_grid"/>&nbsp;</tpl><span>{text}</span></span>'
    }
  ];

  m_aTargetInformation = this.data.trgInformation || [];
  m_bIncoming = this.data.incoming;
  m_nMaxTrgOccurrances = this.data.maxOccurrances;
  m_sInstanceParentID = aConfig.parentID;

  m_sRelClassName = this.data.relClassInd;
  m_sRelClassId = this.data.relClassId;

  // Determine the name of the element to be shown in tooltips. If we have exactly one
  // target class, we can show tooltips such as 'Add Interface', 'Remove Interface', etc.
  // If we have more than one target class, we shown 'Add Relation Target', 'Remove Relation
  // Target'.
  if (m_aTargetInformation.length === 1)
  {
    m_sTargetClassName = m_aTargetInformation[0].name;
  }
  else
  {
    m_sTargetClassName = getString("ait_notebook_relcontrol_tip_reltarget");
  }

  if (this.notebook.isEditMode())
  {
    // Create a tool that opens the relations dialog
    m_aAddButton = new Ext.Toolbar.Button
    (
      {
        tooltip: getString("ait_notebook_relcontrol_tip_add").replace(/%RELATION_TARGET%/, m_sTargetClassName),
        handler: showRelWindow,
        iconCls: 'ait_add_relation'
      }
    );


    // Create a tool that removes a selected target entry
    m_aRemoveButton = new Ext.Toolbar.Button
    (
      {
        tooltip: getString("ait_notebook_relcontrol_tip_delete").replace(/%RELATION_TARGET%/, m_sTargetClassName),
        handler: function ()
          {
            deleteRelation (false);
          },
        disabled: true,
        iconCls: 'ait_remove_relation'
      }
    );

    var aToolBarItems = [];

    // If a title should be shown, show the title of the relations control
    if (aConfig.noTitle === false)
    {
      // Text item for the relation control's toolbar
      aToolBarItems[aToolBarItems.length] = m_aData.relClass+':'
    }

    // Create the items for the toolbar
    aToolBarItems[aToolBarItems.length] = {xtype: 'tbfill'};


    // Only add the add and the remove tool, if we are not in
    // readonly mode.
    if (!aConfig.disabled)
    {
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

        // Iterate through the deletable classes in the settings object
        for ( var j = 0; g_aSettings.allowDeleting &&  g_aSettings.deletableClasses && j < g_aSettings.deletableClasses.length;++j)
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

      // Create the toolbar button that allows the creation of new target objects
      m_aCreateObjectButton = new Ext.Toolbar.Button
      (
        {
          tooltip: getString("ait_notebook_relcontrol_tip_create_target").replace(/%CLASS_NAME%/, m_sNameOfClassToCreate),
          handler: that._doCreateTargetInstance,
          scope: that,
          iconCls: 'ait_newobject'
        }
      );
      // If there are allowed creatable classes, create the 'create new object' button
      // and add it to the toolbar
      if (m_aAllowedCreatableClasses.length > 0)
      {
        aToolBarItems[aToolBarItems.length] = m_aCreateObjectButton;
      }


      aToolBarItems[aToolBarItems.length] = m_aAddButton;
      aToolBarItems[aToolBarItems.length] = m_aRemoveButton;

      if (m_aAllowedDeletableClasses.length > 0)
      {
         // Create a toolbar button that allows the user to remove a selected relation target
        // and delete the target instance from the repository
        m_aDeleteTargetButton = new Ext.Toolbar.Button
        (
          {
            iconCls: 'ait_delete_relation',
            handler: that._doDeleteTargetInstance,
            tooltip: getString("ait_notebook_relcontrol_tip_delete_target").replace(/%RELATION_TARGET%/, m_sNameOfClassToDelete),
            scope: that,
            disabled: true
          }
        );

        aToolBarItems[aToolBarItems.length] = m_aDeleteTargetButton;
      }
    }

    // Create a follow icon toolbar that can be used to follow a relation target
    // in the control
    m_aFollowButton = new Ext.Toolbar.Button
    (
      {
        iconCls: 'ait_follow_relation',
        disabled: true,
        tooltip: getString("ait_notebook_relcontrol_tip_follow").replace(/%RELATION_TARGET%/, m_sTargetClassName),
        // Handler for the button's click event -
        // If only one target is selected, follow it
        handler: function()
        {
          var aRecords = that.field.getSelectedRecords ();
          if (aRecords.length === 1)
          {
            that._followReference (aRecords[0]);
          }
        }
      }
    )
    aToolBarItems[aToolBarItems.length] = m_aFollowButton;

    aConfig.tbarConfig = aToolBarItems;

    aConfig.fieldConf.bodyStyle = "marginBottom: 10px;padding:0px";

    aConfig.fieldConf = aConfig.fieldConf || {};

    aConfig.fieldConf.autoDestroy = true;

    // Store the targets in the list of relation targets
    aConfig.fieldConf.data = this.data.targets;
  }
  m_aRelationTargets = this.data.targets;
  /*if (this.data.targets.length === 0)
  {
    //aConfig.fieldConf.hidden = true;
    aConfig.fieldConf.bodyStyle = "visibility:hidden;";
  }*/
  //aConfig.fieldConf.hideHeaders = true;

  aConfig.listeners =
  {
    render : function (aPanel)
    {
      //aPanel.body.addClass("boc-notebook-multilinefield");
      //aPanel.body.addClass("boc-notebook-relationscontrol");
    }
  }

  // Create listeners for the render and dblclick event
  aConfig.fieldConf.listeners =
  {
    scope:this,
    // On render, add a class to the control's body so it displays multiple lines
    afterrender:
      function(aPanel)
      {
        /*aPanel.innerBody.on("mousedown", function (aEvt, aNode, aOptions)
          {
            aNode = Ext.get(aNode).parent("DL");
            uilogger.error("node: " + aNode.dom);
            var aRecord = aPanel.getRecord(aNode.dom);
            uilogger.error("record: " + aRecord);

            if (aPanel.isSelected (aRecord) || aPanel.getSelectionCount() > 0)
            {
              return;
            }
            aPanel.select(aRecord);
          }
        );*/
        //aPanel.body.addClass("boc-notebook-multilinefield");
        //aPanel.body.addClass("boc-notebook-relationscontrol");

        var canDrop = function (aDraggedRecords, aTarget)
        {
          if ((m_aRelationTargets.length + aDraggedRecords.length) > m_nMaxTrgOccurrances && m_nMaxTrgOccurrances !== 0 && m_nMaxTrgOccurrances !== -1)
          {
            return false;
          }
          if (!aPanel.getEl().contains(aTarget))
          {
            return false;
          }

          var bDropAllowed = that.data.reflexive === true;
          for (var i = 0; i < aDraggedRecords.length;++i)
          {
            var aDraggedRecord = aDraggedRecords[i];
            if (!aDraggedRecord.get("_is_leaf"))
            {
              return false;
            }
            if (aDraggedRecord.get("broken") === true)
            {
              return false;
            }
            var bAllowedAsTarget = false;
            for (var j = 0; j < m_aTargetInformation.length;++j)
            {
              if (m_aTargetInformation[j].id == aDraggedRecord.get("classId"))
              {
                bAllowedAsTarget = true;
              }
            }

            if (!bAllowedAsTarget)
            {
              return false;
            }

            if (that.data.reflexive !== true)
            {
              if (aDraggedRecords[i].get("id") !== that.notebook.getArtefactId())
              {
                bDropAllowed = true;
              }
            }
          }

          return bDropAllowed;
        };

        var sTreeRecordDDGroupID = "treeDrag";
        var aTreeRecordDropZone = new Ext.dd.DropZone(aPanel.el,
          {
            notifyOver: function(aDragSource, aEvent, aData)
            {
              if (that.notebook.body.isMasked())
              {
                return getDragStyle ();
              }

              var sCls = aPanel.dropNotAllowed;
              var aDraggedRecords = aDragSource.dragData.selections;

              if (canDrop (aDraggedRecords, aEvent.getTarget()) )
              {
                sCls = Ext.dd.DropZone.prototype.dropAllowed;
              }

              return setDragStyle(sCls);
            },

            notifyOut : function (aDragSource, aEvent, aData)
            {
              return setDragStyle(aPanel.dropNotAllowed);
            },

            notifyDrop: function (aDragSource, aEvent, aData)
            {
              var aDraggedRecords = aDragSource.dragData.selections;

              if ( canDrop (aDraggedRecords, aEvent.getTarget()))
              {
                aPanel.getEl().mask(getString("ait_loading"), 'x-mask-loading');
                var bError = false;
                try
                {
                  var aAddedRels = [];
                  for (var i = 0; i < aDraggedRecords.length;++i)
                  {
                    if (that.data.reflexive !== true && aDraggedRecords[i].get("id") === that.notebook.getArtefactId())
                    {
                      continue;
                    }
                    var bContinue = false;
                    for (var j = 0; j < m_aRelationTargets.length;++j)
                    {
                      if (m_aRelationTargets[j].artefactId === aDraggedRecords[i].get("id"))
                      {
                        bContinue = true;
                        break;
                      }
                      if (aDragSource.dragData.params.relControl && m_aRelationTargets[j].artefactId === aDraggedRecords[i].get("artefactId"))
                      {
                        bContinue = true;
                        break;
                      }
                    }
                    if (bContinue)
                    {
                      continue;
                    }
                    aAddedRels[aAddedRels.length] =
                    {
                      id:aDraggedRecords[i].get("id"),
                      artefactType: aDraggedRecords[i].get("artefactType")
                    };

                    if (aDragSource.dragData.params.relControl)
                    {
                      aDragSource.dragData.params.relControl.removeTarget (aDraggedRecords[i]);
                    }
                  }

                  var aNewRecords = [];
                  for (var i = 0; i < aAddedRels.length;++i)
                  {
                    var aDraggedRecord = null;
                    for (var j = 0; j < aDraggedRecords.length;++j)
                    {
                      aDraggedRecord = aDraggedRecords[j];
                      if (aDraggedRecord.get("id") === aAddedRels[i].id)
                      {
                        var sNewId = Ext.id();


                        aNewRecords[i] = clone(aDraggedRecord.data);
                        if (!aDragSource.dragData.params.relControl)
                        {
                          aNewRecords[i].id = sNewId;
                          aNewRecords[i].artefactId = aDraggedRecord.get("id");
                          that._addTargets ([{id:sNewId, info:{artefactId: aDraggedRecord.get("id"),artefactType: aDraggedRecord.get("artefactType") }}]);
                        }
                        else
                        {
                          that._addTargets ([{id:aDraggedRecord.get("id"), info:{artefactId: aDraggedRecord.get("artefactId"),artefactType: aDraggedRecord.get("artefactType") }}]);
                        }

                        break;
                      }
                    }
                  }

                  that.showAddedTargets (aNewRecords, true);
                  aPanel.getEl().unmask ();
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
                    aPanel.getEl().unmask ();
                  }
                }
              }
            }
          }
        );
        aPanel.dropZone = aTreeRecordDropZone;
        aPanel.dropZone.addToGroup ('treeDrag');
        aPanel.dropZone.addToGroup ('relControlDrag');


        //aPanel.dragZone = new boc.ait.GridDragZone (that.field, {params: {relControl:that}});
        aPanel.dragZone = new Ext.dd.DragZone
        (
          aPanel.innerBody,
          {
            params: {relControl:that},
            getDragData: function (aEvt)
            {
              var aTarget = aEvt.getTarget();
              uilogger.error(aTarget);

              var aNode = Ext.get(aTarget).parent("DL");
              if (!aNode)
              {
                return;
              }

              var aRecord = aPanel.getRecord(aNode.dom);
              uilogger.error(aRecord);
              if (!aRecord)
              {
                return;
              }
              if (!aPanel.isSelected(aRecord) && aPanel.getSelectionCount() === 0)
              {
                aPanel.select(aRecord);
              }
              var sourceEl, dragProxyHtml, r;

              sourceEl = aEvt.getTarget(aPanel.itemSelector);
              if(!sourceEl)
              {
                return;
              };
              var aTags = [];
              var aRecs = aPanel.getSelectedRecords ();
              if (aRecs.length === 0)
              {
                return;
              }
              for (var i = 0; i < aRecs.length;++i)
              {
                aTags[i] =
                {
                  tag:'p',
                  html:aRecs[i].get("text")
                }
              }

              dragProxyHtml = Ext.DomHelper.createDom
              (
                {
                  tag: 'div',
                  children:aTags
                }
              );

              r = {
                    ddel: dragProxyHtml,
                    sourceEl: sourceEl,
                    repairXY: Ext.fly(sourceEl).getXY(),
                    selections:aPanel.getSelectedRecords(),
                    params:this.params
                  };

              return r;
            },

            getRepairXY: function ()
            {
              return this.dragData.repairXY;
            }
          }
        );
        aPanel.dragZone.addToGroup ('relControlDrag');
      },
    // Define an eventhandler for the dblclick event in rel control
    dblclick: function (aView, nIndex, aNode, aEvt)
    {
      that._followReference (aView.getRecord (aNode));
    },
    // Define an eventhandler for the click event in the relations control
    // The click event is only raised when a node in the relations control is selected
    //click:
    selectionchange:
      function (aView, aSelections)
      {
        if (aSelections.length !== 1)
        {
          return;
        }
        var aRecord = aView.getRecord(aSelections[0]);
        if (aRecord && aRecord.get("broken") !== true)
        {
          // Enable the follow and remove buttons
          m_aFollowButton.enable();

        }
        else
        {
          m_aFollowButton.disable();
          if (m_aDeleteTargetButton)
          {
            m_aDeleteTargetButton.disable ();
          }
        }
        m_aRemoveButton.enable();


        // Check if there is a button to delete a relation target from the repository
        if (aRecord && aRecord.get("broken") === false && m_aDeleteTargetButton)
        {
          // If there were no deleteable classes selected in the settings, return
          if (!g_aSettings.deletableClasses)
          {
            return;
          }
          var bEnabled = true;

          var aRecords = that.field.getStore().getRange();
          // Iterate through the targets of the relation
          for (var i = 0; i < aRecords.length;++i)
          {
            var aRecord = aRecords[i];
            var bFound = false;
            for (var j = 0; g_aSettings.deletableClasses && j < g_aSettings.deletableClasses.length;++j)
            {
              if (g_aSettings.deletableClasses[j] === aRecord.get("classId"))
              {
                bFound = true;
                break;
              }
            }
            // If the classes that can be used as targets for the current relation are not contained in
            // the settings, we return
            if (!bFound)
            {
              return;
            }
          }
          // Enable the button
          m_aDeleteTargetButton.enable();
        }
      }
  }

  if (this.data.incoming === true)
  {
    var sClassNames = "";
    for (var i = 0; i < this.data.trgInformation.length;++i)
    {
      if (this.data.trgInformation.length > 2)
      {
        if (i === 1)
        {
          sClassNames+="/.../";
        }
        else if (i === 0 || i === (this.data.trgInformation.length - 1))
        {
          sClassNames+=this.data.trgInformation[i].name;
        }
      }
      else
      {
        sClassNames+=this.data.trgInformation[i].name;
        if (i < (this.data.trgInformation.length - 1))
        {
          sClassNames+="/"
        }
      }
    }
    this.data.label = this.data.label || getString("ait_incoming_relation")+": " + sClassNames + " -> " + this.data.classname;
  }
  boc.ait.notebook.RelationsControl.superclass.constructor.call (this, aConfig);

  //this._evaluateCardinalities ();

  this._getValueRep = function ()
  {
    var aVal = [];

    var sOnClickDiagram = "g_aMain.getMainArea().openDiagram('%ID%');";
    var sOnClickObject = "g_aMain.getMainArea().openNotebook('%ID%', %ARTEFACT_TYPE%%MODEL_ID%);";


    for (var i = 0; i < m_aRelationTargets.length;++i)
    {
      var aTargetObj = m_aRelationTargets[i];

      var sOnClick = aTargetObj.artefactType === AIT_ARTEFACT_DIAGRAM ? sOnClickDiagram : sOnClickObject;

      if (aTargetObj.broken !== true)
      {
        if(g_aSettings.offline && aTargetObj.trgmissing)
        {
          aVal[aVal.length]=
          {
            tag:'span',
            html: boc.ait.htmlEncode (aTargetObj.text)
          }
        }
        else
        {
          aVal[aVal.length] =
          {
            tag: 'a',
            href: '#',
            cls: 'ait_link',
            onclick:  sOnClick.
                            replace(/%ID%/, aTargetObj.artefactId).
                            replace(/%ARTEFACT_TYPE%/, aTargetObj.artefactType).
                            replace(/%MODEL_ID%/, aTargetObj.modelId ? ",false,null,null,'"+aTargetObj.modelId+"'" : ""),
            html: boc.ait.htmlEncode (aTargetObj.text)
          };
        }
      }
      else
      {
        aVal[aVal.length]=
        {
          tag:'div',
          html: "<img src='images/broken.png' class='ait_broken_reference_grid'/>&nbsp;"+boc.ait.htmlEncode (aTargetObj.text)
        }
      }
      aVal[aVal.length] =
      {
        tag:'br'
      };
    }
    if (m_aRelationTargets.length == 0)
    {
      aVal = "<div>"+getString('ait_no_entry')+"</div>";
    }

    return aVal;
  };

  this.__disable = function ()
  {
    if (m_aRemoveButton)
    {
      m_aRemoveButton.hide ();
    }
    if (m_aAddButton)
    {
      m_aAddButton.hide ();
    }
    if (m_aCreateObjectButton)
    {
      m_aCreateObjectButton.hide ();
    }
    if (m_aDeleteTargetButton)
    {
      m_aDeleteTargetButton.hide ();
    }

    boc.ait.notebook.RelationsControl.superclass.disable.call (this);
  };

  this.__enable = function ()
  {
    if (m_aRemoveButton)
    {
      m_aRemoveButton.show ();
    }
    if (m_aAddButton)
    {
      m_aAddButton.show ();
    }
    if (m_aCreateObjectButton)
    {
      m_aCreateObjectButton.show ();
    }
    if (m_aDeleteTargetButton)
    {
      m_aDeleteTargetButton.show ();
    }

    boc.ait.notebook.RelationsControl.superclass.enable.call (this);
  };

  this._update = function (aAttrData)
  {
    m_aChangedRelationInfo.clear ();
    this.data = aAttrData;

    // Store the targets in the list of relation targets
    m_aRelationTargets = this.data.targets;

    this.field.getStore().removeAll ();
    if (this.data.targets)
    {
      this.field.getStore().loadData(this.data.targets);
    }

    this._evaluateCardinalities ();
  };

  this._showAddedTargets = function (aAddedTargets, bAppend, aChangedRelationInfo)
  {
    var aNodeArray = [];
    if (aChangedRelationInfo)
    {
      m_aChangedRelationInfo = aChangedRelationInfo;

      //m_aChangedRelationInfo = aChangedRelationInfo;
      //this.notebook.onRelChange (m_sRelClassId, m_aChangedRelationInfo);
      this._onRelChange ();
    }

    var aRelRoot = this.field.root;
    var nCnt = 0;
    // First, remove all existing entries from the list if we do not have to append them
    if (!bAppend)
    {
      this.field.getStore().removeAll();
    }


    this.field.getStore().loadData (aAddedTargets, bAppend);
    this.field.getStore ().sort("text");

    if (bAppend)
    {
      aAddedTargets = this._getRelationTargets().concat (aAddedTargets);
    }

    this._setRelationTargets (aAddedTargets);
    this._evaluateCardinalities ();

    this.field.getStore().sort("text");

    //this.field.setHeight (50);

    //this.field.syncSize ();
  };

  this._removeTarget = function (aRecord)
  {
    /*var aTargets =
    [
      {
        id: aRecord.get("id"),
        info:
        {
          artefactType:aRecord.get("artefactType")
        }
      }
    ];

    this.field.getStore().remove (aRecord);
    this._removeTargets(aTargets);*/
    deleteRelation (false, [aRecord]);
  };


  this._onRelChange = function ()
  {
    /*for (var i = 0; i < aTargets.length;++i)
    {
      var sId = aTargets[i].id;
      m_aChangedRelationInfo.removeKey (sId);
      var bAddToRelInformation = bAdd;
      for (var j = 0; j < that.data.targets.length;++j)
      {
        if (that.data.targets[j].id === sId)
        {
          bAddToRelInformation = !bAdd;
          break;
        }
    }*/
    this.notebook.onRelChange (m_sRelClassId, m_aChangedRelationInfo);
  };
}


// boc.ait.notebook.RelationsControl is derived from boc.ait.util.LightListBox
Ext.extend
(
  boc.ait.notebook.RelationsControl,
  //boc.ait.util.LightListBox,
  boc.ait.notebook.Field,
  {
    /*
        Public method that returns a reference to the rel control's notebook
        \retval The notebook
    */
    //--------------------------------------------------------------------
    getNotebook : function ()
    //--------------------------------------------------------------------
    {
      return this.notebook;
    },

    /*
        Public function that adds the passed array of target objects to the rel control's list
        \param aAddedTargets The list of objects to add to the list
        \param bAppend If true, the nodes in the addedtargets array are appended to the shown targets,
               otherwise they are replaced
    */
    //--------------------------------------------------------------------
    showAddedTargets : function (aAddedTargets, bAppend, aChangedRelationInfo)
    //--------------------------------------------------------------------
    {
      this._showAddedTargets (aAddedTargets, bAppend, aChangedRelationInfo);
    },

    /*
        Public method that returns the parent group id of the current instance
        (for which we opened the notebook)
        \retval The id of the group in which the current instance lies.
    */
    //--------------------------------------------------------------------
    getParentID : function ()
    //--------------------------------------------------------------------
    {
      return this._getParentID();
    },


    /*
        Public method that returns the relation targets displayed in this control.
        \retval An array of relation targets.
    */
    //--------------------------------------------------------------------
    getRelationTargets : function ()
    //--------------------------------------------------------------------
    {
      return this._getRelationTargets ();
    },

    getValueRep: function ()
    {
      return this._getValueRep ();
    },

    disable: function ()
    {
      this.__disable ();
    },

    enable: function ()
    {
      this.__enable ();
    },

    removeTarget: function (aRecord)
    {
      this._removeTarget (aRecord);
    }
  }
);

// Register the relations control's xtype
Ext.reg("boc-relationscontrol", boc.ait.notebook.RelationsControl);
