"use strict";

//# BNS init

const fs = require('fs');
const each = require("async/each");
const db = require('./database');
const routes = require('./routes');
const scheduler = require('./scheduler');

// write template list
fs.readdir('./views/templates', (err, list) => {
    if (err) throw err;

    var dirs = [];
    each(list, (entry, callback) => {
        if (entry.indexOf('.') !== -1 !== true) {
            dirs.push(entry);
        }
        callback();
    }, (err) => {
        if (err) throw err;
        db.settings
            .get('notification.template.list')
            .assign(dirs)
            .write();
    });
});
