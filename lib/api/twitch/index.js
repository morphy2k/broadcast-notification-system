'use strict';

const moment = require('moment');

const config = require('../../../config');
const db = require('../../database');
const version = require('../../../package.json').version;

const Follows = require('./follows');
const Subscriptions = require('./subscriptions');
const Hosts = require('./hosts');


class Twitch {
    constructor() {
        this.userId;
        this.options;

        this.follows;
        this.subscriptions;
        this.hosts;

        if (db.settings.get('api.twitch.userid').value() &&
            db.settings.get('api.twitch.auth.token').value()) this.init();
    }

    init() {
        this.userId = db.settings.get('api.twitch.userid').value();
        this.options = {
            headers: {
                'User-Agent': `BroadcastNotificationSystem/${version} (TwitchModule)`,
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.api.twitch.client_id,
                'Authorization': `OAuth ${db.settings.get('api.twitch.auth.token').value()}`
            },
            qs: {
                limit: 15,
                offset: 0,
                direction: 'desc'
            }
        };
        this.follows = new Follows(this.userId, this.options);
        this.subscriptions = new Subscriptions(this.userId, this.options);
        this.hosts = new Hosts(this.userId, this.options);
    }

    check(callback) {

        let follow = db.settings.get('notification.types.follows').value(),
            subscription = db.settings.get('notification.types.subscriptions').value(),
            host = db.settings.get('notification.types.hosts').value();

        async function getData() {
            if (follow) var follows = await twitch.checkFollows();
            if (subscription) var subscriptions = await twitch.checkSubscriptions();
            if (host) var hosts = await twitch.checkHosts();

            return {
                follows,
                subscriptions,
                hosts
            };
        }

        if (db.stats.get('week').value() == moment().isoWeek()) {

            getData().then(data => {
                // follows
                if (follow) {
                    if (data.follows) {
                        for (let obj of data.follows) {
                            db.queue.get('follows.list').push(obj).write();
                        }
                    }
                }
                // subs
                if (subscription) {
                    if (data.subscriptions) {
                        for (let obj of data.subscriptions) {
                            db.queue.get('subs.list').push(obj).write();
                        }
                    }
                }
                // hosts
                if (host) {
                    if (data.hosts) {
                        for (let obj of data.hosts) {
                            db.queue.get('hosts.list').push(obj).write();
                        }
                    }
                }
            });


            callback();

        } else {
            this.setStats();
            console.log('Week set & datasets cleared');
            callback();
        }
    }

    checkFollows() {
        return new Promise(resolve => {
            this.follows.check((res) => {
                resolve(res);
            });
        });
    }

    checkSubscriptions() {
        return new Promise(resolve => {
            this.subscriptions.check((res) => {
                resolve(res);
            });
        });
    }

    checkHosts() {
        return new Promise(resolve => {
            this.hosts.check((res) => {
                resolve(res);
            });
        });
    }

    setStats() {
        let week = moment().isoWeek(),
            startOfWeek = moment().startOf('isoWeek')._d;

        db.stats.assign({
            week: week
        }).write();

        db.queue.get('follows').assign({
            last: startOfWeek
        }).write();
        db.queue.get('subs').assign({
            last: startOfWeek
        }).write();

        db.stats.get('follows').assign([0, 0, 0, 0, 0, 0, 0]).write();
        db.stats.get('subs').assign([0, 0, 0, 0, 0, 0, 0]).write();
        db.stats.get('hosts').assign([0, 0, 0, 0, 0, 0, 0]).write();
    }
}

const twitch = new Twitch();
module.exports = twitch;
