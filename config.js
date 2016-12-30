"use strict";

// # BNS configuration

module.exports = {
    server: {
        url: 'http://localhost', // if you use a special port like 'http://example.com:8080', please add it!
        port: '8083',
        type: 0, // '0' = normal, '1' = proxy, '2' = app engine
        host: 'localhost' // only for 'proxy' type
    },
    api: {
        twitch: {
            client_id: '9x5ovvfwvm9agvw8fo1u6jb06pdyuw',
            client_secret: '',
            scopes: 'channel_subscriptions'
        },
        streamlabs: {
            client_id: 'ZlyweeSVYJ2ABYckuJyTjnzCR9TIcrfcMMrKo9Xd',
            client_secret: 'mhzLln8QSVWra8jw5WoSJS0GxfkzR8SUoqQaGDIQ',
            scopes: 'donations.read'
        }
    }
};
