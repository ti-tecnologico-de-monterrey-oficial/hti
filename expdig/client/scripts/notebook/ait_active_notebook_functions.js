Ext.namespace ("ado.notebook.helpers");

ado.notebook.getElementById = function (sID)
{
  var aNB = g_aMain.getMainArea().getActiveTab ();
  var aContentPanel = null;
  if (!(aNB instanceof boc.ait.notebook.Notebook))
  {
    var aWin = Ext.WindowMgr.getActive();
    if (aWin)
    {
      aNB = aWin.originalPanel;

      aContentPanel = aWin;
    }


    if (!aContentPanel)
    {
      return null;
    }
  }
  else
  {
    aContentPanel = aNB;
  }

  var aRes = [];

  var aControls = aNB.getControls();
  var aCtrl = null;
  for (var i = 0; i < aControls.length;++i)
  {
    var aCurCtrl = aControls[i];

    if (aCurCtrl.props && aCurCtrl.props.dom_id === sID)
    {
      aCtrl = aCurCtrl;
      break;
    }
  }
  if (!aCtrl)
  {
    return null;
  }

  ado.notebook.helpers.enrichElement (aCtrl, aNB.isEditMode());
  return aNB.isEditMode() ? aCtrl : aCtrl.readModeControl;
}


ado.notebook.helpers.enrichElement = function (aElement, bEditMode)
{
  if (bEditMode)
  {
    aElement.getValue = function ()
    {
      return aElement.value;
    }
  }
  else
  {
    aElement.readModeControl.hide = function ()
    {
      aElement.readModeControl.style.display = "none";
    }
    aElement.readModeControl.show = function ()
    {
      aElement.readModeControl.style.display = "";
    }

    aElement.readModeControl.disable = Ext.emptyFn;
    aElement.readModeControl.enable = Ext.emptyFn;

    aElement.readModeControl.getValue = function ()
    {
      return aElement.value;
    }

    aElement.readModeControl.getValueAsJS = function ()
    {
      return aElement.getValueAsJS ();
    }

    aElement.readModeControl.setValue = function (aVal)
    {
      return aElement.setValue (aVal);
    }

    aElement.readModeControl.setValueAsJS = function (aVal)
    {
      return aElement.setValueAsJS (aVal);
    }
  }
}