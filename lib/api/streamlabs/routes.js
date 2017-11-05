'use strict';

const qs = require('querystring');

const config = require('../../../config');
const db = require('../../database');
const authentication = require('./authentication');


module.exports = async(ctx, next) => {

  if (ctx.method === 'GET') {
    if (ctx.url === '/api/streamlabs/auth') {

      const query = qs.stringify({
          response_type: 'code',
          client_id: config.api.streamlabs.client_id,
          redirect_uri: `${db.settings.get('uri').value()}/api/streamlabs/auth`,
          scope: 'donations.read',
          state: db.settings.get('api.state').value()
        }, null, null, {encodeURIComponent: qs.unescape}),
        url = `https://streamlabs.com/api/v1.0/authorize?${query}`;

      ctx.redirect(url);

    } else if (ctx.url.startsWith('/api/streamlabs/auth') && ctx.request.query.code) {

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
