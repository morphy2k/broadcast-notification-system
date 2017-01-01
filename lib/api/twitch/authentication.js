"use strict";

const waterfall = require("async/waterfall"),
    request = require('request'),
    config = require('../../../config'),
    cfg = require('./config'),
    db = require('../../database'),
    server = require('../../server'),
    io = server.io;


module.exports = (code) => {
    var options = {
        headers: {
            'User-Agent': 'BNS/0.8-dev (Twitch Module)',
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': cfg.client_id
        }
    };

    waterfall([
        (callback) => {
            let post = Object.assign({
                form: {
                    client_id: cfg.client_id,
                    client_secret: cfg.client_secret,
                    grant_type: 'authorization_code',
                    redirect_uri: `${config.server.url}/twitch/auth`,
                    code: code
                }
            }, options);
            request.post('https://api.twitch.tv/kraken/oauth2/token',
                post, (err, response, body) => {
                    if (err) {
                        console.log(err);
                        callback(null);
                    } else if (response.statusCode == 200) {
                        let json = JSON.parse(body),
                            token = json.access_token;

                        callback(null, token);
                    } else {
                        console.log(response.statusCode);
                        callback(null);
                    }
                });
        },
        (arg1, callback) => {
            request(`https://api.twitch.tv/kraken?oauth_token=${arg1}`,
                options, (err, response, data) => {
                    if (err) {
                        console.log(err);
                        callback(null);
                    } else if (response.statusCode == 200) {
                        let json = JSON.parse(data),
                            name = json.token.user_name;

                        callback(null, name);
                    } else {
                        console.log(response.statusCode);
                        callback(null);
                    }
                });

        },
        function(arg1, arg2, callback) {
            request(`https://api.twitch.tv/kraken/channels/${arg2}`,
                options, (err, response, data) => {
                    if (err) {
                        console.log(err);
                        callback(null);
                    } else if (response.statusCode == 200) {
                        let json = JSON.parse(data),
                            id = json._id,
                            name = json.name,
                            user = {
                                id: id,
                                name: name,
                                token: arg1
                            };

                        callback(null, user);
                    } else {
                        console.log(response.statusCode);
                        callback(null);
                    }
                });
        }
    ], (err, result) => {
        db.settings.get('api.twitch').assign({
            active: true,
            userid: result.id,
            username: result.name,
            auth: {
                token: result.token
            }
        }).value();

        setTimeout(() => {
            io.emit('general', {
                redirect: '/settings'
            });
        }, 3000);
    });
};
