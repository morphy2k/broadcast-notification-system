"use strict";

const config = require('../config');
const request = require('request');
const express = require('express');
const app = express();
const PORT = process.env.PORT || config.server.port;
const server = app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
const io = require('socket.io').listen(server);

app.set('view engine', 'pug');
app.set('trust proxy', true);

exports.express = express;
exports.app = app;

exports.io = io;

// send every ** seconds the version for client-server matching
const version = require('../package.json').version;

io.on('connection', (socket) => {
    setInterval(() => {
        socket.emit('general', {
            version
        });
    }, 10000);
});
