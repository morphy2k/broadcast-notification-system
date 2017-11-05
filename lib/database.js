'use strict';

const low = require('lowdb');

// init database
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./db.json');
const db = low(adapter);

db.defaults({
  settings: {
    uri: '',
    auth: {
      secret: null,
      email: null,
      expiration_date: null
    },
    notification: {
      enabled: false,
      duration: 16000,
      template: {
        selected: 'default',
        list: []
      },
      types: {
        follows: true,
        subscriptions: false,
        hosts: false,
        donations: false
      }
    },
    dashboard: {
      popups: true
    },
    api: {
      state: '',
      twitch: {
        enabled: false,
        userid: null,
        username: '',
        auth: {
          token: '',
          refresh_token: '',
          expiration_date: null
        },
        type: ''
      },
      streamlabs: {
        enabled: false,
        auth: {
          token: '',
          refresh_token: '',
          expiration_date: null
        }
      }
    }
  },
  stats: {
    week: null,
    follows: [0, 0, 0, 0, 0, 0, 0],
    subscriptions: [0, 0, 0, 0, 0, 0, 0],
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
      last: null,
      list: []
    },
    subscriptions: {
      last: null,
      list: []
    },
    hosts: {
      last: [],
      list: []
    },
    donations: {
      last: null,
      list: []
    }
  },
  blacklist: {
    cleared: null,
    list: []
  }
}).write();

// define paths
exports.settings = db.get('settings');
exports.stats = db.get('stats');
exports.queue = db.get('queue');
exports.blacklist = db.get('blacklist');
