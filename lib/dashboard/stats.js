'use strict';

const { DateTime } = require('luxon');

const db = require('../database');
const socket = require('./socket');


class Stats {
  constructor() {}

  get data() {
    return {
      feed: {
        list: db.stats.get('feed.list').value()
      },
      charts: {
        follows: db.stats.get('follows').value(),
        subscriptions: db.stats.get('subscriptions').value(),
        donations: db.stats.get('donations').value()
      }
    };

  }

  push() {
    if (socket.connected) socket.emit('stats', this.data);
  }

  async set() {
    const dt = DateTime.utc();

    if (db.stats.get('week').value() === dt.weekNumber) return;

    db.stats.set('week', dt.weekNumber).write();

    db.queue.get('follows').set('last', null).write();
    db.queue.get('subscriptions').set('last', null).write();
    db.queue.get('donations').set('last', null).write();

    const zero = [0, 0, 0, 0, 0, 0, 0];

    const types = [
      'follows',
      'subscriptions',
      'donations.count',
      'donations.amount'
    ];

    for (let type of types) {
      db.stats.get(type).assign(zero).write();
    }

    console.info('Week set & datasets cleared');

    return;
  }

}

const stats = new Stats();
module.exports = stats;
