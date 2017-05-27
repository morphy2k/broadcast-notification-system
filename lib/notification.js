'use strict';

const db = require('./database');
const server = require('./server');
const io = server.io;
const dashboard = require('./dashboard');


class Notification {
    constructor() {
        this.queue = [];
    }

    check() {
        return new Promise(resolve => {

            let length = this.queue.length;

            if (length < 5) {

                // follows
                if (db.queue.get('follows.list').size().value() !== 0) {
                    let element = db.queue.get('follows.list').first().value(),
                        obj = Object.assign({
                            type: 'follow'
                        }, element);

                    this.queue.push(obj);
                    db.queue.get('follows.list').remove(element).write();
                }

                // subscriptions
                if (db.queue.get('subs.list').size().value() !== 0) {
                    let element = db.queue.get('subs.list').first().value(),
                        obj = Object.assign({
                            type: 'subscription'
                        }, element);

                    this.queue.push(obj);
                    db.queue.get('subs.list').remove(element).write();
                }

                // hosts
                if (db.queue.get('hosts.list').size().value() !== 0) {
                    let element = db.queue.get('hosts.list').first().value(),
                        obj = Object.assign({
                            type: 'host'
                        }, element);

                    this.queue.push(obj);
                    db.queue.get('hosts.list').remove(element).write();
                }

                // donations
                if (db.queue.get('donations.list').size().value() !== 0) {
                    let element = db.queue.get('donations.list').first().value(),
                        obj = Object.assign({
                            type: 'donation'
                        }, element);

                    this.queue.push(obj);
                    db.queue.get('donations.list').remove(element).write();
                }

                // sort queue by date
                if (length > 1) {
                    this.queue.sort((a, b) => {
                        return new Date(a.date) - new Date(b.date);
                    });
                }
            }

            if (length) {
                var id = this.queue[0].id,
                    data = {
                        date: this.queue[0].date,
                        type: this.queue[0].type,
                        name: this.queue[0].name,
                        resubs: this.queue[0].resubs,
                        amount: this.queue[0].amount,
                        message: this.queue[0].message,
                        currency: this.queue[0].currency,
                        viewers: this.queue[0].viewers
                    };

                // push first element to client
                if (data.name) {
                    this.send(data);
                    dashboard.feed.entry = ({
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

    send(data) {
        io.sockets.emit('notification', data);
    }

    clearBlacklist() {
        let time = new Date(),
            cleared = new Date(db.blacklist.get('cleared').value());

        cleared.setHours(cleared.getHours() + 1);

        if (time > cleared || cleared == 'Invalid Date') {
            db.blacklist.get('list').remove().write();
            db.blacklist.assign({
                cleared: new Date()
            }).write();
        }
    }

    clearQueue() {
        db.queue.get('follows.list').remove().write();
        db.queue.get('subs.list').remove().write();
        db.queue.get('hosts.list').remove().write();
        db.queue.get('donations.list').remove().write();
        this.queue.length = 0;
    }
}

const notification = new Notification();
module.exports = notification;
