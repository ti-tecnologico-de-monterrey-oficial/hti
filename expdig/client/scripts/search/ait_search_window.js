/*********************************************************************
\note Copyright\n
This file is part of ADOit.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2014\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2014
**********************************************************************
\author MWh
This file contains the code for the boc.ait.search.SearchWindow class
that allows to perform a fulltext search
**********************************************************************
*/

// Create namespace boc.ait.search
Ext.namespace('boc.ait.search');

/*
    Implementation of the class boc.ait.search.SearchWindow. This class
    is used for doing fulltext searches on the repository.
    \param aConfig The configuration object.
*/
//--------------------------------------------------------------------
boc.ait.search.SearchWindow = function (aConfig)
//--------------------------------------------------------------------
{
  // private members:
  var that = this;
  var m_aSuccessCallBack = null;
  var m_aFailureCallBack = null;
  var m_aScope = null;
  var m_aInnerPanel = null;
  var m_aSearchPanel = null;
  var m_aResultPanel = null;
  var m_aQueryBox = null;
  var m_aExtendedCheckBox = null;
  var m_aSearchButton = null;
  var m_aResultGrid = null;
  var m_aExtendedPanel = null;
  var m_aSearchTypeDropDown = null;
  var m_aArtefactTypeDropDown = null;
  var m_aExtendedClassPanel = null;
  var m_aClassSpecificFields = [];
  var m_aSearchParams = null;

  var m_aFields = [];
  var m_aResultColumns = [];

  // constants

  var DEFAULT_VAL = 0;
  var ENUM_WIDTH = 250;
  var FIELD_WIDTH = 268;

  // Initialize the config object if necessary
  aConfig = aConfig || {};


  var renderInterref = function (aVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
  {
    var sVisualization = "";
    if ((typeof aVal === "object") && !(aVal instanceof Array))
    {
      var sMsg = getString(aVal.text).replace(/%REL_CLASS_NAME%/, aVal.className);

      if (aMetadata.renderInSupportDialog)
      {
        return sMsg;
      }
      return "<i style='color:gray'>"+sMsg+"</i>";
    }

    if (aMetadata.renderInSupportDialog)
    {
      for (var i = 0; i < aVal.length;++i)
      {
        sVisualization+=
        [
          aVal[i].text,
          '\n'
        ].join('');
      }
    }
    else
    {
      for (var i = 0; i < aVal.length;++i)
      {
        if (i===0)
        {
          sVisualization+=
          [
            (aVal[i].broken ? '<img src=\'images/broken.png\' class=\'ait_broken_reference_readmode\'/>&nbsp;': ('<a class=\'ait_link\' href=\'#\' onclick=\'g_aMain.getMainArea().openNotebook("'+aVal[i].artefactId+'",'+aVal[i].type+');\'>')),
            aVal[i].text,
            (aVal[i].broken ? '' : '</a>')
          ].join('');
        }
        else if (i === 1)
        {
          sVisualization+=" ...";
          break;
        }
      }
    }
    return sVisualization;
  };

  var renderAttribute = function (aVal, aMetadata, aRecord, nRowIndex, nColIndex, aStore)
  {
    if ((typeof aVal === "object") && !(aVal instanceof Array))
    {
      return "<i style='color:gray'>"+getString(aVal.text)+"</i>";
    }

    return aVal;
  };
  /*
    Private callback function that is called when the search result is available.
    Creates a new search result and displays it in the result area.

    May throw an exception!
  */
  //--------------------------------------------------------------------
  var handleSearchResult = function ()
  //--------------------------------------------------------------------
  {
    // Create a new search result grid
    m_aResultGrid = new boc.ait.search.SearchResult
    (
      {
        useLiveGrid: true,
        showGlobalAttributes: true,
        // The result data we want to display in the result grid
        resultData : g_aSettings.offline ? this.reader.jsonData : undefined,
        additionalResultColumns: m_aResultColumns,
        additionalFields: m_aFields,
        searchParams: m_aSearchParams,
        initialLoadCallback: unmaskWC
      }
    );

    m_aResultPanel.add (m_aResultGrid);

    m_aResultGrid.on("load", function (aStore, aRecords)
      {
        // If no results were found, show a message and then focus the querybox again
        if (aRecords.length === 0)
        {
          // Show an info box, and then enable the search panel again (CR #046961)
          showInfoBox
          (
            getString("ait_no_search_results"),
            null,
            function()
            {
              m_aSearchPanel.cascade
              (
                function ()
                {
                  this.enable();
                }
              );
              m_aQueryBox.focus();
            }
          );
        }
        else
        {
          // Enable the search panel again (CR #046961)
          m_aSearchPanel.cascade (function (){this.enable();});
        }
      }
    );

    m_aResultGrid.on("loadexception", function (aStore, aOptions, aResponse, eError)
      {
        m_aSearchPanel.cascade (function (){this.enable();});
      }
    );


    m_aResultPanel.setVisible (true);

    that.doLayout();

    m_aResultPanel.setHeight(m_aResultPanel.getSize().height-1);
  };


  /*
      Private function that creates the search query and performs the search.

      \param aButtonOrMouseKey The button that was clicked or the key that was pressed to call this function
      \param aEvent The Event that triggered this functionality
  */
  //--------------------------------------------------------------------
  var doSearch = function (aButtonOrKey, aEvent)
  //--------------------------------------------------------------------
  {
    maskWC();
    // Necessary to kill the beep in internet explorer when pressing enter in a textbox
    aEvent.stopEvent();

    m_aResultColumns = [];
    m_aFields = [];
    var aAdditionalRelations = [];

    var bOwnershipAdded = false;
    // If we are working with extended search options, we possibly have to display additional
    // columns in the result grid
    if (m_aExtendedCheckBox.getValue())
    {
      // Get the selected class from the artefact dropdown
      var sClass = m_aArtefactTypeDropDown.getValue();

      // Only continue if we are searching for objects and a class was selected
      if (((g_aSettings.showDiagrams === false) || (m_aSearchTypeDropDown && m_aSearchTypeDropDown.getValue() == AIT_ARTEFACT_OBJECT)) && sClass != DEFAULT_VAL)
      {
        // Iterate through the class search settings
        for (var i = 0; i < g_aSettings.searchData.classData.length;++i)
        {
          var aClassData = g_aSettings.searchData.classData[i];
          if (aClassData.idclass == sClass && aClassData.attrRelArr)
          {
            // Iterate through the attribute data and add
            // a new result column for every attribute
            for (var j = 0; j < aClassData.attrRelArr.length;++j)
            {

              var aAttrRelData = aClassData.attrRelArr[j];

              if (aAttrRelData.type === ATTRIBUTE)
              {
                if (aAttrRelData.complex === true)
                {
                  continue;
                }
                m_aResultColumns.push
                (
                  {
                    id: "attr_"+aAttrRelData.attrID,
                    header: aAttrRelData.langName,
                    sortable: true,
                    renderer: renderAttribute,
                    dataIndex: "attr_"+aAttrRelData.attrID,
                    name: "attr_"+aAttrRelData.attrID
                  }
                );
                // Also add the id of the attribute to the fields for the store
                m_aFields[m_aFields.length] = "attr_"+aAttrRelData.attrID;
              }
              else
              {
                if (g_aSettings.ownerShipRelClass && g_aSettings.ownerShipRelClass.idclass === aAttrRelData.idclass)
                {
                  bOwnershipAdded = true;
                }

                aAdditionalRelations[aAdditionalRelations.length] = {
                                                                      name: aAttrRelData.idclass,
                                                                      direction: aAttrRelData.direction
                                                                    };

                m_aResultColumns[m_aResultColumns.length] =
                {
                  id: "rel_"+aAttrRelData.idclass.toLowerCase(),
                  header: aAttrRelData.className,
                  sortable: true,
                  dataIndex: "rel_"+aAttrRelData.idclass.toLowerCase(),
                  renderer: renderInterref,
                  name: "rel_"+aAttrRelData.idclass.toLowerCase()
                };
                // Also add the id of the attribute to the fields for the store
                m_aFields[m_aFields.length] = "rel_"+aAttrRelData.idclass.toLowerCase();
              }
            }
          }
        }
      }

    }


    if (g_aSettings.showOwnerInWebSearchResults && !bOwnershipAdded)
    {
      var sIDClass = g_aSettings.ownerShipRelClass.idclass;
      m_aResultColumns[m_aResultColumns.length] =
      {
        id: "rel_"+sIDClass.toLowerCase(),
        header: g_aSettings.ownerShipRelClass.classname,
        sortable: true,
        dataIndex: "rel_"+sIDClass.toLowerCase(),
        renderer: renderInterref,
        name: "rel_"+sIDClass.toLowerCase()
      };
      // Also add the id of the attribute to the fields for the store
      m_aFields[m_aFields.length] = "rel_"+sIDClass.toLowerCase();

      aAdditionalRelations[aAdditionalRelations.length] = {
                                                            name: sIDClass,
                                                            direction: REL_OUTGOING
                                                          };
    }



    // Disable the search panel, so nothing can be entered when the loading mask is displayed (CR #046961)
    m_aSearchPanel.cascade (function (){this.disable();});
    try
    {
      // If there is already a result being shown, we first remove it
      if (m_aResultPanel)
      {
        if (m_aResultGrid)
        {
          m_aResultPanel.remove(m_aResultGrid, true);
        }
        m_aResultPanel.setVisible (false);
        //m_aInnerPanel.remove(m_aResultPanel, true);
      }

      var aSearchConfig =
      {
        query: g_aSettings.offline ? m_aQueryBox.getValue() : escapeSearchString(m_aQueryBox.getValue())
      };

      // If we are doing an extended search, extend the query
      if (m_aExtendedCheckBox.getValue())
      {
        aSearchConfig.artefactType = m_aSearchTypeDropDown ? m_aSearchTypeDropDown.getValue() : AIT_ARTEFACT_OBJECT;

        aSearchConfig.idclass = m_aArtefactTypeDropDown.getValue();
      }

      if (g_aSettings.offline)
      {
        var aResultEntries = [];
        var aRetObj =
        {
          error:false,
          errStr: null,
          payload:
          {
            entries:aResultEntries
          }
        };

        function iterateSearchData (aSearchData, aResult)
        {
          for (var i = 0; i < aSearchData.length;++i)
          {
            var aEntry = aSearchData[i];
            if (aEntry.artefactType === AIT_ARTEFACT_OBJECT_GROUP || aEntry.artefactType === AIT_ARTEFACT_DIAGRAM_GROUP)
            {
              continue;
            }

            if (aSearchConfig.artefactType === AIT_ARTEFACT_OBJECT && (aEntry.artefactType !== AIT_ARTEFACT_OBJECT && aEntry.artefactType !== AIT_ARTEFACT_MODINST) ||
              (aSearchConfig.artefactType === AIT_ARTEFACT_DIAGRAM && aEntry.artefactType !== AIT_ARTEFACT_DIAGRAM)
            )
            {
              continue;
            }


            if (aSearchConfig.idclass !== undefined && aSearchConfig.idclass !== DEFAULT_VAL && aSearchConfig.idclass !== aEntry.idClass)
            {
              continue;
            }

            for (var sAttrName in aEntry.searchAttrs)
            {
              if (boc.ait.htmlEncode (aEntry.searchAttrs[sAttrName], true).toLowerCase().indexOf (boc.ait.htmlEncode (aSearchConfig.query, true).toLowerCase()) > -1)
              {
                aEntry.model = aEntry.artefactType === AIT_ARTEFACT_DIAGRAM;
                aResult.push (aEntry);
                break;
              }
            }
          }
        }

        iterateSearchData (g_aOfflineData.objectSearch.data, aResultEntries);
        iterateSearchData (g_aOfflineData.modelSearch.data, aResultEntries);

        //aResults.total = aResults.data.length;
        var aReader = new Ext.data.JsonReader();

        // Put the search results into a JSONstore
        var aStore = new Ext.data.JsonStore
        (
          {
            autoDestroy:true,
            proxy : new Ext.data.MemoryProxy (aRetObj),
            reader: aReader
          }
        );
        // Perform the search
        aStore.load
        (
          {
            callback: handleSearchResult

          }
        );
        return;
      }


      m_aSearchParams =
      {
        url: 'proxy',
        type:'search',
        searchid: 'standardsearch'
      };

      m_aSearchParams.params =
      {
        relations:[],
        attributes:{},
        additionalRelations: aAdditionalRelations
      };
      var sQueryString = "";

      // We want to use the entered query to serach in the name and the description attribute
      if (aSearchConfig.query && aSearchConfig.query.trim() !== "")
      {
        var sQuery = aSearchConfig.query.trim().replace(/\*/g, "").replace(/\"/g, "").replace(/\'/g   , "");
        m_aSearchParams.params.attributes.name = sQuery;

        if(!g_aSettings.searchData.global_attributes)
        {
          sQueryString ="((ATTR_DESCRIPTION: " +aSearchConfig.query+ " OR DESCRIPTION: " + aSearchConfig.query+ ") OR NAME: " + aSearchConfig.query+") "+sQueryString;

          m_aSearchParams.params.attributes.description = sQuery;
          m_aSearchParams.params.attributes.attr_description = sQuery;
        }
        else
        {
          var nLength = g_aSettings.searchData.global_attributes.length;
          sQueryString += "(";
          for(var i = 0; i<nLength; i++)
          {
            var sAttrName = g_aSettings.searchData.global_attributes[i].attrName;
            if(sAttrName !== "NAME")
            {
              if(sQueryString.indexOf(sAttrName) < 0)
              {
                if(nLength > i && i !== 0)
                {
                  sQueryString +=" OR ";
                }
                sQueryString += "("+sAttrName+": "+aSearchConfig.query+")";
              }
            }
          }
          if(nLength > 0)
          {
            sQueryString += " OR ";
          }
          sQueryString+="NAME: "+aSearchConfig.query+")";
        }
      }
      // If we are doing an extended search, extend the query
      if (m_aExtendedCheckBox.getValue())
      {
        var nVal = m_aSearchTypeDropDown ? m_aSearchTypeDropDown.getValue() : AIT_ARTEFACT_OBJECT;
        // Search only for models
        if (nVal == AIT_ARTEFACT_DIAGRAM)
        {
          sQueryString+=" AND TYPE:model";
        }
        // Search only for repo instances
        else if (nVal == AIT_ARTEFACT_OBJECT)
        {
          sQueryString+=" AND TYPE:repoinst";
        }

        // Search only for the specified class
        var sClassVal = m_aArtefactTypeDropDown.getValue();
        if (sClassVal != DEFAULT_VAL)
        {
          sQueryString+=" AND CLASS:"+sClassVal;
          m_aSearchParams.params.className = sClassVal;
        }
        // Iterate through possible further class specific attributes to search for
        for (var i = 0; i < m_aClassSpecificFields.length;++i)
        {
          var aField = m_aClassSpecificFields[i];
          var sVal = escapeSearchString (String(aField.getValue()));
          if (sVal === null || sVal.trim() === "")
          {
            continue;
          }
          // Ignore combo boxes for which the value has not been changed
          if ((aField instanceof Ext.form.ComboBox) && sVal == DEFAULT_VAL)
          {
            continue;
          }
          if (aField.type === ATTRIBUTE)
          {
            //sVal = sVal.trim().replace(/\*/g, "").replace(/\"/g, "").replace(/\'/g   , "");
            sVal = sVal.trim().replace(/\"/g, "").replace(/\'/g   , "");
            var sFieldName = aField.getName();
            // Extend the query string so it searches for more indexed attributes
            if(!m_aSearchParams.params.attributes[sFieldName])
            {
              m_aSearchParams.params.attributes[sFieldName] = sVal;
            }

          }
          else
          {
            m_aSearchParams.params.relations[m_aSearchParams.params.relations.length] =
            {
              id: aField.name,
              dir: aField.dir,
              val: sVal.trim()
            };
          }
        }
      }
      else if (g_aSettings.showDiagrams === false)
      {
        sQueryString+=" AND TYPE:repoinst";
      }

      m_aSearchParams.params.query = sQueryString;
      m_aSearchParams.params.additionalAttributes =
      [
        {
          name : "DATA_ACTUALITY"
        }
      ];

      handleSearchResult ();
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
      unmaskWC();
    }
  };


  /*
      Private function that creates the contents of the extended search panel
      \param aCheckbox The checkbox whose value changed and which triggered this function
      \param bChecked The value of the checkbox

      May throw an exception.
  */
  //--------------------------------------------------------------------
  var fillExtendedSearchPanel = function(aCheckbox, bChecked)
  //--------------------------------------------------------------------
  {
    // If the checkbox was checked, we want to expand the extended search panel
    // otherwise collapse it
    if (bChecked)
    {
      m_aExtendedPanel.expand ();
    }
    else
    {
      m_aExtendedPanel.collapse ();
    }

    m_aExtendedPanel.on("expand", function ()
      {
        that.doLayout();
        // If have a result panel and it is not hidden, it might happen that the search button gets hidden behind it (CR #65045)
        // -> do another layout as that will ensure that the search button is visible (reason unclear, related somewhere in ExtJS panel layouting/rendering/...)
        if (g_aSettings.offline && m_aResultPanel && !m_aResultPanel.hidden)
        {
          that.doLayout();
        }
      }
    );
    m_aExtendedPanel.on("collapse", function ()
      {
        that.doLayout();
      }
    );
  };


  /*
      Private function that creates the contents of the artefact type drop down
      that lets us select the class or modeltype to search for.

      May throw an exception.
  */
  //--------------------------------------------------------------------
  var fillArtefactTypeDropDown = function()
  //--------------------------------------------------------------------
  {
    // First, remove the class specific fields
    removeClassSpecificFields ();

    var nVal = m_aSearchTypeDropDown ? m_aSearchTypeDropDown.getValue() : AIT_ARTEFACT_OBJECT;
    var aArtefactTypeData = [];

    // inner sort function to sort the entries in the dropdown list
    var sortFct = function(sVal1, sVal2)
    {
      return sVal1 > sVal2;
    };

    // Create the diagram type entries for the dropdown
    if (nVal == AIT_ARTEFACT_DIAGRAM)
    {
      for (var i = 0; i < g_aSettings.searchData.mtData.length;++i)
      {
        var aMTData = g_aSettings.searchData.mtData[i];
        aArtefactTypeData[aArtefactTypeData.length] = [aMTData.className, aMTData.idclass, aMTData.iconUrl];
      }
      aArtefactTypeData.sort(sortFct);
      aArtefactTypeData = (new Array([getString("ait_search_window_all_diagramtypes"), DEFAULT_VAL, null])).concat(aArtefactTypeData);
    }
    // Create the class entries for the dropdown
    else if (nVal == AIT_ARTEFACT_OBJECT)
    {
      for (var i = 0; i < g_aSettings.searchData.classData.length;++i)
      {
        var aClassData = g_aSettings.searchData.classData[i];
        aArtefactTypeData[aArtefactTypeData.length] = [aClassData.className, aClassData.idclass, aClassData.iconUrl];
      }
      aArtefactTypeData.sort(sortFct);
      aArtefactTypeData = (new Array([getString("ait_search_window_all_classes"), DEFAULT_VAL, null])).concat(aArtefactTypeData);
    }

    // Reset the dropdown so it can be refilled
    m_aArtefactTypeDropDown.reset();
    var aStore = m_aArtefactTypeDropDown.initialConfig.store;

    // Load the new data into the dropdown
    aStore.loadData(aArtefactTypeData);
    m_aArtefactTypeDropDown.setValue(0);
  };


  /*
      Private function that creates the extended class panel holding
      the extended search options

      May throw an exception.
  */
  //--------------------------------------------------------------------
  var createExtendedClassPanel = function ()
  //--------------------------------------------------------------------
  {
    return new Ext.Panel
    (
      {
        title:"",
        border:false,
        layout:'form',
        autoHeight:true,
        labelAlign: 'top',
        bodyStyle: 'margin-left: 0px; padding-left: 10px; border-left-width: 0px; border-top-width:0px;margin-top:0px;padding-top:0px;border-bottom-width:0px;margin-bottom:0px;padding-bottom:0px'
      }
    );
  };


  /*
      Private function that removes the class specific attribute fields shown in the
      extended search options when the selection in one of the dropdowns changes.

      May throw an exception.
  */
  //--------------------------------------------------------------------
  removeClassSpecificFields = function ()
  //--------------------------------------------------------------------
  {
    // Iterate through the currently shownclass specific attribute fields and remove
    // them from their owner (the extended class panel)
    for (var i = 0; i < m_aClassSpecificFields.length;++i)
    {
      var aField = m_aClassSpecificFields[i];
      aField.ownerCt.remove(aField, true);
    }
    m_aClassSpecificFields = [];

    // Remove the extended class panel
    m_aExtendedClassPanel.ownerCt.remove (m_aExtendedClassPanel, true);

    // Recreate the extended class panel
    m_aExtendedClassPanel = createExtendedClassPanel ();
    // Add the extended class panel to the extended panel and redo the layout
    m_aExtendedPanel.add (m_aExtendedClassPanel);
    m_aExtendedPanel.doLayout();
  };

  /*
      Private function that is called when an artefact type is selected in
      the artefact type drowdown list.

      May throw an exception.
  */
  //--------------------------------------------------------------------
  onArtefactTypeSelect = function()
  //--------------------------------------------------------------------
  {
    function callDoLayout ()
    {
      that.doLayout();
    }


    removeClassSpecificFields ();

    // Get the selected artefact type
    var nSelectedArtefactType = m_aSearchTypeDropDown !== null ? m_aSearchTypeDropDown.getValue() : AIT_ARTEFACT_OBJECT;
    if (nSelectedArtefactType == AIT_ARTEFACT_OBJECT)
    {
      // Get the selected class
      var sVal = this.getValue();
      // If a value other then the default value (all objects) was selected
      // we have to create the class specific search fields
      if (sVal != DEFAULT_VAL)
      {
        // Iterate through the class data and get the data for
        // the current class
        for (var j = 0; j < g_aSettings.searchData.classData.length;++j)
        {
          var aClassData = g_aSettings.searchData.classData[j];
          if (aClassData.idclass == sVal)
          {
            // Iterate through the indexed attributes for the current
            // class
            for (var k = 0; aClassData.attrRelArr && k < aClassData.attrRelArr.length;++k)
            {
              var aAttrRelData = aClassData.attrRelArr[k];
              var aField = null;

              if (aAttrRelData.type === ATTRIBUTE)
              {
                switch (aAttrRelData.attrType)
                {
                  // Special handling for enumerations and enum lists
                  // This is not supported yet
                  case "ENUMLIST":
                  case "ENUM":
                    /*alert(Ext.encode(aAttrRelData));
                    var aArr = [];
                    var aIndArr = aAttrRelData.ind.split("@");
                    var aValArr = aAttrRelData.constraint.split("@");
                    aArr[aArr.length] = ["-", DEFAULT_VAL];
                    for (var l = 0;l < aIndArr.length;++l)
                    {
                      aArr[aArr.length] = [aValArr[l],aIndArr[l]];
                    }

                    // As the combobox' store we use a stimple store
                    var aStore= new Ext.data.SimpleStore
                    (
                      {
                        // There are two fields in the data used to fill the box: val and text
                        fields: ['text', "val"],
                        data: aArr
                      }
                    );
                    aField = new Ext.form.ComboBox
                    (
                      {
                        name: aAttrRelData.idclass,
                        fieldLabel: aAttrRelData.langName,
                        valueField: 'val',
                        displayField: 'text',
                        mode: 'local',
                        triggerAction: 'all',
                        value: DEFAULT_VAL,
                        store: aStore,
                        editable: false,
                        autoShow:true,
                        // NECESSARY OR VISUALIZATION BUGS IN FF WILL APPEAR
                        lazyInit: false,
                        listWidth:ENUM_WIDTH,
                        width: ENUM_WIDTH,
                        listeners:
                        {
                          // NECESSARY OR VISUALIZATION BUGS IN FF WILL APPEAR
                          render:function()
                          {
                            var fixCombo = Ext.query("*[class=x-combo-list-inner]");
                            for (var i=0; i < fixCombo.length; ++i)
                            {
                              var el = Ext.get(fixCombo[i]);
                              el.setTop('0px');
                              el.setLeft('0px');
                            }
                          }
                        }
                      }
                    );*/

                    aField = new Ext.form.TextField
                    (
                      {
                        fieldLabel:aAttrRelData.langName,
                        cls : "boc-notebook-singlelinefield",
                        name: aAttrRelData.idclass,
                        width: FIELD_WIDTH
                      }
                    );
                    break;
                  // Dates are not supported yet
                  /*case "DATE":*/
                  // Handle strings
                  case "STRING":
                  case "ADOSTRING":
                  case "LONGSTRING":
                  case "SHORTSTRING":
                    aField =
                      new Ext.form.TextField
                      (
                        {
                          fieldLabel: aAttrRelData.langName,
                          cls : "boc-notebook-singlelinefield",
                          name: aAttrRelData.idclass,
                          width: FIELD_WIDTH
                        }
                      );
                    break;
                  // Handle integers - not supported yet
                  case "INTEGER":
                    aField =
                      new Ext.form.NumberField
                      (
                        {
                          fieldLabel: aAttrRelData.langName,
                          cls : "boc-notebook-singlelinefield",
                          allowDecimals: false,
                          name: aAttrRelData.idclass,
                          width: FIELD_WIDTH
                        }
                      );
                    break;
                  // Handle doubles - not supported yet
                  case "DOUBLE":
                    aField =
                      new Ext.form.NumberField
                      (
                        {
                          fieldLabel: aAttrRelData.langName,
                          cls : "boc-notebook-singlelinefield",
                          name: aAttrRelData.idclass,
                          width: FIELD_WIDTH
                        }
                      );
                    break;
                  case "UTC":
                    continue;
                  // Handle booleans - not supported yet
                  case "BOOLEAN":
                    aField =
                      new Ext.form.Checkbox
                      (
                        {
                          boxLabel: aAttrRelData.langName,
                          hideLabel: true,
                          cls : "boc-notebook-singlelinefield",
                          name: aAttrRelData.idclass,
                          width: FIELD_WIDTH
                        }
                      );
                    break;
                  default:
                    aField =
                      new Ext.form.TextField
                      (
                        {
                          fieldLabel: aAttrRelData.langName,
                          cls : "boc-notebook-singlelinefield",
                          name: aAttrRelData.idclass,
                          width: FIELD_WIDTH
                        }
                      );
                    break;
                }
              }
              else
              {
                aField =
                  new Ext.form.TextField
                  (
                    {
                      fieldLabel:aAttrRelData.className,
                      cls : "boc-notebook-singlelinefield",
                      name: aAttrRelData.classID,
                      width: FIELD_WIDTH
                    }
                  );
              }
              if (aField)
              {
                aField.type = aAttrRelData.type;
                aField.dir = aAttrRelData.direction;
                // Add the new field to the fields array
                m_aClassSpecificFields[m_aClassSpecificFields.length] = aField;

                m_aExtendedClassPanel.add (aField);
                m_aExtendedClassPanel.doLayout();
                m_aResultPanel.doLayout();
              }
            }
            // First hide the extended panel, then redo its layout and show it
            m_aExtendedPanel.setVisible(false);
            m_aExtendedPanel.doLayout();

            // Call doLayout deferred, so the result panel moves below the search button
            callDoLayout.defer(1);
            m_aExtendedPanel.setVisible(true);
          }
        }
      }
      else
      {
        // Call doLayout deferred, so the result panel moves below the search button
        callDoLayout.defer(1);
      }
    }
  };



  /*
      Private method that configures the current object. Serves as a constructor.
  */
  //--------------------------------------------------------------------
  var buildObject = function ()
  //--------------------------------------------------------------------
  {
    try
    {
      aConfig.title = getString("ait_search_window_search");
      // Notebooks use the dockable plugin
      //aConfig.plugins = [boc.ait.plugins.Dockable];
      aConfig.items = aConfig.items || [];
      //aConfig.layout = 'border';
      aConfig.layout = g_aSettings.offline ? 'border' : 'fit';
      //aConfig.autoWidth = true;

      //aConfig.closable = true;
      aConfig.autoScroll = true;

      // Set the icon for the tab panel
      aConfig.iconUrl = "images/search_white.png";
      //aConfig.iconCls = "ait_search";

      aConfig.listeners =
      {

        /*
          Handler for the search window's render event

          \param aPanel The rendered Panel
        */
        //--------------------------------------------------------------------
        render: function (aPanel)
        //--------------------------------------------------------------------
        {
          // Get the tabpanel's selector and add the iconurl
          var aSelector = Ext.get(aPanel.ownerCt.getTabEl(aPanel));
          aSelector.addClass("x-tab-with-icon search-tab");

          var aAnchor = Ext.query("a", aSelector.dom)[0];
          aAnchor.style.backgroundImage="url('images/tab_close.png')";
          aAnchor.style.backgroundPosition="right center";
          aAnchor.style.height="16";
          aAnchor.style.width="16";

          var aSpan = Ext.query("span", aSelector.dom)[1];
          aSpan.style.backgroundImage = "url("+aConfig.iconUrl+")";
          aSpan.style.backgroundPosition = "0 center";


          aPanel.body.dom.style.backgroundImage = "url(images/screen.jpg)";
          aPanel.body.dom.style.backgroundRepeat = "no-repeat";
          aPanel.body.dom.style.backgroundPosition = "left bottom";
          aPanel.body.dom.style.backgroundColor = "transparent";
        }
      };

      // Store the callbacks passed to the window
      m_aSuccessCallBack = aConfig.success;
      m_aFailureCallBack = aConfig.failure;
      // Scope for the callbacks is the passed scope or this
      m_aScope = aConfig.scope || this;


      // Create a new query text box
      m_aQueryBox = new Ext.form.TextField
      (
        {
          tabIndex: 1,
          autoWidth:true,
          fieldLabel: getString("ait_search_window_search"),
          cls : "boc-notebook-singlelinefield",
          listeners :
          {
            // Listener for the render event that focusses the text box on startup
            render: function (){this.focus(false, true);}
          }
        }
      );

      // Create a checkbox that expands the extended search area when checked
      m_aExtendedCheckBox = new Ext.form.Checkbox
      (
        {
          boxLabel: getString("ait_search_window_search_extended"),
          hideLabel : true,
          autoWidth : true,
          autoHeight: true,
          listeners:
          {
            // When the checkbox is checked, show the extended search panel
            check: fillExtendedSearchPanel
          }
        }
      );

      if (g_aSettings.showDiagrams !== false)
      {
        // Create a new two dimensional array as datastore for the drop down to search
        // for either diagrams or objects
        var aArr = [];
        aArr[aArr.length] =
        [
          getString("ait_search_window_diagrams"),AIT_ARTEFACT_DIAGRAM
        ];
        aArr[aArr.length] =
        [
          getString("ait_search_window_objects"),AIT_ARTEFACT_OBJECT
        ];

        // As the combobox' store we use a stimple store
        var aSearchTypeStore = new Ext.data.SimpleStore
        (
          {
            autoDestroy:true,
            // There are two fields in the data used to fill the box: val and text
            fields: ['text', 'val'],
            data: aArr
          }
        );
        // Create the searchtype drop down (lets us select whether we want to search
        // for objects of diagrams)
        m_aSearchTypeDropDown = new Ext.form.ComboBox
        (
          {
            fieldLabel: getString("ait_search_window_search_in"),
            valueField: 'val',
            displayField: 'text',
            mode: 'local',
            triggerAction: 'all',
            value: AIT_ARTEFACT_DIAGRAM,
            store: aSearchTypeStore,
            editable: false,
            autoShow:true,
            // NECESSARY OR VISUALIZATION BUGS IN FF WILL APPEAR
            lazyInit: false,
            listWidth:ENUM_WIDTH,
            width: ENUM_WIDTH,
            listeners:
            {
              // NECESSARY OR VISUALIZATION BUGS IN FF WILL APPEAR
              render:function()
              {
                var fixCombo = Ext.query("*[class=x-combo-list-inner]");
                for (var i=0; i < fixCombo.length; ++i)
                {
                  var el = Ext.get(fixCombo[i]);
                  el.setTop('0px');
                  el.setLeft('0px');
                }

                // Fill the dropdown showing classes or modeltypes initially
                //fillArtefactTypeDropDown();
              },
              // When an entry is selected here, we want to
              // fill the dropdown showing classes or modeltypes accordingly
              select : fillArtefactTypeDropDown
            }
          }
        );
      }




      // Create the artefact type drop down (lets us select for which class or
      // modeltype we want to search
      m_aArtefactTypeDropDown = new Ext.ux.IconCombo
      (
        {
          fieldLabel: getString("ait_search_window_restrict"),
          valueField: 'val',
          displayField: 'text',
          iconClsField: 'iconUrl',
          mode: 'local',
          triggerAction: 'all',
          // We use a simple store as data store for the icon combo
          store: new Ext.data.SimpleStore
          (
            {
              data : [],
              fields:['text','val', 'iconUrl']
            }
          ),
          editable: false,
          // NECESSARY OR VISUALIZATION BUGS IN FF WILL APPEAR
          lazyInit: false,
          width: ENUM_WIDTH,
          listWidth:ENUM_WIDTH,
          listeners:
          {
            // NECESSARY OR VISUALIZATION BUGS IN FF WILL APPEAR
            render:function (aCombo)
            {
              var fixCombo = Ext.query("*[class=x-combo-list-inner]");
              for (var i=0; i < fixCombo.length; ++i)
              {
                var el = Ext.get(fixCombo[i]);
                el.setTop('0px');
                el.setLeft('0px');
              }

              fillArtefactTypeDropDown ();
            },

            select : onArtefactTypeSelect
          }
        }
      );

      // Create the extended class panel that holds the extended search options for classes
      m_aExtendedClassPanel = createExtendedClassPanel ();

      var aSearchPanels = [];
      if (m_aSearchTypeDropDown)
      {
        aSearchPanels[aSearchPanels.length] =
        {
          title:"",
          border:false,
          layout:'form',
          autoHeight:true,
          width:280,
          items:
          [
            m_aSearchTypeDropDown
          ]
        };
      }
      aSearchPanels[aSearchPanels.length] =
      {
        title:"",
        border:false,
        layout:'form',
        autoHeight:true,
        width: 280,
        items:
        [
          m_aArtefactTypeDropDown
        ]
      };

      // Create the extended search panel that holds extended search options
      m_aExtendedPanel = new Ext.Panel
      (
        {
          title: "",
          layout: 'form',
          autoHeight:true,
          autoWidth:true,
          defaults:
          {
            autoHeight:true
          },
          style: 'padding-bottom:10px',
          collapsed: true,
          // The extended search panel contains another panel holding the dropdowns for the
          // search type (classes or diagrams) and the artefact type as well
          // as the extended class panel
          items:
          [
            new Ext.Panel
            (
              {
                title: "",
                border:false,
                bodyStyle: 'margin-left: 0px; padding-left: 0px; border-left-width: 0px; border-top-width:0px;margin-top:0px;padding-top:0px;border-bottom-width:0px;margin-bottom:0px;padding-bottom:0px',
                layout:'column',
                items: aSearchPanels
              }
            ),
            m_aExtendedClassPanel
          ]
        }
      );

      // Create the search button
      m_aSearchButton = new Ext.Button
      (
        {
          text: getString('ait_tools_explorer_tip_search'),
          handler: doSearch
        }
      );

      // Create the search panel
      m_aSearchPanel = new Ext.Panel
      (
        {
          labelAlign: 'top',
          title: getString("ait_search_window_criteria"),
          //titleCollapse: true,

          //collapsible: true,
          layout : "form",
          autoHeight:true,
          region:'north',
          items:
          [
            m_aQueryBox,
            m_aExtendedCheckBox,
            m_aExtendedPanel,
            m_aSearchButton
          ]
        }
      );

      // Add an eventhandler for the render event that makes sure that hitting the enter key
      // triggers the search functionality
      m_aSearchPanel.on("render", function (aPanel)
        {
          var aKeyMap = new Ext.KeyMap
          (
            aPanel.getEl(),
            {
              key: Ext.EventObject.ENTER,
              fn: doSearch,
              scope: that
            }
          );
        }
      );

      // Create a result panel in which we place the result grid
      m_aResultPanel = new Ext.Panel
      (
        {
          titleCollapse: true,
          title: getString("ait_search_window_result"),
          collapsible: true,
          bodyStyle: "padding:0px; margin:0px;",
          style: "padding:0px; margin:0px;",
          hidden:true,
          layout:'fit',
          region:'center',
          listeners:
          {
            afterlayout : function (aP)
            {
              if (aP.items.length > 0 && aP.getSize().height < 200)
              {
                aP.suspendEvents ();
                aP.setHeight (200);
                aP.resumeEvents ();
              }
            }
          }
        }
      );

      // Create the inner panel that holds the actual search panel
      m_aInnerPanel = new Ext.Panel
      (
        {
          title: "",
          region:'center',
          layout:'border',
          border:false,
          // Set autoscroll to true (fix for CR #050009)
          autoScroll:true,
          //style:'background-color:transparent;',
          listeners:
          {
            /*
              Handler for the search window's render event

              \param aPanel The rendered Panel
            */
            //--------------------------------------------------------------------
            render: function (aPanel)
            //--------------------------------------------------------------------
            {
              //aPanel.body.dom.style.backgroundImage = "url(images/screen.jpg)";
              aPanel.body.dom.style.backgroundRepeat = "no-repeat";
              aPanel.body.dom.style.backgroundPosition = "left bottom";
              aPanel.body.dom.style.backgroundColor = "transparent";
            }
          },
          items:
          [
            m_aSearchPanel,
            m_aResultPanel
          ]
        }
      );

      // Add the inner panel to the configuration's items
      aConfig.items =
      [
        m_aInnerPanel
      ];

      var aCIPanel = null;

      if (g_aSettings.offline)
      {
        var aCI = g_aCorporateIdentity [g_aSettings.lang];

        // Do not show the CI if we have a custom start page anyway
        if (aCI && !g_aSettings.showCustomStartpage)
        {
          var sCompName = aCI.company_name;
          var sAddress = aCI.adress;
          var sPostCode = aCI.postcode;
          var sWebLink = aCI.web_link;
          var sAddText1 = aCI.addtext1;
          var sAddText2 = aCI.addtext2;
          var nCILines = 1;

          sCIText = sCompName;
          if (!Ext.isEmpty (sAddress, null))
          {
            sCIText+="<br/>"+sAddress;
            ++nCILines;
          }
          if (!Ext.isEmpty (sPostCode, null))
          {
            sCIText+="<br/>"+sPostCode;
            ++nCILines;
          }
          if (!Ext.isEmpty (sWebLink))
          {
            sCIText+="<br/>"+sWebLink;
            ++nCILines;
          }
          if (!Ext.isEmpty (sAddText1))
          {
            sCIText+="<br/>"+sAddText1;
            ++nCILines;
          }
          if (!Ext.isEmpty (sAddText2))
          {
            sCIText+="<br/>"+sAddText2;
            ++nCILines;
          }



          aCIPanel = new Ext.Panel
          (
            {
              bodyStyle:'border-left-width:0px;border-right-width:0px;height:100%',
              height:Math.max (nCILines*20, 100),
              region:'north',

              items:
              [
                new Ext.BoxComponent
                (
                  {
                    autoEl:
                    {
                      tag:'table',
                      children:
                      [
                        {
                          tag:'tr',
                          children:
                          [
                            {
                              tag: 'td',
                              html:"<font style='font-size:10pt;font-family: arial,verdana,tahoma,arial,helvetica,sans-serif;'>"+sCIText+"</font>",
                              width:'100%'
                            },
                            {
                              tag:'td',
                              children:
                              [
                                {
                                  tag: 'img',
                                  align:'right',
                                  height:'80',
                                  src:'../'+aCI.header_icon
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  }
                )
              ]
            }
          );
          aConfig.items[0] = aCIPanel;
          aConfig.items[1] = m_aInnerPanel;
        }
      }



      // Create a new jsonreader
      var aReader = new Ext.data.JsonReader();



      // Call to the superclass' constructor
      boc.ait.search.SearchWindow.superclass.constructor.call(that, aConfig);


      // Now call an optional callback function provided by the calling component
      if (m_aSuccessCallBack && (typeof m_aSuccessCallBack == "function"))
      {
        m_aSuccessCallBack.apply(m_aScope, [that]);
      }
    }
    catch (aEx)
    {
      displayErrorMessage (aEx);
    }
  };

  // protected members:

  // Call to the constructor function to build the object
  buildObject();
};

// boc.ait.search.SearchWindow is derived from Ext.FormPanel
Ext.extend
(
  boc.ait.search.SearchWindow,
  Ext.FormPanel,
  {
  }
);

// Register the search Window's xtype
Ext.reg("boc-searchWindow", boc.ait.search.SearchWindow);
