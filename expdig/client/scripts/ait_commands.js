/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2013\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2013
**********************************************************************
\author MWh
This file contains shared JS functionality for the ADOit Web Client
**********************************************************************
*/



Ext.namespace("boc.ait");
boc.ait.g_aCommands = new Ext.util.MixedCollection ();

//NOTE DPE: interpret opening link
var openNotebookFromLink = function ()
{
  // this is for older drivers mocked
};

var openLink = function ()
{
  // this is mocked for upcoming drivers
};

var checkOpenDiagramClick = function (aItem)
{
  var aNodes = this.getContext();

  if (!aNodes || aNodes.length != 1)
  {
    aItem.disable ();
    return;
  }

  var nArtefactType = aNodes[0].get("artefactType");
  if (nArtefactType !== AIT_ARTEFACT_DIAGRAM && nArtefactType !== AIT_ARTEFACT_MODINST)
  {
    aItem.hide ();
    return;
  }
  aItem.show ();
  aItem.enable ();
};

/* Is called when the user clicks on the open diagram menu item
    \param aItem The item the user clicked on
*/
//--------------------------------------------------------------------
var onOpenDiagramClick = function (aItem)
//--------------------------------------------------------------------
{
  try
  {
    var aNodes = this.getContext();
    if (aNodes.length > 0)
    {
      var nArtefactType = aNodes[0].get("artefactType");
      if (nArtefactType === AIT_ARTEFACT_DIAGRAM)
      {
        // Open the selected diagram in the main area
        g_aMain.getMainArea().openDiagram(aNodes[0].get("id"));
      }
      else if (nArtefactType === AIT_ARTEFACT_MODINST)
      {
        g_aMain.getMainArea().openDiagram(aNodes[0].get("modelId"));
      }
    }
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};


/* Enables or disables the "open model editor" menu item.
    \param aItem The "open model editor" item
*/
//--------------------------------------------------------------------
var checkOpenModelEditorClick = function (aItem)
//--------------------------------------------------------------------
{
  if (!g_aSettings.allowModelEditor)
  {
    aItem.hide();
    return;
  }
  var aNodes = this.getContext();
  var bEnable = aNodes && (aNodes.length == 1) &&
                aNodes[0].get("_is_leaf") &&
                aNodes[0].get("artefactType") === AIT_ARTEFACT_DIAGRAM;
  if (bEnable)
  {
    aItem.show();
    aItem.enable();
  }
  else
  {
    aItem.disable();
  }
};

/* Is called when the user selects the "open model editor" menu item.
    \param aItem The "open model editor" menu item
*/
//--------------------------------------------------------------------
var onOpenModelEditorClick = function(aItem)
//--------------------------------------------------------------------
{
  try
  {
    var aNodes = this.getContext();
    if (aNodes && aNodes.length > 0)
    {
      g_aMain.getMainArea().openModelEditor(aNodes[0].get("id"));
    }
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};

/* Is called when the user clicks on the open notebook menu item
    \param aItem The item the user clicked on
*/
//--------------------------------------------------------------------
var onOpenNotebookClick = function (aItem)
//--------------------------------------------------------------------
{
  try
  {
    var aNodes = this.getContext ();
    var nArtefactType = null;
    // Get the currently selected node from the tree
    if (aNodes.length > 0)
    {
      nArtefactType = aNodes[0].get("artefactType");
      var aParams = this.getParams();
      var sViewId = null;
      var sModelId = null;
      if (aParams)
      {
        sViewId = aParams.viewId;
      }
      if (aNodes[0].get("repoInst") === false)
      {
        nArtefactType = AIT_ARTEFACT_MODINST;
        sModelId = aNodes[0].get("modelId");
      }

      var aHighlightParams = this.params !== undefined ? this.params.highlightParams : null;
      // Open the selected element's notebook in the main area
      g_aMain.getMainArea().openNotebook(aNodes[0].id, nArtefactType, false, aHighlightParams, sViewId, sModelId);
    }
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};

var checkOpenNBClick = function (aItem)
{
  // Get the currently selected node
  var aNodes = this.getContext();

  if (!aNodes || aNodes.length != 1)
  {
    aItem.disable ();
    return;
  }

  var nArtefactType = aNodes[0].get("artefactType");
  if (nArtefactType !== AIT_ARTEFACT_OBJECT && nArtefactType !== AIT_ARTEFACT_MODINST && nArtefactType !== AIT_ARTEFACT_DIAGRAM)
  {
    aItem.disable ();
    return;
  }

  aItem.show ();
  aItem.enable ();
};

var checkRenameClick = function (aItem)
{
  if (g_aSettings.allowRenaming === false || g_aSettings.offline)
  {
    aItem.hide();
    return;
  }
  var aTree = g_aMain.getTreeArea().getActiveTree();
  if (!aTree)
  {
    aItem.disable ();
    return;
  }
  // Get the currently selected node
  var aNodes = aTree.getSelectedNodes();

  if (!aNodes || aNodes.length != 1)
  {
    aItem.disable ();
    return;
  }

  if (aNodes[0].get("pool"))
  {
    aItem.disable ();
    return;
  }

  if (!aNodes[0].get("editable"))
  {
    aItem.disable ();
    return;
  }
  if (aNodes[0].data.artificial === true)
  {
    aItem.disable ();
    return;
  }
  aItem.show ();
  aItem.enable ();
};

/* Is called when the user clicks on the rename menu item
    \param aItem The item the user clicked on
*/
//--------------------------------------------------------------------
var onRenameClick = function(aItem)
//--------------------------------------------------------------------
{
  try
  {
    // Retrieve the currently selected node
    var aNodes = this.getContext ();

    var aTree = g_aMain.getTreeArea().getActiveTree();
    if (aNodes.length > 0)
    {
      var aNode = aNodes[0];
      //var aTreeControl = aTree.getTreeControl();
      //aTreeControl.startEditing (aTreeControl.getStore().indexOf(aNode), 0);
      aTree.editNode (aNode);
    }
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};

var checkBIAClick = function (aItem)
{
  if (!g_aSettings.allowBIA || !g_aSettings.BIAenabled )
  {
    aItem.hide ();
    return;
  }

  // Get the currently selected node
  var aNodes = this.getContext ();

  if (!aNodes || aNodes.length === 0)
  {
    aItem.disable ();
    return;
  }

  var sOldIDClass = null;
  for (var i = 0; i < aNodes.length;++i)
  {
    var aNode = aNodes[i];
    // Hide the menuitem if one of the nodes is a diagram (diagrams are not valid start objects for
    // BIAs)
    if (aNode.get("artefactType") === AIT_ARTEFACT_DIAGRAM)
    {
      aItem.hide();
      return;
    }
    if (!aNode.get("_is_leaf"))
    {
      // We found a node that is not a leaf, stop the loop and show the menu
      aItem.disable();
      return;
    }

    // Check the node's type
    var sIDClass= aNode.get("idClass");

    // Only if all the selected objects have the same type (= class), we show the BIA menu
    if (sOldIDClass !== null && sOldIDClass !== undefined && sIDClass !== sOldIDClass)
    {
      aItem.disable();
      return;
    }

    sOldIDClass = sIDClass;
  }
  aItem.show ();
  aItem.enable ();
};

var checkUsedInModelsClick = function (aItem)
{
  if (g_aSettings.offline)
  {
    aItem.hide();
    return;
  }
  // Get the currently selected node
  var aNodes = this.getContext ();

  if (!aNodes || aNodes.length != 1)
  {
    aItem.disable ();
    return;
  }

  for (var i = 0; i < aNodes.length;++i)
  {
    var aNode = aNodes[i];
    if (aNode.get("repoInst") === false)
    {
      aItem.hide ();
      return;
    }
    if (aNode.get("artefactType") === AIT_ARTEFACT_DIAGRAM)
    {
      aItem.hide ();
      return;
    }
    if (!aNode.get("_is_leaf"))
    {
      // We found a node that is not a leaf, stop the loop and show the menu
      aItem.disable();
      return;
    }
  }
  aItem.show ();
  aItem.enable ();
};

/* Is called when the user clicks on the open BIA menu item
    \param aItem The item the user clicked on
*/
//--------------------------------------------------------------------
var onOpenBIAClick = function (aItem)
//--------------------------------------------------------------------
{
  try
  {
    var aNodes = this.getContext();

    // Open the selected object's BIA in the main area
    g_aMain.getMainArea().openBIA(aNodes);
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};

/* Is called when the user clicks on the "Used in Models" menu item
    \param aItem The item the user clicked on
*/
//--------------------------------------------------------------------
var onUsedInModelsClick = function (aItem)
//--------------------------------------------------------------------
{
  try
  {
    var aNodes = this.getContext();

    // Open the selected object's BIA in the main area
    g_aMain.getMainArea().openUsedInModels
    (
      {
        artefact: aNodes[0]
      }
    );
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};

var checkCreateClick = function (aItem)
{
  if (!g_aSettings.allowCreatingNewObjects ||
      !g_aSettings.creatableClasses        ||
      g_aSettings.creatableClasses.length === 0)
  {
    aItem.hide ();
    return;
  }

  var aNodes = this.getContext();

  if (!aNodes || aNodes.length != 1)
  {
    aItem.disable ();
    return;
  }
  if (aNodes[0].get("pool"))
  {
    aItem.hide ();
    return;
  }
  if (aNodes[0].get("artificial") === true)
  {
    aItem.hide ();
    return;
  }
  var aTree = g_aMain.getTreeArea().getActiveTree();
  // Get the type of the current tree
  var nArtefactType = aTree.getArtefactType();
  if (nArtefactType !== AIT_ARTEFACT_OBJECT)
  {
    aItem.disable ();
    return;
  }

  if (aNodes[0].get("_is_leaf"))
  {
    aItem.disable ();
    return;
  }

  aItem.show ();
  aItem.enable ();
};

var onCreateObjectClick = function (aItem, aEvent)
{
  try
  {
    g_aMain.getTreeArea().getObjectTree().openCreateNewObjectDialog (aEvent, aItem);
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};

var checkCreateFolderClick = function (aItem)
{
  if (g_aSettings.offline)
  {
    aItem.hide ();
    return;
  }

  var aNodes = this.getContext();

  if (!aNodes || aNodes.length != 1)
  {
    aItem.disable ();
    return;
  }

  if (aNodes[0].get("artificial") === true)
  {
    aItem.hide ();
    return;
  }

  if (aNodes[0].get("pool") === true)
  {
    aItem.hide ();
    return;
  }

  var aTree = g_aMain.getTreeArea().getActiveTree();
  // Get the type of the current tree
  var nArtefactType = aTree.getArtefactType();

  if (nArtefactType === AIT_ARTEFACT_OBJECT && g_aSettings.allowCreatingObjectGroups !== true)
  {
    aItem.hide ();
    return;
  }
  else if (nArtefactType === AIT_ARTEFACT_DIAGRAM && g_aSettings.allowCreatingModelGroups !== true)
  {
    aItem.hide ();
    return;
  }

  if (aNodes[0].get("_is_leaf"))
  {
    aItem.disable ();
    return;
  }

  aItem.show ();
  aItem.enable ();
};

var onCreateFolderClick = function (aItem)
{
  try
  {
    g_aMain.getTreeArea().getActiveTree ().createFolder (this.getContext() [0]);
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};


var checkDelClickFn = function ()
{
  if (!g_aSettings.allowDeleting         ||
      !g_aSettings.deletableClasses      ||
      g_aSettings.deletableClasses.length === 0)
  {
    return false;
  }

  var aTree = g_aMain.getTreeArea().getActiveTree();
  if (!aTree)
  {
    return false;
  }

  // Get the currently selected node
  var aNodes = aTree.getSelectedNodes();

  if (!aNodes || aNodes.length !== 1)
  {
    return false;
  }

  if (aNodes[0].get("parent") === null)
  {
    return false;
  }

  //Only one folder can be deleted and this folder has to be empty
  if (!aNodes[0].get("_is_leaf") && ((aNodes.length > 1) || !aNodes[0].get("_empty")))
  {
    return false;
  }

  //trash bin must not be deleted
  if (aNodes[0].get("pool"))
  {
    return false;
  }

  for (var i = 0; i < aNodes.length;++i)
  {
    var aNode = aNodes[i];
    if (!aNode.get("editable"))
    {
      return false;
    }

    if (aNode.get("_is_leaf"))
    {
      var bFound = false;
      for (var j = 0; g_aSettings.deletableClasses && j < g_aSettings.deletableClasses.length;++j)
      {
        if (g_aSettings.deletableClasses[j] == aNode.get("classId"))
        {
          bFound = true;
          break;
        }
      }
      if (!bFound)
      {
        return false;
      }
    }
  }

  return true;
};

var checkDelClick = function (aItem)
{
  if (!g_aSettings.allowDeleting         ||
      !g_aSettings.deletableClasses      ||
      g_aSettings.deletableClasses.length === 0)
  {
    aItem.hide ();
    return;
  }

  if (checkDelClickFn () === false)
  {
    aItem.disable ();
    return;
  }

  aItem.show ();
  aItem.enable ();
};

/* Callback function that is called when the user confirms that he wants to
  delete an artefact when the user clicks the delete menu item
  \param sResult The id of the button that was clicked in the confirmation dialog ("yes" or "no")
*/
//--------------------------------------------------------------------
var doDelete = function (sResult)
//--------------------------------------------------------------------
{
  if (sResult == "no")
  {
    return;
  }

  var aTree = g_aMain.getTreeArea().getActiveTree();
  // Retrieve the currently selected node
  var aNodes = this.getContext ();
  // Get the selected node and its type
  if (aNodes.length > 0)
  {
    var aNode = aNodes[0];

    var nArtefactType = aTree.artefactType;
    if (nArtefactType == AIT_ARTEFACT_DIAGRAM)
    {
      if (!aNode.get("_is_leaf"))
      {
        nArtefactType = AIT_ARTEFACT_DIAGRAM_GROUP;
      }
    }
    else if (nArtefactType == AIT_ARTEFACT_OBJECT)
    {
      if (!aNode.get("_is_leaf"))
      {
        nArtefactType = AIT_ARTEFACT_OBJECT_GROUP;
      }
    }

    var aArtefactInfo = null;
    if (aNodes.length == 1)
    {
      aArtefactInfo = [aNodes[0].get("id")];
    }
    else
    {
      aArtefactInfo = [];
      for (var i = 0; i < aNodes.length;++i)
      {
        aArtefactInfo[i] = aNodes[i].get("id");
      }
    }

    boc.ait.deleteArtefact
    (
      {
        artefactInfo: aArtefactInfo,
        artefactType: nArtefactType
      }
    );
  }
};

/* Is called when the user clicks on the delete menu item
    \param aItem The item the user clicked on
*/
//--------------------------------------------------------------------
var onDeleteClick = function (aItem)
//--------------------------------------------------------------------
{
  try
  {
    // Retrieve the currently selected node
    var aNodes = this.getContext ();
    if (aNodes.length > 0)
    {
      var aNode = aNodes[0];
      var sConfirm = "";
      if (aNodes.length == 1)
      {
        sConfirm = getString("ait_menu_main_query_delete").replace(/%ARTEFACT_NAME%/, boc.ait.htmlEncode(aNode.get("text")));
      }
      else
      {
        sConfirm = getString("ait_menu_main_query_delete_multiple");
      }
      // Ask the user if he really wants to delete the artefact
      Ext.Msg.confirm
      (
        getString("ait_menu_main_delete"),
        sConfirm,
        // Callback that is called when the user picks an option
        doDelete,
        this
      );
    }
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};


/* Is called after an artefact was deleted
    \param aResponse The HTTP Response
    \param aOptions The options that were passed to the original ajax request
*/
//--------------------------------------------------------------------
var doAfterDelete = function (aResponse, aOptions)
//--------------------------------------------------------------------
{
  try
  {
    var aRetObj = Ext.util.JSON.decode(aResponse.responseText);

    // Display a possible error message
    if (aRetObj.error || aRetObj.errString)
    {
      if (aRetObj.errString && aRetObj.errString.length > 0)
      {
        showErrorBox (aRetObj.errString);
      }
    }
    else
    {
      g_aEvtMgr.fireEvent("instancesdeleted", aRetObj.payload);
    }
  }
  catch (aEx)
  {
    displayErrorMessage (aEx);
  }
};

var onPasswordClick = function (aItem)
{
  g_aMain.changePassword();
};

/* Is called when the user clicks on the logout menu item
    \param aItem The item the user clicked on
*/
//--------------------------------------------------------------------
var onLogoutClick = function(aItem)
//--------------------------------------------------------------------
{
  g_aMain.logout();
};

var checkViewsSubMenu = function (aItem)
{
  if (g_aSettings.offline)
  {
    aItem.hide ();
    return;
  }

  // Do not show the views menu at all if there are no views customized.
  if (boc.ait.isEmpty(boc.ait.viewList))
  {
    aItem.hide ();
    return;
  }

  if (!aItem.menu)
  {
    aItem.hide ();
    return;
  }

  if (g_aSettings.allowGANTT === false && g_aSettings.allowPortfolio === false && g_aSettings.allowMatrix === false && g_aSettings.allowBIA === false)
  {
    aItem.hide ();
    return;
  }

  var aNodes = this.getContext();
  if (aNodes.length === 0)
  {
    aItem.disable ();
    return;
  }
  for (var i = 0; i < aNodes.length;++i)
  {
    if (aNodes[i].get("pool"))
    {
      aItem.hide ();
      return;
    }
    if (!aNodes[i].get("_is_leaf") )
    {
      aItem.hide();
      return;
    }
    var nArtType = aNodes[i].get("artefactType");
    if (nArtType !== AIT_ARTEFACT_OBJECT && nArtType !== AIT_ARTEFACT_DIAGRAM)
    {
      aItem.hide();
      return;
    }
    if (nArtType === AIT_ARTEFACT_DIAGRAM && i > 0)
    {
      aItem.hide();
      return;
    }
  }

  aItem.show ();
  aItem.enable ();
};

var checkPasswordClick = function (aItem)
{
  // Show the change password item only if we are in the offline mode or if
  // we don't explicitely disallow changing the password
  if (g_aSettings.offline || g_aSettings.allowPasswordChange === false)
  {
    aItem.hide ();
    return;
  }

  if (g_aSettings.user.loginMechanism === AIT_LOGIN_MECHANISM_SSO)
  {
    aItem.hide ();
    return;
  }
};

var checkLogoutClick = function (aItem)
{
  if (g_aSettings.offline)
  {
    aItem.hide ();
  }
};

var onCloseTab = function (aItem)
{
  var aTab = this.getParams();

  aTab.ownerCt.remove (aTab);
};

var onCloseAllTabs = function (aItem)
{
  var aTab = this.getParams ();
  aTab.ownerCt.closeTabs ();
};

var onCloseAllOtherTabs = function (aItem)
{
  var aTab = this.getParams ();
  aTab.ownerCt.closeTabs
  (
    {
      tabsToIgnore: [aTab]
    }
  );
};

/*
  Check function for the save image menu item

  \param aItem The menuitem that triggers the save image function
*/
//--------------------------------------------------------------------
var checkSaveViewImage = function (aItem)
//--------------------------------------------------------------------
{
  var aView = this.getParams ("ownerComp");
  if (!(aView instanceof boc.ait.views.GraphicalView))
  {
    aItem.hide ();
  }
};

/*
  Function that triggers saving a view image on the hard disk

  \param aItem The menuitem that triggers the save image function
*/
//--------------------------------------------------------------------
var onSaveViewImage = function (aItem)
//--------------------------------------------------------------------
{
  g_aMain.getMainArea().getActiveTab ().saveViewImage ();
};

/*
  Check function for the generate URL menu item

  \param aItem The menuitem that triggers the generate URL function
*/
//--------------------------------------------------------------------
var checkGenerateURL = function (aItem)
//--------------------------------------------------------------------
{
  var aContext = this.getContext();
  // If there is no context, hide the item
  if (!aContext || !aContext.length || aContext.length === 0)
  {
    aItem.hide ();
    return;
  }

  // If the current context is not a view or a notebook, hide the item
  if (aContext[0].get("context") !== "view" && aContext[0].get("context") !== "notebook")
  {
    aItem.hide ();
    return;
  }
  aItem.show();
  aItem.enable();
};


/*
  Function that triggers the generation of an URL for an artefact.

  \param aItem The menuitem that triggers the generate URL function
*/
//--------------------------------------------------------------------
var onGenerateURL = function (aItem)
//--------------------------------------------------------------------
{
  var sURL = "";
  if (!g_aSettings.offline)
  {
    // Get the url from the current tab
    sURL += "rid="+g_aSettings.repoData.repoId;
  }
  var aTab = null;
  if(this.getParams)
  {
    aTab = this.getParams();
  }
  if(!aTab || !aTab.generateURL)
  {
    aTab = g_aMain.getMainArea().getActiveTab ();
  }
  sURL += "&" + aTab.generateURL ();

  var aTimeFilter = g_aMain.getMenuBar ().getTimeFilter ();
  var aFilter = false;
  // Include the time filter value in the generated url
  if (aTimeFilter && aTimeFilter.isEnabled())
  {
    aFilter = aTimeFilter.getFilter().getTime();
  }

  sURL+="&tf="+aFilter;
  var sLoc = document.location.href;

  sLoc = sLoc.substring(0, sLoc.lastIndexOf("/")+1);
  if (g_aSettings.offline)
  {
    sLoc+="index.html?lang="+g_aSettings.lang;
  }

  var sIDMMode = WindowStorage.get("idm_mode");
  var sHREF = "";
  if (sIDMMode === "idm")
  {
    sHREF = "idm";
  }
  else if (sIDMMode === "idmtest")
  {
    sHREF = "idmtest";
  }

  if (!g_aSettings.offline)
  {
    sLoc += sHREF+"?"+sURL;
  }
  else
  {
    sLoc += sURL;
  }

  // Replace all hashes and curly brackets
  sLoc = sLoc.replace(/#/g, "").replace(/\{/g, "").replace(/\}/g, "");
  sLoc += g_aSettings.debug ? "&debug=true" : "";

  // If we are not in IE, we cannot store the URL in the clipboard
  if (!Ext.isIE)
  {
    // DPE 15.05.2009: ATTENTION: Mozilla does not allow copying to the clipboard by default
    // (special user preferences must be set in the FF settings - see http://www.mozilla.org/editor/midasdemo/securityprefs.html)
    // As we are not able to handle this in any other way (if the user has not allowed it, it will not work!),
    // the only solution is to display a messagebox containing the link itself, where the user can select and copy it himself!
    var aTextField = new Ext.form.TextField
    (
      {
        border: false,
        wrap: 'hard',
        //id: aObj.sObjectid + "copyObjLinkTF",
        selectOnFocus: true,
        width: "100%",
        readOnly: true,
        value: sLoc
      }
    );

    var aCopyURLDialog = null;
    var fnOkHandler = function()
    {
      aCopyURLDialog.close ();
      document.oncontextmenu = function (){return false;};
    };

    var aOkButton = new Ext.Button
    (
      {
        text: getString("ait_close"),
        minWidth: 75,
        handler: fnOkHandler,
        cls: "share-url-close-button"
      }
    );

    aCopyURLDialog = new Ext.Window
    (
      {
        title: getStandardTitle (),
        //id: aObj.sObjectid + 'copyObjLinkWin',
        height: 180,
        width: 400,
        modal: true,
        plain: true,
        constrain: true,
        resizable: false,
        buttons: [aOkButton],
        defaultButton: aTextField,
        listeners:
        {
          hide: fnOkHandler
        },
        items: new Ext.Panel
        (
          {
            title: getString("ait_generate_url_ff"),
            //id: aObj.sObjectid + 'copyObjLinkPanel',
            border: false,
            items: [aTextField]
          }
        )
      }
    );

    aCopyURLDialog.on("show", function ()
      {
        aTextField.focus (false, true);
      }
    );
    aOkButton.on("afterrender", function ()
      {
        aTextField.focus (false, true);
      }
    );
    aCopyURLDialog.on("afterrender", function ()
      {
        aTextField.focus (false, true);
      }
    );

    aCopyURLDialog.show();
    // DPE: Select the text with a small timeout, as for unknwon reason directly after the focus
    // of the window and its textbox, somehow a blur is called -> the textbox is deselected again if
    // selectText() is called directly after opening the window
    //aTextField.selectText.defer(50, aTextField);
    //aTextField.selectText();
    //aTextField.focus.defer(50, aTextField);
    document.oncontextmenu = function (){return true;};
  }
  // In IE, store the URL in the clipboard
  else
  {
    window.clipboardData.setData('Text', sLoc);

    Ext.MessageBox.show
    (
      {
        title: getStandardTitle (),
        msg: getString("ait_generate_url_success"),
        buttons: Ext.MessageBox.OK,
        icon: Ext.MessageBox.INFO
      }
    );
  }
};

/*
  Adds a command to the global commands container

  \param aConfig The configuration for the new command
*/
//--------------------------------------------------------------------
boc.ait.addCommand = function (aConfig)
//--------------------------------------------------------------------
{
  boc.ait.g_aCommands.add
  (
    aConfig.id,
    aConfig
  );
};


// List of global commands in ADOit Web Client

/*
  Open Diagram
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_open_diagram",
    text:"ait_menu_main_open_diagram",
    handler:onOpenDiagramClick,
    checkFn: checkOpenDiagramClick
  }
);

/*
  Model Editor
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_open_model_editor",
    text:"ait_menu_main_open_model_editor",
    handler:onOpenModelEditorClick,
    checkFn: checkOpenModelEditorClick
  }
);

/*
  Open Notebook
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_open_notebook",
    text:"ait_menu_main_open_notebook",
    handler:onOpenNotebookClick,
    checkFn: checkOpenNBClick
  }
);

/*
  Rename
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_rename",
    text:"ait_menu_main_rename",
    handler:onRenameClick,
    checkFn: checkRenameClick
  }
);

/*
  Execute BIA
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_show_bia",
    text:"ait_menu_main_show_bia",
    handler:onOpenBIAClick,
    checkFn: checkBIAClick
  }
);

/*
  Change password
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_change_password",
    text:"ait_menu_main_change_password",
    handler:onPasswordClick,
    checkFn : checkPasswordClick
  }
);

/*
  Logout
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_logout",
    text:"ait_menu_main_logout",
    handler:onLogoutClick,
    checkFn: checkLogoutClick
  }
);

/*
  Create Object
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_create_object",
    text:"ait_menu_main_create_object",
    handler:onCreateObjectClick,
    checkFn: checkCreateClick
  }
);

/*
  Create Folder
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_create_folder",
    text:"ait_menu_main_create_folder",
    handler:onCreateFolderClick,
    checkFn: checkCreateFolderClick
  }
);

/*
  Delete
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_delete",
    text:"ait_menu_main_delete",
    handler:onDeleteClick,
    checkFn: checkDelClick
  }
);

/*
  Open 'Used in models' dialog
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_used_in_models",
    text:"ait_used_in",
    handler:onUsedInModelsClick,
    checkFn: checkUsedInModelsClick
  }
);

/*
  Views Submenu
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_views",
    text:"ait_menu_main_views",
    checkFn: checkViewsSubMenu
  }
);

/*
  Close the current tab
*/
boc.ait.addCommand
(
  {
    id: "ait_menu_tab_close",
    text: "ait_menu_tab_close",
    handler: onCloseTab
  }
);

/*
  Close all tabs
*/
boc.ait.addCommand
(
  {
    id: "ait_menu_tab_close_all",
    text: "ait_menu_tab_close_all",
    handler: onCloseAllTabs
  }
);

/*
  Close all other tabs
*/
boc.ait.addCommand
(
  {
    id: "ait_menu_tab_close_all_others",
    text: "ait_menu_tab_close_all_others",
    handler: onCloseAllOtherTabs
  }
);

/*
  Save image on hard disk
*/
boc.ait.addCommand
(
  {
    id: "ait_menu_view_save_on_disk",
    text: "ait_menu_view_save_on_disk",
    checkFn: checkSaveViewImage,
    handler: onSaveViewImage
  }
);


/*
  Generate fix URL to artefact/view
*/
boc.ait.addCommand
(
  {
    id: "ait_menu_main_generate_url",
    text: "ait_menu_main_generate_url",
    checkFn: checkGenerateURL,
    handler: onGenerateURL
  }
);

function checkLangsSubMenu (aItem)
{
  if (!g_aSettings.langList || g_aSettings.langList.length === 0)
  {
    aItem.hide ();
    return;
  }

  var aMenu = aItem.menu;
  if (aMenu)
  {
    var aItems = aMenu.items;
    for (var i = 0; i < aItems.length;++i)
    {
      aItem = aItems.get(i);

      if (aItem.id === "ait_lang_menu_"+g_aSettings.lang)
      {
        aItem.setChecked (true);
        return;
      }
    }
  }
}

/*
  Langs Submenu
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_langs",
    text:"ait_menu_main_langs",
    checkFn: checkLangsSubMenu
  }
);

/*
  Noise script command
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_test_noise",
    text:"ait_menu_test_noise",
    handler: boc.ait.tests.startTests
  }
);

/*
  Command to get the logs from the web server
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_test_get_logs",
    text:"ait_menu_test_get_logs",
    handler:boc.ait.tests.getLogs
  }
);

/*
  Command to reset the logs on the web server
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_test_reset_logs",
    text:"ait_menu_test_reset_logs",
    handler:boc.ait.tests.resetLogs
  }
);

/*
  Command to lock mouse access
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_set_mouseaccess_lock",
    text:"ait_menu_main_set_mouseaccess_lock",
    checkFn: function (aItem)
    {
      var aView = this.getParams ("ownerComp");
      var sVT = aView.getViewType ();
      if ((sVT !== "graphical" && sVT !== "bia") || aView.isMouseAccessLocked())
      {
        aItem.hide();
      }
    },
    handler: function (aItem)
    {
      var aView = this.getParams("ownerComp");
      aView.updateImageMap (true);
    }
  }
);

/*
  Command to reset mouse access
*/
boc.ait.addCommand
(
  {
    id:"ait_menu_main_remove_mouseaccess_lock",
    text:"ait_menu_main_remove_mouseaccess_lock",
    checkFn: function (aItem)
    {
      var aView = this.getParams ("ownerComp");
      var sVT = aView.getViewType ();
      if ((sVT !== "graphical" && sVT !== "bia") || !aView.isMouseAccessLocked())
      {
        aItem.hide();
      }
    },
    handler: function (aItem)
    {
      var aView = this.getParams("ownerComp");
      aView.updateImageMap (false);
    }
  }
);

boc.ait.addCommand
(
  {
    id:"ait_menu_test_configure",
    text:"ait_menu_test_configure",
    handler: function ()
    {
      boc.ait.tests.configureTests ();
    }
  }
);

boc.ait.checkCopyFn = function (aTree)
{
  if (!aTree)
  {
    return false;
  }
  if (!g_aSettings.allowCreatingNewObjects && !g_aSettings.allowCreatingObjectGroups && !g_aSettings.allowCreatingModelGroups)
  {
    return false;
  }

  var aNodes = aTree.getSelectedNodes ();

  // Return if one of the selected elements is not editable
  for (var i = 0; i < aNodes.length;++i)
  {
    var nArtType = aNodes[i].get("artefactType");
    if (nArtType === AIT_ARTEFACT_OBJECT && !g_aSettings.allowCreatingNewObjects)
    {
      return false;
    }
    if (nArtType === AIT_ARTEFACT_OBJECT_GROUP && !g_aSettings.allowCreatingObjectGroups)
    {
      return false;
    }

    if (nArtType === AIT_ARTEFACT_DIAGRAM_GROUP && !g_aSettings.allowCreatingModelGroups)
    {
      return false;
    }

    // Copy/Pasting currently only works for objects and groups
    if (nArtType === AIT_ARTEFACT_DIAGRAM)
    {
      return false;
    }
    if (!aNodes[i].get("editable"))
    {
      return false;
    }
  }
  return true;
};

boc.ait.checkPasteFn = function (aTree)
{
  if (!aTree)
  {
    return false;
  }
  if (!g_aSettings.allowCreatingNewObjects && !g_aSettings.allowCreatingObjectGroups && !g_aSettings.allowCreatingModelGroups)
  {
    return false;
  }

  var aCopyElements = aTree.getElementsToCopy ();
  // If there are either no elements to copy in the current tree or
  // the number of elements to copy is 0, disable the item
  if (!aCopyElements || aCopyElements.length === 0)
  {
    return false;
  }

  var aNodes = aTree.getSelectedNodes ();
  // If there is not exactly one node selected, or that node is not editable, disable the item
  if (aNodes.length !== 1 || !aNodes[0].get("editable") || aNodes[0].get("_is_leaf"))
  {
    return false;
  }

  return true;
};

/*
  Checks whether artefacts can be copied from the current selection.
  \param aItem The menu item that was clicked.
*/
//--------------------------------------------------------------------
boc.ait.checkCopyArtefacts = function (aItem)
//--------------------------------------------------------------------
{
  if (g_aSettings.offline || (!g_aSettings.allowCreatingNewObjects && !g_aSettings.allowCreatingObjectGroups && !g_aSettings.allowCreatingModelGroups))
  {
    aItem.hide ();
    return;
  }

  if (!boc.ait.checkCopyFn (this.getParams ("ownerComp")))
  {
    aItem.disable ();
    return;
  }
  aItem.enable();
};

/*
  Checks whether artefacts can be pasted in the current selection.
  \param aItem The menu item that was clicked.
*/
//--------------------------------------------------------------------
boc.ait.checkPasteArtefacts = function (aItem)
//--------------------------------------------------------------------
{
  if (g_aSettings.offline || (!g_aSettings.allowCreatingNewObjects && !g_aSettings.allowCreatingObjectGroups && !g_aSettings.allowCreatingModelGroups))
  {
    aItem.hide ();
    return;
  }

  if (!boc.ait.checkPasteFn (this.getParams ("ownerComp")))
  {
    aItem.disable ();
    return;
  }

  aItem.enable ();
};

/*
  Stores the elements to copy in an array at the current tree
  \param aItem The menu item that was clicked.
*/
//--------------------------------------------------------------------
boc.ait.doCopyArtefacts = function (aItem)
//--------------------------------------------------------------------
{
  var aOwnerTree = this.getParams ("ownerComp");
  aOwnerTree.setElementsToCopy (this.getContext ());
};

/*
  Pastes the elements to copy from the current tree to the selected target group.
  \param aItem The menu item that was clicked.
*/
//--------------------------------------------------------------------
boc.ait.doPasteArtefacts = function (aItem)
//--------------------------------------------------------------------
{
  var aTarget = this.getContext()[0];
  var aOwnerTree = this.getParams ("ownerComp");
  var aNodes = aOwnerTree.getElementsToCopy ();

  var aElements = [];
  // Construct the array of elements to copy and paste to a target folder
  for (var i = 0; i < aNodes.length;++i)
  {
    var aNode = aNodes[i];
    aElements.push
    (
      {
        artefactType: aNode.get("artefactType"),
        artefactId: aNode.get("artefactId")
      }
    );
  }

  // Do the actual copy/pasting of elements
  boc.ait.pasteArtefactsToGroup
  (
    {
      artefactType: aOwnerTree.getArtefactType (),
      targetGroupId: aTarget.get ("artefactId"),
      elements: aElements
    }
  );
};

/*
  New command to copy selected elements in the tree.
*/
boc.ait.addCommand
(
  {
    id:"axw_menu_main_copy",
    text:"axw_menu_main_copy",
    checkFn: boc.ait.checkCopyArtefacts,
    handler: boc.ait.doCopyArtefacts
  }
);

/*
  New command to paste selected elements in the tree.
*/
boc.ait.addCommand
(
  {
    id:"axw_menu_main_paste",
    text:"axw_menu_main_paste",
    checkFn: boc.ait.checkPasteArtefacts,
    handler: boc.ait.doPasteArtefacts
  }
);
