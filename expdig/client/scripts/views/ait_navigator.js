/* ***************************************************************************
 * \note Copyright
 * This file is part of the ADONIS Process Portal.\n
 * (C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
 * All Rights Reserved\n
 * Use, duplication or disclosure restricted by BOC Information Systems\n
 * Vienna, 1995 - 2011
 * **************************************************************************
 */

Ext.namespace('boc.ait.views');

/**
 * @namespace boc.app
 * @singleton
 * @class boc.app.scroller Holds the functionality of the Navigator/scroller
 * @extends Ext.Panel
 */
boc.ait.views.Navigator = Ext.extend
(
  Ext.Panel,
  {
    m_bSelDrag :false,
    //m_bScrollerEnabled :false,
    m_bScrollerEnabled :true,
    m_aCurrModelGraphic :null,
    m_aCurrModelId :null,
    m_bSyncingScroller : false,


    // ---------------------------------------------
    // Variables which are used in the _onModelShow-function as well as in
    // _DoDrag
    // and therefore are defined global (used for measuring calculations)

    m_nSmall_x :0,
    m_nSmall_y :0,
    m_nFactor :0,

    m_bX_overflow :false,
    m_bY_overflow :false,

    m_nSelection_x :0,
    m_nSelection_y :0,


    // ---------------------------------------------
    // the width and height of the scroller window
    // should be the same as the width and height
    // of the frame in which the AdoScroller is loaded.

    m_nScroller_window_width :0,
    m_nScroller_window_height :0,
    // ---------------------------------------------

    // ---------------------------------------------
    // The standard header space defines the space
    // from the top of the model page to the actual
    // upper border of the model graphic. Normally
    // the header contains the model name, however
    // you should make sure, that it is always exactly
    // the height specified here.
    // Therefore you should also put possible text
    // emitted in the header inside a <NOBR></NOBR>
    // to avoid line breaks and changes in the header
    // height when resizing the browser window
    m_nStd_header_space :0,
    m_nStd_footer_space :0,
    // ---------------------------------------------

    // ---------------------------------------------
    // m_nScrollbar defines the width of the space
    // allocated for a scrollbar. This is relevant
    // if the model frame has scrolling enabled,
    // which is of course true in most of the cases
    m_nScrollbar :14,
    // ---------------------------------------------

    // ---------------------------------------------
    // Following variables are used for calculating positions
    m_nOldX :0,
    m_nOldY :0,
    m_nNewX :0,
    m_nNewY :0,

    /**
     * Constructs the scroller registers to events "afterModelShow",
     * "modelChanged", "resize" and "startPanel"
     */
    constructor : function(aConfig)
    {
      Ext.apply(this, aConfig);

      g_aEvtMgr.on("webclient_initialized", this._init, this);

      aConfig.floatable = false;
      aConfig.useSplitTips = true;

      boc.ait.views.Navigator.superclass.constructor.call(this, aConfig);
      
      this.on("resize", this._syncScrollerLazy, this);
    },

    _init : function (aWebClient)
    {
      aWebClient.getMainArea().on("tabchange", this._onCurrModelChanged, this);
      g_aEvtMgr.on("modelloaded", this._AfterModelShow, this);
      aWebClient.getMainArea ().on("resize", this._syncScrollerLazy, this);
    },

    /**
     * @private
     * moves model and frame
     * @param {Object} deltaX
     * @param {Object} deltaY
     */
    _DoDrag : function(deltaX, deltaY)
    {
      if (this.m_aCurrModelGraphic)
      {
        // redFrame = Red Frame in scroller
        var aObj = document.getElementById("redFrame");
        if (!aObj)
        {
          this._DoDrag.defer(500, this, [ deltaX, deltaY ]);
          // window.setTimeout("this._DoDrag(" + deltaX + "," + deltaY +
          // ");", 100);
        }
        else
        {
          if (this.m_nFactor === 0)
          {
            this._DoDrag.defer(500, this, [ deltaX, deltaY ]);
            // window.setTimeout("this._DoDrag(" + deltaX + "," + deltaY +
            // ");", 100);
          }
          else
          {
            var oX = aObj.style.left;
            var oY = aObj.style.top;
            oX = Number(oX.substring(0, oX.length - 2));
            oY = Number(oY.substring(0, oY.length - 2));

            // m_nSelection_x+ " ="+(oX + deltaX + m_nSelection_x)+" <
            // "+(this.m_nSmall_x+this.m_nStd_footer_space/this.m_nFactor));

            // Frame is moved
            if (this.m_bX_overflow && 
                (oX + deltaX >= 0) && 
                (oX + deltaX + this.m_nSelection_x <= this.m_nSmall_x +
                  this.m_nStd_footer_space / this.m_nFactor))
            {
              aObj.style.left = oX + deltaX + "px";

              // ... and scroll the big image, too!
              //if (document.getElementById(this.m_aCurrModelGraphic))
                g_aMain.getMainArea().getActiveTab().body
                    .scrollTo('left', Math.round(oX * this.m_nFactor));
            }

            // "this.m_nSelection_y"+ this.m_nSelection_y+ " ="+(oY +
            // deltaY + this.m_nSelection_y)+" <
            // "+(this.m_nSmall_y+this.m_nStd_footer_space/this.m_nFactor));
            if (this.m_bY_overflow && 
               (oY + deltaY >= 0) && 
               (oY + deltaY + this.m_nSelection_y <= this.m_nSmall_y + 
               this.m_nStd_footer_space / this.m_nFactor))
            {
              aObj.style.top = oY + deltaY + "px";
                g_aMain.getMainArea().getActiveTab().body
                    .scrollTo('top', Math.round(oY * this.m_nFactor));
            }

            // Model is scrolled, resized by the reduce-factor
            // Scroll again here to improve the performance on the big
            // image!
            //if (document.getElementById(this.m_aCurrModelGraphic))
              g_aMain.getMainArea().getActiveTab().body
                  .scrollTo('left', Math.round(oX * this.m_nFactor));
              g_aMain.getMainArea().getActiveTab().body
                  .scrollTo('top', Math.round(oY * this.m_nFactor));

          }
        }
      }
    },

    /**
     * @private
     * Is called on mousemove on scroller, calculates new coordinates and
     * triggers the _DoDrag-function if it is clicked
     *
     * @param {Object} Event
     */
    _onMouseMove : function(Event)
    {
      if (!this.m_bScrollerEnabled)
      {
        return;
      }
      this.m_nOldX = this.m_nNewX;
      this.m_nOldY = this.m_nNewY;
      var origEvent = null;

      // firefox = Event, other browsers = event
      if (Ext.isGecko)
      {
        origEvent = Event;
      }
      else
      {
        origEvent = event;
      }

      this.m_nNewX = origEvent.clientX;
      this.m_nNewY = origEvent.clientY;

      if (this.m_bSelDrag)
      {
        this._DoDrag(this.m_nNewX - this.m_nOldX, this.m_nNewY -
            this.m_nOldY);
      }
    },

    /**
     * @private
     * to call when the current model has changed and is now the active
     * model of the tabpanel
     *
     * @param {Object}
     *          Event
     */
    _onCurrModelChanged : function(aTabPanel, aTab)
    {
      //if (Event.value
      //    && Event.viewType == boc.app.model.constants.GRAPHIC)
      if (aTab instanceof boc.ait.views.GraphicalView)
      {
        if (!aTab.isLoaded())
        {
          return;
        }
        this.m_aCurrModelGraphic = aTab;
        // save it for comparison in _AfterModelShow
        this.m_aCurrModelId = aTab.getViewId ();
        this.m_bScrollerEnabled = true;
        // will only succeed if the model is already loaded,
        // if not the _AfterModelShow is triggered anyway
        this._onModelShow();
      }
      else
      {
        this.m_bScrollerEnabled = false;
        this._ResetScroller();
      }
    },

    /**
     * @private
     * After a currmodelchanged a aftermodelshow event is sent, now the
     * image should be available, so we call onmodelshow again
     *
     * @param {Object}
     *          Event
     */
    _AfterModelShow : function(aGraphicalView, sDiagramInfoId)
    {
      this.m_aCurrModelGraphic = aGraphicalView;
      // save it for comparison in _AfterModelShow
      this.m_aCurrModelId = sDiagramInfoId;
      this.m_bScrollerEnabled = true;
      // will only succeed if the model is already loaded,
      // if not the _AfterModelShow is triggered anyway

      this._onModelShow();
    },
    
    /**
     * _syncScrollerLazy - Private function that calls the event for synchronizing the scroller,
     * the difference to the standard syncScroller function is a deferred
     * loading of 0,5 s. The delay is necessary because the layout sometimes
     * needs some time to recalculate its borders (for example on
     * expanding) and an earlier call would lead to wrong values inside
     * the scroller.
     */
    _syncScrollerLazy : function()
    {
      if (this.m_bSyncingScroller)
      {
        return;
      }

      this.m_bSyncingScroller = true;
      this._onModelShow.defer(500, this, [ 100 ]);
    },

    /**
     * @private
     * create frame
     */
    _ScrollFrame : function()
    {
      if (document.getElementById("redFrame"))
      {
        document.getElementById("redFrame").style.top = parseInt(
            g_aMain.getMainArea().getActiveTab().body
                .getScroll().top /
                this.m_nFactor, 10) +
                "px";
        document.getElementById("redFrame").style.left = parseInt(
            g_aMain.getMainArea().getActiveTab().body
                .getScroll().left /
                this.m_nFactor, 10)+
                "px";
      }
    },

    /**
     * @private
     * Scrolls the frame if no flags are set to prevent from this action
     */
    _Scroll : function()
    {
      // if the scroller is disabled or we are dragging at the moment
      // (which again will scroll tha main window
      // and this again will re-call a scroll action on the red frame we are
      // actually dragging) - return
      if (!this.m_bScrollerEnabled || this.m_bSelDrag)
      {
        return;
      }

      this._ScrollFrame();
    },

    /**
     * @private
     * Is called when a model is opened graphically, the scroller frame is
     * resized or the scale of the model is changed -> new calculation of
     * scroller image needed
     *
     * @param {Object}
     *          aObj
     */
    _onModelShow : function(Event)
    {
      this.m_bSyncingScroller = false;
      // Some handler are calling this event method / event on startup,
      // and it may not have a current model graphic available
      if (!this.m_aCurrModelGraphic || !this.el || !this.m_bScrollerEnabled || this.collapsed)
      {
        return;
      }
      // get width and height, calculate size
      // MAA: Simplified the width and height calculation
      this.m_nScroller_window_height = this.getInnerHeight();
      this.m_nScroller_window_width = this.getInnerWidth();

      //var oMg = document.getElementById(this.m_aCurrModelGraphic);
      var oMg = this.m_aCurrModelGraphic;
      var oMb = g_aMain.getMainArea();

      // Image exists but is not completely loaded, retry
      if (!oMg || !oMb)
      {
        // Clean the scroller:
        // This happens for example when a model is displayed in table view
        // then there is no image to displaye, therefore empty
        if (this.body)
        {
          this.body.update("");
        }
        // DPE 10.04.2009: We should NEVER simply return, but always call
        // the whole procedure with some timeout
        // See also CR #005783
        this._onModelShow.defer(1000, this);
        return;
      }
      else
      {
        // get modeldata
        
        oMg = this.m_aCurrModelGraphic.getModelImage ();
        // If the current model image was reset to the blank image url, ignore it
        // In IE7, we don't get a relative path for the image's url, but an absolute one, so we have to check if the
        // image path ends with the blank image url. "endsWith" is not implemented in JavaScript, but
        // STRING.match(MATCH_STRING+"$") == MATCH_STRING does the same
        // IMPORTANT: Don't use the === operator, this will not work.
        if (!oMg || !oMg.getAttribute("src") || oMg.getAttribute("src").match(Ext.BLANK_IMAGE_URL+"$") == Ext.BLANK_IMAGE_URL)
        {
          return;
        }
        var image = "views?navigator=true&id="+this.m_aCurrModelId+"&timestamp="+(new Date()).getTime()+"&sessionid="+WindowStorage.get("sessionID");

        var image_x = oMg.width;
        var image_y = oMg.height;

        // check visible area
        var visible_x = oMb.getInnerWidth();
        var visible_y = oMb.getInnerHeight();

        // if this is the case, some data has not yet been retrieved
        // correctly
        if (image_x == 24 || image_y == 24)
        {
          return;
        }

        var maxModelWidth, maxModelHeight;

        if (image_x > visible_x)
        {
          this.m_bX_overflow = true;
          maxModelWidth = image_x;
        }
        else
        {
          this.m_bX_overflow = false;
          maxModelWidth = visible_x;
        }

        // DPe: If we have a horiz. overflow (= a scrollbar at the bottom of
        // the image), we have to reduce
        // the visible_x-value by the scrollbar height! Actually this should
        // also be done vice versa for the width,
        // but obviously we cannot decide if we have a vertical overflow
        // before we do not know if we have hor. scrollbars
        // while at the same time we do not know if we have hor. scrollbars
        // before we do not know if we have a ver. overflow
        // -> we´ll ignore the hor. issue
        if (this.m_bX_overflow)
        {
          visible_x -= this.m_nScrollbar;
        }

        if ((this.m_nStd_header_space + image_y + this.m_nStd_footer_space) > visible_y)
        {
          this.m_bY_overflow = true;
          maxModelHeight = this.m_nStd_header_space + image_y +
              this.m_nStd_footer_space;
          if (this.m_bX_overflow)
          {
            maxModelHeight += this.m_nScrollbar;
          }
          maxModelWidth = maxModelWidth + this.m_nScrollbar;
        }
        else
        {
          this.m_bY_overflow = false;

          // DPE: TEST
          maxModelHeight = visible_y;
        }

        // factor = resize-factor (smaller image = reduced)
        var factor_x = (maxModelWidth / this.m_nScroller_window_width);
        var factor_y = (maxModelHeight / this.m_nScroller_window_height);
        this.m_nFactor = (factor_x > factor_y) ? factor_x : factor_y;

        this.m_nSmall_x = Math.round(image_x / this.m_nFactor);
        this.m_nSmall_y = Math.round(image_y / this.m_nFactor);
        var small_y_top = Math.round(this.m_nStd_header_space /
            this.m_nFactor);
        var tX = visible_x;
        var tY = visible_y;

        var ama_x = maxModelWidth;
        var ama_y = maxModelHeight;

        if (this.m_bY_overflow)
        {
          tX -= this.m_nScrollbar;
          ama_x -= this.m_nScrollbar;
        }

        if (this.m_bX_overflow)
        {
          tY -= this.m_nScrollbar;
          ama_y -= this.m_nScrollbar;
        }
        // evaluate coordinates
        this.m_nSelection_x = Math.floor(tX / this.m_nFactor);
        this.m_nSelection_y = Math.floor(tY / this.m_nFactor);

        // Reducing the red frame width to ensure its completely visible
        //this.m_nSmall_x -= 2;
        //this.m_nSmall_y -= 2;
        this.m_nSelection_x -= 2;
        this.m_nSelection_y -= 2;

        // DPE: Correction scroller according to CR #004417
        // Remove 2px of the selection-height (which is representing the red
        // frame) to make it more visible to the user
        // Do this only in case we habe NO horizontal scrollbar
        if (!this.m_bX_overflow)
        {
          this.m_nSelection_y -= 1;
        }

        // Get the scale of the current view
        var nCurScale = this.m_aCurrModelGraphic.getZoomInfo().scale;//*100;
        // Calculate the target scale for the navigator
        var nScaleToGet = (nCurScale / this.m_nFactor); /// 100;

        image+="&scale="+nScaleToGet;

        // Fill table with model and frame
        var content = "<div id=\"scroller_image\" style=\"width: " +
            this.m_nSmall_x + "px; height:" + this.m_nSmall_y +
            "px; background: url('" + image;
        content += ("')  no-repeat; margin-top:" +
            small_y_top + "px; border:0; overflow:visible;\">");
        content += ("<div id=\"redFrame\" style=\"position:absolute; width:" +
            this.m_nSelection_x + "px; height:" + this.m_nSelection_y);
        content += ("px; z-index:1; left: 0px; top: 0px; cursor:move;border:1px solid #FF0000\" ");
        content += ("onMouseOut=\"Ext.getCmp('" + this.id + "').endDrag();\" ");
        content += ("onMouseDown=\"Ext.getCmp('" + this.id +
            "').startDrag();\" onMouseUp=\"Ext.getCmp('" + this.id + "').endDrag();\">");
        content += ("<span></span>"); // A child element is required for the
        // redFrame to work correctly
        content += ("</div></div>");

        // Get the Dom-element of the ExtJS-element to set the innerHTML
        this.body.update(content);
        this.body.dom.onmousemove = this._onMouseMove.createDelegate(this);

        g_aMain.getMainArea().getActiveTab().body.dom.onscroll = this._Scroll
            .createDelegate(this);

        // Adapt red frame, needed if this method
        // is called by resizing of a component
        this._Scroll();
      }
    },

    /**
     * @private
     * reset the scroller (show empty panel)
     */
    _ResetScroller : function()
      // May be null if its not initialized
    {
      if (this.body)
      {
        this.body.update("");
      }
    },

    /**
     * Called when dragging event stops, sets an internal flag to indicate that dragging is not active any more
     * @TODO does this have to be public?
     */
    endDrag : function()
    {
      this.m_bSelDrag = false;
    },

    /**
     * Called when dragging event starts, sets an internal flag to indicate that dragging is actually active
     * @TODO does this have to be public?
     */
    startDrag : function()
    {
      this.m_bSelDrag = true;
    }
  }
);