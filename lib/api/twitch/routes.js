"use strict";

const config = require('../../../config');
const qs = require('querystring');
const server = require('../../server');
const express = server.express;
const router = express.Router();


router.get('/auth', (req, res) => {

	if (req.query.code) {
		require('./authentication')(req.query.code);
		res.redirect('/wait');
	} else {
		let query = qs.stringify({
				response_type: 'code',
				client_id: config.api.twitch.client_id,
				redirect_uri: `${config.server.url}/twitch/auth`,
				scope: config.api.twitch.scopes
			}),
			url = `https://api.twitch.tv/kraken/oauth2/authorize?${query}`;

		res.redirect(url);
	}

});

module.exports = router;
