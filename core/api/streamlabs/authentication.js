"use strict";

const
    async = require("async"),
    request = require('request'),
    config = require('../../../config'),
    db = require('../../database');

module.exports = (type, data) => {
    var grant_type,
        name,
        token;

    if (type == 'new') {
        grant_type = 'authorization_code';
        name = 'code';
        token = data;
    } else if (type == 'refresh') {
        grant_type = 'refresh_token';
        name = 'refresh_token';
        token = db.settings.get('api.streamlabs.auth.refresh_token').value();
    }

    var id = config.api.streamlabs.client_id,
        secret = config.api.streamlabs.client_secret,
        uri = `${config.server.url}'/streamlabs/auth`,
        options = {
            url: 'https://www.twitchalerts.com/api/v1.0/token',
            form: {
                grant_type: grant_type,
                client_id: id,
                client_secret: secret,
                redirect_uri: uri,
                [name]: token
            }
        };

    if (type == 'new') {

        request.post(options, (err, response, body) => {
            if (!err && response.statusCode == 200) {
              if (err) throw err;

                let json = JSON.parse(body),
                    date = new Date();

                date.setHours(date.getHours() + 1);

                db.settings.get('api.streamlabs').assign({
                    active: true,
                    auth: {
                        token: json.access_token,
                        refresh_token: json.refresh_token,
                        expiration_date: date
                    }
                }).value();
            }
        });
    } else if (type == 'refresh') {
        request.post(options, (err, response, body) => {
            if (!err && response.statusCode == 200) {
                if (err) throw err;

                let json = JSON.parse(body),
                    date = new Date();

                date.setHours(date.getHours() + 1);

                db.settings.get('api.streamlabs').assign({
                    auth: {
                        token: json.access_token,
                        refresh_token: json.refresh_token,
                        expiration_date: date
                    }
                }).value();
                require('./')();
            }
        });
    }

};
