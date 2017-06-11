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
    if (db.settings.get('api.twitch.userid').value() &&
      !this.userId) this.init();
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

      if (db.stats.get('week').value() === moment().isoWeek()) {

        const follows = this.get('follows');
        const subscriptions = this.get('subscriptions');
        const hosts = this.get('hosts');

        Promise.all([follows, subscriptions, hosts]).then(data => {

          const push = obj => {
            for (let el of obj.arr) {
              db.queue.get(`${obj.type}.list`).push(el).write();
            }
          };

          for (let obj of data) {
            if (obj) push(obj);
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

  get(type) {
    return new Promise(async resolve => {

      let data;

      if (db.settings.get(`notification.types.${type}`).value()) {

        if (type === 'subscriptions' &&
          !db.settings.get(`api.twitch.partner`).value()) return resolve(null);

        try {
          data = await this[type].check();
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

    const week = moment().isoWeek(),
      startOfWeek = moment().startOf('isoWeek')._d;

    db.stats.set('week', week).write();

    db.queue.get('follows').set('last', startOfWeek).write();
    db.queue.get('subscriptions').set('last', startOfWeek).write();

    db.stats.get('follows').assign([0, 0, 0, 0, 0, 0, 0]).write();
    db.stats.get('subscriptions').assign([0, 0, 0, 0, 0, 0, 0]).write();
    db.stats.get('hosts').assign([0, 0, 0, 0, 0, 0, 0]).write();
  }

}

const twitch = new Twitch();
module.exports = twitch;
