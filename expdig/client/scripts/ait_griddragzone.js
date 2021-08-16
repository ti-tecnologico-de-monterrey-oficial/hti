/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.GridDragZone class.
**********************************************************************
*/

boc.ait.GridDragZone = function (aGrid, aConfig)
{
  boc.ait.GridDragZone.superclass.constructor.call(this, aGrid, aConfig);

  this._getParams = function ()
  {
    return aConfig.params;
  };
};

Ext.extend
(
  boc.ait.GridDragZone,
  Ext.grid.GridDragZone,
  {
    getDragData : function (aEvt)
    {
      var aRetObj = boc.ait.GridDragZone.superclass.getDragData.call (this, aEvt);
      if (aRetObj === false)
      {
        return aRetObj;
      }
      aRetObj.params = this.getParams ();
      return aRetObj;
    },

    getParams : function ()
    {
      return this._getParams ();
    }
  }
);