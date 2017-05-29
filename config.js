'use strict';

module.exports = {
  server: {
    host: 'localhost', // if proxy in use set proxy host
    port: 8080,
    proxy: false,
    proxyPort: 80,
    compression: true // static file compression (a bit higher CPU/RAM usage, but smaller files to transfer)
  },
  authentication: { // !!!IMPORTANT!!! works only with HTTPS connection! (use nginx or similar as reverse-proxy for HTTPS)
    enabled: false, // can be disabled if it runs on a local machine
    cookieExp: 2880, // cookie expiration time in minutes (lower value = more secure)
    tokenExp: 7, // token expiration time in days (lower value = more secure)
    mail: { // Nodermailer configuration (https://nodemailer.com/smtp/well-known/)
      service: '"Mailgun"', // no need to set host or port etc.
      auth: {
        api_key: '',
        domain: ''
      }
    }
  },
  api: {
    twitch: { // https://www.twitch.tv/kraken/oauth2/clients/new
      client_id: '',
      client_secret: ''
    },
    streamlabs: { // https://streamlabs.com/dashboard/#/apps/register
      client_id: '',
      client_secret: ''
    }
  }
};
