"use strict";

// # BNS configuration

module.exports = {
    server: {
        url: 'http://localhost:8083', // if you use a special port like 'http://example.com:8080', please add it!
        port: '8083',
        type: 0, // '0' = normal, '1' = proxy
        host: 'localhost' // only for 'proxy' type
    },
    api: {
        twitch: {
            client_id: '9x5ovvfwvm9agvw8fo1u6jb06pdyuw',
            client_secret: '',
            scopes: 'channel_subscriptions'
        },
        streamlabs: {
            client_id: 'R00ShGIwLW910D79i1YakpoqJtWaY8GvRLqor3uC',
            client_secret: 'h8HUwdfNoReTiSaPIWQMEbGMxlK1pD0B4xdqhAoM',
            scopes: 'donations.read'
        }
    }
};
