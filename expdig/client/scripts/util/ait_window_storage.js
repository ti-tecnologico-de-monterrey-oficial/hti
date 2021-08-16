/*********************************************************************
\note Copyright\n
This file is part of ADOxx Web.\n
(C) COPYRIGHT BOC - Business Objectives Consulting 1995 - 2011\n
All Rights Reserved\n
Use, duplication or disclosure restricted by BOC Information Systems\n
Vienna, 1995 - 2011
**********************************************************************
\author DPE
This file contains varants that are used by most ADOit scripts and
components.
It should be included by every dialog and every overlay.
**********************************************************************
*/

Ext.namespace('boc.ait.util');

/**
 * @author dperic
 */
boc.ait.util.WindowStorage = function ()
{
  /* --------- Private Properties --------- */
  var dataContainer = {};

  /* --------- Private Methods --------- */
  function linearize ()
  {
    var string = "", name, value;
    for (name in dataContainer)
    {
      name = encodeURIComponent(name);
      value = encodeURIComponent(dataContainer[name]);
      string += name + "=" + value + "&";
    }
    if (string !== "") 
    {
      string = string.substring(0, string.length - 1);
    }
    return string;
  }

  function read ()
  {
    if (window.name === '' || window.name.indexOf("=") === -1)
    {
      return;
    }
    var pairs = window.name.split("&");
    var pair, name, value;
    for (var i = 0; i < pairs.length; i++)
    {
      if (pairs[i] === "")
      {
        continue;
      }
      pair = pairs[i].split("=");
      name = decodeURIComponent(pair[0]);
      value = decodeURIComponent(pair[1]);
      dataContainer[name] = value;
    }
  }

  function write ()
  {
    window.name = linearize();
  }

  /* --------- Public Methods --------- */
  this.set = function (name, value)
  {
    dataContainer[name] = value;
    write();
  };

  this.get = function (name)
  {
    var returnValue = dataContainer[name];
    return returnValue;
  };

  this.getAll = function ()
  {
    return dataContainer;
  };

  this.remove = function (name)
  {
    if (typeof(dataContainer[name]) !== "undefined") 
    {
      delete dataContainer[name];
    }
    write();
  };

  this.removeAll = function ()
  {
    dataContainer = {};
    write();
  };

  /* --------- Construction --------- */

  read();
};

var WindowStorage = new boc.ait.util.WindowStorage();
