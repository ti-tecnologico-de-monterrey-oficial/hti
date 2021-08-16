/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.util.CheckboxSelectionModel class.
**********************************************************************
*/

// Create namespace boc.ait
Ext.namespace('boc.ait.util');


/*
    Implementation of the class boc.ait.util.CheckboxSelectionModel.
    This class modifies the checkboxselectionmodel in Ext.grid
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.util.CheckboxSelectionModel = function (aConfig)
//--------------------------------------------------------------------
{
  aConfig = aConfig || {};
  if (aConfig.header && aConfig.header !== '<div class="x-grid3-hd-checker">&#160;</div>')
  {
    aConfig.id = 'checkerCol';
    aConfig.width = 30;
  }

  // Call to the superclass' constructor
  boc.ait.util.CheckboxSelectionModel.superclass.constructor.call(this, aConfig);
};

// boc.ait.util.CheckboxSelectionModel is derived from Ext.grid.CheckboxSelectionModel
Ext.extend
(
  boc.ait.util.CheckboxSelectionModel,
  Ext.grid.CheckboxSelectionModel,
  {
    onMouseDown : function(e, t)
    {
      //alert(e.button + " : " + t.className);
      if(e.button === 0 && t.className == 'x-grid3-row-checker' || t.className === "x-grid3-col-checkerCol")
      { // Only fire if left-click
        e.stopEvent();
        var row = e.getTarget('.x-grid3-row');
        //alert(row);
        if(row)
        {
          var index = row.rowIndex;
          if(this.isSelected(index))
          {
            //alert("deselect");
            this.deselectRow(index);
          }
          else
          {
            //alert("select");
            this.selectRow(index, true);
          }
        }
      }
    },

    // private
    onHdMouseDown : function(e, t)
    {
      if(t.className == 'x-grid3-hd-checker')
      {
        e.stopEvent();
        var hd = Ext.fly(t.parentNode);
        var isChecked = hd.hasClass('x-grid3-hd-checker-on');
        if(isChecked)
        {
          hd.removeClass('x-grid3-hd-checker-on');
          this.clearSelections();
        }
        else
        {
          hd.addClass('x-grid3-hd-checker-on');
          this.selectAll();
        }
      }
    },

    selectRow : function(index, keepExisting, preventViewNotify)
    {
      if(this.isLocked() || (index < 0 || index >= this.grid.store.getCount()) )
      {
        return;
      }

      var r = this.grid.store.getAt(index);
      if (typeof this.selectCallback === "function" && !this.selectCallback.call(this, r))
      {
        return;
      }
      if(r && this.fireEvent("beforerowselect", this, index, keepExisting, r) !== false)
      {
        if (!r.get("_is_leaf"))
        {
          return;
        }
        if(!keepExisting || this.singleSelect)
        {
          //this.clearSelections();
        }

        this.selections.add(r);
        this.last = this.lastActive = index;
        if(!preventViewNotify)
        {
          this.grid.getView().onRowSelect(index);
        }
        this.fireEvent("rowselect", this, index, r);
        this.fireEvent("selectionchange", this);
      }
    },

    // private
    handleMouseDown : function(g, rowIndex, e)
    {
      if(e.button !== 0 || this.isLocked())
      {
        return;
      }
      var view = this.grid.getView();
      if(e.shiftKey && !this.singleSelect && this.last !== false)
      {
        var last = this.last;
        this.selectRange(last, rowIndex, e.ctrlKey);
        this.last = last; // reset the last
        view.focusRow(rowIndex);
      }
      else
      {
        var isSelected = this.isSelected(rowIndex);
        if(isSelected)
        {
          this.deselectRow(rowIndex);
        }
        else if(!isSelected || this.getCount() > 1)
        {
          this.selectRow(rowIndex, e.ctrlKey || e.shiftKey);
          view.focusRow(rowIndex);
        }
      }
    },

    // private
    renderer : function(v, p, record)
    {
      if (record.get("_is_leaf"))
      {
        return '<div class="x-grid3-row-checker">&#160;</div>';
      }
      return "";
    }
  }
);