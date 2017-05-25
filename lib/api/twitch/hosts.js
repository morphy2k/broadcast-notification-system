'use strict';

const request = require('request');

const db = require('../../database');


class Hosts {
    constructor(userId, options) {
        this.url = `https://tmi.twitch.tv/hosts?include_logins=1&target=${userId}`;
        this.options = options;
    }

    check() {
        return new Promise((resolve, reject) => {

            let last = db.queue.get('hosts.last').value(),
                arr = [];

            function get() {

                request(this.url, this.options, (err, response, body) => {
                    if (err) {
                        reject(err);
                    } else if (response.statusCode == 200) {
                        cleanup(body, () => {
                            parse(body);
                        });
                    } else {
                        reject(`[TWITCH HOSTS] HTTP ${response.statusCode}`);
                    }
                });
            }
            get();

            function parse(body) {

                let json = JSON.parse(body),
                    hosts = json.hosts,
                    i = 0,
                    length = hosts.length - 1;

                if (length) {
                    for (let host of hosts) {

                        let id = host.host_id,
                            viewer = host.host_viewer;

                        if (!last.includes(id)) {
                            request(`https://api.twitch.tv/kraken/channels/${id}`,
                                this.options, (err, response, body) => {

                                    if (err) {
                                        console.log(err);
                                    } else if (response.statusCode == 200) {
                                        let json = JSON.parse(body),
                                            name = json.display_name;

                                        arr.push({
                                            name,
                                            viewer
                                        });

                                    }

                                    i = i + 1;

                                    if (i == length) send();
                                });
                        }
                    }
                } else {
                    resolve();
                }

            }

            function cleanup(body) {

                let json = JSON.parse(body),
                    hosts = json.hosts;

                for (let i = 0; i < last.length; i++) {
                    let lastHost = last[i];

                    for (let host of hosts) {
                        if (host.host_id == lastHost) {
                            last.splice(i, 1);
                            break;
                        }
                    }

                    if (i == last.length) {
                        db.queue.set('hosts.last', last).write();
                        return;
                    }
                }
            }

            function send() {
                resolve(arr);
            }
        });
    }
}

module.exports = Hosts;
