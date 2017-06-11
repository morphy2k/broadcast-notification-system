'use strict';

const qs = require('querystring');
const crypto = require('crypto');

const config = require('../../../config');
const db = require('../../database');
const authentication = require('./authentication');


module.exports = async(ctx, next) => {

  if (ctx.method === 'GET') {
    if (ctx.url === '/api/twitch/auth') {

      let state = db.settings.get('api.twitch.auth.state').value();

      if (!state) {
        state = crypto.randomBytes(16).toString('hex');
        db.settings.get('api.twitch.auth').set('state', state).write();
      }

      const query = qs.stringify({
          response_type: 'code',
          client_id: config.api.twitch.client_id,
          redirect_uri: `${db.settings.get('uri').value()}/api/twitch/auth`,
          scope: 'channel_read channel_subscriptions',
          state
        }),
        url = `https://api.twitch.tv/kraken/oauth2/authorize?${query}`;

      ctx.redirect(url);

    } else if (ctx.url.startsWith('/api/twitch/auth') && ctx.request.query.code) {

      try {
        await authentication.init(ctx.request.query);
      } catch (e) {
        return ctx.throw(e);
      }

      ctx.redirect('/settings');

    }
  }

  await next();

};
