"use strict";

// # lowdb

const low = require('lowdb');

// init database
const db = low('./db.json', {
    storage: require('lowdb/lib/file-async')
});
db.defaults({
    settings: {
        notification: {
            active: false,
            duration: 13000,
            template: {
                multipage: false,
                pages: 1,
                selected: 'default',
                list: []
            }
        },
        dashboard: {
            popups: true,
            feed: true
        },
        api: {
            twitch: {
                active: false,
                userid: 0,
                username: '',
                auth: {
                    token: '',
                },
                types: {
                    follows: true,
                    subscriptions: true,
                    hosts: true
                }
            },
            streamlabs: {
                active: false,
                auth: {
                    token: '',
                    refresh_token: '',
                    expiration_date: ''
                },
                currency: 'EUR',
                types: {
                    donations: true
                }
            }
        }
    },
    stats: {
        week: null,
        follows: [0, 0, 0, 0, 0, 0, 0],
        subs: [0, 0, 0, 0, 0, 0, 0],
        hosts: [0, 0, 0, 0, 0, 0, 0],
        donations: {
            count: [0, 0, 0, 0, 0, 0, 0],
            amount: [0, 0, 0, 0, 0, 0, 0]
        },
        feed: {
            list: []
        }
    },
    queue: {
        follows: {
            last: false,
            list: []
        },
        subs: {
            last: false,
            list: []
        },
        hosts: {
            last: false,
            list: []
        },
        donations: {
            last: false,
            list: []
        }
    },
    blacklist: {
        cleared: false,
        list: []
    }
}).value();

// define paths
exports.settings = db.get('settings');
exports.stats = db.get('stats');
exports.queue = db.get('queue');
exports.blacklist = db.get('blacklist');
