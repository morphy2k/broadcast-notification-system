'use strict';

const request = require('request');
const moment = require('moment');

const db = require('../../database');


class Donations {
  constructor(options) {

    this.url = 'https://www.streamlabs.com/api/v1.0/donations';
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
        db.queue.get('donations').assign({
          last: new Date(data.arr[0].created_at).toISOString()
        }).write();

        data.arr.reverse();

        db.stats.get('donations').assign(data.statsCount).write();
        db.stats.get('amount').assign(data.statsAmount).write();

        resolve({
          type: 'donations',
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
      const last = new Date(db.queue.get('donations.last').value()).toISOString();

      let arr = [],
        statsCount = db.stats.get('donations.count').value(),
        statsAmount = db.stats.get('donations.amount').value(),
        options = this.options;


      const get = next => {

        if (next) {
          Object.assign(options.qs, {
            after: next
          });
        }

        request(url, options, (err, response, body) => {
          if (err) {
            reject(err);
          } else if (response.statusCode === 200) {
            parse(body);
          } else {
            reject(`[TWITCH DONATIONS] HTTP ${response.statusCode}`);
          }
        });
      };


      const parse = body => {

        let json = JSON.parse(body),
          donations = json.data,
          i = 0,
          length = donations.length - 1;

        if (length) {
          for (let donation of donations) {

            let id = parseInt(donation.donation_id),
              name = donation.name,
              date = new Date(donation.created_at).toISOString(),
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

              let day = moment(date).isoWeekday() - 1;
              statsCount[day] = statsCount[day] + 1;
              statsAmount[day] = statsAmount[day] + amount;

            } else if (arr.length) {
              resolve({
                arr,
                statsCount,
                statsAmount
              });
              break;
            } else {
              resolve(null);
              break;
            }

            i = i + 1;

            if (i === length && length >= options.qs.limit) {
              get(id);
            } else if (i === length) {
              resolve({
                arr,
                statsCount,
                statsAmount
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

module.exports = Donations;
