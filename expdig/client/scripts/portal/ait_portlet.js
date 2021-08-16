/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.portal.Portlet class.
**********************************************************************
*/

// Create namespace boc.ait.portal
Ext.namespace('boc.ait.portal');

boc.ait.portal.Portlet = function (aConfig)
{
  aConfig.layout = aConfig.layout || 'fit';

  boc.ait.portal.Portlet.superclass.constructor.call (this, aConfig);
};

/*
    Implementation of the class boc.ait.portal.Portlet. This class is the portlet
    used inside the portal on the web client's startpage.
    boc.ait.portal.Portlet extends Ext.ux.Portlet
*/
//--------------------------------------------------------------------
Ext.extend
//--------------------------------------------------------------------
(
  boc.ait.portal.Portlet,
  Ext.ux.Portlet,
  {}
);
// Register the portlet's xtype
Ext.reg('boc-portlet', boc.ait.portal.Portlet);