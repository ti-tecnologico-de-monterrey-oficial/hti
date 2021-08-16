Ext.ux.MyFill = function(tValue)
{
  Ext.ux.MyFill.superclass.constructor.call(this);
  var value = tValue;
  this.render = function(td)
  {
    if(Ext.isIE)
    {
      td.style.cssText = value;
    }
    else
    {
      td.setAttribute('style',value);
    }
  }
}
Ext.extend(Ext.ux.MyFill, Ext.Toolbar.Spacer);