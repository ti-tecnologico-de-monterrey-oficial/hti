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
  // private members:

  var m_aSelMod = new boc.ait.util.CheckboxSelectionModel
  (
    {
      header:"<div>&#160;</div>",
      id :'checkerCol',
      width : 30
    }
  );

  var m_aSelAllButton = new Ext.Button
  (
    {
      width:"100px",
      text:"Select All",
      minWidth:80,
      handler: function ()
      {
        m_aSelMod.selectAll();
      }
    }
  );

  var m_aUnSelAllButton = new Ext.Button
  (
    {
      width:"100px",
      text:"Select None",
      minWidth:80,
      handler: function ()
      {
        m_aSelMod.clearSelections ();
      }
    }
  );

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
        {name:"_is_leaf"}
      ],
      columns:
      [
        m_aSelMod,
        {id:'text', header:'Text', sortable: true, dataIndex: 'text'},
      ],
      data:
      [
        {"id":"bla","text":"dummdi", _is_leaf:true},
        {"id":"bla1","text":"dummdi2", _is_leaf:true},
      ],
      buttons:
      [
        m_aSelAllButton,
        m_aUnSelAllButton
      ]
    }
  );


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

  var m_aMainPanel = new Ext.Panel
  (
    {
      layout:"fit",
      bodyStyle:"background-color:transparent;border:0px solid",
      style:"background-color:transparent;border:0px solid;margin-bottom:5px;padding-bottom:5px;",
      items:
      [
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
                  html:getString("ait_unsaved_changes")
                }
              ],
              style:"margin-top:10px;margin-bottom:10px",
              //html:
              cls:"ext-mb-content"
            }
          }
        ),
        new Ext.form.Label
        (
          {
            text:"List of unsaved tabs:",
            style:"border:0px solid;"
          }
        ),
        m_aListPanel,
        new Ext.form.Label
        (
          {
            style:"margin-top:10px;margin-bottom:10px;padding-bottom:10px;border:0px solid;",
            text:"Click on the \"Continue\" button in order to save selected tabs."
          }
        )
      ]
    }
  );

  aConfig.width = 400;
      //height:400,
  aConfig.resizable = false;
  aConfig.style = "background-color:transparent;";
  aConfig.bodyStyle = "background-color:transparent;";
  aConfig.modal = true;

      //layout:"fit",
  aConfig.items =
  [
    m_aMainPanel
  ];
  aConfig.buttons =
  [
    {
      text: "Continue",
      minWidth:80,
      handler :function ()
      {
        this.ownerCt.close();
      }
    },
    {
      text:"Cancel",
      minWidth:80,
      handler:function ()
      {
        this.ownerCt.close();
      }
    }
  ];

  boc.ait.UnsavedTabsDialog.superclass.constructor.call (this, aConfig);
};

Ext.extend
(
  boc.ait.UnsavedTabsDialog,
  Ext.Window,
  {}
);