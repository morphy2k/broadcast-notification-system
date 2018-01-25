'use strict';

const request = require('request-promise-native');

const config = require('../../../config');
const db = require('../../database');
const version = require('../../../package.json').version;


class Authentication {
  constructor() {
    this.options = {
      headers: {
        'User-Agent': `BroadcastNotificationSystem/${version} (TwitchModule)`,
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Client-ID': config.api.twitch.client_id
      },
      uri: 'https://api.twitch.tv/kraken/oauth2/token',
      formData: {
        client_id: config.api.twitch.client_id,
        client_secret: config.api.twitch.client_secret
      }
    };
  }

  async new(query) {

    const state = db.settings.get('api.state').value();
    if (query.state !== state) return Promise.reject('State not valid! Maybe CSRF!');

    const getAuth = async () => {

      let options = Object.assign({
        method: 'POST',
      }, this.options);

      Object.assign(options.formData, {
        grant_type: 'authorization_code',
        redirect_uri: `${db.settings.get('uri').value()}/api/twitch/auth`,
        code: query.code
      });

      try {
        const body = await request(options);

        const json = JSON.parse(body),
          token = json.access_token,
          refresh_token = json.refresh_token,
          expiration_date = Math.floor(Date.now() / 1000 + json.expires_in - 60);

        return {
          token,
          refresh_token,
          expiration_date
        };

      } catch (err) {
        return Promise.reject(err);
      }

    };

    const getUser = async auth => {

      let options = Object.assign({}, this.options);
      delete options.formData;

      Object.assign(options.headers, {
        'Authorization': `OAuth ${auth.token}`
      });

      options.uri = `https://api.twitch.tv/kraken/channel`;

      console.log(options);

      try {
        const body = await request(options);

        const json = JSON.parse(body),
          id = parseInt(json._id),
          name = json.name,
          type = json.broadcaster_type;

        return {
          id,
          name,
          auth,
          type
        };

      } catch (err) {
        return Promise.reject(err);
      }

    };

    let user = {};
    try {
      const auth = await getAuth();
      user = await getUser(auth);
    } catch (err) {
      return Promise.reject(err);
    }

    db.settings.get('api.twitch').assign({
      enabled: true,
      userid: user.id,
      username: user.name,
      auth: {
        token: user.auth.token,
        refresh_token: user.auth.refresh_token,
        expiration_date: user.auth.expiration_date
      },
      type: user.type
    }).write();

    require('./').init();
    require('../../scheduler').api('twitch');

    return;
  }

  async refresh() {

    let options = Object.assign({
      method: 'POST',
    }, this.options);

    Object.assign(options.formData, {
      grant_type: 'refresh_token',
      refresh_token: db.settings.get('api.twitch.auth.refresh_token').value()
    });

    try {
      const body = await request(options);

      const json = JSON.parse(body),
        token = json.access_token,
        refresh_token = json.refresh_token,
        expiration_date = Math.floor(Date.now() / 1000 + json.expires_in - 60);

      db.settings.get('api.twitch.auth').assign({
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
