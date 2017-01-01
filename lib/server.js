"use strict";

const
    config = require('../config'),
    request = require('request'),
    express = require('express'),
    app = express(),
    PORT = process.env.PORT || config.server.port,
    server = app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
        console.log('Press Ctrl+C to quit.');
    });

app.set('view engine', 'pug');
app.set('trust proxy', true);

exports.express = express;
exports.app = app;

const io = require('socket.io').listen(server);
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
