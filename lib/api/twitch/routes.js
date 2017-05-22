'use strict';

const qs = require('querystring');

const config = require('../../../config');
const server = require('../../server');
const express = server.express;
const twitch = express.Router();
const db = require('../../database');
const authentication = require('./authentication');


twitch.get('/auth', (req, res) => {

    if (req.query.code) {
        res.render('dashboard/process', (err) => {
            if (err) return res.status(500).send('500');

            authentication.init(req.query.code, (err) => {
                if (err) return res.send('ERROR!');
                res.redirect('/settings');
            });
        });
    } else {
        let query = qs.stringify({
                response_type: 'code',
                client_id: config.api.twitch.client_id,
                redirect_uri: `${db.settings.get('uri').value()}/twitch/auth`,
                scope: 'channel_subscriptions'
            }),
            url = `https://api.twitch.tv/kraken/oauth2/authorize?${query}`;

        res.redirect(url);
    }

});

module.exports = twitch;
