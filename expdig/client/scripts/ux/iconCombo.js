/**
  * Ext.ux.IconCombo Extension Class for Ext 2.x Library
  *
  * @author  Ing. Jozef Sakalos
  * @version $Id: Ext.ux.IconCombo.js 617 2007-12-20 11:29:56Z jozo $
  *
  * @class Ext.ux.IconCombo
  * @extends Ext.form.ComboBox
  */
Ext.ux.IconCombo = Ext.extend(Ext.form.ComboBox,
{
    getIconPath: function ()
    {
      return boc.ait.getIconPath ();
    },
    initComponent:function()
    {
        Ext.apply
        (
          this,
          {
            tpl:  '<tpl for=".">'
                + '<div class="x-combo-list-item ux-icon-combo-item '
                + '" style="background-image:url('+this.getIconPath()+'{'+this.iconClsField+'});">'
                + '{' + this.displayField + '}'
                + '</div></tpl>'
          }
        );
        // call parent initComponent
        Ext.ux.IconCombo.superclass.initComponent.call(this);

    }, // end of function initComponent

    onRender:function(ct, position)
    {
      try
      {
        // call parent onRender
        Ext.ux.IconCombo.superclass.onRender.call(this, ct, position);
        // adjust styles
        this.wrap.applyStyles({position:'relative'});
        this.el.addClass('ux-icon-combo-input');
        // add div for icon
        this.icon = Ext.DomHelper.append
        (
          this.el.up('div.x-form-field-wrap'),
          {
            tag: 'div', style:'position:absolute'
          }
        );

      }
      catch (aEx)
      {
        displayErrorMessage (aEx);
      }
    }, // end of function onRender

    setIconCls:function() {
      try
      {
        var rec = this.store.query(this.valueField, this.getValue()).itemAt(0);
        if(rec)
        {
          this.icon.className = 'ux-icon-combo-icon';
          var sIconCls = rec.get(this.iconClsField);
          if (sIconCls)
          {
            this.icon.style.backgroundImage = "url("+this.getIconPath()+sIconCls+")";
          }
        }
      }
      catch (aEx)
      {
        displayErrorMessage ( aEx);
      }
    }, // end of function setIconCls

    setValue: function(value)
    {
        Ext.ux.IconCombo.superclass.setValue.call(this, value);
        this.setIconCls();
    } // end of function setValue
});

// register xtype
Ext.reg('iconcombo', Ext.ux.IconCombo);
