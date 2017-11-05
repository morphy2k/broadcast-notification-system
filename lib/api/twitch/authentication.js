'use strict';

const request = require('request');

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
      url: 'https://api.twitch.tv/kraken/oauth2/token',
      form: {
        client_id: config.api.twitch.client_id,
        client_secret: config.api.twitch.client_secret
      }
    };
  }

  new(query) {

    const state = db.settings.get('api.state').value();

    return new Promise((resolve, reject) => {

      new Promise((resolve, reject) => {

        if (query.state !== state) return reject('State not valid! Maybe CSRF!');

        let options = this.options;

        Object.assign(options.form, {
          grant_type: 'authorization_code',
          redirect_uri: `${db.settings.get('uri').value()}/api/twitch/auth`,
          code: query.code,
          state
        });

        request.post(options, (err, response, body) => {
          if (err) {
            reject(`[TWITCH AUTH]: S1 ${err}`);

          } else if (response.statusCode === 200) {

            const json = JSON.parse(body),
              token = json.access_token,
              refresh_token = json.refresh_token,
              expiration_date = Math.floor(Date.now() / 1000 + json.expires_in - 60),
              auth = {
                token,
                refresh_token,
                expiration_date
              };

            resolve(auth);

          } else {
            reject(`[TWITCH AUTH]: S1 HTTP ${response.statusCode}`);
          }

        });
      }).then(auth => {
        return new Promise((resolve, reject) => {

          let options = this.options;

          Object.assign(options.headers, {
            'Authorization': `OAuth ${auth.token}`
          });

          options.url = `https://api.twitch.tv/kraken/channel`;

          request(options, (err, response, body) => {
            if (err) {
              reject(`[TWITCH AUTH]: S2 ${err}`);

            } else if (response.statusCode === 200) {

              const json = JSON.parse(body),
                id = parseInt(json._id),
                name = json.name,
                type = json.broadcaster_type,
                user = {
                  id,
                  name,
                  auth,
                  type
                };

              resolve(user);

            } else {
              reject(`[TWITCH AUTH]: S2 HTTP ${response.statusCode}`);
            }
          });

        });
      }).then(user => {

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

        resolve();

      }).catch(err => {
        console.error(new Error(err));
        reject(err);
      });

    });
  }

  refresh() {
    return new Promise((resolve, reject) => {

      let options = this.options;

      Object.assign(options.form, {
        grant_type: 'refresh_token',
        refresh_token: db.settings.get('api.twitch.auth.refresh_token').value()
      });

      request.post(options, (err, response, body) => {
        if (err) {
          reject(`[TWITCH AUTH]: ${err}`);

        } else if (response.statusCode === 200) {

          const json = JSON.parse(body),
            token = json.access_token,
            refresh_token = json.refresh_token,
            expiration_date = Math.floor(Date.now() / 1000 + json.expires_in - 60);

          db.settings.get('api.twitch.auth').assign({
            token,
            refresh_token,
            expiration_date
          }).write();

          resolve();

        } else {
          reject(`[TWITCH AUTH]: HTTP ${response.statusCode}`);
        }

      });

    });
  }

}

const authentication = new Authentication();
module.exports = authentication;
