'use strict';

const path = require('path');
const fs = require('fs');

const uuidV1 = require('uuid/v1');

const db = require('./database');
const server = require('./server');
const io = server.io;


class Settings {
    constructor() {
        this.settings = {};

        // DB paths
        this.dashboard = {
            popups: 'dashboard.popups',
        };
        this.api = {
            twitch: 'api.twitch.enabled',
            youtube: 'api.youtube.enabled',
            streamlabs: 'api.streamlabs.enabled',
            api: 'api.tipeeeStream.enabled'
        };
        this.notification = {
            enabled: 'notification.enabled',
            duration: 'notification.duration',
            follows: 'notification.types.follows',
            subscriptions: 'notification.types.subscriptions',
            hosts: 'notification.types.hosts',
            donations: 'notification.types.donations'
        };

        this.init();
    }

    init() {
        this.settings = {
            notification: db.settings.get('notification').cloneDeep().value(),
            dashboard: db.settings.get('dashboard').value(),
            api: {
                twitch: db.settings.get('api.twitch').cloneDeep().value(),
                youtube: {
                    enabled: false
                },
                streamlabs: db.settings.get('api.streamlabs').cloneDeep().value()
            }
        };
    }

    get data() {
        return this.settings;
    }

    set data(data) {
        db.settings.set(this[data.type][data.name], data.value).write();

        const scheduler = require('./scheduler');

        if (`${data.type}.${data.name}` === 'notification.enabled' && data.value)
            scheduler.notifications();

        if (`${data.type}.${data.name}` === 'api.twitch' && data.value)
            scheduler.twitchAPI();

        if (`${data.type}.${data.name}` === 'api.youtube' && data.value)
            scheduler.youtubeAPI();

        if (`${data.type}.${data.name}` === 'api.streamlabs' && data.value)
            scheduler.streamlabsAPI();

        if (`${data.type}.${data.name}` === 'api.tipeee' && data.value)
            scheduler.tipeeeAPI();
    }

    update(callback) {
        this.settings = {
            notification: db.settings.get('notification').cloneDeep().value(),
            dashboard: db.settings.get('dashboard').value(),
            api: {
                twitch: db.settings.get('api.twitch').cloneDeep().value(),
                youtube: {
                    enabled: false
                },
                streamlabs: db.settings.get('api.streamlabs').cloneDeep().value()
            }
        };

        callback();
    }
}

const settings = new Settings();


class Stats {
    constructor() {
        this.stats = {
            feed: {
                list: db.stats.get('feed.list').value()
            },
            charts: {
                follows: db.stats.get('follows').value(),
                subs: db.stats.get('subs').value(),
                donations: db.stats.get('donations').value()
            }
        };
    }

    get data() {
        return this.stats;
    }

    update() {
        this.stats = {
            feed: {
                list: db.stats.get('feed.list').value()
            },
            charts: {
                follows: db.stats.get('follows').value(),
                subs: db.stats.get('subs').value(),
                donations: db.stats.get('donations').value()
            }
        };

        this.push();
    }

    push() {
        if (socket.connected) {
            io.sockets.emit('stats', this.stats);
        }
    }
}

const stats = new Stats();
exports.stats = stats;


exports.getData = () => {
    return new Promise((resolve) => {
        settings.update(() => {
            resolve({
                settings: settings.data,
                stats: stats.data
            });
        });
    });
};


class Socket {
    constructor() {
        this.connected = false;

        io.on('connection', (socket) => {
            this.connected = true;

            socket.on('dashboard', (data) => {

                function response(err, res) {
                    if (err) return socket.emit('dashboard', 'response', true);
                    socket.emit('dashboard', 'response', null, res);
                }

                if (data.type == 'template') {
                    if (data.name == 'search') {
                        templates.search((err, templates, selected) => {
                            if (err) {
                                response(true);
                                return console.error(new Error(`[TEMPLATE SEARCH]: ${err}`));
                            }
                            response(null, {
                                name: 'templates',
                                templates,
                                selected
                            });
                        });
                    } else if (data.name == 'template') {
                        templates.set(data.value, (err) => {
                            if (err) {
                                response(true);
                                return console.error(new Error(`[TEMPLATE SET]: ${err}`));
                            }
                            response(null, data);
                        });
                    }
                } else if (data.type == 'testNotification') {
                    let obj = {
                        type: data.name,
                        test: true
                    };
                    io.sockets.emit('notification', obj);
                } else {
                    settings.data = data;
                    response(null, data);
                }
            });

            socket.on('disconnect', () => {
                this.connected = false;
            });
        });
    }
}

const socket = new Socket();


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
                var remove = {
                    feed: {
                        remove: first.uuid
                    }
                };
                io.sockets.emit('stats', remove);
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
            viewer: entry.viewer
        }).write();
    }
}

const feed = new Feed(30);
exports.feed = feed;


class Templates {
    constructor() {
        this.selected = db.settings.get('notification.template.selected').value();
        this.fromPath = path.resolve(`./templates/${this.selected}`);
        this.toPath = path.resolve('./views/template');

        fs.stat(this.toPath, (err) => {
            if (err) {
                fs.symlink(this.fromPath, this.toPath, 'dir', (err) => {
                    if (err) return console.error(new Error(`[TEMPLATE SET]: ${err}`));
                });
            }
        });

        this.search(() => {});
    }

    search(callback) {
        fs.readdir('./templates', (err, dirs) => {
            if (err) {
                return callback(err);
            }

            let templates = [],
                length = dirs.length,
                i = 0;

            for (let dir of dirs) {

                templates.push(dir);

                i = i + 1;

                if (i == length) {
                    db.settings.get('notification.template').set('list', templates).write();
                    callback(null, templates, this.selected);
                }
            }
        });
    }

    set(name, callback) {
        this.selected = name;

        const fromPath = path.resolve(`./templates/${name}`);
        const toPath = this.toPath;

        function link() {
            fs.symlink(fromPath, toPath, 'dir', (err) => {
                if (err) return callback(err);

                db.settings.get('notification.template').set('selected', name).write();

                callback(null);
            });
        }

        fs.stat(toPath, (err) => {
            if (!err) {
                fs.unlink(toPath, (err) => {
                    if (err) return callback(err);
                    link();
                });
            } else {
                link();
            }
        });

    }
}

const templates = new Templates();
exports.templates = templates;
