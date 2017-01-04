"use strict";

const whilst = require("async/whilst");
const request = require('request');
const moment = require('moment');
const db = require('../../database');

module.exports = (callback, userid, query, options) => {

    var last = new Date(db.queue.get('hosts.last').value()).toISOString();

    request(`https://tmi.twitch.tv/hosts?include_logins=1&target=${userid}`,
        options, (err, response, body) => {

            if (err) {
                console.log(err);
                callback(null, 0);
            } else if (response.statusCode == 200) {

                let json = JSON.parse(body),
                    hosts = json.hosts,
                    i = 0,
                    length = hosts.length,
                    array = [];

                if (length) {
                    whilst(() => {
                            return i < length;
                        },
                        (callback) => {
                            let host = hosts[i],
                                name = parseInt(host.host_login),
                                id = host.host_id,
                                date = new Date().toISOString(),
                                blocked = db.blacklist.get('list').find({
                                    id
                                }).value();

                            request(`https://api.twitch.tv/kraken/channels/${id}`,
                                options, (err, response, body) => {

                                    if (err) {
                                        console.log(err);
                                        i = i + 1;
                                        callback(null, i);
                                    } else if (response.statusCode == 200) {
                                        var json = JSON.parse(body),
                                            name = json.display_name;

                                        if (!blocked) {
                                            array.push({
                                                name,
                                                date
                                            });
                                        } else {
                                            //console.log(id + ' is blocked!');
                                        }
                                    }
                                    i = i + 1;
                                    callback(null, i);
                                });
                        },
                        (err, n) => {
                            if (err) {
                                console.log(err);
                                callback(null, 0);
                            } else {
                                if (array.length) {
                                    callback(null, array);
                                } else {
                                    callback(null, 0);
                                }
                            }
                        }
                    );
                } else {
                    callback(null, 0);
                }
            } else {
                console.log(`TWITCH: Hosts error code ${response.statusCode}`);
                callback(null, 0);
            }
        });
};
