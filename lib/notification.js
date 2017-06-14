'use strict';

const db = require('./database');
const io = require('./server').io;
const feed = require('./dashboard/feed');


class Notification {
  constructor() {
    this.queue = [];
    this.cleanupBlacklist();
  }

  check() {
    return new Promise(async resolve => {

      const length = this.queue.length;

      if (length < 5) {

        const follow = this.get('follow', 'follows');
        const subscription = this.get('subscription', 'subscriptions');
        const host =  this.get('host', 'hosts');
        const donation = this.get('donation', 'donations');

        await Promise.all([follow, subscription, host, donation]);

        // sort queue by date
        if (length > 1) {
          this.queue.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
        }

      }

      let id,
        data;

      if (length) {
        id = this.queue[0].id;
        data = {
          date: this.queue[0].date,
          type: this.queue[0].type,
          name: this.queue[0].name,
          resubs: this.queue[0].resubs,
          amount: this.queue[0].amount,
          message: this.queue[0].message,
          currency: this.queue[0].currency,
          viewers: this.queue[0].viewers,
          display_name: this.queue[0].display_name
        };

        // push first element to client
        if (data.name) {
          this.send(data);
          feed.entry = ({
            id,
            entry: data
          });
        }

        // remove first element
        this.queue.splice(0, 1);

      }

      resolve();

    });
  }

  get(type, category) {
    return new Promise(resolve => {

      const queue = db.queue.get(`${category}.list`);

      if (queue.size().value()) {

        let element = queue.first().value(),
          obj = Object.assign({
            type
          }, element);

        this.queue.push(obj);
        queue.remove(element).write();

      }

      resolve();

    });
  }

  send(data) {
    io.sockets.emit('notification', data);
  }

  cleanupBlacklist() {

    let time = new Date(),
      cleared = new Date(db.blacklist.get('cleared').value());

    cleared.setHours(cleared.getHours() + 1);

    if (time > cleared || cleared === 'Invalid Date') {
      db.blacklist.get('list').remove().write();
      db.blacklist.assign({
        cleared: new Date()
      }).write();
    }

  }

  cleanupQueue() {
    return new Promise(resolve => {

      db.queue.get('follows.list').remove().write();
      db.queue.get('subscription.list').remove().write();
      db.queue.get('hosts.list').remove().write();
      db.queue.get('donations.list').remove().write();
      this.queue.length = 0;

      resolve();

    });
  }

}

const notification = new Notification();
module.exports = notification;
