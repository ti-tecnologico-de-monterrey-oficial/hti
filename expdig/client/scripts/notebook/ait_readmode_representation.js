/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2015\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2015
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.ReadModeRepresentation
class.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace("boc.ait.notebook");

/*
    Implementation of the class boc.ait.notebook.ReadModeRepresentation.
    This is used to create DOM Elements that show the read mode representation
    of a notebook control
    is used to load the contents of a notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.ReadModeRepresentation = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  // The name of an attribute or interref
  var m_sName = aConfig.name;
  // The value of an attribute or interref
  var m_aVal = aConfig.val;
  // Is the current element a chapter?
  var m_bChapter = aConfig.chapter;

  var m_bGroup = aConfig.group;
  // The id class of the current attribute or interref
  var m_sIDClass = aConfig.idclass;
  // The notebook in which the readmode representation is contained
  var m_aNotebook = aConfig.nb;
  // The alignment of the control. Either 'below' or 'right'
  // If 'below', the value is shown below the attribute's name
  var m_aMetadata = aConfig.metadata;
  // The relation class name of an interref control
  var m_sRelClassName = aConfig.relClassName;


  // protected members:
  /*
      Protected method that returns the dom structure that is the read mode representation
      of a notebook control.
      \retval An object containing the dom structure of a read mode notebook control
  */
  //--------------------------------------------------------------------
  this._getSimpleRepresentation = function ()
  //--------------------------------------------------------------------
  {
    // Array that holds all the dom elements of which a readmode control consists
    var aRows = []
    // Check if the current element is a chapter
    if (m_bGroup)
    {
      var sClass = m_bChapter === true ? "ait_readmode_notebook_chapter" : "ait_readmode_notebook_group";
      // Create the title row for the chapter
      aRows[0]=
      {
        tag:'tr',
        children:
        [
          {
            tag:'td',
            colspan:'2',
            cls: sClass,
            children:
            [
              {
                tag:'b',
                html:m_sName
              }
            ]
          }
        ]
      }
    }
    // Otherwise we are dealing with a "normal" control
    else
    {
      var sFct = "";
      var sID = Ext.id();
      var sClassID = null;
      var nArtefactType = null;
      var sIDClass = null;
      // Handle attribute controls
      if (m_aNotebook && m_sIDClass)
      {
        sClassID = m_aNotebook.getClassID();
        nArtefactType = m_aNotebook.getArtefactType();
        sIDClass = m_sIDClass;
      }
      // Handle interref control
      else if (m_sRelClassName)
      {
        sClassID = m_sRelClassName;
        nArtefactType = AIT_ARTEFACT_RELATION;
      }

      var sNameCls = 'ait_readmode_notebook_attr';
      var sValCls = 'ait_readmode_notebook_val';
      var sColspan = "1";

      // If the text should be displayed below the title, stretch the title row over 2 columns
      if (m_aMetadata.textAlign == 'below')
      {
        sColspan ="2";
        sNameCls = 'ait_readmode_notebook_attr_below'
        sValCls = 'ait_readmode_notebook_val_below';
      }

  	  var sStyle = "vertical-align: text-top; ";

      // Does a fix for long attribute names which are not linebreaked
  	  sStyle += "word-break: break-all; width: 35% !important;";

      // Create the name cell
      var aNameCell =
      [
        {
          id: sID,
          tag: 'td',
          valign: 'top',
          style: sStyle,
          classID: sClassID,
          artefactType: nArtefactType,
          idClass: sIDClass,
          cls: sNameCls,
          colspan: sColspan,
          html: m_sName+": "
        }
      ];

      // Create the value cell
      var aValCell = null;
      // If the passed value is a string or a number, display it directly as inner html of the
      // created table cell
      if ((typeof m_aVal) == "string" || (typeof m_aVal) == "number")
      {
        if (m_aVal+"" == "")
        {
          m_aVal = "<div>"+getString('ait_no_entry')+"</div>";
        }

        aValCell = {
                      tag:'td',
                      valign: 'top',
                      colspan: sColspan,
                      cls: sValCls,
                      style: 'vertical-align: text-top;',
                      html: String (m_aVal)
                    };
      }
      // Otherwise, the value is of type object, contains the dom structure of the value
      // and we append it to the table cell
      else if ((typeof m_aVal) == "object")
      {
        aValCell = {
                      tag:'td',
                      colspan: sColspan,
                      style: 'vertical-align: text-top;',
                      cls: sValCls,
                      valign:'top',
                      children: m_aVal
                    };
      }

      // If the value should be displayed below the title row, create two rows,
      // one for the title, one for the value
      if (m_aMetadata.textAlign == 'below')
      {
        aRows =
        [
          {
            tag:'tr',
            children:[aNameCell]
          },
          {
            tag:'tr',
            children:[aValCell]
          }
        ];
      }
      // Otherwise, create only one row with two cells, showing the name in the
      // left cell, the value in the right
      else
      {
        aRows =
        {
          tag:'tr',
          cls: 'ait_readmode_notebook',
          children:
          [
            aNameCell,
            aValCell
          ]
        }
      }
    }

    return aRows;
  };
}

// Prototype of boc.ait.notebook.ReadModeRepresentation
boc.ait.notebook.ReadModeRepresentation.prototype =
{
  // public members:
  /*
      Public method that returns the dom structure that is the read mode representation
      of a notebook control.
      \retval An object containing the dom structure of a read mode notebook control
  */
  //--------------------------------------------------------------------
  getSimpleRepresentation : function ()
  //--------------------------------------------------------------------
  {
    return this._getSimpleRepresentation ();
  }
}
