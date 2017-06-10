'use strict';

const db = require('./database');
const stats = require('./dashboard/stats');
const authentication = require('./authentication');
const notification = require('./notification');
const api = require('./api');


class Scheduler {
  constructor() {

    this.durations = {
      notification: 10000,
      stats: 10000,
      jwt: 1800000,
      blacklist: 3660000,

      // apis
      twitch: 10000,
      streamlabs: 10000
    };

    this.system();
    this.notifications();
    this.api('twitch');
    this.api('streamlabs');

  }

  system() {

    setInterval(() => stats.push(), this.durations.stats);
    setInterval(() => authentication.ifExpired(), this.durations.jwt);
    setInterval(() => notification.clearBlacklist(), this.durations.blacklist);

  }

  async notifications() {

    const enabled = db.settings.get('notification.enabled').value();

    this.durations.notification = db.settings.get('notification.duration').value();

    if (enabled) {
      await notification.check();
      setTimeout(() => this.notifications(), this.durations.notification);
    }

  }

  async api(name) {

    const enabled = db.settings.get(`api.${name}.enabled`).value();

    if (enabled) {
      await api[name].check();
      setTimeout(() => this.api(name), this.durations[name]);
    }

  }

}

const scheduler = new Scheduler();
module.exports = scheduler;
