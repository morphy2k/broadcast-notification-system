'use strict';

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

  async check() {
    const expDate = db.settings.get('api.streamlabs.auth.expiration_date').value(),
      date = Math.floor(Date.now() / 1000);

    if (!this.token) {

      console.error(new Error('Streamlabs authentication not set!'));
      return;

    } else if (date > expDate) {

      try {
        await authentication.refresh();
      } catch (e) {
        console.error(new Error(e));
      }

      this.init();

      return;

    } else {

      const donations = this.get('donations');

      const data = await Promise.all([donations]);

      const push = obj => {
        for (let el of obj.arr) {
          db.queue.get(`${obj.type}.list`).push(el).write();
        }
      };

      for (let obj of data) {
        if (obj) push(obj);
      }

      return;

    }
  }

  async get(type) {
    let data;

    if (db.settings.get(`notification.types.${type}`).value()) {
      try {
        data = await this[type].check();
      } catch (e) {
        console.error(new Error(e));
        return null;
      }
    } else {
      return null;
    }

    return data;
  }

}

const streamlabs = new Streamlabs();
module.exports = streamlabs;
