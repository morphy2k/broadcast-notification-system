'use strict';

const request = require('request');
const moment = require('moment');

const db = require('../../database');


class Donations {
    constructor(options) {
        this.url = 'https://www.streamlabs.com/api/v1.0/donations';
        this.options = options;
    }

    check(callback) {

        let arr = [],
            statsCount = db.stats.get('donations.count').value(),
            statsAmount = db.stats.get('donations.amount').value(),
            last = new Date(db.queue.get('donations.last').value()).toISOString(),
            options = this.options;

        function get(next) {

            if (next) {
                Object.assign(options.qs, {
                    after: next
                });
            }

            request(this.url, options, (err, response, body) => {
                if (err) {
                    console.error(new Error(`[TWITCH DONATIONS] ${err}`));
                    callback(null);
                } else if (response.statusCode == 200) {
                    parse(body);
                } else {
                    console.error(new Error(`[TWITCH DONATIONS] HTTP ${response.statusCode}`));
                    callback(null);
                }
            });
        }
        get();

        function parse(body) {

            let json = JSON.parse(body),
                donations = json.data,
                i = 0,
                length = donations.length,
                statsCount = db.stats.get('donations.count').value(),
                statsAmount = db.stats.get('donations.amount').value();

            if (length) {
                for (let donation of donations) {

                    let id = parseInt(donation.donation_id),
                        name = donation.name,
                        date = new Date(donation.created_at).toISOString(),
                        amount = parseInt(donation.amount),
                        message = donation.message,
                        currency = donation.currency;

                    // check if newer
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
                        send();
                        break;
                    } else {
                        callback(null);
                        break;
                    }

                    i = i + 1;

                    if (i === length && length >= options.qs.limit) {
                        get(id);
                    } else if (i === length) {
                        send();
                    }
                }
            } else {
                callback(null);
            }
        }

        function send() {

            db.queue.get('donations').assign({
                last: new Date(arr[0].created_at).toISOString()
            }).write();

            arr.reverse();

            db.stats.get('donations').assign(statsCount).write();
            db.stats.get('amount').assign(statsAmount).write();

            callback(arr);
        }

    }
}

module.exports = Donations;
