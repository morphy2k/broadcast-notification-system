'use strict';

const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();

const config = require('../config');
const db = require('./database');
const authentication = require('./authentication');

// init server
const PORT = process.env.PORT || config.server.port;
const server = app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
const io = require('socket.io').listen(server);

app.set('view engine', 'pug');
app.set('trust proxy', true);

// authentication
if (config.authentication.enabled) {
    const secret = db.settings.get('auth.secret').value();

    app.use(cookieParser(secret));
    app.use(authentication.expressHandler());
    io.use(authentication.socketHandler(cookieParser));
}

// export
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
    }, 10 * 1000);
});
