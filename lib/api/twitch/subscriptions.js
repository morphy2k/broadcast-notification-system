'use strict';

const request = require('request-promise-native');
const moment = require('moment');

const db = require('../../database');


class Subscriptions {
  constructor(userId, options) {
    this.options = Object.assign({}, options);
    this.options.uri = `https://api.twitch.tv/kraken/channels/${userId}/subscriptions`;
  }

  async check() {
    const type = db.settings.get(`api.twitch.type`).value();

    if (type !== 'affiliate' && type !== 'partner') return null;

    let data;
    try {
      data = await this.worker();
    } catch (e) {
      return Promise.reject(e);
    }

    if (data) {
      db.queue.get('subscriptions').set('last', data.arr[0].date).write();

      data.arr.reverse();

      db.stats.get('subscriptions').assign(data.week).write();

      return {
        type: 'subscriptions',
        arr: data.arr
      };
    } else {
      return null;
    }
  }

  worker() {

    let arr = [],
      week = db.stats.get('subscriptions').value(),
      options = this.options,
      last = db.queue.get('subscriptions.last').value();

    if (!last) {
      last = moment().startOf('isoWeek')._d;
      db.queue.get('subscriptions').set('last', last).write();
    }
    last = new Date(last);


    const get = async next => {

      if (next) options.qs.offset = options.qs.offset + options.qs.limit;

      try {
        return parse(await request(options));
      } catch (err) {
        return Promise.reject(err);
      }

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
            return {
              arr,
              week
            };
          } else {
            return null;
          }

          if (i === length && length >= options.qs.limit) {
            return get(true);
          } else if (i === length) {
            return {
              arr,
              week
            };
          }

          i = i + 1;
        }
      } else {
        return null;
      }
    };

    return get();
  }

}

module.exports = Subscriptions;
