"use strict";

const
    config = require('../../../config'),
    qs = require('querystring'),
    server = require('../../server'),
    express = server.express,
    router = express.Router();


router.get('/auth', (req, res) => {

    if (req.query.code) {
        require('./authentication')('new', req.query.code);
        res.redirect('/wait');
    } else {
        let query = qs.stringify({
                response_type: 'code',
                client_id: config.api.streamlabs.client_id,
                redirect_uri: `${config.server.url}/streamlabs/auth`,
                scope: config.api.streamlabs.scopes
            }),
            url = `https://streamlabs.com/api/v1.0/authorize?${query}`;

        res.redirect(url);
    }

});

module.exports = router;
