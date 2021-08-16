/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2010\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2010
**********************************************************************
\author MWh
This file contains the code of the boc.ait.plugins.Customizable plugin.
**********************************************************************
*/

Ext.namespace("boc.ait.plugins");

// The Customizable plugin goes through all the overlays defined
// for a class and calls them
boc.ait.plugins.Customizable =
{

  /*
    Function that is called when the object that includes this plugin was created.
    \param aCmp The object that was created.
  */
  //--------------------------------------------------------------------
  init: function (aCmp)
  //--------------------------------------------------------------------
  {
    checkParam (aCmp, "object");
    // Check if overlays were defined for this class
    if (Ext.isArray (aCmp.overlayingFns))
    {
      // Iterate through the overlays and execute them.
      for (var i = 0; i < aCmp.overlayingFns.length;++i)
      {
        var aFnObj = aCmp.overlayingFns[i];
        if (typeof aFnObj.fn == "function")
        {
          var aScope = aFnObj.scope || aCmp;
          aFnObj.fn.apply (aScope, [aCmp]);
        }
      }
    }
  }
}