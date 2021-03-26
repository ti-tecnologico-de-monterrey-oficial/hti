/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.WebClient class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');


/*
    Implementation of the class boc.ait.WebClient. This class is the main class for the ADOit
    Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.WebClient = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var m_aMainArea = null;
  var m_aTreeArea = null;
  var m_aDebugBox = null;
  var m_aMenuBar = null;
  var m_aStatusBar = null;
  var m_aPlugins = [];
  var m_bIsLoggedOut = false;

  // Initialize the config object if necessary
  aConfig = aConfig || {};
  
  aConfig.plugins = [boc.ait.plugins.Customizable];

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      // Use borderlayout in the web client. This allows us to use regions 'center', 'west' and 'south'
      aConfig.layout = 'border';

      // Create a new instance of the MainPanel
      m_aMainArea = new boc.ait.MainPanel
      (
        {
          // Show the start page in the main Panel
          bShowStartPage: true,
          // Show the main panel in the web client's center region
          region: 'center'
          // Set the margins of the main area
          //margins: '26 0 0 0',
          //cmargins: '26 0 0 0'
        }
      );

      // Collapse the tree by default if there is a startpage and it contains elements
      // Ignore this default setting if there is a definite setting (true or false) set by a customized plugin
      // CR 051823
      var bCollapseTree = false;
      if (g_aSettings.showTreePanel === true)
      {
        bCollapseTree = false;
      }
      else if (g_aSettings.showTreePanel === false)
      {
        bCollapseTree = true;
      }
      else
      {
        bCollapseTree = (m_aMainArea.getStartPage() && m_aMainArea.getStartPage().items && m_aMainArea.getStartPage().items.length > 0);
      }

      m_aTreeArea = new boc.ait.LiveTreePanel
      (
        {
          title:getString("axw_explorer_title"),
          border:true,
          collapsible:true,
          collapsed:bCollapseTree,
          floatable:false,
          animCollapse:false,
          stateful:false,
          split:true,
          width:310,
          region:'west'
        }
      );
      
      // Create a new instance of the DebugBox allowing developers to execute entered JS code
      m_aDebugBox = new boc.ait.DebugBox
      (
        {
          // Show the debug box in the web client's south region
          region: 'south'
        }
      );
      
      var aItems = [];
      
      // Check if the web client shoud show a header
      if (g_aSettings.header instanceof boc.ait.util.Header)
      {
        // Create a new instance of the Menubar
        m_aMenuBar = new boc.ait.menu.Menubar
        (
          {
            region: 'south'
          }
        );
        var aNorthPanel = new Ext.Container
        (
          {
            layout:"border",
            region:"north",
            title:"northpanel",
            height:g_aSettings.header.getHeight()+30,
            items:
            [
              m_aMenuBar,
              new Ext.Container
              (
                {
                  region:"center",
                  height:g_aSettings.header.getHeight(),
                  html: g_aSettings.header.getHTML(),
                  items: g_aSettings.header.getItems ()
                }
              )
            ]
          }
        );
        
        aItems.push (aNorthPanel);
      }
      else
      {
        // Create a new instance of the Menubar
        m_aMenuBar = new boc.ait.menu.Menubar
        (
          {
            region: 'north'
          }
        );
        aItems.push (m_aMenuBar);
      }
       

      m_aStatusBar = new boc.ait.menu.Statusbar ();

      // Create the contained items of the web client
      aConfig.items = aItems.concat
      (
        [
          //m_aMenuBar,
          m_aTreeArea,
          m_aMainArea,
          new Ext.Panel
          (
            {
              header: false,
              autoHeight: true,
              region:'south',
              items:
              [
                m_aDebugBox
              ],
              bbar:m_aStatusBar,
              listeners:
              {
                render : function (aPanel)
                {
                  aPanel.doLayout ();
                }
              }
            }
          )
        ]
      );

      /*
          Inner function that is called when the web client is rendered
          Hides the debug box
      */
      //--------------------------------------------------------------------
      var aOnRenderFunction = function (aPanel)
      //--------------------------------------------------------------------
      {
        m_aDebugBox.hide();

        for (var s in m_aPlugins)
        {
          var aPlugin = m_aPlugins[s];
          if ((typeof aPlugin) != "object")
          {
            continue;
          }
          aPlugin.load();
        }
      };

      // Create a listener that hides the debug box when the web client is rendered
      aConfig.listeners =
      {
        render: aOnRenderFunction
      };

      // Add a binding to the keymap. We want to show the menubar's DevTools Menu when the
      // user presses CTRL+SHIFT+d.
      g_aKeyMap.addBinding
      (
        {
          key: 'd',
          shift: true,
          ctrl: true,
          // The scope (this) of the called handler function is the menubar itself
          scope: m_aMenuBar,
          // toggle the dev tools menu in the menubar
          fn: m_aMenuBar.toggleDevToolsMenu
        }
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };


  // protected members:

  /*
      Protected function that returns the web client's main area
      \retval The web client's main area
  */
  //--------------------------------------------------------------------
  this._getMainArea = function()
  //--------------------------------------------------------------------
  {
    return m_aMainArea;
  };

  /*
      Protected function that returns the web client's menu bar
      \retval The web client's menu bar
  */
  //--------------------------------------------------------------------
  this._getMenuBar = function ()
  //--------------------------------------------------------------------
  {
    return m_aMenuBar;
  };

  /*
      Protected function that returns the web client's status bar
      \retval The web client's status bar
  */
  //--------------------------------------------------------------------
  this._getStatusBar = function ()
  //--------------------------------------------------------------------
  {
    return m_aStatusBar;
  };

  /*
      Protected function that returns the web client's debug box
      \retval The web client's debug box
  */
  //--------------------------------------------------------------------
  this._getDebugBox = function ()
  //--------------------------------------------------------------------
  {
    return m_aDebugBox;
  };

  /*
      Protected method that returns the treearea
      \retval The tree area
  */
  //--------------------------------------------------------------------
  this._getTreeArea = function()
  //--------------------------------------------------------------------
  {
    return m_aTreeArea;
  };


  // Call to the constructor function to build the object
  buildObject.call (this);

  // Call to the superclass' constructor
  boc.ait.WebClient.superclass.constructor.call(this, aConfig);

  g_aEvtMgr.fireEvent ("webclient_initialized", this);
  
  /*
    Protected function that logs out the current user of the web client
  */
  //--------------------------------------------------------------------
  this._logout = function ()
  //--------------------------------------------------------------------
  {
    m_bIsLoggedOut = true;
    boc.ait.logout ();
  };
  
  /*
    Protected function that returns whether or not the user has already logged out of the web client
  */
  //--------------------------------------------------------------------
  this._isLoggedOut = function ()
  //--------------------------------------------------------------------
  {
    return m_bIsLoggedOut;
  };
};

// boc.ait.WebClient is derived from Ext.Viewport
Ext.extend
(
  boc.ait.WebClient,
  Ext.Viewport,
  {
    // public members:
    /*
        Public function that returns the web client's main area
        \retval The web client's main area
    */
    //--------------------------------------------------------------------
    getMainArea : function()
    //--------------------------------------------------------------------
    {
      return this._getMainArea ();
    },

    /*
        Public function that returns the web client's menu bar
        \retval The web client's menu bar
    */
    //--------------------------------------------------------------------
    getMenuBar : function ()
    //--------------------------------------------------------------------
    {
      return this._getMenuBar ();
    },

    /*
        Public function that returns the web client's status bar
        \retval The web client's stats bar
    */
    //--------------------------------------------------------------------
    getStatusBar : function ()
    //--------------------------------------------------------------------
    {
      return this._getStatusBar ();
    },


    /*
        Public function that returns the web client's debug box
        \retval The web client's debug box
    */
    //--------------------------------------------------------------------
    getDebugBox: function ()
    //--------------------------------------------------------------------
    {
      return this._getDebugBox ();
    },

    /*
        Public method that returns the treearea
        \retval The tree area
    */
    //--------------------------------------------------------------------
    getTreeArea: function()
    //--------------------------------------------------------------------
    {
      return this._getTreeArea();
    },
    
    /*
      Public function that logs out the current user of the web client
    */
    //--------------------------------------------------------------------
    logout: function ()
    //--------------------------------------------------------------------
    {
      this._logout ();
    },

    changePassword : function ()
    {
      try
      {
        var aPasswordWindow = new boc.ait.PasswordDialog();
        aPasswordWindow.show();

      }
      catch (aEx)
      {
        displayErrorMessage (aEx);
      }
    },

    getRepoData : function ()
    {
      return  {
                repoId: g_aSettings.repoData.repoId,
                libId: g_aSettings.repoData.libId,
                libName: g_aSettings.repoData.libName
              };
    },
    
    /*
      Public function that returns whether or not the user has already logged out of the web client
    */
    //--------------------------------------------------------------------
    isLoggedOut : function ()
    //--------------------------------------------------------------------
    {
      return this._isLoggedOut ();
    }
  }
);

// Register the web client's xtype
Ext.reg("boc-webclient", boc.ait.WebClient);