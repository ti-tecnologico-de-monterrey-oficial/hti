/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.views.BIAView class.
**********************************************************************
*/

// Create namespace boc.ait.views
Ext.namespace('boc.ait.views');


/*
    Implementation of the class boc.ait.views.BIAView. This shows
    a BIA based on the selected objects in the object tree.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.views.BIAView = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  var that = this;

  // Initialize the config object if necessary
  aConfig = aConfig || {};

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    try
    {
      var aClassIDs = [];
      var aIDs = [];

      // Iterate through the artefacts and get their ids as well as the ids of the
      // classes they are instantiated from
      for (var i = 0; i < aConfig.artefacts.length;++i)
      {
        aClassIDs[i] = aConfig.artefacts[i].get("classId");
        aIDs[i] = aConfig.artefacts[i].get("id");
      }

      // Create an application test data object so that we only get configurations
      // that are applicable for our artefacts
      var aAppTestData =
      (
        {
          classIDs: aClassIDs
        }
      );


      aConfig.appTestData = aAppTestData;
      aConfig.configId = BIA_VIEW_ID;
      aConfig.configurable = true;
      aConfig.noConfigsText = getString("ait_no_bia_configs_text");
      aConfig.viewType = "bia";
      aConfig.webMethod = "bia";
      aConfig.artefactInfo =
      {
        artefactType: AIT_ARTEFACT_OBJECT,
        artefactIds: aIDs
      };

      // Call the bia view's super class
      boc.ait.views.BIAView.superclass.constructor.call(that, aConfig);
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

    // Call to the constructor function to build the object
  buildObject();
};

// boc.ait.views.BIAView is derived from boc.ait.views.GraphicalView
Ext.extend
(
  boc.ait.views.BIAView,
  boc.ait.views.GraphicalView,
  {
  }
);

// Register the bia view's xtype
Ext.reg("boc-biaview", boc.ait.views.BIAView);