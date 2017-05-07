"use strict";

//# notification controller

const db = require('./database');
const server = require('./server');
const io = server.io;
const dashboard = require('./dashboard');

function send(data) {
    io.sockets.emit('notification', data);
}

var queue = [];

module.exports = () => {

    let length = queue.length;

    if (length < 5) {
        // follows
        if (db.queue.get('follows.list').size().value() !== 0) {
            let element = db.queue.get('follows.list').first().value(),
                obj = Object.assign({
                    type: 'follow'
                }, element);

            queue.push(obj);
            db.queue.get('follows.list').remove(element).write();
        }
        // subscriptions
        if (db.queue.get('subs.list').size().value() !== 0) {
            let element = db.queue.get('subs.list').first().value(),
                obj = Object.assign({
                    type: 'subscription'
                }, element);

            queue.push(obj);
            db.queue.get('subs.list').remove(element).write();
        }
        // hosts
        if (db.queue.get('hosts.list').size().value() !== 0) {
            let element = db.queue.get('hosts.list').first().value(),
                obj = Object.assign({
                    type: 'host'
                }, element);

            queue.push(obj);
            db.queue.get('hosts.list').remove(element).write();
        }
        // donations
        if (db.queue.get('donations.list').size().value() !== 0) {
            let element = db.queue.get('donations.list').first().value(),
                obj = Object.assign({
                    type: 'donation'
                }, element);

            queue.push(obj);
            db.queue.get('donations.list').remove(element).write();
        }

        // sort queue by date
        if (length > 1) {
            queue.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            });
        }
    }

    if (length) {
        var id = queue[0].id,
            data = {
                type: queue[0].type,
                name: queue[0].name,
                resubs: queue[0].resubs,
                amount: queue[0].amount,
                message: queue[0].message,
                currency: queue[0].currency
            };

        // push first element to client
        send(data);
        dashboard.feed(id, data);

        // remove first element
        queue.splice(0, 1);
    }

};
