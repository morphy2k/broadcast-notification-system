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

      let data;

      try {
        data = await this.worker();
      } catch (e) {
        return reject(e);
      }

      if (data) {
        db.queue.get('subs').assign({
          last: new Date(data.arr[0].date).toISOString()
        }).write();

        data.arr.reverse();

        db.stats.get('subs').assign(data.week).write();

        resolve(data.arr);
      } else {
        resolve(null);
      }

    });
  }

  worker() {
    return new Promise((resolve, reject) => {

      const url = this.url;
      const last = new Date(db.queue.get('subs.last').value()).toISOString();

      let arr = [],
        week = db.stats.get('subs').value(),
        options = this.options;


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

        let json = JSON.parse(body),
          subscriptions = json.subscriptions,
          i = 0,
          length = subscriptions.length;

        if (length) {
          for (let subscription of subscriptions) {

            let id = parseInt(subscription.user._id),
              name = subscription.user.display_name,
              date = new Date(subscription.created_at).toISOString(),
              resubs = Math.round(moment(date).diff(moment(new Date().toISOString()), 'months', true));

            if (date > last) {

              arr.push({
                id,
                name,
                date,
                resubs
              });

              let day = moment(date).isoWeekday() - 1;
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

            i = i + 1;

            if (i === length && length >= options.qs.limit) {
              get(true);
            } else if (i === length) {
              resolve({
                arr,
                week
              });
            }
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
