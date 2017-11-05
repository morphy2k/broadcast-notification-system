'use strict';

const crypto = require('crypto');

require('./scheduler');
require('./routes');

const db = require('./database');

new Promise((resolve, reject) => {
  let server = require('../config').server,
    host = server.host,
    uri = '';

  if (!host) return reject('Host is not set!');

  if (server.proxy) {
    uri = `https://${host}:${server.proxyPort}`;
  } else {
    uri = `http://${host}:${server.port}`;
  }

  resolve(uri);

}).then(uri => {
  db.settings.set('uri', uri).write();
}).catch(err => {
  console.error(new Error(err));
});

if (!db.settings.get('api.state').value()) db.settings.get('api').set('state', crypto.randomBytes(16).toString('hex')).write();
