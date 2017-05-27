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
        db.settings.set(this[data.type][data.prop], data.value).write();



        if (data.value) {
            const scheduler = require('./scheduler');

            switch (`${data.type}.${data.prop}`) {
            case 'notification.enabled':
                scheduler.notifications();
                break;
            case 'api.twitch':
                scheduler.twitchAPI();
                break;
            case 'api.youtube':
                scheduler.youtubeAPI();
                break;
            case 'api.streamlabs':
                scheduler.streamlabsAPI();
                break;
            case 'api.tipeee':
                scheduler.tipeeeAPI();
                break;
            }
        }
    }

    update() {
        return new Promise(resolve => {
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

            resolve();
        });
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
    return new Promise(async resolve => {
        await settings.update();
        resolve({
            settings: settings.data,
            stats: stats.data
        });
    });
};


class Socket {
    constructor() {
        this.connected = false;

        io.on('connection', socket => {
            this.connected = true;

            socket.on('dashboard', async data => {

                const response = (err, res) => {
                    if (err) return socket.emit('dashboard', 'response', true);
                    socket.emit('dashboard', 'response', null, res);
                };

                if (data.type === 'template') {

                    if (data.prop === 'search') {

                        let result = {};

                        try {
                            result = await templates.search();
                        } catch (e) {
                            response(true);
                            return console.error(new Error(`[TEMPLATE SEARCH]: ${e}`));
                        }

                        response(null, {
                            prop: 'templates',
                            templates: result.templates,
                            selected: result.selected
                        });

                    } else if (data.prop === 'template') {

                        try {
                            await templates.set(data.value);
                        } catch (e) {
                            response(true);
                            return console.error(new Error(`[TEMPLATE SET]: ${e}`));
                        }

                        response(null, data);
                    }
                } else if (data.type === 'testNotification') {

                    let obj = {
                        type: data.prop,
                        test: true
                    };
                    io.sockets.emit('notification', obj);

                } else if (data.prop === 'clearQueue') {
                    require('./notification').clearQueue();
                    response(null, data);
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
            viewers: entry.viewers
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
                fs.symlink(this.fromPath, this.toPath, 'dir', err => {
                    if (err) return console.error(new Error(`[TEMPLATE SET]: ${err}`));
                });
            }
        });

        try {
            this.search();
        } catch (e) {
            console.error(e);
        }
    }

    search() {
        return new Promise((resolve, reject) => {
            fs.readdir('./templates', (err, dirs) => {
                if (err) return reject(err);

                let templates = [],
                    length = dirs.length,
                    i = 0;

                for (let dir of dirs) {

                    templates.push(dir);

                    i = i + 1;

                    if (i == length) {
                        db.settings.get('notification.template').set('list', templates).write();
                        resolve({
                            templates,
                            selected: this.selected
                        });
                    }
                }
            });
        });

    }

    set(name) {
        return new Promise((resolve, reject) => {
            this.selected = name;

            const fromPath = path.resolve(`./templates/${name}`);
            const toPath = this.toPath;

            const link = () => {
                fs.symlink(fromPath, toPath, 'dir', (err) => {
                    if (err) return reject(err);

                    db.settings.get('notification.template').set('selected', name).write();

                    resolve();
                });
            };

            fs.stat(toPath, err => {
                if (!err) {
                    fs.unlink(toPath, err => {
                        if (err) return reject(err);
                        link();
                    });
                } else {
                    link();
                }
            });

        });
    }
}

const templates = new Templates();
exports.templates = templates;
