/* eslint require-atomic-updates: 0 */
'use strict';

const crypto = require('crypto');
const qs = require('querystring');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const config = require('../config');
const db = require('./database');


class Mail {
  constructor() {

    this.email = db.settings.get('auth.email').value();

    if (process.env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    } else {
      this.transporter = nodemailer.createTransport(config.authentication.mail);
    }

  }

  set address(address) {
    this.email = address;
    db.settings.get('auth').set('email', this.email).write();
  }

  get address() {
    return this.email;
  }

  send(token) {

    const uri = db.settings.get('uri').value();

    const body =
      `${uri}/authentication?token=${token}

      Add the following string to the end of URLs that you use for your streaming software.
      ?token=${token}`;

    if (process.env.NODE_ENV === 'development') {

      this.transporter.sendMail({
        from: 'Broadcast Notification System',
        to: this.email,
        subject: 'BNS access token',
        text: `${uri}/authentication?token=${token}`
      }, (err, info) => {
        console.log(info.envelope);
        console.log(info.messageId);
        console.log(info.message);
      });

    } else {

      this.transporter.sendMail({
        from: 'Broadcast Notification System',
        to: this.email,
        subject: 'BNS access token',
        text: body
      }, (err, info) => {
        if (err) {
          console.error(err);
        } else {
          console.log(info);
        }
      });

    }
  }
}

const mail = new Mail();


class JSONWebToken {
  constructor() {

    this.secret = db.settings.get('auth.secret').value();
    if (!this.secret) {
      this.secret = crypto.randomBytes(24).toString('hex');
      db.settings.get('auth').set('secret', this.secret).write();
    }

  }

  async signToken() {
    let token;

    const exp_date = Math.floor(Date.now() / 1000 + config.authentication.tokenExp * 24 * 60 * 60);

    try {
      token = await jwt.sign({
        iss: 'BNS',
        email: mail.address,
        iat: Math.floor(Date.now() / 1000),
        exp: exp_date,
      }, this.secret);
    } catch (err) {
      return Promise.reject(err);
    }

    db.settings.get('auth').set('expiration_date', exp_date).write();
    mail.send(token);

    console.info(new Date(), 'Token successfully signed!');
    return;
  }

  async verifyToken(token) {
    try {
      await jwt.verify(token, this.secret);
    } catch (err) {
      return Promise.reject(err);
    }

    return;
  }

  ifExpired() {

    const expDate = db.settings.get('auth.expiration_date').value() - 24 * 60 * 60,
      date = Math.floor(Date.now() / 1000);

    if (mail.address && (!expDate || date > expDate)) {
      console.info('JWT has been expired! A new token will be signed.');
      this.signToken();
    }

  }

}


class Authentication extends JSONWebToken {
  constructor() {

    super();

    this.cookieSecure = false;

    // if (process.env.NODE_ENV === 'development') {
    //   this.cookieSecure = false;
    // } else {
    //   this.cookieSecure = true;
    // }

  }

  signUp(email) {
    mail.address = email;
    super.signToken();
  }

  koaMiddleware() {
    return async (ctx, next) => {

      const url = ctx.url;
      const authPath = '/authentication';

      if (!mail.address &&
        !url.startsWith(`${authPath}/signup`) &&
        !url.startsWith(`${authPath}/ressources`)) {
        return ctx.redirect(`${authPath}/signup`);
      }

      if (url.startsWith(`${authPath}`) && url.indexOf('?token') === -1) {
        return await next();
      }

      let token;

      if (ctx.request.query.token) {
        token = ctx.request.query.token;
      } else if (ctx.cookies.get('jwt')) {
        token = ctx.cookies.get('jwt');
      } else {
        ctx.status = 401;
        return await ctx.render('authentication/locked');
      }

      try {
        await super.verifyToken(token);

        await ctx.cookies.set('jwt', token, {
          secure: this.cookieSecure,
          httpOnly: true,
          maxAge: config.authentication.cookieExp * 60 * 1000,
          overwrite: true
        });
      } catch (err) {
        console.error(err);
        ctx.status = 401;
        return await ctx.render('authentication/locked');
      }

      await next();

    };
  }

  socketMiddleware() {
    return async(socket, next) => {

      const cookies = socket.request.headers.cookie,
        token = qs.parse(cookies, ';', '=').jwt;

      if (token) {
        try {
          await super.verifyToken(token);
        } catch (err) {
          console.error(new Error(err));
          return next(new Error(err));
        }
      }

      next();

    };
  }

}

const authentication = new Authentication();
module.exports = authentication;
