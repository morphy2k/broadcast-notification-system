'use strict';

const request = require('request');
const moment = require('moment');

const db = require('../../database');


class Subscriptions {
    constructor(userId, options) {
        this.url = `https://api.twitch.tv/kraken/channels/${userId}/subscriptions`;
        this.options = options;
    }

    check(callback) {

        let arr = [],
            week = db.stats.get('follows').value(),
            last = new Date(db.queue.get('subs.last').value()).toISOString(),
            options = this.options;

        function get(next) {

            if (next) options.qs.offset = options.qs.offset + options.qs.limit;


            request(this.url, options, (err, response, body) => {
                if (err) {
                    console.error(new Error(`[TWITCH SUBS] ${err}`));
                    callback(null);
                } else if (response.statusCode == 200) {
                    parse(body);
                } else {
                    console.error(new Error(`[TWITCH SUBS] HTTP ${response.statusCode}`));
                    callback(null);
                }
            });
        }
        get(false);

        function parse(body) {

            let json = JSON.parse(body),
                subscriptions = json.subscriptions,
                i = 0,
                length = subscriptions.length;

            if (length) {
                for (let subscription of subscriptions) {

                    let id = parseInt(subscription.user._id),
                        name = subscription.user.display_name,
                        date = new Date(subscription.created_at).toISOString(),
                        resubs = Math.round(moment(date).diff(moment(new Date().toISOString()), 'months', true));

                    // check if newer
                    if (date > last) {

                        arr.push({
                            id,
                            name,
                            date,
                            resubs
                        });

                        let day = moment(date).isoWeekday() - 1;
                        week[day] = week[day] + 1;

                    } else if (arr.length) {
                        send();
                        break;
                    } else {
                        callback(null);
                        break;
                    }

                    i = i + 1;

                    if (i === length && length >= options.qs.limit) {
                        get(true);
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
            db.queue.get('subs').assign({
                last: new Date(arr[0].date).toISOString()
            }).write();

            // reverse list order before send
            arr.reverse();

            // add stats to db
            db.stats.get('subs').assign(week).write();

            callback(arr);
        }

    }
}

module.exports = Subscriptions;
