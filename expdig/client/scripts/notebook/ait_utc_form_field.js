Ext.namespace ("boc.ait.notebook");

boc.ait.notebook.FormUTCField = function (aConfig)
{

  boc.ait.notebook.FormUTCField.superclass.constructor.call (this, aConfig);
}

Ext.extend
(
  boc.ait.notebook.FormUTCField,
  Ext.form.DateField,
  {
    setValue : function (aVal)
    {
      if (aVal === null)
      {
        aVal = 0;
      }

      if (typeof aVal == "number")
      {
        var aDate = new Date ();
        aDate.setTime (aVal);
        aVal = aDate;
      }
      boc.ait.notebook.FormUTCField.superclass.setValue.call (this, aVal);
    }
  }
);
