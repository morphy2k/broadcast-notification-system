"use strict";

// # BNS init

// load modules
const fs = require('fs'),
    async = require("async"),
    db = require('./core/database'),
    routes = require('./core/routes'),
    scheduler = require('./core/scheduler');

//console.log('Dont close this window, unless you want to terminate the application!');

// write template list
fs.readdir('./views/templates', function(err, list) {
    if (err) {
        throw err;
    }
    var dirs = [];
    async.each(list, function(entry, callback) {
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

// check if blacklist need a cleanup
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
