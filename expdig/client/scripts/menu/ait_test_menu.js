/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.menu.TestMenu class.
**********************************************************************
*/

// Create namespace boc.ait.menu
Ext.namespace('boc.ait.menu');

/*
    Implementation of the class boc.ait.menu.TestMenu. This class contains
    menu entries that allow the user to do tests. Customizers can
    extend this to add their own tests.

    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.menu.TestMenu = function (aConfig)
//--------------------------------------------------------------------
{
  aConfig = aConfig || {};
  aConfig.text = getString("ait_menu_tests");
  aConfig.commands =
  [
    "ait_menu_test_noise",
    "ait_menu_test_get_logs",
    "ait_menu_test_reset_logs"
  ];

  var m_aCategories = {};

  aConfig.commands = aConfig.commands.concat(["ait_menu_test_configure", "-"]);
  
  function _startTestChainFn (aItem)
  {
    boc.ait.tests.startTestChain (aItem.commandParams.chain, false);
  }
  
  function _startTestChainLoopFn (aItem)
  {
    boc.ait.tests.startTestChain (aItem.commandParams.chain, true);
  }

  for (var i = 0; i < boc.ait.tests._TestChains.length;++i)
  {
    var aChain = boc.ait.tests._TestChains [i];

    if (aChain.extended && !g_aSettings.testmode_extended)
    {
      continue;
    }
    var aSuperCmd = aConfig;

    if (aChain.category)
    {
      aSuperCmd = m_aCategories[aChain.category];
      if (!aSuperCmd)
      {
        var sSuperCmdId = Ext.id();
        boc.ait.addCommand
        (
          {
            id: sSuperCmdId,
            text: aChain.category
          }
        );

        aSuperCmd =
        {
          cmdId: sSuperCmdId,
          commands: []
        };

        aConfig.commands.push (aSuperCmd);
        m_aCategories[aChain.category] = aSuperCmd;
      }
    }
    boc.ait.addCommand
    (
      {
        id:aChain.id,
        text:aChain.text,
        handler: _startTestChainFn,
        commandParams: {"chain":aChain}
      }
    );

    aSuperCmd.commands.push (aChain.id);

    if (aChain.loopable)
    {
      boc.ait.addCommand
      (
        {
          id:aChain.id+"_loop",
          text:getString (aChain.text)+" ("+getString("ait_test_loop")+")",
          handler: _startTestChainLoopFn,
          commandParams: {"chain":aChain}
        }
      );
      aSuperCmd.commands.push (aChain.id+"_loop");
    }
  }


  boc.ait.menu.TestMenu.superclass.constructor.call (this, aConfig);

  this._getContext = function ()
  {
    return g_aMain.getTreeArea().getActiveTree().getSelectedNodes ();
  };
};

Ext.extend
(
  boc.ait.menu.TestMenu,
  boc.ait.menu.Menu,
  {
    getContext : function ()
    {
      return this._getContext ();
    }
  }
);