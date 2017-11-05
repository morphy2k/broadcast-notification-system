'use strict';

const moment = require('moment');

const config = require('../../../config');
const db = require('../../database');
const authentication = require('./authentication');
const version = require('../../../package.json').version;

const Follows = require('./follows');
const Subscriptions = require('./subscriptions');
const Hosts = require('./hosts');


class Twitch {
  constructor() {
    if (db.settings.get('api.twitch.auth.token').value() &&
      !this.token) this.init();
  }

  init() {
    this.userId = db.settings.get('api.twitch.userid').value();
    this.token = db.settings.get('api.twitch.auth.token').value();
    this.options = {
      headers: {
        'User-Agent': `BroadcastNotificationSystem/${version} (TwitchModule)`,
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Client-ID': config.api.twitch.client_id,
        'Authorization': `OAuth ${this.token}`
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
    return new Promise(async resolve => {

      const expDate = db.settings.get('api.twitch.auth.expiration_date').value(),
        date = Math.floor(Date.now() / 1000);

      if (!this.token) {

        console.error(new Error('Twitch authentication not set!'));
        resolve();

      } else if (expDate && date > expDate) {

        try {
          await authentication.refresh();
        } catch (e) {
          console.error(new Error(e));
        }

        this.init();

        resolve();

      } else {

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

      }
    });

  }

  get(type) {
    return new Promise(async resolve => {

      let data;

      if (db.settings.get(`notification.types.${type}`).value()) {

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
    db.stats.set('week', moment().isoWeek()).write();

    db.queue.get('follows').set('last', null).write();
    db.queue.get('subscriptions').set('last', null).write();

    const types = [
      'follows',
      'subscriptions',
      'hosts'
    ];

    for (let type of types) {
      db.stats.get(type).assign([0, 0, 0, 0, 0, 0, 0]).write();
    }
  }

}

const twitch = new Twitch();
module.exports = twitch;
