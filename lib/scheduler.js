"use strict";

// # scheduler

const db = require('./database');
const dashboard = require('./dashboard');
const notification = require('./notification');
const api = require('./api');

//* get/update dashboard data
setInterval(() => {
    dashboard.stats.push((callback) => {
        //console.log('update');
    });
}, 3000);

//* api/notification shedule
function notifications() {
    if (db.settings.get('notification.active').value()) {

        // notification controller
        var notificationID = setInterval(() => {
            notification((callback) => {
                console.log(callback);
            });
        }, db.settings.get('notification.duration').value());

        // twitch api
        var twitchID = setInterval(() => {
            api.twitch((callback) => {
                console.log(callback);
            });
        }, 10000);

        // streamlabs api
        var streamlabsID = setInterval(() => {
            api.streamlabs((callback) => {
                console.log(callback);
            });
        }, 10000);

        // stop machines
        module.exports.stopInt = () => {
            clearInterval(notificationID);
            clearInterval(twitchID);
            clearInterval(streamlabsID);

            console.log('Notifications has been stoped!');
        };

        console.log('Notifications has been started');
    } else {
        console.log('Notifications stoped!');
    }
}

notifications();
exports.notifications = notifications;

// blacklist clearing
setInterval(() => {
    var time = new Date(),
        cleared = new Date(db.blacklist.get('cleared').value());

    cleared.setHours(cleared.getHours() + 1);

    if (time > cleared || cleared == 'Invalid Date') {
        db.blacklist.get('list').remove().value();
        db.blacklist.assign({
            cleared: new Date()
        }).value();
    }
}, 3660000);
