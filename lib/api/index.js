'use strict';

// api modules
exports.twitch = require('./twitch');
exports.streamlabs = require('./streamlabs');

// api routes
const twitchRouter = require('./twitch/routes');
const streamlabsRouter = require('./streamlabs/routes');

exports.routes = app => {
  app.use(twitchRouter);
  app.use(streamlabsRouter);
};
