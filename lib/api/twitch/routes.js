'use strict';

const qs = require('querystring');

const config = require('../../../config');
const db = require('../../database');
const authentication = require('./authentication');


module.exports = async(ctx, next) => {

    if (ctx.methode === 'GET' && ctx.url === '/api/twitch/auth') {
        if (ctx.request.query.code) {
            ctx.render('dashboard/process', err => {
                if (err) return ctx.throw(500);

                try {
                    authentication.init(ctx.request.query.code);
                } catch (e) {
                    return ctx.body = e;
                }

                ctx.redirect('/settings');
            });
        } else {
            let query = qs.stringify({
                    response_type: 'code',
                    client_id: config.api.twitch.client_id,
                    redirect_uri: `${db.settings.get('uri').value()}/api/twitch/auth`,
                    scope: 'channel_subscriptions'
                }),
                url = `https://api.twitch.tv/kraken/oauth2/authorize?${query}`;

            ctx.redirect(url);
        }
    }

    await next();
};
