"use strict";

const whilst = require("async/whilst");
const request = require('request');
const moment = require('moment');
const db = require('../../database');


module.exports = (callback, userid, query, options) => {

    var last = new Date(db.queue.get('subs.last').value()).toISOString();

    request(`https://api.twitch.tv/kraken/channels/${userid}/subscriptions?${query}`,
        options, (err, response, body) => {

            if (err) {
                console.log(err);
                callback(null, 0);
            }
            if (!err && response.statusCode == 200) {

                let json = JSON.parse(body),
                    subscriptions = json.subscriptions,
                    i = 0,
                    length = subscriptions.length,
                    array = [],
                    week = db.stats.get('subs').value();

                if (length) {
                    whilst(() => {
                            return i < length;
                        },
                        (callback) => {
                            let subscription = subscriptions[i],
                                id = parseInt(subscription.user._id),
                                name = subscription.user.display_name,
                                created = new Date(subscription.user.created_at).toISOString(),
                                date = new Date(subscription.created_at).toISOString(),
                                resubs = Math.round(moment(date).diff(moment(created), 'months', true));


                            // check if newer
                            if (date > last) {

                                array.push({
                                    id,
                                    name,
                                    created,
                                    date,
                                    resubs
                                });

                                let day = moment(date).isoWeekday() - 1;
                                week[day] = week[day] + 1;

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
                                db.queue.get('subs').assign({
                                    last: new Date(subscriptions[0].created_at).toISOString()
                                }).value();

                                if (array.length) {

                                    array.reverse();

                                    db.stats.get('subs').assign(week).value();

                                    callback(null, array);
                                } else {
                                    callback(null, 0);
                                }
                            }
                        }
                    );
                } else {
                    callback(null, 0);
                }
            } else if (response.statusCode == 422) {
                let json = JSON.parse(body),
                    message = json.message;
                console.log(`TWITCH: ${message}`);
                callback(null, 0);
            } else {
                console.log(`TWITCH: Subscriptions error code ${response.statusCode}`);
                callback(null, 0);
            }
        });
};
