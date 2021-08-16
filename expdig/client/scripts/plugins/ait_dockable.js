/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2009\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2009
**********************************************************************
\author MWh
This file contains the code for the boc.ait.plugins.Dockable.
**********************************************************************
*/

// Create namespace boc.ait.plugins
Ext.namespace("boc.ait.plugins");

/*
    Implementation of the class boc.ait.plugins.Dockable. Plugins that
    use this plugin can be undocked from their ownerCt by doubleclicking their
    header. The contents of the panel will then be copied to a floating, non-modal
    window.
*/
//--------------------------------------------------------------------
boc.ait.plugins.Dockable =
//--------------------------------------------------------------------
{
  /*
      The init method for the plugin. This serves as a constructor.
      \param aCmp The component the plugin is applied to
  */
  //--------------------------------------------------------------------
  init: function(aPanel)
  //--------------------------------------------------------------------
  {
    checkParam (aPanel, Ext.Panel);

    try
    {
      // inner variables globally available within the init function.

      // Store a reference to the panel owner
      var aPanelOwner = null;
      // Store a reference to the window that will then contain the undocked panel
      var aUndockedWindow = null;

      // Flag that stores whether we are inside a tabpanel.
      var bTab = false;

      /*
        Inner function that undocks the panel from its owner
      */
      //--------------------------------------------------------------------
      var undock = function()
      //--------------------------------------------------------------------
      {
        try
        {
          if (typeof aPanel.show == "function")
          {
            aPanel.show();
          }

          if (aPanel.tooltip)
          {
            aPanel.tooltip.destroy();
            delete aPanel.tooltip;
          }

          // Get the panel's height
          var nHeight = aPanel.getEl().getHeight();
          // Get the panel's width
          var nWidth = aPanel.getEl().getWidth();
          // Get the panel's owner
          aPanelOwner = aPanel.ownerCt;


          // Create the configuration object for the inner window panel
          var aWinPanelConfig =
          {
            title:'',
            layout:'fit',
            anchor:'100% 100%',
            autoScroll: aPanel.initialConfig.autoScroll
          };

          // If we are inside a tab panel, copy the panel's items to the new panel in the window
          //if (bTab)
          if (aPanel.items && aPanel.items.length > 0)
          {
            var aItems = [];
            // Copy the items from the panel to the win panel
            for (var i = 0; i < aPanel.items.length;++i)
            {
              aItems[i] = aPanel.items.get(i);
            }

            aWinPanelConfig.items = aItems;
          }
          // If we are not inside a tab panel, we copy the dockable panel's inner html to
          // the window's inner panel.
          else
          {
            aWinPanelConfig.html = aPanel.body.dom.innerHTML;
          }
          // We then remove the panel from the former owner and
          // also hide it. This workaround is necessary because otherwise the undocked panel
          // still be shown in the former owner
          aPanel.hide();

          var aTabClass = (aPanel instanceof boc.ait.Tab) ? boc.ait.Tab : Ext.Panel;

          // Create a new panel that will contain all the dockable panel's elements and then
          // be added to the window
          var aWinPanel = new Ext.Panel (aWinPanelConfig);

          // Is the panel closable?
          var bClosable = aPanel.closable;
          // Is the panel collapsible?
          var bCollapsible = aPanel.collapsible;
          // Is the panel collapsed?
          var bCollapsed = aPanel.collapsed;

          var aListeners = aPanel.initialConfig.listeners;

          var aTools = aPanel.initialConfig.tools;

          if (!aTools)
          {
            aTools = [];
          }

          for (var j = 0; j < aTools.length;++j)
          {
            var aTool = aTools[j];
            if (aTool.id == 'unpin' || aTool.id == 'pin')
            {
              aTools.splice(j,1);
              --j;
            }
          }

          aTools[aTools.length] =
          {
            id: 'pin',
            handler: dock,
            scope: aPanel
          };

          // Create a new window
          // This window will contain the undocked panel
          aUndockedWindow = new Ext.Window
          (
            {
              // Use the undocked panel's title
              title: aPanel.initialConfig.title,
              constrainHeader: true,
              resizable:true,
              //autoScroll:true,
              layout:'anchor',
              // If the undocked panel was closable, the window is closable
              closable:bClosable,
              // We use the undocked panel's id and add a 'win-' prefix. It is important that we reuse
              // the original id, because we want to be able to find this window by id when we e.g. try to
              // open the contained diagram by double clicking on a treenode.
              id:"win-"+aPanel.id,
              // If the undocked panel was collapsible, the window is collapsible
              collapsible: bCollapsible,
              width: nWidth,
              height: nHeight,
              // We add a 'pin' tool that allows us to dock the undocked panel to its former owner
              tools: aTools,
              cls: 'x-tab-panel-body',
              // We add the inner panel to the window's items
              items:
              [
                aWinPanel
              ],
              listeners: aListeners,
              originalPanel: aPanel
            }
          );

          aUndockedWindow.relayEvents(aPanel, ["destroy"]);

          // If we are inside a tab panel, we have to completely remove the original tab
          // When the undocked window is closed. Otherwise it won't be possible to open a tab
          // containing the object or model again
          if (bTab)
          {
            aUndockedWindow.on("close", function ()
              {
                aPanelOwner.remove(aPanel, true);
              }
            );
          }

          // Force the window and the former owner to redo their layouts
          aUndockedWindow.doLayout();
          aPanelOwner.doLayout();
          // Remove the panel from its owner, but don't destroy it
          aPanelOwner.remove(aPanel, false);

          // show the window
          aUndockedWindow.show();

          /*
            Inner function that creates a context menu for the undocked element

            \param aEvt The event object
          */
          //--------------------------------------------------------------------
          var aUndockedContextMenuFunction = function (aEvt)
          //--------------------------------------------------------------------
          {
            // Create a new menu item that allows us to undock the panel
            var aDockItem = new Ext.menu.Item
            (
              {
                text: getString("ait_dock"),
                handler: dock
              }
            );

            // Create a new menu item that allows us to undock the panel
            var aDockItemClose = new Ext.menu.Item
            (
              {
                text: getString("ait_close"),
                handler: aUndockedWindow.close, scope: aUndockedWindow
              }
            );

            // Create the contextmenu
            var aMenu = new Ext.menu.Menu
            (
              {
                items:
                [
                  aDockItem,
                  aDockItemClose
                ]
              }
            );

            // Show the context menu
            aMenu.showAt(aEvt.getXY());
            // Stop the event thus stopping the browser from showing its default context menu
            aEvt.stopEvent();
          };

          // Add a context menu to the window's header that contains a menu item which
          // allows us to redock the panel
          Ext.fly (aUndockedWindow.body).on
          (
            "contextmenu",
            aUndockedContextMenuFunction
          );

          // If the panel was collapsed, the window will be collapsed
          if (bCollapsed)
          {
            aUndockedWindow.collapse(false);
          }
          else
          {
            aUndockedWindow.expand(false);
          }
        }
        catch (aEx)
        {
          displayErrorMessage (aEx);
        }
      };

      /*
        Inner function that redocks the undocked panel to its original owner
      */
      //--------------------------------------------------------------------
      var dock = function ()
      //--------------------------------------------------------------------
      {
        try
        {
          // Add the dockable panel to the original owner
          aPanelOwner.add (aPanel);


          // Otherwise we get the inner panel from the window
          var aWinPanel = aUndockedWindow.getComponent(0);

          // If we are inside a tab panel we have to make the panel dockable again because
          // during the undock - dock procedure the original selector was destroyed and then recreated
          if (bTab)
          {
            makeDockable (aPanel);

            var aSelector = Ext.get(aPanel.ownerCt.getTabEl(aPanel));
            aSelector.addClass("x-tab-with-icon");

            var aAnchor = Ext.query("a", aSelector.dom)[0];
            aAnchor.style.backgroundImage="url('images/tab_close.png')";
            aAnchor.style.backgroundPosition="right center";
            aAnchor.style.height="16";
            aAnchor.style.width="16";

            var aSpan = Ext.query("span", aSelector.dom)[1];
            aSpan.style.backgroundImage = "url("+aPanel.iconUrl+")";
            aSpan.style.backgroundPosition = "0 center";
            
            // Copy the items from the panel to the win panel
            var nLength = aWinPanel.items.length;
            for (var i = 0; i < nLength;++i)
            {
              aPanel.add (aWinPanel.items.get(0));
            }
            aPanel.setTitle(aPanel.initialConfig.title);
          }
          else
          {
            if (aPanel.items)
            {
              aPanel.items.clear();
            }
            
            var aUndockedItems = aWinPanel.items;
            if (!aUndockedItems)
            {
              aUndockedItems = aUndockedWindow.items;

            }
            if (aUndockedItems)
            {
              for (var j = 0; j < aUndockedItems.length;++j)
              {
                aPanel.add(aUndockedItems.get(j));
              }
            }

            // Move the winpanel's inner html to the redocked panel's inner html
            //aPanel.body.dom.innerHTML = aWinPanel.body.dom.innerHTML;
            // Add the redocked panel to the original owner
            aPanelOwner.add(aPanel);
            // Force the redocked panel to redo its layout
            aPanel.doLayout();
            // Show the redocked panel
            aPanel.show();

            // If the undocked window was collapsed, collapse the redocked panel
            if (aUndockedWindow.collapsed)
            {
              aPanel.collapse(false);
            }
            else
            {
              aPanel.expand(false);
            }
          }

          if (aPanel instanceof boc.ait.Tab)
          {
            aPanel.initTab ();
          }


          // Force the panel owner to redo its layout
          aPanelOwner.doLayout();

          // We do not need the undocked window anymore, so destroy it
          // Suspend events so that the destroy event is not thrown when the window is destroyed
          aUndockedWindow.suspendEvents ();
          aUndockedWindow.destroy();

          // If we are inside a tabpanel, we activate the newly added tab
          if (bTab)
          {
            aPanelOwner.setActiveTab(aPanel);
          }
        }
        catch (aEx)
        {
          displayErrorMessage (aEx);
        }
      };

      /*
          Inner function that makes the panel dockable
      */
      //--------------------------------------------------------------------
      var makeDockable = function ()
      //--------------------------------------------------------------------
      {
        try
        {
          // Store the panel owner
          aPanelOwner = aPanel.ownerCt;

          // Check if the owner is a tab panel and the dockable panel is a tab
          bTab = aPanelOwner instanceof Ext.TabPanel;

          // Get the selector of the panel
          var aSelector = null;

          // Are we inside a tabpanel? Then the selector is the tab element
          if (bTab)
          {
            aSelector = Ext.fly(aPanel.ownerCt.getTabEl(aPanel));
          }
          // Otherwise the selector is the panel's header
          else
          {
            aSelector = Ext.fly(aPanel.header);
          }

          if (aSelector)
          {
            /*
              Views Submenu
            */
            boc.ait.addCommand
            (
              {
                id:"ait_menu_tab_undock",
                text:"ait_undock",
                handler: undock
              }
            );

            // Add an event listener for the selector's dblclick event
            aSelector.on
            (
              "dblclick",
              undock
            );

            /*
              Inner function that creates a context menu for the docked element

              \param aEvt The event object
            */
            //--------------------------------------------------------------------
            var aDockedContextMenuFunction = function (aEvt)
            //--------------------------------------------------------------------
            {
              // Create a new menu item that allows us to undock the panel
              var aUndockItem = new Ext.menu.Item
              (
                {
                  text: getString("ait_undock"),
                  handler: undock
                }
              );

              var aMenu = aPanel.getTabContextMenu ();

              if (aMenu)
              {
                aMenu.add ("", aUndockItem);
              }
              else
              {
                aMenu = new Ext.menu.Menu
                (
                  {
                    items: aUndockItem
                  }
                );
              }
              // Create the contextmenu

              // Show the context menu
              aMenu.showAt(aEvt.getXY());
              // Stop the event thus stopping the browser from showing its default context menu
              aEvt.stopEvent();
            };


            if (typeof aPanel.getTabContextMenu !== "undefined")
            {
              // Create a new menu item that allows us to undock the panel
              var aUndockItem = new Ext.menu.Item
              (
                {
                  text: getString("ait_undock"),
                  handler: undock
                }
              );

              var aMenu = aPanel.getTabContextMenu ();
              if (aMenu && aMenu.getItemById ("ait_menu_tab_undock"))
              {
                return;
              }
              if (aMenu && aMenu.menu.items.length > 0)
              {
                aMenu.insertSeparator ();
              }
              aMenu.insertCommand ("ait_menu_tab_undock");
            }
            else
            {
              // Add an event listener for the selector's contextmenu event
              aSelector.on
              (
                "contextmenu",
                aDockedContextMenuFunction
              );
            }
          }
        }
        catch (aEx)
        {
          displayErrorMessage (aEx);
        }
      };


      // Dockable panel initialization

      // Check if the panel already has tools defined
      // If this is not the case, create the tools
      if (!aPanel.tools || aPanel.tools.length === null)
      {
        aPanel.tools = [];
      }

      // Add an 'unpin' tool to the panel's header to undock the panel
      aPanel.tools[aPanel.tools.length] =
      (
        {
          id:"unpin",
          handler:undock
        }
      );
      // Add a handler for the panel's render event that makes the panel dockable
      aPanel.on
      (
        'render',
        makeDockable
      );
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }
};