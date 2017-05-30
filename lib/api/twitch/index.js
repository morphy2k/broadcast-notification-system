'use strict';

const moment = require('moment');

const config = require('../../../config');
const db = require('../../database');
const version = require('../../../package.json').version;

const Follows = require('./follows');
const Subscriptions = require('./subscriptions');
const Hosts = require('./hosts');


class Twitch {
  constructor() {

    this.userId;
    this.options;

    this.follows;
    this.subscriptions;
    this.hosts;

    if (db.settings.get('api.twitch.userid').value() &&
      db.settings.get('api.twitch.auth.token').value()) this.init();

  }

  init() {

    this.userId = db.settings.get('api.twitch.userid').value();
    this.options = {
      headers: {
        'User-Agent': `BroadcastNotificationSystem/${version} (TwitchModule)`,
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Client-ID': config.api.twitch.client_id,
        'Authorization': `OAuth ${db.settings.get('api.twitch.auth.token').value()}`
      },
      qs: {
        limit: 15,
        offset: 0,
        direction: 'desc'
      }
    };

    this.follows = new Follows(this.userId, this.options);
    this.subscriptions = new Subscriptions(this.userId, this.options);
    this.hosts = new Hosts(this.userId);

  }

  check() {
    return new Promise(resolve => {

      const follows = twitch.checkFollows();
      const subscriptions = twitch.checkSubscriptions();
      const hosts = twitch.checkHosts();

      if (db.stats.get('week').value() === moment().isoWeek()) {

        Promise.all([follows, subscriptions, hosts]).then(data => {
          // follows
          if (data[0]) {
            for (let obj of data[0]) {
              db.queue.get('follows.list').push(obj).write();
            }
          }
          // subs
          if (data[1]) {
            for (let obj of data[1]) {
              db.queue.get('subs.list').push(obj).write();
            }
          }
          // hosts
          if (data[2]) {
            for (let obj of data[2]) {
              db.queue.get('hosts.list').push(obj).write();
            }
          }

          resolve();

        });

      } else {

        this.setStats();
        console.info('Week set & datasets cleared');

        resolve();
      }
    });

  }

  checkFollows() {
    return new Promise(async resolve => {

      let data;

      if (db.settings.get('notification.types.follows').value()) {
        try {
          data = await this.follows.check();
        } catch (e) {
          console.error(new Error(e));
          return resolve(null);
        }
      } else {
        return resolve(null);
      }

      resolve(data);

    });
  }

  checkSubscriptions() {
    return new Promise(async resolve => {

      let data;

      if (db.settings.get('notification.types.subscriptions').value()) {
        try {
          data = await this.subscriptions.check();
        } catch (e) {
          console.error(new Error(e));
          return resolve(null);
        }
      } else {
        return resolve(null);
      }

      resolve(data);

    });
  }

  checkHosts() {
    return new Promise(async resolve => {

      let data;

      if (db.settings.get('notification.types.hosts').value()) {
        try {
          data = await this.hosts.check();
        } catch (e) {
          console.error(new Error(e));
          return resolve(null);
        }
      } else {
        return resolve(null);
      }

      resolve(data);

    });
  }

  setStats() {

    let week = moment().isoWeek(),
      startOfWeek = moment().startOf('isoWeek')._d;

    db.stats.assign({
      week: week
    }).write();

    db.queue.get('follows').assign({
      last: startOfWeek
    }).write();
    db.queue.get('subs').assign({
      last: startOfWeek
    }).write();

    db.stats.get('follows').assign([0, 0, 0, 0, 0, 0, 0]).write();
    db.stats.get('subs').assign([0, 0, 0, 0, 0, 0, 0]).write();
    db.stats.get('hosts').assign([0, 0, 0, 0, 0, 0, 0]).write();
  }

}

const twitch = new Twitch();
module.exports = twitch;
