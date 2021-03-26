/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.menu.ThemeMenu class.
**********************************************************************
*/

// Create namespace boc.ait.menu
Ext.namespace('boc.ait.menu');

/*
    Implementation of the class boc.ait.menu.ThemeMenu. This class is a menu all
    the available themes for the Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.menu.ThemeMenu = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  var aMenu = null;

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

      // Get the last stored theme. If no theme could be found (no cookies, or no theme selected, we use the
      // default theme
      var sTheme = Ext.state.Manager.get("Theme") || "gray";
      // Apply the theme
      //Ext.util.CSS.swapStyleSheet('theme', 'ext/resources/css/xtheme-'+sTheme+'.css');

      // Create an array of objects representing available themes
      var aThemes = new Array
      (
        {text: 'Default', id: 'default'},
        {text: 'Gray', id: 'gray'},
        {text: 'Purple', id: 'purple'},
        {text: 'Black', id: 'black'},
        {text: 'Slate', id: 'slate'},
        {text: 'Darkgray', id: 'darkgray'},
        {text: 'Olive', id: 'olive'},
        {text: 'Slickness', id: 'slickness'},
        {text: 'Midnight', id: 'midnight'},
        {text: 'Silver Cherry', id: 'silverCherry'},
        {text: 'Pink', id: 'pink'},
        {text: 'Green', id: 'green'}
      );


      /*
          Private method that swaps the theme of the web client depending on the checked item
          \param aItem the menuitem that was checked
      */
      //--------------------------------------------------------------------
      var aSwapTheme = function (aItem)
      //--------------------------------------------------------------------
      {
        var sCurThemeID = aItem.id;
        // swap the stylesheet
        if (sCurThemeID == "default")
        {
          Ext.util.CSS.removeStyleSheet('default_theme');
        }
        Ext.util.CSS.swapStyleSheet('theme', 'ext-2.2/resources/css/xtheme-'+sCurThemeID+'.css');

        // Store the current theme via the Statemanager
        Ext.state.Manager.set("Theme", sCurThemeID);
        // mask and unmask the body -> this is a workaround for a bug that sometimes resulted in the
        // stylesheet not being applied on all elements in the web client
        Ext.getBody().mask(getString("ait_loading"));
        Ext.getBody().unmask();
      };

      var aThemeItems = [];
      // Iterate over the available themes
      for (var i = 0; i < aThemes.length;++i)
      {
        var aTheme = aThemes[i];
        var sText = aTheme.text;
        var sID = aTheme.id;
        var bChecked = sTheme == sID;
        // For every available theme, create a new Ext.menu.CheckItem
        aThemeItems[aThemeItems.length] = new Ext.menu.CheckItem
        (
          {
            text: sText,
            id:sID,
            // Put all the checkitems in a group, so that only one item at a time is checked
            group:'theme',
            checked:bChecked,
            handler: aSwapTheme
          }
        );
      }

      // Create the inner menu of the theme menu
      aMenu = new Ext.menu.Menu
      (
        {
          // Add the theme items to the menu
          items: aThemeItems
        }
      );

      // Set the thememenu's inner menu
      aConfig.menu = aMenu;
      // Set the thememenu's text
      aConfig.text = getString("ait_themes");
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // protected members

  /*
      Protected method that returns the thememenu's inner menu
      \retval The theme menu's inner menu
  */
  //--------------------------------------------------------------------
  this._getInnerMenu = function()
  //--------------------------------------------------------------------
  {
    return aMenu;
  };

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.menu.ThemeMenu.superclass.constructor.call(this, aConfig);
};

// boc.ait.menu.ThemeMenu is derived from Ext.Toolbar.Button
Ext.extend
(
  boc.ait.menu.ThemeMenu,
  Ext.Toolbar.Button,
  {
    // public members

    /*
        Public method that returns the thememenu's inner menu
        \retval The theme menu's inner menu
    */
    //--------------------------------------------------------------------
    getInnerMenu : function ()
    //--------------------------------------------------------------------
    {
      return this._getInnerMenu();
    }
  }
);
// Register the thememenu's xtype
Ext.reg("boc-thememenu", boc.ait.menu.ThemeMenu);