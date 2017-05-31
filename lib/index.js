'use strict';

require('./scheduler');
require('./routes');

const db = require('./database');

new Promise((resolve, reject) => {
  let server = require('../config').server,
    host = server.host,
    uri = '';

  if (!host) return reject('Host is not set!');

  if (host.startsWith('http')) {
    if (server.proxy) {
      uri = `${host}:${server.proxyPort}`;
    } else {
      uri = `${host}:${server.port}`;
    }
  } else {
    if (server.proxy) {
      uri = `http://${host}:${server.proxyPort}`;
    } else {
      uri = `http://${host}:${server.port}`;
    }
  }

  resolve(uri);

}).then(uri => {
  db.settings.set('uri', uri).write();
}).catch(err => {
  console.error(new Error(err));
});
