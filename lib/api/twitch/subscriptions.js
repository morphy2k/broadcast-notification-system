'use strict';

const request = require('request');
const moment = require('moment');

const db = require('../../database');


class Subscriptions {
  constructor(userId, options) {
    this.url = `https://api.twitch.tv/kraken/channels/${userId}/subscriptions`;
    this.options = options;
  }

  check() {
    return new Promise(async(resolve, reject) => {

      const type = db.settings.get(`api.twitch.type`).value();

      if (type !== 'affiliate' && type !== 'partner') return resolve(null);


      let data;

      try {
        data = await this.worker();
      } catch (e) {
        return reject(e);
      }

      if (data) {
        db.queue.get('subscriptions').set('last', data.arr[0].date).write();

        data.arr.reverse();

        db.stats.get('subscriptions').assign(data.week).write();

        resolve({
          type: 'subscriptions',
          arr: data.arr
        });
      } else {
        resolve(null);
      }

    });
  }

  worker() {
    return new Promise((resolve, reject) => {

      const url = this.url;

      let arr = [],
        week = db.stats.get('subscriptions').value(),
        options = this.options,
        last = db.queue.get('subscriptions.last').value();

      if (!last) {
        last = moment().startOf('isoWeek')._d;
        db.queue.get('subscriptions').set('last', last).write();
      }
      last = new Date(last);


      const get = next => {

        if (next) options.qs.offset = options.qs.offset + options.qs.limit;

        request(url, options, (err, response, body) => {
          if (err) {
            reject(err);
          } else if (response.statusCode === 200) {
            parse(body);
          } else {
            reject(`[TWITCH SUBS] HTTP ${response.statusCode}`);
          }
        });
      };

      const parse = body => {

        const json = JSON.parse(body),
          subscriptions = json.subscriptions,
          length = subscriptions.length;

        let i = 1;

        if (length) {
          for (let subscription of subscriptions) {

            const id = parseInt(subscription.user._id),
              name = subscription.user.name,
              display_name = subscription.user.display_name,
              date = new Date(subscription.created_at),
              resubs = Math.round(moment(date).diff(moment(new Date()), 'months', true));

            if (date > last) {

              arr.push({
                id,
                name,
                display_name,
                date,
                resubs
              });

              const day = moment(date).isoWeekday() - 1;
              week[day] = week[day] + 1;

            } else if (arr.length) {
              resolve({
                arr,
                week
              });
              break;
            } else {
              resolve(null);
              break;
            }

            if (i === length && length >= options.qs.limit) {
              get(true);
            } else if (i === length) {
              resolve({
                arr,
                week
              });
            }

            i = i + 1;
          }
        } else {
          resolve(null);
        }
      };

      get();

    });
  }

}

module.exports = Subscriptions;
