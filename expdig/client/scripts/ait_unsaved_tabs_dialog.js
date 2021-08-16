/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.UnsavedTabsDialog class that
is shown when unsaved tabs are closed
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait');

/*
    Implementation of the class boc.ait.UnsavedTabsDialog.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.UnsavedTabsDialog = function (aConfig)
//--------------------------------------------------------------------
{
  aConfig = aConfig || {};

  var that = this;

  // private members:

  /*
    Private function that renders the name column
    \param sValue The value to render
    \param aMetadata Metadata for the cell
    \param aRecord The record for the current row.
  */
  //--------------------------------------------------------------------
  this._renderName = aConfig.renderName || function (sVal, aMetadata, aRecord)
  //--------------------------------------------------------------------
  {
    return sVal;
  };

  /*
    Private function that renders the icon column
    \param sValue The value to render
    \param aMetadata Metadata for the cell
    \param aRecord The record for the current row.
  */
  //--------------------------------------------------------------------
  var renderIcon = function (sVal, aMetadata, aRecord)
  //--------------------------------------------------------------------
  {
    // Use the blank image url as the standard overlay for the modeltype, folder or class icon
    var sSrc = Ext.BLANK_IMAGE_URL;
    // If the current record is not editable, we want to overlay its icon with a lock
    if (!aRecord.data.editable && !g_aSettings.offline)
    {
    //  sSrc = 'images/lock.gif';
    }

    // Render leaf nodes
    aMetadata.attr="style='background:url("+aRecord.data.iconUrl+") center center transparent no-repeat;'";

    return "<span style='background:url("+sSrc+") 6px center transparent no-repeat;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>";
  };


  // Store the data to display
  var m_aData = aConfig.data;

  // Create an instance of the checkbox selection model
  var m_aSelMod = new boc.ait.util.CheckboxSelectionModel
  (
    {
      header:"<div>&#160;</div>",
      id :'checkerCol',
      width : 30
    }
  );

  // A button that allows selecting all entries in the box
  var m_aSelAllButton = new Ext.Button
  (
    {
      width:"100px",
      text: getString("ait_select_all"),
      minWidth:80,
      /*
        Anonymous function that selects all entries in the selection model
      */
      //--------------------------------------------------------------------
      handler: function ()
      //--------------------------------------------------------------------
      {
        m_aSelMod.selectAll();
      }
    }
  );

  // A button that allows deselecting all entries in the box
  var m_aUnSelAllButton = new Ext.Button
  (
    {
      width:"100px",
      text: getString("ait_select_none"),
      minWidth:80,
      /*
        Anonymous function that deselects all entries in the selection model
      */
      //--------------------------------------------------------------------
      handler: function ()
      //--------------------------------------------------------------------
      {
        m_aSelMod.clearSelections ();
      }
    }
  );
  
  // A listbox that shows all unsaved tabs
  var m_aTabList = new boc.ait.util.ListBox
  (
    {
      sm: m_aSelMod,
      ctCls:"ait_unsaved_tabs_list",
      columnWidth:1.0,
      fields:
      [
        {name:"id"},
        {name:"text"},
        {name:"_is_leaf"},
        {name:"idClass_lang"},
        {name:"iconUrl"},
      ],
      // Show the checkbox column, the icon and the name of the tab
      columns:
      [
        m_aSelMod,
        {
          id: "idClass_lang",
          header: getString("ait_search_result_type"),
          sortable: true,
          dataIndex: "idClass_lang",
          width:40,
          fixed: true,
          renderer: renderIcon,
          name: 'idClass_lang'
        },
        {
          id: "text",
          header: getString("ait_search_result_name"),
          sortable: true,
          dataIndex: "text",
          width: 75,
          renderer: that._renderName,
          name: "text"
        }
      ],
      data: m_aData,
      buttons:
      [
        m_aSelAllButton,
        m_aUnSelAllButton
      ]
    }
  );

  // A panel that holds the tablist
  var m_aListPanel = new Ext.Panel
  (
    {
      header:false,
      items:
      [
        m_aTabList
      ]
    }
  );

  // The main panel used in the window
  var m_aMainPanel = new Ext.Panel
  (
    {
      layout:"fit",
      bodyStyle:"background-color:transparent;border:0px solid",
      style:"background-color:transparent;border:0px solid;margin-bottom:5px;padding-bottom:5px;",
      items:
      [
        // A text describing the purpose of the dialog
        new Ext.BoxComponent
        (
          {
            autoWidth:true,
            autoHeight:true,
            autoEl:
            {
              tag:"div",
              children:
              [
                {
                  tag:"span",
                  cls:"ext-mb-text",
                  html: getString("ait_unsaved_changes")
                }
              ],
              style:"margin-top:10px;margin-bottom:10px",
              cls:"ext-mb-content"
            }
          }
        ),
        // A label for the tablist
        new Ext.form.Label
        (
          {
            text: getString("ait_unsaved_tabs_list"),
            style:"border:0px solid;"
          }
        ),
        // The panel holding the tablist
        m_aListPanel,
        // A label
        new Ext.form.Label
        (
          {
            style:"margin-top:10px;margin-bottom:10px;padding-bottom:10px;border:0px solid;",
            text: getString("ait_unsaved_tabs_continue")
          }
        )
      ]
    }
  );

  aConfig.width = 400;
  aConfig.resizable = false;
  aConfig.style = "background-color:transparent;";
  aConfig.bodyStyle = "background-color:transparent;";
  aConfig.modal = true;

  aConfig.items =
  [
    m_aMainPanel
  ];
  aConfig.buttons =
  [
    // The continue button
    {
      text: getString("ait_continue"),
      minWidth:80,
      /*
        Anonymous function that is called when the continue button is clicked
      */
      //--------------------------------------------------------------------
      handler :function ()
      //--------------------------------------------------------------------
      {
        // Close the button's owner (the dialog)
        this.ownerCt.ownerCt.close();

        // If there is a callback for the dialog, call it
        if (aConfig.callback)
        {
          var aScope = aConfig.scope || this.ownerCt;
          aConfig.callback.call (aScope, "continue", m_aSelMod.getSelections());
        }
      }
    },
    // The cancel button
    {
      text:getString("ait_cancel"),
      minWidth:80,
      /*
        Anonymous function that is called when the cancel button is clicked
      */
      //--------------------------------------------------------------------
      handler: function ()
      //--------------------------------------------------------------------
      {
        // Close the button's owner (the dialog)
        this.ownerCt.ownerCt.close();
        // If there is a callback for the dialog, call it
        if (aConfig.callback)
        {
          var aScope = aConfig.scope || this.ownerCt;
          aConfig.callback.call (aScope, "cancel", m_aSelMod.getSelections());
        }
      }
    }
  ];

  boc.ait.UnsavedTabsDialog.superclass.constructor.call (this, aConfig);
};

// The unsaved tabs dialog extends Ext.Window
Ext.extend
(
  boc.ait.UnsavedTabsDialog,
  Ext.Window,
  {}
);