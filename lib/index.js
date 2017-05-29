'use strict';

require('./scheduler');
require('./routes');

const db = require('./database');

const resolveURI = () => {

  let server = require('../config').server,
    host = server.host,
    uri = '';

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

  return uri;

};

resolveURI(uri => {
  db.settings.set('uri', uri).write();
});
