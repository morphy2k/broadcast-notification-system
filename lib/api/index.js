"use strict";

// api modules
exports.twitch = require('./twitch');
exports.streamlabs = require('./streamlabs');

// api routes
exports.routes = (app) => {
	app.use('/twitch', require('./twitch/routes'));
	app.use('/streamlabs', require('./streamlabs/routes'));
};
