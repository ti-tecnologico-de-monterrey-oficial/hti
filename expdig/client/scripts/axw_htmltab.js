/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2017\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2017
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.Notebook class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace ('com.boc.axw');

/*
    Implementation of the class boc.notebook.Notebook. This class
    is used for showing ADOxx style notebooks in the web
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
com.boc.axw.HTMLTab = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var that = this;

  var m_sContent = aConfig.content;

  aConfig.title = getString ("axw_html_publishing_custom_startpage_title");
  aConfig.iconUrl = "images/home.png";
  if (Ext.isEmpty (aConfig.closable))
  {
    aConfig.closable = true;
  }
  else
  {
    aConfig.closable = aConfig.closable;
  }
  aConfig.html = "<iframe class='axw-html-frame' src ='../data/startpage/"+m_sContent+"'></iframe>";

  com.boc.axw.HTMLTab.superclass.constructor.call (that, aConfig);
}

// boc.ait.notebook.Notebook is derived from Ext.Panel
Ext.extend
(
  com.boc.axw.HTMLTab,
  boc.ait.Tab,
  {
  }
);
