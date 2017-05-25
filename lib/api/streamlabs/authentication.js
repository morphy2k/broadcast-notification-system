'use strict';

const request = require('request');

const config = require('../../../config');
const db = require('../../database');
const version = require('../../../package.json').version;


class Authentication {
    constructor() {
        this.id = config.api.streamlabs.client_id;
        this.secret = config.api.streamlabs.client_secret;
        this.uri = `${db.settings.get('uri').value()}/streamlabs/auth`;
        this.options = {
            headers: {
                'User-Agent': `BroadcastNotificationSystem/${version} (StreamlabsModule)`
            },
            url: 'https://streamlabs.com/api/v1.0/token',
            form: {
                client_id: this.id,
                client_secret: this.secret,
                redirect_uri: this.uri,
            }
        };
    }

    new(token) {
        return Promise((resolve, reject) => {
            let options = this.options;

            Object.assign(options.form, {
                grant_type: 'authorization_code',
                code: token
            });

            request.post(options, (err, response, body) => {
                if (err) {
                    reject(new Error(`[Streamlabs authentication]: ${err}`));
                } else if (response.statusCode == 200) {

                    let json = JSON.parse(body),
                        date = new Date();

                    date.setHours(date.getHours() + 1);

                    db.settings.get('api.streamlabs')
                        .assign({
                            enabled: true,
                            auth: {
                                token: json.access_token,
                                refresh_token: json.refresh_token,
                                expiration_date: date
                            }
                        }).write();
                } else {
                    reject(new Error(`[Streamlabs AUTH HTTP]: ${response.statusCode}`));
                }

                require('./').init();
                require('../../scheduler').twitchAPI();

                resolve();
            });
        });
    }

    refresh() {
        return new Promise((resolve, reject) => {
            let options = this.options;

            Object.assign(options.form, {
                grant_type: 'refresh_token',
                refresh_token: db.settings
                    .get('api.streamlabs.auth.refresh_token').value()
            });

            request.post(options, (err, response, body) => {
                if (err) {
                    reject(new Error(`[Streamlabs authentication]: ${err}`));
                } else if (response.statusCode == 200) {

                    let json = JSON.parse(body),
                        date = new Date();

                    date.setHours(date.getHours() + 1);

                    db.settings.get('api.streamlabs')
                        .assign({
                            auth: {
                                token: json.access_token,
                                refresh_token: json.refresh_token,
                                expiration_date: date
                            }
                        }).write();

                } else {
                    reject(new Error(`[Streamlabs AUTH HTTP]: ${response.statusCode}`));
                }
            });
        });
    }
}

const authentication = new Authentication();
module.exports = authentication;
