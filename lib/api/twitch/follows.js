'use strict';

const request = require('request');
const moment = require('moment');

const db = require('../../database');


class Follows {
    constructor(userId, options) {
        this.url = `https://api.twitch.tv/kraken/channels/${userId}/follows`;
        this.options = options;
    }

    check(callback) {

        let arr = [],
            week = db.stats.get('follows').value(),
            last = new Date(db.queue.get('follows.last').value()).toISOString(),
            url = this.url,
            options = this.options;

        function get(cursor) {

            if (cursor) {
                Object.assign(options.qs, {
                    cursor
                });
            }

            request(url, options, (err, response, body) => {
                if (err) {
                    console.error(new Error(`[TWITCH FOLLOWS] ${err}`));
                    callback(null);
                } else if (response.statusCode == 200) {
                    parse(body);
                } else {
                    console.error(new Error(
                        `[TWITCH FOLLOWS] HTTP ${response.statusCode}`));
                    callback(null);
                }
            });
        }
        get();

        function parse(body) {

            let json = JSON.parse(body),
                follows = json.follows,
                i = 0,
                length = follows.length - 1;

            if (length) {
                for (let follow of follows) {

                    let id = parseInt(follow.user._id),
                        name = follow.user.display_name,
                        date = new Date(follow.created_at).toISOString(),
                        blacklist = db.blacklist.get('list').value(),
                        blocked = blacklist.includes(id);

                    // check if newer
                    if (date > last) {

                        // check if blocked
                        if (!blocked) {
                            arr.push({
                                id,
                                name,
                                date
                            });

                            let day = moment(date).isoWeekday() - 1;
                            week[day] = week[day] + 1;
                        }

                    } else if (arr.length) {
                        send();
                        break;
                    } else {
                        callback(null);
                        break;
                    }

                    i = i + 1;

                    if (i === length && json._cursor) {
                        get(json._cursor);
                    } else if (i === length) {
                        send();
                    }
                }
            } else {
                callback(null);
            }
        }

        function send() {

            // add date of latest element to last date
            db.queue.get('follows').assign({
                last: new Date(arr[0].date).toISOString()
            }).write();

            // reverse list order before send
            arr.reverse();

            // add stats to db
            db.stats.get('follows').assign(week).write();

            for (let el of arr) {
                db.blacklist.get('list').push(el.id).write();
            }

            callback(arr);
        }

    }
}

module.exports = Follows;
