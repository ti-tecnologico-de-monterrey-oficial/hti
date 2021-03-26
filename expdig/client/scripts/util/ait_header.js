/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.util.Header class.
**********************************************************************
*/

Ext.namespace ("boc.ait.util");

/*
  Constructor of boc.ait.util.Header.
  
  The following properties are available for aConfig:
  - height: [optional] The height of the header. By default, a height of 50px is assumed
  - html: [optional] An html fragment or a DomHelper specification that describes the html shown in the header
  - items: [optional] An array of items to show in the header. 
  
  Only one of html or header can be set.
*/
boc.ait.util.Header = function (aConfig)
{
  aConfig.height = aConfig.height || 50;
  boc.ait.util.Header.superclass.constructor.call (this, aConfig);
  
  this._getHeight = function ()
  {
    return aConfig.height;
  };
  
  this._getHTML = function ()
  {
    return aConfig.html;
  };
  
  this._getItems = function ()
  {
    return aConfig.items;
  };
};

// boc.ait.util.Header is derived from Ext.Component
Ext.extend
(
  boc.ait.util.Header,
  Ext.Component,
  {
    getHeight : function ()
    {
      return this._getHeight ();
    },
    
    getHTML : function ()
    {
      return this._getHTML ();
    },
    
    getItems : function ()
    {
      return this._getItems ();
    }
  }
);