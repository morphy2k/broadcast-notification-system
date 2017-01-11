"use strict";

const parallel = require("async/parallel");
const request = require('request');
const moment = require('moment');
const db = require('../../database');
const auth = require('./authentication');

// Sub modules
const donationModule = require('./donations');

if (true) {
    let startOfWeek = moment().startOf('isoWeek')._d;

    if (!db.queue.get('donations.last').value()) {
        db.queue.get('donations').assign({
            last: startOfWeek
        }).value();
    }
}

module.exports = (cb) => {
    var streamlabs = db.settings.get('api.streamlabs.active').value(),
        donation = db.settings.get('api.streamlabs.types.donations').value();

    if (streamlabs) {
        // week check
        if (db.stats.get('week').value() == moment().isoWeek()) {
            parallel([
                    // check if new donations
                    (callback) => {
                        if (donation) {
                            let token = db.settings.get('api.streamlabs.auth.token').value(),
                                date = new Date(),
                                expDate = new Date(db.settings.get('api.streamlabs.auth.expiration_date').value()),
                                currency = db.settings.get('api.streamlabs.currency').value(),
                                options = {
                                    headers: {
                                        'User-Agent': 'BNS/0.8-dev (Streamlabs Module)'
                                    },
                                    qs: {
                                        access_token: token,
                                        limit: 6,
                                        currency: currency
                                    }
                                };
                            if (date > expDate) {
                                auth('refresh');
                                callback(null, 0);
                            } else {
                                donationModule(callback, options, (response) => {
                                    callback(response);
                                });
                            }
                        } else {
                            callback(null, 0);
                        }
                    }
                ],
                // write new entrys to db
                (err, results) => {
                    if (err) {
                        cb(null, err);
                    }
                    // donations
                    if (donation) {
                        if (results[0]) {
                            for (let obj of results[0]) {
                                db.queue.get('donations.list').push(obj).value();
                            }
                        }
                    }

                });
        } else {
            let week = moment().isoWeek(),
                startOfWeek = moment().startOf('isoWeek')._d;

            db.stats.assign({
                week: week
            }).value();

            db.queue.get('donations').assign({
                last: startOfWeek
            }).value();

            db.stats.get('donations').assign({
                count: [0, 0, 0, 0, 0, 0, 0],
                amount: [0, 0, 0, 0, 0, 0, 0]
            }).value();

            cb('Week set & datasets cleared');
        }
    }
};
