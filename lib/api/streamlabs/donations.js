'use strict';

const request = require('request-promise-native');
const moment = require('moment');

const db = require('../../database');


class Donations {
  constructor(options) {
    this.options = Object.assign({}, options);
    this.options.uri = 'https://www.streamlabs.com/api/v1.0/donations';
  }

  async check() {

    let data;
    try {
      data = await this.worker();
    } catch (e) {
      return Promise.reject(e);
    }

    if (data) {
      db.queue.get('donations').set('last', data.arr[0].date).write();

      data.arr.reverse();

      db.stats.get('donations.count').assign(data.statsCount).write();
      db.stats.get('donations.amount').assign(data.statsAmount).write();

      return {
        type: 'donations',
        arr: data.arr
      };
    } else {
      return null;
    }
  }

  worker() {

    let arr = [],
      statsCount = db.stats.get('donations.count').value(),
      statsAmount = db.stats.get('donations.amount').value(),
      options = this.options,
      last = db.queue.get('donations.last').value();

    if (!last) {
      last = moment().startOf('isoWeek')._d;
      db.queue.get('donations').set('last', last).write();
    }
    last = new Date(last);


    const get = async next => {

      if (next) Object.assign(options.qs, {
        after: next
      });

      try {
        return parse(await request(options));
      } catch (err) {
        return Promise.reject(err);
      }

    };


    const parse = body => {

      const json = JSON.parse(body),
        donations = json.data,
        length = donations.length;

      let i = 1;

      if (length) {
        for (let donation of donations) {

          const id = parseInt(donation.donation_id),
            name = donation.name,
            date = new Date(moment(donation.created_at, 'X').format()),
            amount = parseInt(donation.amount),
            message = donation.message,
            currency = donation.currency;

          if (date > last) {

            arr.push({
              id,
              name,
              amount,
              message,
              date,
              currency
            });

            const day = moment(date).isoWeekday() - 1;
            statsCount[day] = statsCount[day] + 1;
            statsAmount[day] = statsAmount[day] + amount;

          } else if (arr.length) {
            return {
              arr,
              statsCount,
              statsAmount
            };
          } else {
            return null;
          }

          if (i === length && length >= options.qs.limit) {
            return get(id);
          } else if (i === length) {
            return {
              arr,
              statsCount,
              statsAmount
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

module.exports = Donations;
