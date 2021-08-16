/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2010\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2010
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.ComplexAttrTable class.

**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.ComplexAttrTable. This class
    is used for showing record attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.ComplexAttrTable = function (aConfig)
//--------------------------------------------------------------------
{
  /*
      Private function that is called when the record is rendered.
      Adds css classes to the record's header and body
      \param aCmp The rendered component
  */
  //--------------------------------------------------------------------
  var onRender = function (aCmp)
  //--------------------------------------------------------------------
  {
    try
    {
      // In IE make sure that the record uses the available space
      if (Ext.isIE)
      {
        aCmp.el.addClass("boc-notebook-field");

        if (aCmp.header)
        {
          aCmp.header.addClass("boc-notebook-field");
        }
      }
      if (aCmp.header)
      {
        // Add a class to the record's header
        aCmp.header.addClass("boc-notebook-group");
      }

      /*var aOwner = that.ownerCt;
      while (aOwner != null)
      {
        if (aOwner.collapsible)
        {
          aOwner.on("expand", function ()
            {
              that.field.view.refresh ();
            }
          );
          break;
        }
        aOwner = aOwner.ownerCt;
      }*/

      if (that.data.editable)
      {
        new Ext.ToolTip
        (
          {
            target: aCmp.getView().mainBody,
            autoHide:true,
            showDelay: 1000,
            trackMouse:true,
            html: getString("ait_grid_edit_tooltip")
          }
        );
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  function doAfterRowModify ()
  {
    if (this.m_aAddButton)
    {
      this.m_aAddButton.enable ();
    }
    if (this.m_aRemoveButton && this.field.getSelectionModel().getSelectedCell())
    {
      this.m_aRemoveButton.enable ();
    }
    this.el.unmask();
  }

  function doBeforeRowModify ()
  {
    if (this.m_aAddButton)
    {
      this.m_aAddButton.disable ();
    }
    if (this.m_aRemoveButton)
    {
      this.m_aRemoveButton.disable ();
    }
    this.el.mask(getString("ait_loading"), 'x-mask-loading');
  }


  Ext.apply (this, aConfig);

  var that = this;

  aConfig.autoScroll = true;
  aConfig.autoWidth = true;
  aConfig.fieldConf.autoHeight= true;
  aConfig.fieldConf.header = false;
  aConfig.fieldConf.bodyStyle = "padding:0px;";


  var m_bEditable = aConfig.editable !== false && this.data.editable;
  aConfig.hideTBar = aConfig.header === false;

  aConfig.fieldClass = Ext.grid.EditorGridPanel;

  aConfig.autoScroll = true;
  aConfig.autoWidth = true;
  aConfig.fieldConf.autoHeight= true;
  aConfig.fieldConf.header = false;
  aConfig.fieldConf.bodyStyle = "padding:0px;";
  aConfig.fieldConf.stripeRows = true;


  if ((typeof this.notebook) !== "undefined")
  {
    aConfig.fieldConf.disabled = !that.notebook.isEditable();
  }
  else
  {
    aConfig.fieldConf.disabled = !m_bEditable;
  }



  aConfig.fieldConf.listeners = aConfig.fieldConf.listeners || {};

  aConfig.fieldConf.listeners.scope = aConfig.fieldConf.listeners.scope || this;

  aConfig.fieldConf.listeners.render = aConfig.fieldConf.listeners.render || onRender;

  aConfig.fieldConf.listeners.beforeEdit = aConfig.fieldConf.listeners.beforeEdit || function (aParams)
  {
    // Don't allow editing if the record is not editable
    if (!this.data.editable)
    {
      return false;
    }
    return true;
  };


  // Use form layout
  aConfig.fieldConf.layout = "form";
  aConfig.fieldConf.cls = "boc-notebook-field";
  aConfig.fieldConf.title = this.data.classname;

  aConfig.fieldConf.sm = aConfig.fieldConf.sm || new Ext.grid.CellSelectionModel ();
  aConfig.fieldConf.sm.on("selectionchange", function (aSM, aSelection)
    {
      if (this.m_aRemoveButton)
      {
        if (aSelection != null)
        {
          this.m_aRemoveButton.enable();
        }
        else
        {
          this.m_aRemoveButton.disable();
        }
      }
    },
    this
  );

  // Do not mask the field if it is disabled - this causes IE not to show the field at all
  aConfig.fieldConf.maskDisabled = false;

  var m_aColumns = aConfig.fieldConf.columns;

  var m_aRowTemplate = Ext.data.Record.create
  (
    m_aColumns
  );

  if (!aConfig.showTBar)
  {
    var aToolbarItems = [{xtype: 'tbfill'}];
    if (m_bEditable)
    {
      this.m_aAddButton = new Ext.Toolbar.Button
      (
        {
          iconCls: 'ait_add_relation',
          tooltip: getString('ait_add_record_row'),
          handler: function ()
          {
            var bEx = false;
            try
            {
              var aRow = new m_aRowTemplate ({});
              var sRowID = Ext.id();
              var aValueRow =
              {
                values:[],
                modified:true,
                id: sRowID
              };

              for (var i = 0; i < m_aColumns.length;++i)
              {
                if (m_aColumns[i].defaultValue)
                {
                  aRow.set(m_aColumns[i].id, m_aColumns[i].defaultValue.value.value);
                  aValueRow.values[i] = {value:m_aColumns[i].defaultValue.value.value};
                }
              }
              this.value.rows[this.value.rows.length] = aValueRow;

              aRow.set("id", sRowID);
              this.field.store.add (aRow);
              this.field.store.commitChanges();
              this.setHeight (100 + this.field.store.getCount()*21);

              boc.ait.notebook.ComplexAttrTable.superclass.valueChange.call (this, this.value);
              doAfterRowModify.call (this);
            }
            catch (aEx)
            {
              bEx = true;
              throw aEx;
            }
            finally
            {
              if (bEx)
              {
                doAfterRowModify.call (this);
              }
            }
          },
          scope: this
        }
      );

      this.m_aRemoveButton = new Ext.Toolbar.Button
      (
        {
          iconCls: 'ait_remove_relation',
          tooltip: getString('ait_remove_record_row'),
          disabled: true,
          handler: function ()
          {
            var bEx = false;
            try
            {
              doBeforeRowModify.call (this);
              var aSelCell = this.field.getSelectionModel().getSelectedCell();
              var nRowIndex = aSelCell[0];
              var nColIndex = aSelCell[1];
              var aRecord = this.field.store.getAt (nRowIndex);

              for (var i = 0; i < this.value.rows.length;++i)
              {
                var aRowObj = this.value.rows[i];
                if (aRowObj.id == aRecord.get("id"))
                {
                  if (aRowObj.modified === true)
                  {
                    this.value.rows.splice(i, 1);
                    --i;
                  }
                  else
                  {
                    delete aRowObj.modified;
                    aRowObj.deleted = true;
                  }
                }
              }
              this.field.store.remove (aRecord);
              this.setHeight (100 + this.field.store.getCount()*21);
              if (this.field.store.getCount() > nRowIndex)
              {
                this.field.getSelectionModel().select (nRowIndex, nColIndex);
              }
              else if (this.field.store.getCount () != 0)
              {
                this.field.getSelectionModel().select (nRowIndex-1, nColIndex);
              }

              boc.ait.notebook.ComplexAttrTable.superclass.valueChange.call (this, this.value);
              doAfterRowModify.call (this);
            }
            catch (aEx)
            {
              bEx = true;
              throw aEx;
            }
            finally
            {
              if (bEx)
              {
                doAfterRowModify.call (this);
              }
            }
          },
          scope: this
        }
      )

      if (this.data.editable)
      {
        aToolbarItems [aToolbarItems.length] = this.m_aAddButton;
        aToolbarItems [aToolbarItems.length] = this.m_aRemoveButton;
      }
    }
    aConfig.tbarConfig = aToolbarItems;
  }


  // Make sure the grid contents always fits the screen
  aConfig.fieldConf.viewConfig =
  {
    forceFit: true
  }

  // Call the superclass' constructor
  boc.ait.notebook.ComplexAttrTable.superclass.constructor.call (this, aConfig);
};

// boc.ait.notebook.ComplexAttrTable is a notebook field
Ext.extend
(
  boc.ait.notebook.ComplexAttrTable,
  boc.ait.notebook.Field,
  {}
);