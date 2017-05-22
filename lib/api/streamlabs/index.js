'use strict';

const moment = require('moment');

const db = require('../../database');
const authentication = require('./authentication');
const version = require('../../../package.json').version;

const Donations = require('./donations');


class Streamlabs {
    constructor() {
        this.token;
        this.currency;
        this.options;

        this.init();
    }

    init() {
        this.token = db.settings.get('api.streamlabs.auth.token').value();
        this.currency = db.settings.get('api.streamlabs.currency').value();
        this.options = {
            headers: {
                'User-Agent': `BroadcastNotificationSystem/${version}`
            },
            qs: {
                access_token: this.token,
                limit: 15,
                currency: this.currency
            }
        };

        this.donations = new Donations(this.options);
    }

    check(callback) {
        let donation = db.settings.get('notification.types.donations').value();

        async function getData() {
            if (donation) var donations = await streamlabs.checkDonations();

            return {
                donations
            };
        }

        if (db.stats.get('week').value() == moment().isoWeek()) {

            getData().then(data => {
                if (donation) {
                    if (data.donations) {
                        for (let obj of data.donations) {
                            db.queue.get('donations.list').push(obj).write();
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

    checkDonations() {
        let expDate = new Date(db.settings.get('api.streamlabs.auth.expiration_date').value()),
            date = new Date();

        if (date > expDate) {
            authentication.refresh();
            return null;
        } else {
            return new Promise(resolve => {
                this.donations.check((response) => {
                    resolve(response);
                });
            });
        }
    }

    setStats() {
        let week = moment().isoWeek(),
            startOfWeek = moment().startOf('isoWeek')._d;

        db.stats.assign({
            week: week
        }).write();

        db.queue.get('donations').assign({
            last: startOfWeek
        }).write();

        db.stats.get('donations').assign({
            count: [0, 0, 0, 0, 0, 0, 0],
            amount: [0, 0, 0, 0, 0, 0, 0]
        }).write();
    }
}

const streamlabs = new Streamlabs();
module.exports = streamlabs;
