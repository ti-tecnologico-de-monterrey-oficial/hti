/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.menu.MainMenu class.
**********************************************************************
*/

// Create namespace boc.ait.menu
Ext.namespace('boc.ait.menu');

/*
    Implementation of the class boc.ait.menu.MainMenu. This class is the main menu of the ADOit
    Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.menu.MainMenu = function (aConfig)
//--------------------------------------------------------------------
{
  aConfig = aConfig || {};
  aConfig.commands =
  [
    "ait_menu_main_open_diagram",
    "ait_menu_main_open_model_editor",
    "ait_menu_main_open_notebook",
    '-',
    "ait_menu_main_rename",
    "ait_menu_main_create_folder",
    "ait_menu_main_create_object",
    "ait_menu_main_delete",
    '-',
    {
      cmdId:'ait_menu_main_langs'
    },
    '-',
    "ait_menu_main_change_password",
    '-',
    "ait_menu_main_logout"
  ];

  boc.ait.menu.MainMenu.superclass.constructor.call (this, aConfig);

  // Get the languages sub menu item from the main menu
  var aLangsMenu = this.getItemById("ait_menu_main_langs");

  // Create a menu for the language menu item
  aLangsMenu.menu = new Ext.menu.Menu
  (
    {
      items:[]
    }
  );
  
  // Iterate through the language list and add a new check item for each language in the list to the
  // languages menu
  for (var i = 0; g_aSettings.langList && i < g_aSettings.langList.length;++i)
  {
    var aLang = g_aSettings.langList[i];

    var sLangName = getString("ait_lang_"+aLang.langId);
    if (sLangName.indexOf("ait_lang_") === 0)
    {
      sLangName = aLang.name;
    }
    // Add a new check item
    aLangsMenu.menu.addMenuItem
    (
      new Ext.menu.CheckItem
      (
        {
          text: sLangName,
          handler: function ()
          {
            // If the current language was selected, return and do nothing
            if (this.checked)
            {
              return;
            }
            var sLang = this.id.substring(this.id.lastIndexOf("_")+1);
            boc.ait.switchLanguage (sLang);
          },
          id:"ait_lang_menu_"+aLang.langId,
          group:"ait_langs",
          visible:true,
          checked: aLang.langId === g_aSettings.lang
        }
      )
    );
  }

  /*
    Returns the context (=the artefacts the entries in the menu are applied on) of the menu.
    The relevant artefacts are those that are selected in the active tree.
    If there is no active tree, an empty array is returned.

  */
  //--------------------------------------------------------------------
  this._getContext = function ()
  //--------------------------------------------------------------------
  {
    if (g_aMain.getTreeArea().getActiveTree())
    {
      return g_aMain.getTreeArea().getActiveTree().getSelectedNodes ();
    }
    return [];
  };
};

Ext.extend
(
  boc.ait.menu.MainMenu,
  boc.ait.menu.Menu,
  {
    getContext : function ()
    {
      return this._getContext ();
    }
  }
);