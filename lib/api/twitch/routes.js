'use strict';

const qs = require('querystring');

const config = require('../../../config');
const db = require('../../database');
const authentication = require('./authentication');


module.exports = async (ctx, next) => {

  if (ctx.method === 'GET') {
    if (ctx.url === '/api/twitch/auth') {

      const query = qs.stringify({
          response_type: 'code',
          client_id: config.api.twitch.client_id,
          redirect_uri: `${db.settings.get('uri').value()}/api/twitch/auth`,
          scope: 'channel_read channel_subscriptions',
          state: db.settings.get('api.state').value()
        }),
        url = `https://api.twitch.tv/kraken/oauth2/authorize?${query}`;

      ctx.redirect(url);

    } else if (ctx.url.startsWith('/api/twitch/auth') && ctx.request.query.code) {

      try {
        await authentication.new(ctx.request.query);
      } catch (e) {
        return ctx.throw(e);
      }

      ctx.redirect('/settings');

    }
  }

  await next();

};
