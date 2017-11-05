'use strict';

const request = require('request');

const config = require('../../../config');
const db = require('../../database');
const version = require('../../../package.json').version;


class Authentication {
  constructor() {
    this.options = {
      headers: {
        'User-Agent': `BroadcastNotificationSystem/${version} (StreamlabsModule)`
      },
      url: 'https://streamlabs.com/api/v1.0/token',
      form: {
        client_id: config.api.streamlabs.client_id,
        client_secret: config.api.streamlabs.client_secret
      }
    };
  }

  new(query) {

    const state = db.settings.get('api.state').value();

    return new Promise((resolve, reject) => {

      if (query.state !== state) return reject('State not valid! Maybe CSRF!');

      let options = this.options;

      Object.assign(options.form, {
        grant_type: 'authorization_code',
        code: query.code,
        redirect_uri: `${db.settings.get('uri').value()}/api/streamlabs/auth`
      });

      request.post(options, (err, response, body) => {
        if (err) {
          reject(`[STREAMLABS AUTH]: ${err}`);

        } else if (response.statusCode === 200) {

          const json = JSON.parse(body),
            token = json.access_token,
            refresh_token = json.refresh_token,
            expiration_date = Math.floor(Date.now() / 1000 + 50 * 60);

          db.settings.get('api.streamlabs').assign({
            enabled: true,
            auth: {
              token,
              refresh_token,
              expiration_date
            }
          }).write();

        } else {
          reject(`[STREAMLABS AUTH]: HTTP ${response.statusCode}`);
        }

        require('./').init();
        require('../../scheduler').api('streamlabs');

        resolve();

      });

    });

  }

  refresh() {
    return new Promise((resolve, reject) => {

      let options = this.options;

      Object.assign(options.form, {
        grant_type: 'refresh_token',
        refresh_token: db.settings.get('api.streamlabs.auth.refresh_token').value()
      });

      request.post(options, (err, response, body) => {
        if (err) {
          reject(`[STREAMLABS AUTH]: ${err}`);

        } else if (response.statusCode === 200) {

          const json = JSON.parse(body),
            token = json.access_token,
            refresh_token = json.refresh_token,
            expiration_date = Math.floor(Date.now() / 1000 + 50 * 60);

          db.settings.get('api.streamlabs')
            .assign({
              token,
              refresh_token,
              expiration_date
            }).write();

          resolve();

        } else {
          reject(`[STREAMLABS AUTH]: HTTP ${response.statusCode}`);
        }
      });

    });
  }
}

const authentication = new Authentication();
module.exports = authentication;
