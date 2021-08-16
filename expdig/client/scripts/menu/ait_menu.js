/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.menu.Menu class.
**********************************************************************
*/

// Create namespace boc.ait.menu
Ext.namespace('boc.ait.menu');

/*
    Implementation of the class boc.ait.menu.Menu. This class is the super class for all menus
    in the ADOit Web Client
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.menu.Menu = function (aConfig)
//--------------------------------------------------------------------
{
  aConfig = aConfig || {};

  var m_aParamMap = {};

  /**
   * Checks if a menu item is visible and or if it is a 
   * container which contains no further entries.
   * 
   * @param aMenu
   * @returns
   */
  var emptyOrHidden = function(aMenu)
  {
    if(!aMenu || aMenu.hidden === true || 
        aMenu.menu && aMenu.menu.hidden === true ||
        aMenu.menu && aMenu.menu.items && aMenu.menu.items.length === 0)
    {
      return true;
    }
    return false;
  };
  
  var onBeforeShow = function (aMenu)
  {
    var aLastItem = null;

    //aMenu.ownerMenu = this;
    aMenu.items.each
    (
      function (aItem)
      {
        if ((aItem instanceof Ext.menu.Separator) && !aLastItem)
        {
          aItem.hide ();
          return;
        }
        if(aItem.getXType() === "menu")
        {
          return;
        }
        aItem.show();
        // Reset the handler of the menuitem so we can change the scope
        // in which it will be called
        aItem.setHandler (aItem.initialConfig.handler || Ext.emptyFn, this);
        if (typeof aItem.checkFn === "function")
        {
          aItem.checkFn.call (this, aItem);
        }

        // Clean the menu, so that there are no two separators after each other
        if (!emptyOrHidden(aItem))
        {
          if ((aLastItem instanceof Ext.menu.Separator) && (aItem instanceof Ext.menu.Separator))
          {
            aLastItem.hide ();
          }
          aLastItem = aItem;
        }
      },
      this
    );

    // If the last visible item is a separator, hide it!
    if (aLastItem instanceof Ext.menu.Separator)
    {
      aLastItem.hide ();
    }
  };

  // private members
  Ext.apply (this, aConfig);

  // Create the actual menu and add all the menu items we created before
  this.menu = new Ext.menu.Menu
  (
    {
      items: [],
      text:aConfig.text
    }
  );

  /*
      Protected method that inserts a new menuitem with the passed cmd id into the menu
      \param sCmd The command id of the item to add
  */
  //--------------------------------------------------------------------
  this._insertCommand = function (aCmd)
  //--------------------------------------------------------------------
  {
    var aCmdConf = null;
    if (aCmd === '-')
    {
      this.menu.items.add(Ext.id(), new Ext.menu.Separator ());
    }
    else if (typeof aCmd === "string")
    {
      aCmdConf = boc.ait.g_aCommands.get(aCmd);
      if (!aCmdConf)
      {
        alert("cmd: " + aCmd);
      }
      var ItemClass = (aCmdConf.checkBox === true) ? Ext.menu.CheckItem : Ext.menu.Item ;

      this.menu.addItem
      (
        new ItemClass
        (
          {
            itemId: aCmdConf.id,
            //id: aCmdConf.id,
            text: getString(aCmdConf.text),
            handler: aCmdConf.handler,
            checkFn: aCmdConf.checkFn,
            commandParams: aCmdConf.commandParams
          }
        )
      );
    }
    else if (typeof aCmd === "object")
    {
      var aSuperMenu = (aCmd.superMenuId ? this.getItemById (aCmd.superMenuId) : this) || this;

      if (!aSuperMenu.menu)
      {
        aSuperMenu.menu = new boc.ait.menu.Menu
        (
          {
            text: aSuperMenu.text,
            itemId: aSuperMenu.id,
            //id: aSuperMenu.id,
            superMenu: this
          }
        ).menu;
      }

      if (aCmd.cmdId === "-")
      {
        aSuperMenu.menu.add("-");
        return;
      }

      aCmdConf = boc.ait.g_aCommands.get(aCmd.cmdId);

      var aSubMenu = new boc.ait.menu.Menu
      (
        {
          text: getString(aCmdConf.text),
          itemId: aCmdConf.id,
          //id: aCmdConf.id,
          commands:aCmd.commands,
          superMenu: aSuperMenu
        }
      );



      aSuperMenu.menu.addItem
      (
        new Ext.menu.Item
        (
          {
            //id: aCmdConf.id,
            itemId: aCmdConf.id,
            text: aCmd.label || getString(aCmdConf.text),
            handler: aCmdConf.handler || function(){return false;},
            menu: aCmd.commands ? aSubMenu.menu : null,
            checkFn: aCmdConf.checkFn,
            commandParams: aCmdConf.commandParams
          }
        )
      );
    }
  };

  this._getItemById = function (sItemId)
  {
    if (!this.menu.items)
    {
      return null;
    }

    var aItems = this.menu.items.getRange ();
    for (var i = 0; i < aItems.length;++i)
    {
      var aItem = aItems[i];

      if (sItemId === aItem.itemId)
      {
        return aItem;
      }
    }

    return null;
  };

  /*
      Public method that hides the menuitem for the passed command id
      \param sCmd The cmd id of the menuitem to hide
  */
  //--------------------------------------------------------------------
  this._hideCommand = function (sCmd)
  //--------------------------------------------------------------------
  {
    this.menu.items.get(sCmd).hide ();
  };

  var aCommands = aConfig.commands;
  for (var i = 0; aCommands && i < aCommands.length;++i)
  {
    var aCmd = aCommands [i];

    this._insertCommand (aCmd);
  }

  this.menu.on("beforeshow", onBeforeShow, this);

  aConfig.plugins = [boc.ait.plugins.Customizable];


  boc.ait.menu.Menu.superclass.constructor.call (this, aConfig);

  /*
      Protected method that returns the context of the current menu
      \param aContext The context
  */
  //--------------------------------------------------------------------
  this._getContext = function()
  //--------------------------------------------------------------------
  {
    var aCtx = this.context;
    if ((aCtx === undefined || aCtx === null) && this.superMenu)
    {
      aCtx = this.superMenu.getContext();
    }
    return aCtx;
  };

  /*
      Protected method that inserts a new menuitem at the end of the menu.
      \param aItem The menuitem to insert
  */
  //--------------------------------------------------------------------
  this._insertMenuItem = function (aItem)
  //--------------------------------------------------------------------
  {
    this.menu.addMenuItem (aItem);
  };

  /*
      Protected method that sets additional parameters for a menu
      \param aParams
  */
  //--------------------------------------------------------------------
  this._setParams = function (sKey, aParams)
  //--------------------------------------------------------------------
  {
    if (aParams)
    {
      m_aParamMap[sKey] = aParams;
    }
    else
    {
      this.params = sKey;
    }
  };

  /*
      Protected method that returns any additional parameters for a menu
      \retval The parameters for the menu
  */
  //--------------------------------------------------------------------
  this._getParams = function (sKey)
  //--------------------------------------------------------------------
  {
    if (sKey)
    {
      return m_aParamMap[sKey];
    }
    return this.params;
  };

  this._insertSeparator = function ()
  {
    this.menu.addSeparator ();
  };
};

// boc.ait.menu.Menu is derived from Ext.Toolbar.Button
Ext.extend
(
  boc.ait.menu.Menu,
  Ext.Toolbar.Button,
  {
    // public members

    /*
        Public method that returns the context of the current menu
        \param aContext The context
    */
    //--------------------------------------------------------------------
    getContext : function ()
    //--------------------------------------------------------------------
    {
      return this._getContext ();
    },

    /*
        Public method that inserts a new menuitem at the end of the menu.
        \param aItem The menuitem to insert
    */
    //--------------------------------------------------------------------
    insertMenuItem : function (aItem)
    //--------------------------------------------------------------------
    {
      this._insertMenuItem (aItem);
    },


    /*
        Public method that inserts a new menuitem with the passed cmd id into the menu
        \param sCmd The command id of the item to add
    */
    //--------------------------------------------------------------------
    insertCommand : function (aCmd)
    //--------------------------------------------------------------------
    {
      //checkParam (sCmd, "string");

      this._insertCommand (aCmd);
    },


    /*
        Public method that sets the context for the menu, e.g. the selected tree elements
        \param aContext The context
    */
    //--------------------------------------------------------------------
    setContext: function (aContext)
    //--------------------------------------------------------------------
    {
      this.context = aContext;
    },

    /*
        Public method that hides the menuitem for the passed command id
        \param sCmd The cmd id of the menuitem to hide
    */
    //--------------------------------------------------------------------
    hideCommand: function (sCmd)
    //--------------------------------------------------------------------
    {
      checkParam (sCmd, "string");

      this._hideCommand (sCmd);
    },

    /*
        Public method that sets additional parameters for a menu
        \param aParams
    */
    //--------------------------------------------------------------------
    setParams: function (sKey, aParams)
    //--------------------------------------------------------------------
    {
      if (arguments.length === 2)
      {
        checkParam (sKey, "string");
      }

      this._setParams (sKey, aParams);
    },

    /*
        Public method that returns any additional parameters for a menu
        \retval The parameters for the menu
    */
    //--------------------------------------------------------------------
    getParams: function (sKey)
    //--------------------------------------------------------------------
    {
      checkParamNull (sKey, "string");
      return this._getParams (sKey);
    },

    getItemById : function (sId)
    {
      return this._getItemById (sId);
    },

    insertSeparator : function ()
    {
      this._insertSeparator ();
    }
  }
);
// Register the menu's xtype
Ext.reg("boc-menu", boc.ait.menu.Menu);