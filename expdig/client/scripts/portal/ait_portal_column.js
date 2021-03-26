/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.portal.PortalColumn class.
**********************************************************************
*/

// Create namespace boc.ait.portal
Ext.namespace('boc.ait.portal');

/*
    Implementation of the class boc.ait.portal.PortalColumn. This class is the column
    used inside the portal on the web client's startpage.
    boc.ait.portal.PortalColumn extends Ext.ux.PortalColumn
*/
//--------------------------------------------------------------------
boc.ait.portal.PortalColumn = Ext.extend
//--------------------------------------------------------------------
(
  Ext.ux.PortalColumn,
  {
    // We are using our own portlet implemenation as default child object
    defaultType: 'boc-portlet'
  }
);
// Register the portal column's xtype
Ext.reg('boc-portalcolumn', boc.ait.portal.PortalColumn);