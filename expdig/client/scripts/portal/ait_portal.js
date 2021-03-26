/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.portal.Portal class.
**********************************************************************
*/

// Create namespace boc.ait.portal
Ext.namespace('boc.ait.portal');

boc.ait.portal.Portal = function(aConfig)
{
  // Call to the superclass' constructor
  boc.ait.portal.Portal.superclass.constructor.call(this, aConfig);
}

/*
    Implementation of the class boc.ait.portal.Portal. This class is the Portal
    shown on the web client's startpage.
    boc.ait.portal.Portal extends Ext.ux.Portal
*/
//--------------------------------------------------------------------
Ext.extend
//--------------------------------------------------------------------
(
  boc.ait.portal.Portal,
  Ext.ux.Portal,
  {
    // We are using our own portalcolumn implemenation as default child object
    defaultType: 'boc-portalcolumn'
  }
);
// Register the portal's xtype
Ext.reg('boc-portal', boc.ait.portal.Portal);