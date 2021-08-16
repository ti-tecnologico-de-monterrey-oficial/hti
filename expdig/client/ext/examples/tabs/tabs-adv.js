/*
This file is part of Ext JS 3.4

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

Commercial Usage
Licensees holding valid commercial licenses may use this file in accordance with the Commercial
Software License Agreement provided with the Software or, alternatively, in accordance with the
terms contained in a written agreement between you and Sencha.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-04-03 15:07:25
*/
Ext.onReady(function(){

    var tabs = new Ext.TabPanel({
        renderTo:'tabs',
        resizeTabs:true, // turn on tab resizing
        minTabWidth: 115,
        tabWidth:135,
        enableTabScroll:true,
        width:600,
        height:250,
        defaults: {autoScroll:true},
        plugins: new Ext.ux.TabCloseMenu()
    });

    // tab generation code
    var index = 0;
    while(index < 7){
        addTab();
    }
    function addTab(){
        tabs.add({
            title: 'New Tab ' + (++index),
            iconCls: 'tabs',
            html: 'Tab Body ' + (index) + '<br/><br/>'
                    + Ext.example.bogusMarkup,
            closable:true
        }).show();
    }

    new Ext.Button({
        text: 'Add Tab',
        handler: addTab,
        iconCls:'new-tab'
    }).render(document.body, 'tabs');
});