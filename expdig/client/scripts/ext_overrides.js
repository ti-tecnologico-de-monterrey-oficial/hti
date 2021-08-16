/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2015\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2015
**********************************************************************
\author MWh
This file contains overrides for Ext JS components. Some of those overrides
are temporary fixes that have to be removed, as soon as a new Ext JS version
comes out, that already contains this fix.

**********************************************************************
*/


// # Fix for CR "Make sure that CR #064335 in offline web client works for IE11"
(function (){
  var sUserAgent = navigator.userAgent.toLowerCase();
  var sDocMode = document.documentMode;
  var checkUA = function (aRegEx)
  {
    return aRegEx.test (sUserAgent);
  };
  Ext.isIE = !Ext.isOpera && (checkUA(/msie/) || checkUA(/trident/));
  Ext.isIE11 = Ext.isIE && ((checkUA(/trident\/7\.0/) && sDocMode != 7 && sDocMode != 8 && sDocMode != 9 && sDocMode != 10) || sDocMode == 11);
}());

Ext.Container.prototype.bufferResize = false;

// Fix for an issue in Ext.menu.Menu, where the 'beforeshow' event is not fired
// Only necessary for Ext 3.0
/*
Ext.override(Ext.menu.Menu, {
    show : function(el, pos, parentMenu){
        if(this.floating){
            this.parentMenu = parentMenu;
            if(!this.el){
                this.render();
                this.doLayout(false, true);
            }
            //if(this.fireEvent('beforeshow', this) !== false){
                this.showAt(this.el.getAlignToXY(el, pos || this.defaultAlign, this.defaultOffsets), parentMenu, false);
            //}
        }else{
            Ext.menu.Menu.superclass.show.call(this);
        }
    },
    showAt : function(xy, parentMenu,  _e){
        if(this.fireEvent('beforeshow', this) !== false){
            this.parentMenu = parentMenu;
            if(!this.el){
                this.render();
            }
            this.el.setXY(xy);
            if(this.enableScrolling){
                this.constrainScroll(xy[1]);
            }
            this.el.show();
            Ext.menu.Menu.superclass.onShow.call(this);
            if(Ext.isIE){
                this.layout.doAutoSize();
                if(!Ext.isIE8){
                    this.el.repaint();
                }
            }
            this.hidden = false;
            this.focus();
            this.fireEvent("show", this);
        }
    }
});*/


// Override for the Ext.grid.GridView. This introduces a property preserveCellWidths that is only evaluated if forceFit is
// also true. In this case, if the width of a column is changed only the size of the column adjacent to it will be changed.
// Positions of splitters of other columns are not touched.
Ext.override
(
  Ext.grid.GridView,
  {
    onColumnSplitterMoved : function(nColIdx, nWidth)
    {
      this.userResized = true;
      var aCM = this.grid.colModel;

      if (this.forceFit && this.preserveCellWidths)
      {
        var nNextColIdx = nColIdx+1;
        // Only change the column width if we do not work with the last column and the next column to the right
        // is not fixed and not hidden.
        if (nNextColIdx < aCM.getColumnCount (true) && !aCM.isHidden(nNextColIdx) && !aCM.isFixed(nNextColIdx))
        {
          var nOldWidth = aCM.getColumnWidth (nColIdx);
          var nDiff = nOldWidth-nWidth;

          // Set the width of the current column
          aCM.setColumnWidth(nColIdx, nWidth, true);
          var nNewNextColWidth = aCM.getColumnWidth (nNextColIdx)+nDiff;
          // Change the width of the neighbor column
          aCM.setColumnWidth(nNextColIdx, nNewNextColWidth, true);

          this.updateAllColumnWidths();

          // Fire events
          this.grid.fireEvent("columnresize", nColIdx, nWidth);
          this.grid.fireEvent("columnresize", nNextColIdx, nNewNextColWidth);
        }
      }
      else
      {
        aCM.setColumnWidth(nColIdx, nWidth, true);

        if(this.forceFit)
        {
          this.fitColumns(true, false, nColIdx);
          this.updateAllColumnWidths();
        }
        else
        {
          this.updateColumnWidth(nColIdx, nWidth);
          this.syncHeaderScroll();
        }

        this.grid.fireEvent("columnresize", nColIdx, nWidth);
      }
    }
  }
);

/* Temporary Fix for CR #048244 - Also reported in Ext JS Forums (http://www.extjs.com/forum/showthread.php?t=74765)
*/
Ext.override
(
  Ext.Element,
  {
    contains : function(el)
    {
      try
      {
        return !el ? false : Ext.lib.Dom.isAncestor(this.dom, el.dom ? el.dom : el);
      }
      catch(e)
      {
        return false;
      }
    }
  }
);

// Override for a bug that occurs when destroying a datepicker
// (http://www.extjs.com/forum/showthread.php?t=79605&highlight=keynav)
Ext.override (Ext.DatePicker,
  {
    beforeDestroy : function()
    {
      if(this.rendered)
      {
        if(this.keyNav)
        {
          this.keyNav.disable();
          this.keyNav = null;
        }
        Ext.destroy
        (
          this.leftClickRpt,
          this.rightClickRpt,
          this.monthPicker,
          this.eventEl,
          this.mbtn,
          this.todayBtn
        );
      }
    }
  }
);


var umlRe = /&([AEIOUYaeiouy])uml;/g, szRe = /&szlig;/g;
/*
  "Germanizes" a passed string, replaces umlauts with a_, u_ or o_ respectively and handles the 'ß' character
  This is required for correct sorting
*/
function germanize (sString)
{
  sString = String(sString);
  return sString.replace(umlRe, function(a, b) {return b + "|";})
          .replace(szRe, "S|")
          .replace(/ö/g, "o|")
          .replace(/Ö/g, "O|")
          .replace(/ä/g, "a|")
          .replace(/Ä/g, "A|")
          .replace(/ü/g, "u|")
          .replace(/Ü/g, "U|")
          .replace(/ß/g, "S|");
}



/*This overrides the sorttypes, code taken from the 2.2 Version of the data\SortTypes.js File
  Check thread http://www.extjs.com/forum/showthread.php?t=53191&highlight=umlaut
*/
Ext.apply (Ext.data.SortTypes,
  {
    asUCText: function(s)
    {
      return germanize(String(s).toUpperCase().replace(this.stripTagsRE, ""),false);
    },
    asUCString: function(s)
    {
      return germanize(String(s).toUpperCase(),false);
    },
    asText: function(s)
    {
      return germanize(String(s).replace(this.stripTagsRE, ""),true);
    },
    none: function(s)
    {
      return germanize(s,true);
    }
  }
);

/**
 * New implementation of Ext.History because of IE8 Ext.History bug, see
 * http://www.sencha.com/forum/showthread.php?80963-UNKNOWN-3.0-IE8-Ext.History-loop-prev-current-page
 */
Ext.History = (function () {
  var iframe, hiddenField;
  var ready = false;
  var currentToken;

  function getHash() {
      var href = top.location.href, i = href.indexOf("#");
      return i >= 0 ? href.substr(i + 1) : null;
  }

  function doSave() {
      hiddenField.value = currentToken;
  }

  function handleStateChange(token) {
      currentToken = token;
      Ext.History.fireEvent('change', token);
  }

  function updateIFrame (token) {
      var html = ['<html><body><div id="state">',token,'</div></body></html>'].join('');
      try {
          var doc = iframe.contentWindow.document;
          doc.open();
          doc.write(html);
          doc.close();
          return true;
      } catch (e) {
          return false;
      }
  }

  function checkIFrame() {
      if (!iframe.contentWindow || !iframe.contentWindow.document) {
          setTimeout(checkIFrame, 10);
          return;
      }

      var doc = iframe.contentWindow.document;
      var elem = doc.getElementById("state");
      var token = elem ? elem.innerText : null;

      var hash = getHash();

      setInterval(function () {

          doc = iframe.contentWindow.document;
          elem = doc.getElementById("state");

          var newtoken = elem ? elem.innerText : null;

          var newHash = getHash();
          if (newtoken !== token) {
              token = newtoken;
              handleStateChange(token);
              top.location.hash = token;
              hash = token;
              doSave();
          } else if (newHash !== hash) {
              hash = newHash;
              updateIFrame(newHash);
          }

      }, 50);

      ready = true;

      Ext.History.fireEvent('ready', Ext.History);
  }

  function startUp() {
    if (hiddenField)
    {
      currentToken = hiddenField.value ? hiddenField.value : getHash();
      if (Ext.isIE)
      {
        checkIFrame();
      }
      else
      {
        var hash = getHash();
        setInterval(function()
        {
          var newHash = getHash();
          if (newHash !== hash)
          {
            hash = newHash;
            handleStateChange(hash);
            doSave();
          }
        }, 50);
        ready = true;
        Ext.History.fireEvent('ready', Ext.History);
      }
    }
  }

  return {

      fieldId: 'x-history-field',

      iframeId: 'x-history-frame',

      events:{},


      init: function (onReady, scope) {
          if(ready) {
              Ext.callback(onReady, scope, [this]);
              return;
          }
          if(!Ext.isReady){
              Ext.onReady(function(){
                  Ext.History.init(onReady, scope);
              });
              return;
          }
          hiddenField = Ext.getDom(Ext.History.fieldId);
    if (Ext.isIE) {
              iframe = Ext.getDom(Ext.History.iframeId);
          }
          this.addEvents('ready', 'change');
          if(onReady){
              this.on('ready', onReady, scope, {single:true});
          }
          startUp();
      },


      add: function (token, preventDup) {
          if(preventDup !== false){
              if(this.getToken() == token){
                  return true;
              }
          }
          if (Ext.isIE) {
              return updateIFrame(token);
          } else {
              top.location.hash = token;
              return true;
          }
      },


      back: function(){
          history.go(-1);
      },


      forward: function(){
          history.go(1);
      },


      getToken: function() {
          return ready ? currentToken : getHash();
      }
  };
})();
Ext.apply(Ext.History, new Ext.util.Observable());


Ext.override
(
  Ext.list.ListView,
  {
    onResize : function(w, h){
        var body = this.innerBody.dom,
            header = this.innerHd.dom,
            scrollWidth = w - Ext.num(this.scrollOffset, Ext.getScrollBarWidth()) + 'px',
            parentNode;

        if(!body){
            return;
        }
        parentNode = body.parentNode;
        if(Ext.isNumber(w)){
            if(this.reserveScrollOffset || ((parentNode.offsetWidth - parentNode.clientWidth) > 10)){
                body.style.width = scrollWidth;
                header.style.width = scrollWidth;
            }else{
                body.style.width = w + 'px';
                header.style.width = w + 'px';
                setTimeout(function(){
                    if((parentNode.offsetWidth - parentNode.clientWidth) > 10){
                        body.style.width = scrollWidth;
                        header.style.width = scrollWidth;
                    }
                }, 10);
            }
        }
        if(Ext.isNumber(h)){
            parentNode.style.height = Math.max(0, h - header.parentNode.offsetHeight) + 'px';
            parentNode.parentNode.style.height=(h+(Ext.isIE ? 2 : 0))+"px";
        }
    }
  }
);

Ext.Panel.override
(
  {
    setAutoScroll: function()
    {
      if (this.rendered && this.autoScroll)
      {
        var el = this.body || this.el;
        if (el)
        {
          el.setOverflow('auto');
          // Following line required to fix autoScroll
          el.dom.style.position = 'relative';
        }
      }
    }
  }
);