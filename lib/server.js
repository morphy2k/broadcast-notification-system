'use strict';

const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');

const config = require('../config');
const authentication = require('./authentication');

// init server
const PORT = process.env.PORT || config.server.port;
const server = app.listen(PORT, () => {
  console.info(`Server listening now on port ${PORT}`);
  console.info('Press Ctrl+C to quit.');
});
const io = require('socket.io').listen(server);

if (process.env.NODE_ENV === 'development') {
  app.use(async(ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
  }).on('error', err => {
    console.error(new Error(err));
  });

  console.info('Server logging active');
}

app.use(views('./views', {
  extension: 'pug'
}));

if (config.authentication.enabled) {
  app.use(authentication.koaMiddleware());
  io.use(authentication.socketMiddleware());

  console.info('Authentication middlwares loaded');
} else {
  console.warn('Authentication middlwares NOT loaded!');
}

// export
exports.app = app;
exports.io = io;

// send every ** seconds the version for client-server matching
const version = require('../package.json').version;

io.on('connection', socket => {
  setInterval(() => {
    socket.emit('general', {
      version
    });
  }, 10 * 1000);
});
