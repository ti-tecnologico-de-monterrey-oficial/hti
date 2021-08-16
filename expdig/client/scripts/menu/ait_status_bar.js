/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.menu.Statusbar class.
**********************************************************************
*/

// Create namespace boc.ait.menu
Ext.namespace('boc.ait.menu');

/*
    Implementation of the class boc.ait.menu.Statusbar. This class is the menubar of the ADOit
    Web Client.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.menu.Statusbar = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  var m_aStatusField = null;
  var m_aZoomWidget = null;

  // Initialize the config object if necessary
  aConfig = aConfig || {};

  /*
      Private method that configures the current object. Serves as a constructor.
      HFA CR #051001 adapt web client zoom to the rich client
      created zoom widget component in scripts/views/ait_zoom_widget.js
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    // Render the menubar to the document's body
    aConfig.height = 25;

    var sText = aConfig.text;
    if (Ext.isEmpty(sText) || sText === "")
    {
      sText = "&nbsp;";
    }

    // Create the status field
    m_aStatusField = new Ext.Toolbar.TextItem
    (
      {
        text:sText
      }
    );

    var aItemArr =
    [
      m_aStatusField,
      {xtype: 'tbfill'}
    ];

    if (!g_aSettings.offline)
    {
      m_aZoomWidget = new boc.ait.views.ZoomWidget
      (
        {
          nZoomMaxValue: 200,
          nZoomMinValue: 1
        }
      );
      aItemArr = aItemArr.concat([m_aZoomWidget]);
    }
    aConfig.items = aItemArr;
  };

  // Call to the constructor function to build the object
  buildObject.call (this);

  // Call to the superclass' constructor
  boc.ait.menu.Statusbar.superclass.constructor.call(this, aConfig);


  /*
    Sets the contents of the status field

    \param sStatusText The text that will be shown in the status field
  */
  //--------------------------------------------------------------------
  this._setStatus = function (sStatusText)
  //--------------------------------------------------------------------
  {
    m_aStatusField.setText (boc.ait.htmlEncode (sStatusText));
  };

  /*
    Retrieves the zoom slider

    \retval The zoom slider widget
  */
  //--------------------------------------------------------------------
  this._getZoomSlider = function ()
  //--------------------------------------------------------------------
  {
//    return m_aSlider;
    return m_aZoomWidget.getSlider();
  };

  /*
    Hides the zoom slider widget.
  */
  //--------------------------------------------------------------------
  this._hideZoomSlider = function ()
  //--------------------------------------------------------------------
  {
    if (g_aSettings.offline)
    {
      return;
    }
    m_aZoomWidget.hideWidget();
  };

  /*
    Shows the zoom slider and reconfigures it using the passed zoom information

    \param aZoomInfo An object containing the following members:
        - scale The value the slider should be set to
        - maxScale The maximum scale for the slider
        - minScale The minimum scale for the slider
  */
  //--------------------------------------------------------------------
  this._showZoomSlider = function (aZoomInfo)
  //--------------------------------------------------------------------
  {
    if (g_aSettings.offline)
    {
      return;
    }
    m_aZoomWidget.showWidget(aZoomInfo);
    this.doLayout ();
  };
};

// boc.ait.menu.Statusbar is derived from Ext.Toolbar
Ext.extend
(
  boc.ait.menu.Statusbar,
  Ext.Toolbar,
  {
    // public members
    /*
      Sets the contents of the status field

      \param sStatusText The text that will be shown in the status field
    */
    //--------------------------------------------------------------------
    setStatus : function (sStatusText)
    //--------------------------------------------------------------------
    {
      checkParam (sStatusText, "string");

      this._setStatus (sStatusText);
    },

    /*
      Retrieves the zoom slider

      \retval The zoom slider widget
    */
    //--------------------------------------------------------------------
    getZoomSlider : function ()
    //--------------------------------------------------------------------
    {
      return this._getZoomSlider ();
    },

    /*
      Shows the zoom slider and reconfigures it using the passed zoom information

      \param aZoomInfo An object containing the following members:
          - scale The value the slider should be set to
          - maxScale The maximum scale for the slider
          - minScale The minimum scale for the slider
    */
    //--------------------------------------------------------------------
    showZoomSlider : function (aZoomInfo)
    //--------------------------------------------------------------------
    {
      checkParam (aZoomInfo, "object");

      this._showZoomSlider (aZoomInfo);
    },

    /*
      Hides the zoom slider widget.
    */
    //--------------------------------------------------------------------
    hideZoomSlider : function ()
    //--------------------------------------------------------------------
    {
      this._hideZoomSlider ();
    }
  }
);
// Register the menubar's xtype
Ext.reg("boc-statusbar", boc.ait.menu.Statusbar);