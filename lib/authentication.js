'use strict';

const crypto = require("crypto");
const qs = require('querystring');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const config = require('../config');
const db = require('./database');


class Mail {
    constructor() {

        this.email = db.settings.get('auth.email').value();
        this.uri = db.settings.get('uri').value();

        if (process.env.NODE_ENV !== 'production') {
            this.transporter = nodemailer.createTransport({
                jsonTransport: true
            });
        } else {
            this.transporter = nodemailer.createTransport(config.authentication.mail);
        }
    }

    set address(adress) {
        this.email = adress;
        db.settings.get('auth').set('email', this.email).write();
    }

    get address() {
        return this.email;
    }

    send(token) {

        const htmlBody = `<div style="font-family: 'sans-serif', sans-serif; font-size: 0.9rem; background-color:rgb(241, 241, 241); box-sizing:border-box; min-height:15rem; max-width:40rem; margin: 0 auto; padding:2rem 5rem 4rem 5rem; display:flex; flex-wrap: wrap; align-items:center; justify-content:center; text-align:center;">
            <h1>BNS Authentication</h1>
            <a style="display:block; box-sizing:border-box; width:20rem; margin:2rem 3rem 4rem 3rem; background:rgb(4, 42, 66); color:white; text-align:center; line-height:4rem; text-decoration:none; text-transform:uppercase;" href="${this.uri}/authentication?token=${token}" target="_blank">Authenticate</a>

            <b>Add the following string to the end of the URLs that you use for your streaming software.</b>
            <div style="box-sizing:border-box; max-width:30rem; margin:1rem; word-break:break-all;">
                ?token=${token}
            </div>
        </div>`;

        if (process.env.NODE_ENV === 'development') {
            this.transporter.sendMail({
                from: 'Broadcast Notification System',
                to: this.email,
                subject: 'Access token',
                text: `${this.uri}/authentication?token=${token}`
            }, (err, info) => {
                console.log(info.envelope);
                console.log(info.messageId);
                console.log(info.message); // JSON string
            });
        } else {
            this.transporter.sendMail({
                from: 'Access token - Broadcast Notification System',
                to: this.email,
                subject: 'Access token',
                html: htmlBody
            }, (err, info) => {
                if (err) {
                    console.error(new Error(err));
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

    signToken() {
        return new Promise(async(resolve, reject) => {
            try {
                var token = await jwt.sign({
                    iss: 'BNS',
                    email: mail.address,
                    iat: Math.floor(Date.now() / 1000) - 30,
                    exp: Math.floor(Date.now() / 1000) + (config.authentication.tokenExp * 24 * 60 * 60),
                }, this.secret);
            } catch (err) {
                return reject(err);
            }

            db.settings.get('auth').set('expiration_date', Math.floor(Date.now() / 1000) + (10070 * 60)).write();
            mail.send(token);

            console.info(new Date(), 'Token successfully signed!');
            resolve();
        });
    }

    verifyToken(token) {
        return new Promise(async(resolve, reject) => {
            try {
                await jwt.verify(token, this.secret);
            } catch (err) {
                return reject(err);
            }

            resolve();
        });
    }

    ifExpired() {
        let expDate = new Date(db.settings.get('auth.expiration_date').value()),
            date = new Date();

        if (expDate > date) this.signToken();
    }
}


class Authentication extends JSONWebToken {
    constructor() {
        super();

        if (process.env.NODE_ENV === 'development') {
            this.cookieSecure = false;
        } else {
            this.cookieSecure = true;
        }

    }

    signIn(email) {
        mail.address = email;
        super.signToken();
    }

    koaMiddleware() {
        return async(ctx, next) => {

            const url = ctx.url;
            const authPath = '/authentication';

            if (!mail.address &&
                !url.startsWith(`${authPath}/signin`) &&
                !url.startsWith(`${authPath}/ressources`)) {
                return ctx.redirect(`${authPath}/signin`);
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

            await new Promise(async(resolve, reject) => {
                try {
                    await super.verifyToken(token);
                } catch (err) {
                    return reject(err);
                }

                resolve();
            }).then(() => {
                return new Promise(async(resolve, reject) => {
                    if (ctx.request.query.token) {
                        try {
                            await ctx.cookies.set('jwt', token, {
                                secure: this.cookieSecure,
                                httpOnly: true,
                                maxAge: config.authentication.cookieExp * 60 * 1000,
                                overwrite: true
                            });
                        } catch (err) {
                            return reject(err);
                        }
                    }

                    resolve();
                });
            }).catch(async err => {
                ctx.status = 401;
                await ctx.render('authentication/locked');
                console.error(new Error(err));
            });

            await next();
        };
    }

    socketMiddleware() {
        return async(socket, next) => {

            let cookies = socket.request.headers.cookie,
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
