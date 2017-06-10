'use strict';

const qs = require('querystring');

const config = require('../../../config');
const db = require('../../database');
const authentication = require('./authentication');


module.exports = async(ctx, next) => {

  if (ctx.methode === 'GET' && ctx.url === '/api/streamlabs/auth') {
    if (ctx.request.query.code) {

      ctx.render('dashboard/process', err => {
        if (err) return ctx.throw(500);

        try {
          authentication.new(ctx.request.query.code);
        } catch (e) {
          return ctx.throw(e);
        }

        ctx.redirect('/settings');
      });

    } else {

      const query = qs.stringify({
          response_type: 'code',
          client_id: config.api.streamlabs.client_id,
          redirect_uri: `${db.settings.get('uri').value()}/api/streamlabs/auth`,
          scope: 'donations.read'
        }),
        url = `https://streamlabs.com/api/v1.0/authorize?${query}`;

      ctx.redirect(url);

    }
  }

  await next();

};
