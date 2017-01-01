"use strict";

// # BNS init

// load modules
const fs = require('fs'),
    each = require("async/each"),
    db = require('./database'),
    routes = require('./routes'),
    scheduler = require('./scheduler');

// write template list
fs.readdir('./views/templates', function(err, list) {
    if (err) {
        throw err;
    }
    var dirs = [];
    each(list, function(entry, callback) {
        if (entry.indexOf('.') !== -1 !== true) {
            dirs.push(entry);
        }
        callback();
    }, function(err) {
        if (err) {
            throw err;
        }
        db.settings
            .get('notification.template.list')
            .assign(dirs)
            .value();
    });
});

// check if blacklist need a cleanup on start
function clearBL() {
    var time = new Date(),
        cleared = new Date(db.blacklist.get('cleared').value());

    cleared.setHours(cleared.getHours() + 1);

    if (time > cleared || cleared == 'Invalid Date') {
        db.blacklist.get('list').remove().value();
        db.blacklist.assign({
            cleared: new Date()
        }).value();
    }
}

clearBL();
