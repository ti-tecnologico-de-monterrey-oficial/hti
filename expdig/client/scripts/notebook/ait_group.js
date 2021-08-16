/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2008\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2008
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.Group class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.Group. This is used
    for notebook groups and chapters
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.Group = function (aConfig)
//--------------------------------------------------------------------
{
  // private members
  var m_aNotebook = null;
  var m_aData = null;
  var m_aControls = [];


  this._getReadModeRepresentation = function ()
  {
    return new boc.ait.notebook.ReadModeRepresentation
    (
      {
        chapter: aConfig.chapter,
        group: true,
        name: m_aData.name,
        val: ''
      }
    );
  };


  this._renderGroup = function ()
  {
    m_aControls = [];
    for (var i = 0; i < m_aData.children.length;++i)
    {
      /*if (i===1)
      {
        break;
      }*/
      var aAttrData = m_aData.children[i];

      // Create an object that will represent the field
      // We use lazy instantiation here
      var aField = null;
      // If we are dealing with a group inside a group, we call this function
      // recursively
      if (aAttrData.type === "group")
      {
		if (com.boc.axw.isGroupEmpty (aAttrData))
        {
          continue;
        }
        aField = new boc.ait.notebook.Group
        (
          {
            //xtype: 'boc-notebookgroup',
            title: aAttrData.name,
            notebook: m_aNotebook,
            data: aAttrData,
            chapter: false,
            autoWidth: true,
            autoHeight: true
          }
        );

        m_aControls[m_aControls.length] = aField;
        m_aControls = m_aControls.concat(aField.getControls());
      }
      else
      {
          // Every field requires a reference to the notebook it belongs to
          // and the object containing its data
          aField =
          {
            notebook: m_aNotebook,
            data: aAttrData
          };

          var bFound = true;
          // handle the field's type
          switch (aAttrData.type)
          {
            // handle attributes
            case ATTRIBUTE:
              // handle the attribute's attrtype
              switch (aAttrData.ctrltype)
              {
                // String attributes
                case 'LONGSTRING':
                case 'STRING_MULTILINE':
                  aField = new boc.ait.notebook.MultiLineTextField (aField);
                  //aField.xtype = 'boc-multilinetextfield';
                  break;
                case 'ADOSTRING':
                case 'STRING':
                case 'SHORTSTRING':
                case 'NAME':
                  aField = new boc.ait.notebook.TextField(aField);
                  //aField = new boc.ait.notebook.Field (aField);
                  //aField.xtype = 'boc-textfield';
                  break;
                // double attributes
                case 'DOUBLE':
                  aField = new boc.ait.notebook.NumberField(aField);
                  //aField.xtype = 'boc-numberfield';
                  break;
                // integer attributes
                case 'INTEGER':
                  aField = new boc.ait.notebook.IntegerField(aField);
                  //aField.xtype = 'boc-integerfield';
                  break;
                // boolean attributes
                case 'BOOL':
                  aField = new boc.ait.notebook.BoolField(aField);
                  //aField.xtype = 'boc-boolfield';
                  break;
                // date attributes
                case 'DATE':
                  aField = new boc.ait.notebook.DateField(aField);
                  //aField.xtype = 'boc-datefield';
                  break;
                case 'TIME':
                  aField = new boc.ait.notebook.TimeField (aField);
                  break;
                case 'DURATION':
                  aField = new boc.ait.notebook.DurationField (aField);
                  break;
                // utc attributes
                case 'UTC':
                  aField = new boc.ait.notebook.UTCField(aField);
                  //aField.xtype = 'boc-utcfield';
                  break;
                // Enum attributes
                case 'ENUM':
                  aField = new boc.ait.notebook.EnumField(aField);
                  //aField.xtype = 'boc-enumfield';
                  break;
                // enumlist attributes
                case 'ENUM_LIST':
                  aField = new boc.ait.notebook.EnumListField(aField);
                  //aField.xtype = 'boc-enumlistfield';
                  break;
                case 'ENUM_LIST_TREE':
                  aField = new boc.ait.notebook.EnumListTreeField (aField);
                  break;
                case 'FILE_POINTER':
                  aField = new boc.ait.notebook.FilePointerField (aField);
                  break;
                default:
                // If our attribute's type didn't match yet, and it is complex, we check
                // if we can handle the specific complex type. Otherwise we treat it as a record
                  if (aAttrData.complex)
                  {
                    switch (aAttrData.attrtype)
                    {
                      case 'FILE_POINTER_LIST':
                        aField = new boc.ait.notebook.FilePointerList (aField);
                        break;
                      default :
                        //aField.xtype = 'boc-record';
                        aField.parentID = m_aNotebook.getParentId ();
                        aField = new boc.ait.notebook.Record(aField);
                    }
                  }
                  else
                  {
                    continue;
                  }
                  break;
              }
              break;
            // Handle relations
            case RELATION:
              //aField.xtype = 'boc-relationscontrol';
              // Also pass the current instance's parent to the relations control
              aField.parentID = m_aNotebook.getParentId ();
              aField = new boc.ait.notebook.RelationsControl(aField);
              break;
          }

          if (!bFound)
          {
            break;
          }

          m_aControls[m_aControls.length] = aField;

          //var sKey = aAttrData.name === undefined ? aAttrData.relClassInd : aAttrData.name;
          //if (sKey)
          //{
          //  m_aControlsHash.add (aAttrData.name === undefined ? aAttrData.relClassInd : aAttrData.name, aField);
          //}
      }
    }

    if (aConfig.chapter && this.rendered)
    {
      for (var j = 0; j < m_aControls.length;++j)
      {
        this.add(m_aControls[j]);
      }

      this.doLayout ();
    }
  };

  this._clearGroup = function (bForce)
  {
    for (var i = 0; m_aControls && i < m_aControls.length;++i)
    {
      /*if (m_aControls[i] && m_aControls[i].destroy)
      {
        m_aControls[i].destroy ();
      }*/
      m_aControls[i].readModeControl = null;
      if (bForce)
      {
        //m_aControls[i].destroy ();
        this.remove (m_aControls[i], true);
      }
      m_aControls[i] = null;
    }
    m_aControls = [];
    //this.removeAll ();
  };

  this._getControls = function ()
  {
    return m_aControls;
  };

  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function()
  //--------------------------------------------------------------------
  {
    try
    {
      m_aData = aConfig.data;
      m_aNotebook = aConfig.notebook;

      aConfig.title = m_aData.name;

      // Use form layout
      aConfig.layout = 'form';
      aConfig.autoHeight = true;
      aConfig.cls = "boc-notebook-field boc-notebook-multilinefield";
      //aConfig.items = [{xtype:'box', autoEl: {tag:'b', html:aData.name}}].concat(aConfig.items);
	  
      if (!aConfig.chapter || aConfig.renderImmediately)
      {
        this._renderGroup ();

        if (m_aNotebook.isEditMode())
        {
          aConfig.items = m_aControls;
        }
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // Call to the constructor function to build the object
  buildObject.call(this);

  // Call to the superclass' constructor
  boc.ait.notebook.Group.superclass.constructor.call(this, aConfig);

  /*if (!aConfig.chapter || aConfig.renderImmediately)
  {
    for (var i = 0; i < m_aControls.length;++i)
    {
      this.add (m_aControls[i]);
    }
  }*/

  this.on("destroy", function ()
    {
      m_aNotebook = null;
      m_aData = null;
      //m_aControls = null;
      /*this.removeAll ();*/

      for (var i = 0; i < m_aControls.length;++i)
      {
        //m_aControls[i].destroy();
        m_aControls[i] = null;
      }

      m_aControls = [];
    },
    this
  );
};

// boc.ait.notebook.Group is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.Group,
  Ext.Panel,
  {
    getReadModeRepresentation: function ()
    {
      return this._getReadModeRepresentation ();
    },

    renderGroup: function ()
    {
      uilogger.profile("rendergroup");
      this.on("afterlayout", function (aP)
        {
          uilogger.profile("rendergroup");
        }
      );
      this._renderGroup ();
      //uilogger.profile("rendergroup");
    },

    clearGroup: function (bForce)
    {
      this._clearGroup (bForce);
    },

    getControls : function ()
    {
      return this._getControls ();
    }
  }
);

// Register the notebookgroup's xtype
Ext.reg("boc-notebookgroup", boc.ait.notebook.Group);