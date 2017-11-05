'use strict';

const moment = require('moment');

const db = require('../../database');
const authentication = require('./authentication');
const version = require('../../../package.json').version;

const Donations = require('./donations');


class Streamlabs {
  constructor() {
    if (db.settings.get('api.streamlabs.auth.token').value() && !this.token) this.init();
  }

  init() {
    this.token = db.settings.get('api.streamlabs.auth.token').value();
    this.currency = db.settings.get('api.streamlabs.currency').value();
    this.options = {
      headers: {
        'User-Agent': `BroadcastNotificationSystem/${version}`
      },
      qs: {
        access_token: this.token,
        limit: 15
      }
    };

    this.donations = new Donations(this.options);
  }

  check() {
    return new Promise(async resolve => {

      const expDate = db.settings.get('api.streamlabs.auth.expiration_date').value(),
        date = Math.floor(Date.now() / 1000);

      if (!this.token) {

        console.error(new Error('Streamlabs authentication not set!'));
        resolve();

      } else if (date > expDate) {

        try {
          await authentication.refresh();
        } catch (e) {
          console.error(new Error(e));
        }

        this.init();

        resolve();

      } else {

        if (db.stats.get('week').value() === moment().isoWeek()) {

          const donations = this.get('donations');

          Promise.all([donations]).then(data => {

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

    db.queue.get('donations').set('last', null).write();

    const reset = [0, 0, 0, 0, 0, 0, 0];

    db.stats.get('donations').assign({
      count: reset,
      amount: reset
    }).write();
  }

}

const streamlabs = new Streamlabs();
module.exports = streamlabs;
