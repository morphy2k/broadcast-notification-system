"use strict";

const parallel = require("async/parallel");
const request = require('request');
const qs = require('querystring');
const moment = require('moment');
const db = require('../../database');
const auth = require('./authentication');
const config = require('../../../config');

// Sub modules
const followModule = require('./follows');
const subscriptionModule = require('./subscriptions');
const hostModule = require('./hosts');

(function ifChecked() {
	let startOfWeek = moment().startOf('isoWeek')._d;

	if (!db.queue.get('follows.last').value()) {
		db.queue.get('follows').assign({
			last: startOfWeek
		}).value();
	}
	if (!db.queue.get('subs.last').value()) {
		db.queue.get('subs').assign({
			last: startOfWeek
		}).value();
	}
})();

module.exports = (cb) => {
	var twitch = db.settings.get('api.twitch.active').value(),
		follows = db.settings.get('api.twitch.types.follows').value(),
		subs = db.settings.get('api.twitch.types.subscriptions').value(),
		hosts = db.settings.get('api.twitch.types.hosts').value(),
		userid = db.settings.get('api.twitch.userid').value(),
		options = {
			headers: {
				'User-Agent': 'BNS/0.8-dev (Twitch Module)',
				'Accept': 'application/vnd.twitchtv.v5+json',
				'Client-ID': config.client_id,
				'Authorization': `OAuth ${db.settings.get('api.twitch.auth.token').value()}`
			},
		},
		query = {
			limit: 15,
			direction: 'desc'
		};

	if (twitch) {
		// week check
		if (db.stats.get('week').value() == moment().isoWeek()) {
			parallel([
                    // check if new follower
					(callback) => {
						if (follows) {
							followModule(callback, userid, query, options, (response) => {
								callback(response);
							});
						} else {
							callback(null, 0);
						}
                    },
                    // check if new subscriber
					(callback) => {
						if (subs) {
							subscriptionModule(callback, userid, query, options, (response) => {
								callback(response);
							});
						} else {
							callback(null, 0);
						}
                    },
                    // check if new hosts
					(callback) => {
						if (hosts) {
							hostModule(callback, userid, query, options, (response) => {
								callback(response);
							});
						} else {
							callback(null, 0);
						}
                    }
                ],
				// write new entrys to db
				(err, results) => {
					if (err) {
						cb(null, err);
					}
					// follows
					if (follows) {
						if (results[0]) {
							for (let obj of results[0]) {
								db.queue.get('follows.list').push(obj).value();
							}
						}
					}
					// subs
					if (subs) {
						if (results[1]) {
							for (let obj of results[1]) {
								db.queue.get('subs.list').push(obj).value();
							}
						}
					}
					// hosts
					if (hosts) {
						if (results[2]) {
							for (let obj of results[2]) {
								db.queue.get('hosts.list').push(obj).value();
							}
						}
					}
				});
		} else {
			// set current week & clear chart data
			let week = moment().isoWeek(),
				startOfWeek = moment().startOf('isoWeek')._d;

			db.stats.assign({
				week: week
			}).value();

			db.stats.get('follows').assign([0, 0, 0, 0, 0, 0, 0]).value();
			db.stats.get('subs').assign([0, 0, 0, 0, 0, 0, 0]).value();
			db.stats.get('hosts').assign([0, 0, 0, 0, 0, 0, 0]).value();

			cb('Week set & datasets cleared');
		}
	}
};
