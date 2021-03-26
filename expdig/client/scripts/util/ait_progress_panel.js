/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author MWh
This file contains the code for the boc.ait.util.ProgressPanel class.
**********************************************************************
*/
Ext.namespace("boc.ait.util");

boc.ait.util.ProgressPanel = function (aConfig)
{
  aConfig = aConfig || this;
  
  var m_aStates = aConfig.states;
  
  var m_aProgressBar = new Ext.ProgressBar
  (
    {
      text:getString(m_aStates[0].label)
    }
  );
  
  var m_sId = Ext.id();
  
  var m_sStatusHTML = "<table style='padding:10px;'>";
  
  for (var i = 0; i < m_aStates.length;++i)
  {
    m_sStatusHTML+="<tr height='20px'><td><img id='"+m_sId+"_state_"+i+"' src=";
    
    if (i === 0)
    {
      m_sStatusHTML +=  "'ext/resources/images/default/grid/loading.gif'";
    }
    else
    {
      m_sStatusHTML += "'"+Ext.BLANK_IMAGE_URL+"' ";
    }
    m_sStatusHTML += "/></td><td><p style='width:400px;margin:5px;'>"+getString(m_aStates[i].label)+"</p></td></tr>";
  }
  m_sStatusHTML+="</table>";
  
  aConfig.autoHeight = true;
  
  var m_aStatusContainer = new Ext.Container
  (
    {
      html:m_sStatusHTML
    }
  );
  
  aConfig.items = 
  [
    m_aStatusContainer,
    m_aProgressBar
  ];
  
  function _changeStateVisualization (sState)
  {
    checkParamNull (sState, "string");
    
    var i = 0;
    if (sState)
    {
      var bFound = false;
      for (i = 0; i < m_aStates.length;++i)
      {
        if (m_aStates[i].id === sState)
        {
          bFound = true;
          break;
        }
      }
      if (!bFound)
      {
        return;
      }
    }   
    
    for (i = 0; i < m_aStates.length;++i)
    {
      var aEl = Ext.DomQuery.selectNode("*[id="+m_sId+"_state_"+i+"]", this.getEl().dom);
      
      if (aEl)
      {
        if (sState !== m_aStates[i].id)
        {
          aEl.setAttribute("src", "images/ok_16.gif");
        }
      }
      
      if (sState === m_aStates[i].id)
      {
        if (aEl)
        {
          aEl.setAttribute("src", "ext/resources/images/default/grid/loading.gif");
        }
        
        break;
      }
    }
    var nPercentage = (i/m_aStates.length);
    m_aProgressBar.updateProgress (nPercentage, Math.round(nPercentage*100)+"% completed");
  }
  
  boc.ait.util.ProgressPanel.superclass.constructor.call (this, aConfig);
  
  this.on("afterrender", function ()
    {
      this.advanceTo (m_aStates[0].id);
    },
    this
  );
  
  this._advanceTo = function (sState)
  {
    _changeStateVisualization.call (this, sState);
    aConfig.iteratorFn.defer ( aConfig.interval || 1000, this);
  };
  
  this._finish = function ()
  {
    _changeStateVisualization.call (this);
    aConfig.finishFn.defer (500, this);
  };
};

Ext.extend
(
  boc.ait.util.ProgressPanel,
  Ext.Container,
  {
    advanceTo: function (sState)
    {
      this._advanceTo (sState);
    },
    
    finish: function ()
    {
      this._finish ();
    }
  }
);