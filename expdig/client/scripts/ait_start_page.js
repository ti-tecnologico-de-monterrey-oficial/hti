/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.StartPage class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');


/*
    Implementation of the class boc.ait.StartPage. This class contains the startpage
    of the web client
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.StartPage = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  aConfig = aConfig || {};
  var m_aPortalColumns = [];


  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    try
    {
      // Set the startpage's title
      aConfig.title = aConfig.title || getString("ait_startpage_title");
      aConfig.iconUrl = "images/start/home.png";
      
      aConfig.plugins = [boc.ait.plugins.Customizable];
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };


  /*
      Protected method that adds a portlet to the startpage

      \param aPortlet The portlet to add
      \param nColumn The index of the column in which to add the portlet
  */
  //--------------------------------------------------------------------
  this._addPortlet = function (aPortlet, nColumn)
  //--------------------------------------------------------------------
  {
    // Try to retrieve the column at the desired position
    var aPortalCol = m_aPortalColumns[nColumn];
    // If there is no column there, create a new one
    if (!aPortalCol)
    {
      // Set the column index to the next index in the columns array
      nColumn = m_aPortalColumns.length;
      // The width of all columns should be 1 divided by the number of columns
      var nColWidth = 1/(nColumn+1);
      // Create the new column
      var aNewPortalCol = new boc.ait.portal.PortalColumn
      (
        {
          //style:'padding:10px 0 10px 10px'
        }
      );
      // Add the column
      this.add(aNewPortalCol);
      m_aPortalColumns[nColumn] = aNewPortalCol;

      // Set the width for the columns
      for (var i = 0; i < m_aPortalColumns.length;++i)
      {
        m_aPortalColumns[i].columnWidth = nColWidth;
      }

      aPortalCol = m_aPortalColumns[nColumn];
    }

    // Add the new portlet
    aPortalCol.add (aPortlet);
    // Redo the layout
    this.doLayout();
  };

  // Call to the constructor function to build the object
  buildObject();

  // Call to the superclass' constructor
  boc.ait.StartPage.superclass.constructor.call(this, aConfig);
};

// The startpage is derived from the boc.ait.portal.Portal class
Ext.extend
(
  boc.ait.StartPage,
  boc.ait.portal.Portal,
  {

    /*
        Public method that adds a portlet to the startpage

        \param aPortlet The portlet to add
        \param nColumn The index of the column in which to add the portlet
    */
    //--------------------------------------------------------------------
    addPortlet: function (aPortlet, nColumn)
    //--------------------------------------------------------------------
    {
      //checkParam (aPortlet, boc.ait.portal.Portlet);
      checkParam (nColumn, "number");

      this._addPortlet(aPortlet, nColumn);
    }
  }
);

// Register the startpage's xtype
Ext.reg("boc-startpage", boc.ait.StartPage);