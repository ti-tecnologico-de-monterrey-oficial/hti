/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.menu.Menubar class.
**********************************************************************
*/

// Create namespace boc.ait.menu
Ext.namespace('boc.ait.menu');

/*
    Implementation of the class boc.ait.menu.Menubar. This class is the menubar of the
    ADOxx Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.menu.Menubar = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  var m_aMainMenu = null;
  var m_aDevToolsMenu = null;
  var m_aThemeMenu = null;
  var m_aLogoutButton = null;
  var m_aSearchButton = null;
  var m_aHelpButton = null;
  var m_aReportMenu = null;
  var m_aTestMenu = null;
  var m_aHelpWindow = null;
  var m_aTimeFilter = null;
  var m_aDummyButton = null;

  // Initialize the config object if necessary
  aConfig = aConfig || {};

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    // Render the menubar to the document's body
    aConfig.height = 30;
    // Create a new instance of the mainmenu
    m_aMainMenu = new boc.ait.menu.MainMenu
    (
      {
        text: g_aSettings.productData.productName
      }
    );

    // Create a new instance of the report menu
    m_aReportMenu = new boc.ait.menu.ReportMenu ();

    // Create a new instance of the thememenu
    m_aThemeMenu = new boc.ait.menu.ThemeMenu
    (
      {
        hidden: true
      }
    );

    // Create a new instance of the dev tools menu
    m_aDevToolsMenu = new boc.ait.menu.DevToolsMenu
    (
      {
        // Initially hide the dev tools menu. It can be activated pressing ctrl+shift+d
        hidden: true
      }
    );

    m_aDummyButton =
    {
      xtype:"box",
      autoEl:
      {
        tag:"div",
        cls: g_aSettings.offline ? "ait_dummy_offline" : "ait_dummy"
      }
    };
    m_aLogoutButton = new Ext.Toolbar.Button
    (
      {
        text: getString("ait_menu_main_logout"),
        tooltip: getString("ait_menu_main_tip_logout"),
        iconCls: 'ait_logout',
        handler: function ()
        {
          g_aMain.logout();
        }
      }
    );

    var SearchBtnClass = Ext.Button;

    var aSearchBtnCfg =
    {
      text: "&nbsp;"+getString("ait_tools_explorer_tip_search"),
      iconCls: 'ait_menubar_search',
      handler: function ()
      {
        g_aMain.getMainArea().openSearchTab();
      }
    };

    if (!g_aSettings.offline)
    {
      SearchBtnClass = Ext.SplitButton;

      aSearchBtnCfg.menu =
      [
        {
          text: getString("axw_search_open_search_page"),
          handler: function ()
          {
            g_aMain.getMainArea().openSearchTab();
          }
        },
        {
          text: getString ("axw_search_query_management_title"),
          handler: function ()
          {
            boc.ait.showStoredSearchQueryMgtDialog ({});
          }
        }
      ];
    }

    m_aSearchButton = new SearchBtnClass (aSearchBtnCfg);

    m_aHelpButton = new Ext.Toolbar.Button
    (
      {
        text: "&nbsp;"+getString("ait_help"),
        tooltip: getString("ait_tip_help"),
        iconCls: 'ait_menubar_help',
        handler: function ()
        {
          var bAcrobatSupport = false;
          for (var i = 0;i < navigator.plugins.length;++i)
          {
            if (navigator.plugins[i].name.indexOf("Acrobat") > -1)
            {
              bAcrobatSupport = true;
              break;
            }
          }
          var sHelpURL = "help/"+g_aSettings.lang+"/help.pdf";

          function _showHelp ()
          {
            document.location.href = sHelpURL;
            unmaskWC ();
          }

          if (bAcrobatSupport)
          {
            // If the help window is already being showed, just bring it to front
            if (m_aHelpWindow)
            {
              m_aHelpWindow.toFront ();
              return;
            }

            m_aHelpWindow = new Ext.Window
            (
              {
                title: document.title + " - " + getString("ait_help"),
                width:700,
                constrainHeader: true,
                height:600,
                style: "background-color:white;",
                layout:'fit',
                items:
                [
                  {
                    xtype:"box",
                    autoEl:
                    {
                      tag:"iframe",
                      src: sHelpURL
                    }
                  }
                ]
              }
            );

            // When the help window closes, removethe reference to it
            m_aHelpWindow.on("close", function ()
              {
                m_aHelpWindow = null;
              }
            );
            m_aHelpWindow.show ();
          }
          else
          {
            maskWC ();
            try
            {
              _showHelp.defer (500, this);
            }
            catch (aEx)
            {
              unmaskWC ();
            }
          }
        }
      }
    );


    // Add the created menus to the menubar
    aConfig.items =
    [
      m_aDummyButton,
      m_aMainMenu
    ];

    if (!g_aSettings.offline)
    {
      aConfig.items.push (m_aReportMenu);
    }

    // If we are in testmode, add the testmenu
    if (g_aSettings.testmode || g_aSettings.testmode_extended)
    {
      m_aTestMenu = new boc.ait.menu.TestMenu ();

      aConfig.items.push (m_aTestMenu);
    }

    if (g_aSettings.offline && g_aLangs.length > 1)
    {
      var aLangData = [];
      for (var i = 0; i < g_aLangs.length;++i)
      {
        var aLangEntry = g_aLangs[i];
        aLangData[i] =
        [
          aLangEntry.id, aLangEntry.displayNames[g_aSettings.lang]
        ];
      }
      // Create a simple store containing the available languages
      var aLangStore = new Ext.data.SimpleStore
      (
        {
          autoDestroy:true,
          fields: ['id', 'val'],
          data : aLangData
        }
      );

      aConfig.items.push
      (
        new Ext.form.ComboBox
        (
          {
            name: 'lang',
            store: aLangStore,
            width: 70,
            listWidth: 70,
            mode: 'local',
            forceSelection: true,
            triggerAction: 'all',
            selectOnFocus:true,
            editable:false,
            fieldLabel: getString("ait_lang"),
            valueField: 'id',
            displayField:'val',
            cls: 'language-selector',
            value: g_aSettings.lang,
            listeners:
            {
              select : function (aCombo, aRecord, nIndex)
              {
                document.location.href = "index.html?lang="+aRecord.get("id");
              }
            }
          }
        )
      );
    }

    aConfig.items = aConfig.items.concat
    (
      [
        m_aDevToolsMenu
      ]
    );

    if (g_aSettings.filterSettings && g_aSettings.filterSettings.available)
    {
      m_aTimeFilter = new boc.ait.filter.TimeFilterWidget ();
      aConfig.items = aConfig.items.concat
      (
        [
          new Ext.BoxComponent
          (
            {
              autoEl:
              {
                tag:'div',
                style:'width:10px'
              }
            }
          ),
          m_aTimeFilter
        ]
      );
    }

    aConfig.items = aConfig.items.concat
    (
      [
        // For Ext 3.*
        {xtype:'tbspacer', width:100},
        g_aSettings.offline ? '' : getString("ait_welcome")+", " + g_aSettings.user.nameForVisualization,
        {xtype: 'tbfill'},
        m_aSearchButton
      ]
    );
    if (!g_aSettings.offline)
    {
      aConfig.items[aConfig.items.length] = m_aHelpButton;
      aConfig.items[aConfig.items.length] = m_aLogoutButton;
    }
  };

  // protected members

  /*
      Protected method that returns the devtools menu
      \retval The dev tools menu
  */
  //--------------------------------------------------------------------
  this._getDevToolsMenu = function ()
  //--------------------------------------------------------------------
  {
    return m_aDevToolsMenu;
  };

  /*
      Protected method that returns the main menu
      \retval The main menu
  */
  //--------------------------------------------------------------------
  this._getMainMenu = function ()
  //--------------------------------------------------------------------
  {
    return m_aMainMenu;
  };

  /*
    Protected function that returns the reports menu if it exists

    \retval the report menu if it exists, or null
  */
  //--------------------------------------------------------------------
  this._getReportMenu = function ()
  //--------------------------------------------------------------------
  {
    return m_aReportMenu;
  };


  /*
    Protected function that returns the time filter widget

    \retval The time filter widget if it exists, or null
  */
  //--------------------------------------------------------------------
  this._getTimeFilter = function ()
  //--------------------------------------------------------------------
  {
    return m_aTimeFilter;
  };

  this._getTestMenu = function ()
  {
    return m_aTestMenu;
  };

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.menu.Menubar.superclass.constructor.call(this, aConfig);
};

// boc.ait.menu.Menubar is derived from Ext.Toolbar
Ext.extend
(
  boc.ait.menu.Menubar,
  Ext.Toolbar,
  {
    // public members

    /*
        Public method that returns the main menu
        \retval The main menu
    */
    //--------------------------------------------------------------------
    getMainMenu: function ()
    //--------------------------------------------------------------------
    {
      return this._getMainMenu();
    },

    /*
        Public method that returns the devtools menu
        \retval The dev tools menu
    */
    //--------------------------------------------------------------------
    getDevToolsMenu: function ()
    //--------------------------------------------------------------------
    {
      return this._getDevToolsMenu();
    },

    /*
      Public function that returns the reports menu if it exists

      \retval the report menu if it exists, or null
    */
    //--------------------------------------------------------------------
    getReportMenu : function ()
    //--------------------------------------------------------------------
    {
      return this._getReportMenu ();
    },

    /*
        Public method that shows/hides the devtools menu
    */
    //--------------------------------------------------------------------
    toggleDevToolsMenu: function ()
    //--------------------------------------------------------------------
    {
      try
      {
        var aDevToolsMenu = this.getDevToolsMenu();
        aDevToolsMenu.setVisible(aDevToolsMenu.hidden);
      }
      catch (aEx)
      {
        displayErrorMessage (aEx);
      }
    },

    /*
      Public function that returns the time filter widget

      \retval The time filter widget if it exists, or null
    */
    //--------------------------------------------------------------------
    getTimeFilter : function ()
    //--------------------------------------------------------------------
    {
      return this._getTimeFilter ();
    },

    getTestMenu : function ()
    {
      return this._getTestMenu ();
    }
  }
);
// Register the menubar's xtype
Ext.reg("boc-menubar", boc.ait.menu.Menubar);
