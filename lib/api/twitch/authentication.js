'use strict';

const request = require('request');

const config = require('../../../config');
const db = require('../../database');
const version = require('../../../package.json').version;


class Authentication {
  constructor() {

    this.options = {};

    setTimeout(() => {
      this.options = {
        headers: {
          'User-Agent': `BroadcastNotificationSystem/${version} (TwitchModule)`,
          'Accept': 'application/vnd.twitchtv.v5+json',
          'Client-ID': config.api.twitch.client_id
        }
      };
    }, 2 * 1000);

    this.state = '';

  }

  init(query) {

    this.state = db.settings.get('api.twitch.auth.state').value();

    return new Promise((resolve, reject) => {

      new Promise((resolve, reject) => {

        if (query.state !== this.state) {
          return reject('State not valid!');
        }

        const options = Object.assign({
          form: {
            client_id: config.api.twitch.client_id,
            client_secret: config.api.twitch.client_secret,
            grant_type: 'authorization_code',
            redirect_uri: `${db.settings.get('uri').value()}/api/twitch/auth`,
            code: query.code,
            state: query.state
          }
        }, this.options);

        request.post('https://api.twitch.tv/kraken/oauth2/token',
          options, (err, response, body) => {
            if (err) {
              reject(`[TWITCH AUTH]: S1 ${err}`);

            } else if (response.statusCode === 200) {

              const json = JSON.parse(body),
                token = json.access_token;

              resolve(token);

            } else {
              reject(`[TWITCH AUTH]: S1 HTTP ${response.statusCode}`);
            }

          });
      }).then(token => {
        return new Promise((resolve, reject) => {

          let options = this.options;

          Object.assign(options.headers, {
            'Authorization': `OAuth ${token}`
          });
          Object.assign(options, {
            qs: {
              state: this.state
            }
          });

          request(`https://api.twitch.tv/kraken/channel`,
            options, (err, response, body) => {
              if (err) {
                reject(`[TWITCH AUTH]: S2 ${err}`);

              } else if (response.statusCode === 200) {

                const json = JSON.parse(body),
                  id = parseInt(json._id),
                  name = json.name,
                  partner = json.partner,
                  user = {
                    id,
                    name,
                    token,
                    partner
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
            token: user.token,
            state: this.state
          },
          partner: user.partner
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

}

const authentication = new Authentication();
module.exports = authentication;
