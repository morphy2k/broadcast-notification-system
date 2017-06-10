'use strict';

const uuidV1 = require('uuid/v1');

const db = require('../database');
const socket = require('./socket');


class Feed {
  constructor(length) {

    this.length = length;

  }

  set entry(data) {

    let entry = data.entry,
      feed = db.stats.get('feed.list').value(),
      first = db.stats.get('feed.list').first().value();

    if (feed.length === this.length) {
      db.stats.get('feed.list').remove(first).write();
      if (socket.connected) {

        const remove = {
          feed: {
            remove: first.uuid
          }
        };

        socket.emit('stats', remove);
      }
    }

    db.stats.get('feed.list').push({
      uuid: uuidV1(),
      uid: data.id,
      date: entry.date,
      type: entry.type,
      name: entry.name,
      resubs: entry.resubs,
      amount: entry.amount,
      message: entry.message,
      currency: entry.currency,
      viewers: entry.viewers,
      display_name: entry.display_name
    }).write();

  }
}

const feed = new Feed(30);
module.exports = feed;
