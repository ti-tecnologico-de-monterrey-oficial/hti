/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains JS functionality for the startup of the ADOit
WebClient.
**********************************************************************
*/

// Overwrite the blank image url for the tree. This normally points to an url in the domain www.extjs.com
Ext.BLANK_IMAGE_URL = 'ext-2.2/resources/images/default/s.gif';  // 2.0


try
{
  //Permit Local file access for IE.
  Ext.lib.Ajax.forceActiveX = (document.location.protocol == 'file:');
  //Set to a friendlier version for Iframes
  Ext.SSL_SECURE_URL= 'javascript:void(0)';
  Ext.Loader = new Ext.ux.ModuleManager
  (
    {
      disableCaching:true,

      modulePath:"http://localhost:8080/ADOitNP/scripts/dynamic/",
    }
  );
  Ext.Loader.on(
    {
      'beforeload':function(manager, module, response)
      {
        alert("?");
        //return false to prevent the script from being executed.
        return module.extension == 'js';
      },
      'loadexception':function(manager, module, ex)
      {
        alert('Failed to Load Module '+module.fullName+' Error: ' +
        (ex.error?ex.error.description||ex.error.message:ex));
      },
      'load':function()
      {
        alert('loaded');
      }
    }
  );

  Ext.require = Ext.Loader.load.createDelegate(Ext.Loader);


  // Define a handler for the Ext.onReady event
  Ext.onReady
  (
    function()
    {
      var panel = new Ext.Panel
      (
        {
          title: 'test',
          renderTo: Ext.getBody(),
          tools:
          [
            {
              id:'search'
            }
          ]
        }
      );

      Ext.require('testung.js');
      //now load MIFP and our demo script



    }
  );
}
catch (aEx)
{
  displayErrorMessage (aEx);
}

