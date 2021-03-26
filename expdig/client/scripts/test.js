// Overwrite the blank image url for the tree. This normally points to an url in the domain www.extjs.com
Ext.BLANK_IMAGE_URL = 'ext-2.2/images/ext/resources/images/aero/s.gif';  // 1.1
Ext.BLANK_IMAGE_URL = 'ext-2.2/resources/images/default/s.gif';  // 2.0

try
{
  // Define a handler for the Ext.onReady event
  Ext.onReady
  (
    function()
    {
      var cp = new Ext.ColorPalette({value:'993300'});
      cp.listeners =
      {
          select:function (){alert('bla');}
      };
      // initial selected color
      
      new Ext.Viewport
      (
        {
          layout:'border',
          items:
          [
            {
              title:'center',
              region:'center',
              items:
              [
                cp
              ]
            }
          ]
        }
      );

      cp.on("select", function(palette, selColor){alert(selColor);});
    }
  );
}
catch (aEx)
{
  alert (aEx);
}

