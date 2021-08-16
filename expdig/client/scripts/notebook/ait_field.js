/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2010\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2010
**********************************************************************
\author MWh
This file contains the code for the boc.ait.notebook.Field class.
This is the baseclass for any field in the ADOit web Client
Notebook.
**********************************************************************
*/

// Create namespace boc.ait.notebook
Ext.namespace('boc.ait.notebook');

/*
    Implementation of the class boc.notebook.NumberField. This class
    is used for showing number attribute values inside the notebook
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.notebook.Field = function (aConfig)
//--------------------------------------------------------------------
{
  // Initialize the config object if necessary
  aConfig = aConfig || {};

  var aToolbarConfig = null;
  this.notebook = aConfig.notebook;
  if (!aConfig.forRecord)
  {
    this.data = aConfig.data;
    this.name = aConfig.data.name;

    this.props = this.data.props || {};

    // Check if there should be a toolbar
    if (!aConfig.hideTBar)
    {
      // Create the toolbar for the field
      var aToolbarConfig =
        (aConfig.noTitle ? [] : [this.data.label || this.data.classname+":"]).concat
        (
          [
            {xtype: 'tbfill'}
          ]
        ).concat
        (aConfig.tbarConfig || []);

      // Check if there is an infotext for the control
      if (this.data.infotext === true)
      {
        // Add the infotext tool to the toolbar
        aToolbarConfig = aToolbarConfig.concat
        (
          [
            {
              iconCls: 'ait_infotext',
              scope: this,
              /*
                Anonymous function that handles clicking the toolbar button
              */
              //--------------------------------------------------------------------
              handler: function ()
              //--------------------------------------------------------------------
              {
                var sClassID = null;
                var nArtefactType = -1;
                var sIDClass = null;
                if (this.data.relClassInd)
                {
                  sClassID = this.data.relClassInd;
                  nArtefactType = AIT_ARTEFACT_RELATION;
                }
                else
                {
                  sClassID = this.notebook.getClassID ();
                  nArtefactType = this.notebook.artefactType;
                  sIDClass = this.data.idclass;
                }
                // Show the field's infotext
                showInfoText (sClassID, nArtefactType, sIDClass);
              }
            }
          ]
        );
      }

      aConfig.tbar = new Ext.Toolbar (aToolbarConfig);
      aConfig.tbar.cls = 'ait_relcontrol_tbar';
    }

    aConfig.header = false;

    aConfig.maskDisabled = false;

    // Is the field editable ?
    aConfig.fieldConf.disabled = aConfig.fieldConf.disabled === false ? false : (this.notebook ? !this.notebook.isEditable() : null) || !this.data.editable;
  }

  if (!this.notebook || this.notebook.isEditMode())
  {
    this.field = new aConfig.fieldClass (aConfig.fieldConf);
  }

  // Check if the field is contained in a record, in which case the field's superclass constructor should not be called
  if (aConfig.forRecord)
  {
    return;
  }

  if (aConfig.tbar)
  {
    aConfig.items = [aConfig.tbar];
  }

  aConfig.items = aConfig.items || [];
  aConfig.items[aConfig.items.length] = this.field;

  if (!this.notebook || this.notebook.isEditMode())
  {
    // Call to the superclass' constructor
    boc.ait.notebook.Field.superclass.constructor.call(this, aConfig);

    this.on("destroy", function (aCmp)
      {
        //this.field.destroy ();
        //this.remove (this.field, true);
        this.readModeControl = null;

        this.field = null;
        //delete this.field;

        this.data = null;
        //delete this.data;

        this.notebook = null;
        //delete this.notebook;

        this.name = null;
        //delete this.name;

        this.props = null;

        /*var aTBar = this.getTopToolbar ();
        if (aTBar)
        {
          this.remove(aTBar, true);
          aTBar.destroy ();
        }

        for (var i = 0; aToolbarConfig && i < aToolbarConfig.length;++i)
        {
          if (aToolbarConfig[i].destroy)
          {
            aToolbarConfig[i].destroy ();
          }
          aToolbarConfig[i] = null;
        }
        aToolbarConfig = null;*/
      },
      this
    );
  }
  else
  {

  }


  /*
    Returns the inner Ext JS control used for editing the field's value

    \retval The Ext JS control used for editing the field's value
  */
  //--------------------------------------------------------------------
  this._getFormField = function ()
  //--------------------------------------------------------------------
  {
    return m_aField;
  };

  /*
    Returns the field's data object

    \retval The field's data
  */
  //--------------------------------------------------------------------
  this._getData = function ()
  //--------------------------------------------------------------------
  {
    return m_aData;
  };

  /*
    Returns the current field's notebook

    \retval The field's notebook
  */
  //--------------------------------------------------------------------
  this._getNotebook = function ()
  //--------------------------------------------------------------------
  {
    return m_aNotebook;
  };

  /*
    Protected function that returns a read mode representation of the current field

    \param aHighlightParams An object containing highlight parameters for the readmode. This is used
           to highlight sections of the readmode representation when the notebook is opened through
           a search result

    \retval An instance of boc.ait.notebook.ReadModeRepresentation for display in the read mode notebook.
  */
  //--------------------------------------------------------------------
  this._getReadModeRepresentation = function (aHighlightParams)
  //--------------------------------------------------------------------
  {
    // Create a metadata object for the representation
    var aMetadata =
    {
      textAlign: 'left',
      highlightParams: aHighlightParams
    }
    // Get the field's value representation
    var aVal = this.getValueRep (aMetadata);

    // Create the configuration for the representation
    var aRepConf =
    {
      name: this.data.label || this.data.classname,
      val: aVal,
      nb: this.notebook,
      metadata: aMetadata
    };

    // If we are dealing with a string, we have to check whether we have to mark anything in the notebook, if
    // the notebook was opened from a search result
    if (typeof aVal === "string")
    {
      // Iterate through all attributes in the highlight parameters
      for (var sAttrName in aHighlightParams)
      {
        // Check if the current attribute contains elements to highlight
        if (this.data.idclass && (sAttrName.toLowerCase () === this.data.idclass.toLowerCase ()))
        {
          // Get the substring that is to highlight
          var sVal = aHighlightParams[sAttrName];
          if (sVal === "")
          {
            continue;
          }


          var sString = aRepConf.val;
          var sModified = "";
          var sPost = "";
          var bDidReplacing = false;
          // Iterate through the string as long as the substring to highlight is contained
          while (sString.toLowerCase().indexOf(sVal.toLowerCase()) > -1)
          {
            bDidReplacing = true;
            // Get the index of the contained substring to highlight
            var nIndex = sString.toLowerCase().indexOf (sVal.toLowerCase());
            // Get everything before the index
            var sPre = sString.substring (0, nIndex);
            // Get the matched value
            var sMatchedValue = sString.substring (nIndex, nIndex + sVal.length);
            // Get everything after the matched value
            sPost = sString.substring (nIndex + sVal.length);
            // Modify the matched value (mark it red)
            sModified+= sPre+"<span style='color:red;'>"+sMatchedValue+"</span>";
            // Now do the next iteration with the remaining string
            sString = sPost;
          }

          // If any replacing was done, the value to show is replaced with the modified string (containing the red markings
          if (bDidReplacing)
          {
            sModified+=sPost;
            aRepConf.val = sModified;
          }
        }
      }
    }

    if (this.data.relClassInd)
    {
      aRepConf.relClassName = this.data.relClassInd;
    }
    else
    {
      aRepConf.idclass = this.data.idclass;
    }

    return new boc.ait.notebook.ReadModeRepresentation (aRepConf);
  };

  /*
    Returns a representation of the field's value for the readmode

    \retval A string containing the representation of the field's value.
  */
  //--------------------------------------------------------------------
  this._getValueRep = function ()
  //--------------------------------------------------------------------
  {
    return boc.ait.htmlEncode (this.value.toString());
  };

  /*
    Retrieve the field's value as JSON object

    \retval A JS object containing the field's value
  */
  //--------------------------------------------------------------------
  this._getValueAsJSON = function ()
  //--------------------------------------------------------------------
  {
    return this.value;
  };

  /*
    Sets the fields value.

    \param aVal The new value for the field
  */
  //--------------------------------------------------------------------
  this._setValue = function (aVal)
  //--------------------------------------------------------------------
  {
    this.field.setValue (aVal);
    // Check if the value has changed, if so, call the notebook's onAttrChange method
    if (aVal != this.value)
    {
      this.notebook.onAttrChange
      (
        this.name,
        {
          val: this.field.getValue(),
          noValue: this.isNoValue (),
          id: this.data.id
        }
      );
    }
    this.value = aVal;
  };

  /*
    Protected function that sets the fields value using a json parameter

    \param aVal A JS object containing the value representation of the field
  */
  //--------------------------------------------------------------------
  this._setValueAsJSON = function (aVal)
  //--------------------------------------------------------------------
  {
    this.field.setValue (aVal.val);
  };

  /*
    Protected function that is called when the value of the field changes.

    \param aVal The new value of the field
  */
  //--------------------------------------------------------------------
  this._valueChange = function (aVal)
  //--------------------------------------------------------------------
  {
    // Handle simple attributes
    if (!this.data.complex )
    {
      // Call the notebooks on attrchange event, so that the notebook's saved/unsaved status changes
      // accordingly
      this.notebook.onAttrChange
      (
        this.name,
        {
          val: aVal,
          noValue: this.isNoValue (),
          id: this.data.id
        }
      );
    }
    // Complex attributes
    else
    {
      switch (this.data.attrtype)
      {
        // Handle the file pointer
        case "FILE_POINTER":
          this.notebook.onAttrChange (this.name, aVal);
          break;
        // Handle all other attributes
        default:
          this.notebook.onAttrChange (this.name, aVal);
      }
    }

    // Check if we have an active notebook on change event and call it if necessary
    if ((typeof this.data.props) === "object" && (typeof this.data.props.onValueChange) === "string")
    {
      var f = new Function ("control", this.data.props.onValueChange);
      f.call (this, this);
    }

    if (!this.data.complex)
    {
      this.data.value.val = aVal;
      this.data.value.isNoValue = this.isNoValue();
    }
    else
    {
      this.data.value = aVal;
    }
  };

  /*
    Protected function that disables the field
  */
  //--------------------------------------------------------------------
  this._disable = function ()
  //--------------------------------------------------------------------
  {
    this.field.disable();

    boc.ait.notebook.Field.superclass.disable.call (this);
  };

  /*
    Protected function that enables the field
  */
  //--------------------------------------------------------------------
  this._enable = function ()
  //--------------------------------------------------------------------
  {
    this.field.enable();

    boc.ait.notebook.Field.superclass.enable.call (this);
  };

  /*
    Protected function that updates the field's data

    \param aData The data for the current field
  */
  //--------------------------------------------------------------------
  this._update = function (aData)
  //--------------------------------------------------------------------
  {
    if (aData.value)
    {
      this.field.setValue (aData.value.val);
      this.value = aData.value.val;
    }
  };


  /*
    Protected function that returns whether the field's value is currently the no value

    \retval true, if the field has a no value, otherwise false
  */
  //--------------------------------------------------------------------
  this._isNoValue = function ()
  //--------------------------------------------------------------------
  {
    return false;
  };


  /*
    Protected function that returns  the field's unterlying attribute's or relation class' name

    \retval A string containing the field's classname
  */
  //--------------------------------------------------------------------
  this._getLangName = function ()
  //--------------------------------------------------------------------
  {
    return this.data.classname;
  };
}

// boc.ait.notebook.Field is derived from Ext.Panel
Ext.extend
(
  boc.ait.notebook.Field,
  //Ext.Panel,
  Ext.Container,
  {
    /*
      Public function that returns a read mode representation of the current field

      \param aHighlightParams An object containing highlight parameters for the readmode. This is used
             to highlight sections of the readmode representation when the notebook is opened through
             a search result

      \retval An instance of boc.ait.notebook.ReadModeRepresentation for display in the read mode notebook.
    */
    //--------------------------------------------------------------------
    getReadModeRepresentation : function (aHighlightParams)
    //--------------------------------------------------------------------
    {
      try
      {
        return this._getReadModeRepresentation (aHighlightParams);
      }
      catch (aEx)
      {
        displayErrorMessage (aEx);
        throw aEx;
      }
    },

    /*
      Returns a representation of the field's value for the readmode

      \retval A string containing the representation of the field's value.
    */
    //--------------------------------------------------------------------
    getValueRep : function ()
    //--------------------------------------------------------------------
    {
      return this._getValueRep ();
    },

    /*
      Retrieve the field's value as JSON object

      \retval A JS object containing the field's value
    */
    //--------------------------------------------------------------------
    getValueAsJSON : function ()
    //--------------------------------------------------------------------
    {
      return this._getValueAsJSON ();
    },

    /*
      Sets the fields value.

      \param aVal The new value for the field
    */
    //--------------------------------------------------------------------
    setValue : function (aVal)
    //--------------------------------------------------------------------
    {
      this._setValue (aVal);
    },

    /*
      Public function that sets the fields value using a json parameter

      \param aVal A JS object containing the value representation of the field
    */
    //--------------------------------------------------------------------
    setValueAsJSON : function (aVal)
    //--------------------------------------------------------------------
    {
      this._setValueAsJSON (aVal);
    },

    /*
      Public function that is called when the value of the field changes.

      \param aVal The new value of the field
    */
    //--------------------------------------------------------------------
    valueChange : function (aVal)
    //--------------------------------------------------------------------
    {
      this._valueChange (aVal);
    },

    /*
      Public function that disables the field
    */
    //--------------------------------------------------------------------
    disable : function ()
    //--------------------------------------------------------------------
    {
      this._disable ();
    },

    /*
      Public function that enables the field
    */
    //--------------------------------------------------------------------
    enable: function ()
    //--------------------------------------------------------------------
    {
      this._enable ();
    },

    /*
      Public function that updates the field's data

      \param aData The data for the current field
    */
    //--------------------------------------------------------------------
    update: function (aData)
    //--------------------------------------------------------------------
    {
      this._update (aData);
    },

    /*
      Public function that returns whether the field's value is currently the no value

      \retval true, if the field has a no value, otherwise false
    */
    //--------------------------------------------------------------------
    isNoValue : function ()
    //--------------------------------------------------------------------
    {
      return this._isNoValue ();
    },

    /*
      Public function that returns  the field's unterlying attribute's or relation class' name

      \retval A string containing the field's classname
    */
    //--------------------------------------------------------------------
    getLangName : function ()
    //--------------------------------------------------------------------
    {
      return this._getLangName ();
    }
  }
);

// Register the numberfield's xtype
Ext.reg("boc-field", boc.ait.notebook.Field);