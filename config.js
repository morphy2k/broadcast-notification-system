'use strict';

module.exports = {
  server: {
    host: 'localhost', // if proxy in use set proxy host
    port: 8083,
    proxy: false,
    proxyPort: 80,
    compression: true // static file compression (a bit higher CPU/RAM usage, but smaller files to transfer)
  },
  authentication: { // !!!IMPORTANT!!! works only with HTTPS connection! (use nginx or similar as reverse-proxy for HTTPS)
    enabled: true, // can be disabled if it runs on a local machine
    cookieExp: 2880, // cookie expiration time in minutes (lower value = more secure)
    tokenExp: 7, // token expiration time in days (lower value = more secure)
    mail: { // Nodermailer configuration (https://nodemailer.com/smtp/well-known/)
      service: '"Mailgun"', // no need to set host or port etc.
      auth: {
        api_key: 'key-6ae4aa17ad513c1ebe64198f38330d3b',
        domain: 'sandbox1f688ee71ffd4b778d8335005e12cd43.mailgun.org'
      }
    }
  },
  api: {
    twitch: { // https://www.twitch.tv/kraken/oauth2/clients/new
      client_id: '9x5ovvfwvm9agvw8fo1u6jb06pdyuw',
      client_secret: ''
    },
    streamlabs: { // https://streamlabs.com/dashboard/#/apps/register
      client_id: 'R00ShGIwLW910D79i1YakpoqJtWaY8GvRLqor3uC',
      client_secret: 'h8HUwdfNoReTiSaPIWQMEbGMxlK1pD0B4xdqhAoM'
    }
  }
};
