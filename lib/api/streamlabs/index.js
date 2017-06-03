'use strict';

const moment = require('moment');

const db = require('../../database');
const authentication = require('./authentication');
const version = require('../../../package.json').version;

const Donations = require('./donations');


class Streamlabs {
  constructor() {

    this.token;
    this.currency;
    this.options;

    this.init();

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
        limit: 15,
        currency: this.currency
      }
    };

    this.donations = new Donations(this.options);

  }

  check() {
    return new Promise(resolve => {

      let expDate = new Date(db.settings.get('api.streamlabs.auth.expiration_date').value()),
        date = new Date();

      if (date > expDate) {
        authentication.refresh();
        resolve();

      } else {
        if (db.stats.get('week').value() === moment().isoWeek()) {

          const donations = streamlabs.get('donations');

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
    let week = moment().isoWeek(),
      startOfWeek = moment().startOf('isoWeek')._d;

    db.stats.assign({
      week: week
    }).write();

    db.queue.get('donations').assign({
      last: startOfWeek
    }).write();

    db.stats.get('donations').assign({
      count: [0, 0, 0, 0, 0, 0, 0],
      amount: [0, 0, 0, 0, 0, 0, 0]
    }).write();
  }
}

const streamlabs = new Streamlabs();
module.exports = streamlabs;
