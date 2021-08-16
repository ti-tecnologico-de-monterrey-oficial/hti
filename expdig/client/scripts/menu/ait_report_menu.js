/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.menu.ReportMenu class.
**********************************************************************
*/

// Create namespace boc.ait.menu
Ext.namespace('boc.ait.menu');

/*
    Implementation of the class boc.ait.menu.ReportMenu. This class contains
    menu entries that allow the user to trigger reports.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.menu.ReportMenu = function (aConfig)
//--------------------------------------------------------------------
{
  aConfig = aConfig || {};
  aConfig.text = getString("ait_menu_reports");
  aConfig.commands =
  [
    {
      cmdId: "ait_menu_main_views",
      commands:
      [
        "ait_menu_main_show_bia"
      ]
    },
    "-",
    "ait_menu_main_used_in_models"
  ];

  boc.ait.menu.ReportMenu.superclass.constructor.call (this, aConfig);

  this._getContext = function ()
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
  boc.ait.menu.ReportMenu,
  boc.ait.menu.Menu,
  {
    getContext : function ()
    {
      return this._getContext ();
    }
  }
);