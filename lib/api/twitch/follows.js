"use strict";

const whilst = require("async/whilst");
const request = require('request');
const qs = require('querystring');
const moment = require('moment');
const db = require('../../database');


module.exports = (callback, userid, query, options) => {

    var last = new Date(db.queue.get('follows.last').value()).toISOString(),
        array = [],
        next = false;

    function get() {
        request(
            `https://api.twitch.tv/kraken/channels/${userid}/follows?${qs.stringify(query)}`,
            options, (err, response, body) => {

                if (err) {
                    console.log(err);
                    callback(null, 0);
                } else if (response.statusCode == 200) {

                    let json = JSON.parse(body),
                        follows = json.follows,
                        i = 0,
                        length = follows.length,
                        week = db.stats.get('follows').value();

                    if (length) {
                        whilst(() => {
                                return i < length;
                            },
                            (callback) => {
                                let follow = follows[i],
                                    id = parseInt(follow.user._id),
                                    name = follow.user.display_name,
                                    date = new Date(follow.created_at).toISOString(),
                                    blacklist = db.blacklist.get('list').value(),
                                    blocked = blacklist.includes(id);

                                // check if newer
                                if (date > last) {

                                    // check if blocked
                                    if (!blocked) {
                                        array.push({
                                            id,
                                            name,
                                            date
                                        });

                                        let day = moment(date).isoWeekday() - 1;
                                        week[day] = week[day] + 1;
                                    }

                                } else {
                                    length = 0;
                                    next = false;
                                }

                                i = i + 1;

                                if (length) {
                                    if (i === length && json._cursor) next = true;
                                }

                                callback(null, i);
                            },
                            (err, n) => {
                                if (err) {
                                    console.log(err);
                                    callback(null, 0);
                                } else {
                                    if (next) {
                                        Object.assign(query, {
                                            cursor: json._cursor
                                        });

                                        get();
                                    } else {
                                        if (array.length) {

                                            // add date of latest element to last date
                                            db.queue.get('follows').assign({
                                                last: new Date(array[0].date).toISOString()
                                            }).value();

                                            //if (query.cursor) delete query.cursor;

                                            // reverse list order before send
                                            array.reverse();

                                            // add stats to db
                                            db.stats.get('follows').assign(week).value();

                                            for (let el of array) {
                                                db.blacklist.get('list').push(el.id).value();
                                            }

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
                    console.log(`TWITCH: Follows error code ${response.statusCode}`);
                    callback(null, 0);
                }
            });
    }

    get();

};
