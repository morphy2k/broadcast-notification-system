'use strict';

const qs = require('querystring');

const config = require('../../../config');
const server = require('../../server');
const express = server.express;
const streamlabs = express.Router();
const db = require('../../database');
const authentication = require('./authentication');


streamlabs.get('/auth', (req, res) => {

    if (req.query.code) {
        res.render('dashboard/process', (err) => {
            if (err) return res.status(500).send('500');

            authentication.new(req.query.code, (err) => {
                if (err) return res.send('ERROR!');
                res.redirect('/settings');
            });
        });
    } else {
        let query = qs.stringify({
                response_type: 'code',
                client_id: config.api.streamlabs.client_id,
                redirect_uri: `${db.settings.get('uri').value()}/streamlabs/auth`,
                scope: 'donations.read'
            }),
            url = `https://streamlabs.com/api/v1.0/authorize?${query}`;

        res.redirect(url);
    }

});

module.exports = streamlabs;
