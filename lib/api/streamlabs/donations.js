"use strict";

const whilst = require("async/whilst");
const request = require('request');
const moment = require('moment');
const db = require('../../database');


module.exports = (callback, options) => {

    var last = new Date(db.queue.get('donations.last').value()).toISOString();

    request('https://www.streamlabs.com/api/v1.0/donations',
        options, (err, response, body) => {

            if (err) {
                console.log(err);
                callback(null, 0);
            } else if (response.statusCode == 200) {

                let json = JSON.parse(body),
                    donations = json.data,
                    i = 0,
                    length = donations.length,
                    array = [],
                    statsCount = db.stats.get('donations.count').value(),
                    statsAmount = db.stats.get('donations.amount').value();

                if (length) {
                    whilst(() => {
                            return i < length;
                        },
                        (callback) => {
                            let donation = donations[i],
                                id = parseInt(donation.donation_id),
                                name = donation.name,
                                date = new Date(donation.created_at).toISOString(),
                                amount = parseInt(donation.amount),
                                message = donation.message,
                                currency = donation.currency;

                            // check if newer
                            if (date > last) {

                                array.push({
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

                            } else {
                                length = 0;
                            }

                            i = i + 1;
                            callback(null, i);
                        },
                        (err, n) => {
                            if (err) {
                                console.log(err);
                                callback(null, 0);
                            } else {
                                // update dateStorage to the newest entry
                                db.queue.get('donations').assign({
                                    last: new Date(donations[0].created_at).toISOString()
                                }).value();

                                if (array.length) {
                                    // reverse list order before send
                                    array.reverse();

                                    db.stats.get('donations').assign(statsCount).value();
                                    db.stats.get('amount').assign(statsAmount).value();

                                    callback(null, array);
                                } else {
                                    callback(null, 0);
                                }
                            }
                        }
                    );
                } else {
                    console.log(err);
                    callback(null, 0);
                }
            }
        });
};
