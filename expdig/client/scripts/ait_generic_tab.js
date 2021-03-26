/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2016\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2016
**********************************************************************
\author MWh
This file contains the code for the boc.ait.GenericTab class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');

/*
    Implementation of the class boc.ait.GenericTab. This is the
    base class for all tabs in the Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.GenericTab = function (aConfig)
//--------------------------------------------------------------------
{
  aConfig = aConfig || {};
  
  boc.ait.GenericTab.superclass.constructor.call (this, aConfig);
  
  
  /*
    Protected function that initializes the tab (sets initial event listeners, so
    the context menu is created correctly
  */
  //--------------------------------------------------------------------
  this._initTab = function ()
  //--------------------------------------------------------------------
  {
    // Create an event listener for the afterlayout event
    this.on("afterlayout", function (aPanel)
      {
        // Get the selector of the panel
        var aSelector = Ext.fly (aPanel.ownerCt.getTabEl(aPanel));

        this.mon
        (
          aSelector,
          {
            contextmenu: this._onTabContextMenu,
            scope: this,
          }
        );
        
        g_aEvtMgr.on 
        (
          com.boc.axw.events.MOUSE_CLICK_MIDDLE, 
          this._onMouseClickMiddle,
          this
        );
      },
      this
    );
  };
  
  this._onMouseClickMiddle = function (aEvent)
  {
    // Check if the clicked element is a child element of the tab selector
    // If not, we don't want to handle the event.
    if (!Ext.fly (this.ownerCt.getTabEl (this)).contains (Ext.fly (aEvent.target)))
    {
      return true;
    }
    // If the tab is closable, we close it and return false to stop event handling for this event.
    if (this.closable)
    {
      this.close ();
      return false;
    }
  };
  
  this._onTabContextMenu = function (aEvent)
  {
    if (!this.getTabContextMenu)
    {
      return;
    }
    var aTabContextMenu = this.getTabContextMenu ();
    if (aTabContextMenu && aTabContextMenu.menu.items.length > 0)
    {
      aTabContextMenu.menu.showAt (aEvent.getXY());
    }
  };

  // Initialize the tab
  this._initTab ();
  
  this.mon(this, "activate", boc.ait.ellipsisTitle);
  this.mon(this, "deactivate", boc.ait.ellipsisTitle);        
  
  this.mon(this, "show", function (aP, sTitle)
    {
      if (typeof aP.ownerCt.getTabEl !== "function")
      {
        return;
      }

      // Get the title of the panel
      sTitle = aP.title;
      // If the panel already has a tooltip, return
      if (aP.tooltip)
      {
        return;
      }
      aP.selector = Ext.fly(aP.ownerCt.getTabEl(aP)).dom;

      // Create a new tooltip for the panel
      aP.tooltip = new Ext.ToolTip
      (
        {
          target: aP.selector,
          autoHide:true,
          autoHeight:true,
          trackMouse:true,
          constrainPosition:true,
          shadow: true,
          hideDelay: 0,
          showDelay: 10,
          html:sTitle
        }
      );
    }
  );
  
  this.mon
  (
    this, 
    "beforedestroy",           
    function (aP)
    {
      if (aP.tooltip)
      {
        aP.tooltip.destroy();
        aP.tooltip = null;
        delete aP.tooltip;
        aP.selector = null;
        delete aP.selector;
      }
      g_aEvtMgr.un(com.boc.axw.events.MOUSE_CLICK_MIDDLE, this._onMouseClickMiddle, this);
    },
    this
  );
  
  this._setTabTitle = function (sTitle)
  {
    this.setTitle (sTitle);
    boc.ait.ellipsisTitle (this);
    if (this.tooltip)
    {
      if(this.tooltip.rendered)
      {
        this.tooltip.update (sTitle);
      }
      else
      {
        this.tooltip.html = (sTitle);
      }
    }
  };
  
  this._setIcon = function (sIconUrl)
  {
    this.iconUrl = sIconUrl;
    if (this.rendered)
    {
      var aSelector = Ext.get(this.ownerCt.getTabEl(this));
      var aSpan = Ext.query("span", aSelector.dom)[1];
      aSpan.style.backgroundImage = "url("+sIconUrl+")";
    }
  };
  
  this._getIcon = function ()
  {
    return this.iconUrl;
  };
};

// boc.ait.GenericTab is derived from Ext.Panel
Ext.extend
(
  boc.ait.GenericTab,
  Ext.Panel,
  {
    onRender: function ()
    {
      // Invoke the onRender function of the BoxComponent
      boc.ait.GenericTab.superclass.onRender.apply(this, arguments);
      
      var aSelector = Ext.get(this.ownerCt.getTabEl(this));
      aSelector.addClass("x-tab-with-icon");
      
      if (this.closable)
      {
        var aAnchor = Ext.query("a", aSelector.dom)[0];
        aAnchor.style.backgroundImage="url('images/tab_close.png')";
        aAnchor.style.backgroundPosition="right center";
        aAnchor.style.height="16";
        aAnchor.style.width="16";
      }
      
      if (this.iconUrl)
      {
        this._setIcon (this.iconUrl);
      }
    },
    
    setIcon: function (sIconUrl)
    {
      this._setIcon (sIconUrl);
    },
    
    getIcon: function ()
    {
      return this._getIcon ();
    },
    
    setTabTitle : function (sTitle)
    {
      this._setTabTitle (sTitle);
    }
  }
);

// Register the view's xtype
Ext.reg("boc-generictab", boc.ait.GenericTab);