'use strict';

// api modules
exports.twitch = require('./twitch');
exports.streamlabs = require('./streamlabs');

// api routes
const twitchRoutes = require('./twitch/routes');
const streamlabsRoutes = require('./streamlabs/routes');

exports.routes = app => {
  app.use(twitchRoutes);
  app.use(streamlabsRoutes);
};
