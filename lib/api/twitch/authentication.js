'use strict';

const request = require('request');

const config = require('../../../config');
const db = require('../../database');
const version = require('../../../package.json').version;


class Authentication {
    constructor() {
        this.options = {
            headers: {
                'User-Agent': `BroadcastNotificationSystem/${version} (TwitchModule)`,
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.api.twitch.client_id
            }
        };

        this.uri = db.settings.get('uri').value();
    }

    init(code) {

        new Promise((resolve) => {

            let post = Object.assign({
                form: {
                    client_id: config.api.twitch.client_id,
                    client_secret: config.api.twitch.client_secret,
                    grant_type: 'authorization_code',
                    redirect_uri: `${this.uri}/twitch/auth`,
                    code
                }
            }, this.options);

            request.post('https://api.twitch.tv/kraken/oauth2/token',
                post, (err, response, body) => {
                    if (err) {
                        throw new Error(`[TWITCH AUTH]: S1 ${err}`);
                    } else if (response.statusCode == 200) {
                        let json = JSON.parse(body),
                            token = json.access_token;

                        resolve(token);
                    } else {
                        throw new Error(`[TWITCH AUTH]: S1 HTTP ${response.statusCode}`);
                    }
                });
        }).then((token) => {
            return new Promise((resolve) => {
                request(`https://api.twitch.tv/kraken?oauth_token=${token}`,
                    this.options, (err, response, data) => {
                        if (err) {
                            throw new Error(`[TWITCH AUTH]: S2 ${err}`);
                        } else if (response.statusCode == 200) {
                            let json = JSON.parse(data),
                                name = json.token.user_name;

                            resolve({
                                token,
                                name
                            });
                        } else {
                            throw new Error(`[TWITCH AUTH]: S2 HTTP ${response.statusCode}`);
                        }
                    });
            });
        }).then((data) => {
            return new Promise((resolve) => {
                request(`https://api.twitch.tv/kraken/channels/${data.name}`,
                    this.options, (err, response, data) => {
                        if (err) {
                            throw new Error(`[TWITCH AUTH]: S3 ${err}`);
                        } else if (response.statusCode == 200) {
                            let json = JSON.parse(data),
                                id = json._id,
                                name = json.name,
                                user = {
                                    id: id,
                                    name: name,
                                    token: data.token
                                };

                            resolve(user);
                        } else {
                            throw new Error(`[TWITCH AUTH]: S3 HTTP ${response.statusCode}`);
                        }
                    });
            });
        }).then((user) => {
            db.settings.get('api.twitch').assign({
                enabled: true,
                userid: user.id,
                username: user.name,
                auth: {
                    token: user.token
                }
            }).write();

            require('./').init();
            require('../../scheduler').twitchAPI();

        }).catch((err) => {
            console.error(err.message);
        });
    }
}

const authentication = new Authentication();
module.exports = authentication;
