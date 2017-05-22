'use strict';

const db = require('./database');
const dashboard = require('./dashboard');
const authentication = require('./authentication');
const notification = require('./notification');
const api = require('./api');


class Scheduler {
    constructor() {
        this.notiDuration = db.settings.get('notification.duration').value();
        this.twitchDuration = 10000;
        this.streamlabsDuration = 10000;

        this.updateStats();
        this.jwtCheck();
        this.blacklist();
        this.notifications();
        this.twitchAPI();
        this.streamlabsAPI();
    }

    updateStats() {
        dashboard.stats.update();
        setTimeout(() => this.updateStats(), 10000);
    }

    jwtCheck() {
        authentication.ifExpired();
        setTimeout(() => this.jwtCheck(), 1800000);
    }

    blacklist() {
        notification.clearBlacklist();
        setTimeout(() => this.blacklist(), 3660000);
    }

    notifications() {
        let notificationON = db.settings.get('notification.enabled').value();

        if (notificationON) {
            notification.check(() => {
                setTimeout(() => this.notifications(), this.notiDuration);
            });
        }
    }

    twitchAPI() {
        let twitchON = db.settings.get('api.twitch.enabled').value();

        if (twitchON) {
            api.twitch.check(() => {
                setTimeout(() => this.twitchAPI(), this.twitchDuration);
            });
        }
    }

    streamlabsAPI() {
        let streamlabsON = db.settings.get('api.streamlabs.enabled').value();

        if (streamlabsON) {
            api.streamlabs.check(() => {
                setTimeout(() => this.streamlabsAPI(), this.streamlabsDuration);
            });
        }
    }

}

const scheduler = new Scheduler();
module.exports = scheduler;
