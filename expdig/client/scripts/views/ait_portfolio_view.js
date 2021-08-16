/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2009\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2009
**********************************************************************
\author MWh
This file contains the code for the boc.ait.views.PortfolioView class.
**********************************************************************
*/

// Create namespace boc.ait.views
Ext.namespace('boc.ait.views');


/*
    Implementation of the class boc.ait.views.PortfolioView. This shows
    a Portfolio based on the selected objects in the object tree.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.views.PortfolioView = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  var that = this;

  // The name of the configuration for the portfolio view
  var sConfigID = null;
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
      // Get the passed scope for the callback functions. If no scope was provided, use
      // this as scope
      var aScope = aConfig.scope || this;

      // As failure callback for the config window we use the passed failure callback or -
      // if none was provided - an empty function
      var aFailureCallback = aConfig.failure || Ext.emptyFn;
      var nArtType = -1;

      var aArtefacts = aConfig.artefacts;

      // Create an application test data object so that only configurations applicable
      // for our modeltype are returned
      var aAppTestData =
      {
        type: aArtefacts[0].get("artefactType")
      };



      aConfig.artefactInfo =
      {
        artefactType: aArtefacts[0].get("artefactType")
      }

      if (aAppTestData.type === AIT_ARTEFACT_DIAGRAM)
      {
        aAppTestData.classID = aArtefacts[0].get("classId");
        aConfig.artefactInfo.artefactId = aConfig.artefactId = aArtefacts[0].get("id");
      }
      else
      {
        var aClassIDs = [];
        aConfig.artefactInfo.artefactIds = [];
        for (var i = 0; i < aArtefacts.length;++i)
        {
          aClassIDs[i] = aArtefacts[i].get("classId");
          aConfig.artefactInfo.artefactIds[i] = aArtefacts[i].get("id");
        }
        aAppTestData.classIDs = aClassIDs;

      }

      aConfig.configurable = true;
      aConfig.noConfigsText = getString("ait_no_portfolio_configs_text");
      aConfig.configId = PORTFOLIO_VIEW_ID;
      aConfig.appTestData = aAppTestData;
      aConfig.viewId = Ext.id();

      aConfig.viewType = "portfolio";
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  }

    // Call to the constructor function to build the object
  buildObject();
  // Call the Portfolio view's super class
  boc.ait.views.PortfolioView.superclass.constructor.call(that, aConfig);
}

// boc.ait.views.PortfolioView is derived from boc.ait.views.GraphicalView
Ext.extend
(
  boc.ait.views.PortfolioView,
  boc.ait.views.GraphicalView,
  {
  }
);

// Register the portfolio view's xtype
Ext.reg("boc-portfolioview", boc.ait.views.GraphicalView);