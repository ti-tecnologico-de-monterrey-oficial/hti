/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author DKo
This file contains the code for the boc.ait.print class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.print');

/*
    Implementation of the class boc.ait.print. This class
    is used for showing ADOxx style notebooks in the web
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.print.printPreview = function(aPanel)
//--------------------------------------------------------------------
{
  var aBox = new Ext.BoxComponent
  ({
      autoEl :
      {
        id:     'notebook-iframe',
        tag:    'iframe',
        src:    'print.html',
        width:  '100%',
        height: '100%',
        frameborder: '0'
      }
  });

  aBox.on("render", function(aCmp)
    {
      aCmp.getEl().on("load",
        function ()
        {
          Ext.DomHelper.applyStyles
          (
            aPanel.getEl().dom.firstChild.firstChild,
            'border:0pt;'
          );
          var aNBEl = Ext.DomQuery.selectNode("table[@class='ait_readmode_notebook']");

          Ext.DomHelper.append
          (
            Ext.get(aCmp.getEl().dom.contentWindow.document.body),
            aNBEl.parentNode.innerHTML
          );

          aCmp.getEl().dom.contentWindow.document.body.firstChild.id = Ext.id();
          Ext.get(aCmp.getEl().dom.contentWindow.document.body).clean();
          var aArr = Ext.get(aCmp.getEl().dom.contentWindow.document.body).select("a");
          for(var i=0; i < aArr.elements.length; i++)
          {
            var aEl = aArr.elements[i];
            aEl.removeAttribute("href");
            aEl.setAttribute("onclick", "");
            aEl.removeAttribute("onclick");
            aEl.removeAttribute("class");
          }
        }
      );
    }
  );

  var aWin = new boc.ait.printWindow
  (
    {
      layout:'fit',
      autoScroll:true,
      constrainHeader: true,
      width : 800,
      height: 600,
      title : getString("axw_print_preview"),
      maximizable: true,
      modal: true,
      items: [aBox]
    }
  );

  aWin.show();
};

boc.ait.printWindow = function(aConfig)
{
  aConfig = aConfig || {};

  this.buttons =
  [{
    text:    getString("axw_print"),
    handler: this.print,
    scope:   this
  },
  {
    text:    getString("ait_close"),
    handler: this.close,
    scope:   this
  }];

  boc.ait.printWindow.superclass.constructor.call(this, aConfig);
}

Ext.extend
(
  boc.ait.printWindow,
  Ext.Window,
  {
    print : function()
    {
      var aIframeWindow = Ext.get('notebook-iframe').dom.contentWindow;
      if (Ext.isIE)
      {
        aIframeWindow.focus();
      }
      aIframeWindow.print();
    }
  }
);