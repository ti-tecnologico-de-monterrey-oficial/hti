/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.menu.DevToolsMenu class.
**********************************************************************
*/

// Create namespace boc.ait.menu
Ext.namespace('boc.ait.menu');

/*
    Implementation of the class boc.ait.menu.DevToolsMenu. This class is a menu containing
    functionality for Web Client developers of the ADOit
    Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.menu.DevToolsMenu = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  var m_aMenu = null;
  var m_aToggleDebugBoxItem = null;
  var m_aReloadAServerScriptsItem = null;


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

      /*
          Private method that shows/hides the debug box depending on whether it is currently shown
      */
      //--------------------------------------------------------------------
      var aToggleDebugBoxFunction = function ()
      //--------------------------------------------------------------------
      {
        // Get the debug box
        var aDebugBox = g_aMain.getDebugBox();
        // Show/hide the debug box depending on whether this item is checked or not
        aDebugBox.setVisible(!this.checked);
        // Redo the web client's layout
        g_aMain.doLayout();
      };

      // Create a check item that toggles the debug box' visibility
      m_aToggleDebugBoxItem = new Ext.menu.CheckItem
      (
        {
          text: 'Show JS Debug Box',
          handler: aToggleDebugBoxFunction
        }
      );

      m_aReloadAServerScriptsItem = new Ext.menu.Item
      (
        {
          text: 'Reload AServer Scripts',
          handler: boc.ait.reloadAServerScripts
        }
      );


      // Create the inner menu of the dev tools menu
      m_aMenu = new Ext.menu.Menu
      (
        {
          text: 'Show JS Debug Box',
          // Add the toggle item to the inner menu's items
          items:
          [
            m_aToggleDebugBoxItem
          ]
        }
      );

      // Set the mainmenu's inner menu
      aConfig.menu = m_aMenu;
      // Set the mainmenu's text
      aConfig.text = 'Dev Tools';
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // protected members

  /*
      Protected method that returns the devtoolmenu's inner menu
      \retval The devtool menu's inner menu
  */
  //--------------------------------------------------------------------
  this._getInnerMenu = function()
  //--------------------------------------------------------------------
  {
    return m_aMenu;
  };

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.menu.DevToolsMenu.superclass.constructor.call(this, aConfig);
};

// boc.ait.menu.DevToolsMenu is derived from Ext.Toolbar.Button
Ext.extend
(
  boc.ait.menu.DevToolsMenu,
  Ext.Toolbar.Button,
  {
    // public members

    /*
        Public method that returns the devtoolmenu's inner menu
        \retval The maidevtooln menu's inner menu
    */
    //--------------------------------------------------------------------
    getInnerMenu : function ()
    //--------------------------------------------------------------------
    {
      return this._getInnerMenu();
    }
  }
);
// Register the devtoolsmenu's xtype
Ext.reg("boc-devtoolsmenu", boc.ait.menu.DevToolsMenu);