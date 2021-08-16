/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2016\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2016
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.FilePointerField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.FilePointerField. This class
    is used for showing file pointer attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.FilePointerField = function (aConfig)
//--------------------------------------------------------------------
{
  var that = this;
  Ext.apply (this, aConfig);

  var m_aInnerField = null;
  var m_aFileInput = null;
  var m_aTextInput = null;
  var bFileSelectionOpen = false;

  /*
      Private method that is called when the field value's validity was checked
      \param aField The checked field
  */
  //--------------------------------------------------------------------
  var onValid = function (aField)
  //--------------------------------------------------------------------
  {
    if (m_sOriginalValue != aField.getValue())
    {
      this.value = aField.getValue();
      this.valueChange ({program: this.data.value.val.program, parameter: this.value});
    }
  };

  aConfig.fieldConf = aConfig.fieldConf ||
  {
    cls: "boc-notebook-field boc-notebook-singlelinefield"
  };

  aConfig.fieldConf.enableKeyEvents = true;
  aConfig.fieldConf.listeners = aConfig.fieldConf.listeners || {};
  aConfig.fieldConf.listeners =
  {
    valid: onValid,
    scope: this
  };

  var m_sOriginalValue = null;
  this.value = m_sOriginalValue = this.data.value.val.parameter;

  if (!Ext.isGecko)
  {
    aConfig.fieldClass = aConfig.fieldClass || Ext.BoxComponent;
    aConfig.fieldConf.autoEl =
    {
      tag:'div',
      id:'fileinputdiv',
      children:
      [
        {
          tag:'input',
          id:'fileinput',
          type: 'file',
          style: "width:100%"
        },
        {
          tag:'input',
          id:'text',
          cls: 'x-form-text x-form-field',
          type:'text',
          style:"position:absolute;left:0px;z-index:2;",
          value: this.value
        }
      ]
    };
  }
  else
  {
    aConfig.fieldClass = aConfig.fieldClass || Ext.form.TextField;
    aConfig.fieldConf.value = this.value;
  }

  aConfig.bodyStyle = "border:0px;padding-left:0px;padding-top:0px;padding-right:0px;padding-bottom:8px;";


  aConfig.tbarConfig =  [
                          {xtype: 'tbfill'},
                          new Ext.Toolbar.Button
                          (
                            {
                              iconCls: 'ait_follow_relation',
                              tooltip: getString('ait_follow_file_pointer'),
                              handler: function ()
                              {
                                boc.ait.openFile(that.value);
                              }
                            }
                          )
                        ];
  aConfig.fieldConf.listeners.render = aConfig.fieldConf.listeners.render ||
      function (aBox)
      {
        //aBox.getEl().dom.parentNode.style.paddingRight = "6pt";
        that.notebook.on("save", function ()
          {
            m_sOriginalValue = that.value;
          }
        );

        m_aFileInput = Ext.DomQuery.selectNode("input[type=file]", this.field.getEl().dom);
        m_aTextInput = Ext.DomQuery.selectNode("input[type=text]", this.field.getEl().dom);
        if (!Ext.isGecko)
        {
          Ext.get(m_aFileInput).on("change", function ()
            {
              m_aTextInput.value = m_aFileInput.value;
              if (m_sOriginalValue != m_aTextInput.value)
              {
                that.value = m_aTextInput.value;
                that.valueChange ({program: that.data.value.val.program, parameter: that.value});
              }
            }
          );
          Ext.get(m_aFileInput).on("click", function ()
            {
              bFileSelectionOpen = true;
            }
          );
          Ext.get(m_aFileInput).on("focus", function ()
            {
              if (!bFileSelectionOpen)
              {
                return;
              }
              bFileSelectionOpen = false;
              m_aTextInput.value = m_aFileInput.value;
              if (m_sOriginalValue != m_aTextInput.value)
              {
                that.value = m_aTextInput.value;
                that.valueChange ({program: that.data.value.val.program, parameter: that.value});
              }
            }
          );

          Ext.get(m_aTextInput).on("keyup", function ()
            {
              if (m_sOriginalValue != m_aTextInput.value)
              {
                that.value = m_aTextInput.value;
                that.valueChange ({program: that.data.value.val.program, parameter: that.value});
              }
            }
          );
        }
      };

  aConfig.listeners =
  {
    afterlayout: function (aBox)
    {
      if (!Ext.isGecko)
      {
        Ext.get(m_aTextInput).setWidth(Ext.get(m_aFileInput).getWidth()-130);
      }
    }
  };

  boc.ait.notebook.FilePointerField.superclass.constructor.call (this, aConfig);

  this._update = function (aData)
  {
    this.value = m_sOriginalValue = aData.value.val.parameter;
    if (m_aTextInput)
    {
      m_aTextInput.value = aData.value.val.parameter;
    }
    else if (Ext.isGecko)
    {
      this.field.setValue (aData.value.val.parameter);
    }
  };

  /*
    Returns the values readmode representation

    \retval A readmode representation of the value
  */
  //--------------------------------------------------------------------
  this._getValueRep = function ()
  //--------------------------------------------------------------------
  {
    if (this.value.indexOf("db:/") !== 0)
    {
      return boc.ait.transformFileReferenceToLink (this.value);
    }
    
    function cutBracketsFromID (sIDWithBrackets)
    {
      if (!sIDWithBrackets)
      {
        return sIDWithBrackets;
      }
      return sIDWithBrackets.substring(1, sIDWithBrackets.length-1);
    }
    var aNBData = this.notebook.getData ();
    var sID = aNBData.repoid;
    var sIDClass = aNBData.idclass;
    var aMMData = g_aMMData[g_aSettings.lang];
    var aClasses = aMMData.classData;
    var aClass = null;
    for (var i = 0; i < aClasses.length;++i)
    {
      var aCurClass = aClasses [i];
      if (aCurClass.idclass === sIDClass)
      {
        aClass = aCurClass;
        break;
      }
    }
    if (!aClass)
    {
      return boc.ait.transformFileReferenceToLink (this.value, null, false);
    }
    else
    {
      sID = cutBracketsFromID (sID);
      var sClassID = cutBracketsFromID (aClass.id);
      var sRepoID = cutBracketsFromID (g_aGlobalData.repoID);
      var sAttrID = cutBracketsFromID (this.data.id);
      var sURL = g_aGlobalData.baseURL;
      var sDMSAttrID = g_aGlobalData.dmsAttrID;
      if (!sURL || !sDMSAttrID)
      {
        return boc.ait.transformFileReferenceToLink (this.value, null, false);
      }
      if (this.data.id !== sDMSAttrID )
      {
        return boc.ait.transformFileReferenceToLink (this.value, null, false);
      }
      var sValueRep = sURL+"?t=nb&at=0&id="+sID+"&classId="+sClassID+"&repoid="+sRepoID+"&openAttr="+sAttrID;
      return boc.ait.transformFileReferenceToLink (this.value, sValueRep);
    }
  };
};

// boc.ait.notebook.FilePointerField is derived from boc.ait.notebook.Field
Ext.extend
(
  boc.ait.notebook.FilePointerField,
  boc.ait.notebook.Field,
  {

  }
);

// Register the textfield's xtype
Ext.reg("boc-filepointerfield", boc.ait.notebook.FilePointerField);