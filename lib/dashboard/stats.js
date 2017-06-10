'use strict';

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

    if (socket.connected) {
      socket.emit('stats', this.data);
    }
  }

}

const stats = new Stats();
module.exports = stats;
