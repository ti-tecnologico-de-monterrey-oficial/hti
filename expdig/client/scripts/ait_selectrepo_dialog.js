/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.SelectRepoDialog class.
**********************************************************************
*/
Ext.namespace ("boc.ait");

boc.ait.SelectRepoDialog = function (aConfig)
{
  aConfig = aConfig || {};
  
  

  var m_aRepoList = new boc.ait.util.ListBox
  (
    {
      data: aConfig.repos,
      disabled:true,
      fields:
      [
        {name:'text'},
        {name:'id'},
        {name:'libId'},
        {name:'libName'}
      ],
      anchor:'100% 100%',
      selModel: new Ext.tree.DefaultSelectionModel (),
      selection: [0]
    }
  );
  var m_aOkButton = new Ext.Button
                      (
                        {
                          text: getString("ait_ok"),
                          minWidth: 80,
                          disabled: true,
                          handler: function ()
                          {
                            this._onOk(m_aRepoList.getSelectedElements()[0].data);
                          },
                          scope: this
                        }
                      );

  var m_aScope = aConfig.scope || this;
  aConfig.modal = true;
  aConfig.minWidth = aConfig.width = 400;
  aConfig.minHeight = aConfig.height = 300;
  aConfig.title = getStandardTitle();
  aConfig.tbar = [getString("ait_choose_repository")];
  aConfig.layout = 'anchor';
  aConfig.constrainHeader = true;
  aConfig.keys = new Ext.KeyMap
    (
      document,
      {
        key: Ext.EventObject.ENTER,
        fn: function ()
          {
            var aSel = m_aRepoList.getSelectedElements ();
            if (aSel.length > 0)
            {
              this._onOk(aSel[0].data);
            }
          },
        scope: this
      }
    );
  aConfig.buttons =
  [
    m_aOkButton,
    new Ext.Button
    (
      {
        text: getString('ait_cancel'),
        minWidth: 80,
        handler: function ()
        {
          this.close ();
        },
        scope: this
      }
    )
  ];
  
  m_aRepoList.on("rowdblclick", function (aGrid, nRowIndex, aEvent)
    {
      var aRecord = aGrid.getStore().getAt (nRowIndex);
      aConfig.okCallBack.call (this, aRecord.data);
    },
    this
  );

  m_aRepoList.on("rowselect", function (nRowIndex, aRecord)
    {
      m_aOkButton.enable ();
    }
  );

  m_aRepoList.on("rowdeselect", function (nRowIndex, aRecord)
    {
      if (m_aRepoList.getSelectedElements().length === 0)
      {
        m_aOkButton.disable ();
      }
    }
  );


  aConfig.items = [m_aRepoList];

  boc.ait.SelectRepoDialog.superclass.constructor.call (this, aConfig);



  this.on("afterlayout", function (aWin)
    {
      //m_aRepoList.selectAtIndex (0);
      //m_aRepoList.doLayout ();
    }
  );

  this._onOk = function (aRepoData)
  {
    if (typeof aConfig.okCallBack === "function")
    {
      aConfig.okCallBack.call (m_aScope, aRepoData);
    }
  };
};

Ext.extend
(
  boc.ait.SelectRepoDialog,
  Ext.Window,
  {}
);