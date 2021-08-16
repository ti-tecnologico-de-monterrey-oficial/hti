/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2016\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2016
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.EnumListTreeField class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.EnumListTreeField. This class
    is used for showing enumlisttree attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.EnumListTreeField = function (aConfig)
//--------------------------------------------------------------------
{
  Ext.apply (this, aConfig);

  // Initialize the config object if necessary
  aConfig = aConfig || {};
  
  
  aConfig.fieldConf = aConfig.fieldConf || {};

  aConfig.fieldConf.enableKeyEvents = true;
  
  this.value = this.data.value.val;

  aConfig.fieldClass = Ext.form.TextField;

  this.value = this.data.value.val;

  // Call to the superclass' constructor
  boc.ait.notebook.EnumListTreeField.superclass.constructor.call(this, aConfig);
  
  this._handleChildren = function (aChildren)
  {
    if (!aChildren || aChildren.length === 0)
    {
      return "";
    }
    var sVal = "<ul class='axw_enumlisttree_readmode'>";
    for (var i = 0; i < aChildren.length;++i)
    {
      var aCurChild = aChildren[i];
      sVal+="<li>";
      sVal+=aCurChild.name;
      sVal+=this._handleChildren (aCurChild.children);
      sVal+="</li>";
    }
    sVal+="</ul>";
    return sVal;
  }

  this._getValueRep = function ()
  {
    return this._handleChildren (this.value);
  };
};

// boc.ait.notebook.EnumListTreeField is derived from Ext.form.FieldSet
Ext.extend
(
  boc.ait.notebook.EnumListTreeField,
  boc.ait.notebook.Field,
  {
    getValueRep : function ()
    {
      return this._getValueRep ();
    },

    update: function (aAttrData)
    {
    }
  }
);
// Register the enumlisttreefield's xtype
Ext.reg("boc-enumlisttreefield", boc.ait.notebook.EnumListTreeField);