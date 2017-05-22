'use strict';

const twitchRouter = require('./twitch/routes');
const streamlabsRouter = require('./streamlabs/routes');

// api modules
exports.twitch = require('./twitch');
exports.streamlabs = require('./streamlabs');

// api routes
exports.routes = (app) => {
    app.use('/twitch', twitchRouter);
    app.use('/streamlabs', streamlabsRouter);
};
