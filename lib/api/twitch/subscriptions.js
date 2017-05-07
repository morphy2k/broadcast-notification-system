"use strict";

const whilst = require("async/whilst");
const request = require('request');
const qs = require('querystring');
const moment = require('moment');
const db = require('../../database');


module.exports = (callback, userid, query, options) => {

    var last = new Date(db.queue.get('subs.last').value()).toISOString(),
        array = [],
        next = false,
        through = 0;

    function get() {
        request(
            `https://api.twitch.tv/kraken/channels/${userid}/subscriptions?${qs.stringify(query)}`,
            options, (err, response, body) => {

                if (err) {
                    console.log(err);
                    callback(null, 0);
                } else if (response.statusCode == 200) {

                    let json = JSON.parse(body),
                        subscriptions = json.subscriptions,
                        i = 0,
                        count = json._total,
                        length = subscriptions.length,
                        week = db.stats.get('subs').value();

                    if (length) {
                        whilst(() => {
                                return i < length;
                            },
                            (callback) => {
                                let subscription = subscriptions[i],
                                    id = parseInt(subscription.user._id),
                                    name = subscription.user.display_name,
                                    date = new Date(subscription.created_at).toISOString(),
                                    resubs = Math.round(moment(date).diff(moment(new Date().toISOString()), 'months', true));

                                // check if newer
                                if (date > last) {

                                    array.push({
                                        id,
                                        name,
                                        date,
                                        resubs
                                    });

                                    let day = moment(date).isoWeekday() - 1;
                                    week[day] = week[day] + 1;

                                } else {
                                    length = 0;
                                    next = false;
                                }

                                i = i + 1;
                                through = through + 1;

                                if (length) {
                                    if (i === length && through < count) next = true;
                                }

                                callback(null, i);
                            },
                            (err, n) => {
                                if (err) {
                                    console.log(err);
                                    callback(null, 0);
                                } else {
                                    if (next) {
                                        query.offset = query.offset + query.limit;

                                        get();
                                    } else {
                                        if (array.length) {

                                            // add date of latest element to last date
                                            db.queue.get('subs').assign({
                                                last: new Date(array[0].date).toISOString()
                                            }).write();

                                            //if (query.cursor) delete query.cursor;

                                            // reverse list order before send
                                            array.reverse();

                                            // add stats to db
                                            db.stats.get('subs').assign(week).write();

                                            callback(null, array);
                                        } else {
                                            callback(null, 0);
                                        }
                                    }
                                }
                            }
                        );
                    } else {
                        callback(null, 0);
                    }
                } else {
                    console.log(`TWITCH: Subscriptions error code ${response.statusCode}`);
                    console.log(body);
                    callback(null, 0);
                }
            });
    }

    get();

};
