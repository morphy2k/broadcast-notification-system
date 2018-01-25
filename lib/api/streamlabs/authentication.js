'use strict';

const request = require('request-promise-native');

const config = require('../../../config');
const db = require('../../database');
const version = require('../../../package.json').version;


class Authentication {
  constructor() {
    this.options = {
      headers: {
        'User-Agent': `BroadcastNotificationSystem/${version} (StreamlabsModule)`
      },
      uri: 'https://streamlabs.com/api/v1.0/token',
      formData: {
        client_id: config.api.streamlabs.client_id,
        client_secret: config.api.streamlabs.client_secret
      }
    };
  }

  async new(query) {

    const state = db.settings.get('api.state').value();

    if (query.state !== state) return Promise.reject('State not valid! Maybe CSRF!');

    let options = Object.assign({
      method: 'POST',
    }, this.options);

    Object.assign(options.formData, {
      grant_type: 'authorization_code',
      code: query.code,
      redirect_uri: `${db.settings.get('uri').value()}/api/streamlabs/auth`
    });

    try {
      const body = await request(options);

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

      require('./').init();
      require('../../scheduler').api('streamlabs');

      return;

    } catch (err) {
      return Promise.reject(err);
    }

  }

  async refresh() {

    let options = Object.assign({
      method: 'POST',
    }, this.options);

    Object.assign(options.formData, {
      grant_type: 'refresh_token',
      refresh_token: db.settings.get('api.streamlabs.auth.refresh_token').value()
    });

    try {
      const body = await request(options);

      const json = JSON.parse(body),
        token = json.access_token,
        refresh_token = json.refresh_token,
        expiration_date = Math.floor(Date.now() / 1000 + 50 * 60);

      db.settings.get('api.streamlabs.auth')
        .assign({
          token,
          refresh_token,
          expiration_date
        }).write();

      return;

    } catch (err) {
      return Promise.reject(err);
    }

  }
}

const authentication = new Authentication();
module.exports = authentication;
