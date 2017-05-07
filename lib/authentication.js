"use strict";

const config = require('../config');
const db = require('./database');
const uuidV4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


class Mail {
    constructor() {
        if (true) {
            let transporter = nodemailer.createTransport({
                jsonTransport: true
            });
        } else if (false) {
            this.transport = nodemailer.createTransport();
        }
    }

    send(to, token) {
        if (true) {
            this.transporter.sendMail({
                from: 'Broadcast Notification System',
                to,
                subject: 'Access token',
                text: `${config.server.url}/authentication?token=${token}`
            }, (err, info) => {
                console.log(info.envelope);
                console.log(info.messageId);
                console.log(info.message); // JSON string
            });
        } else {
            this.transport.sendMail({
                from: 'Broadcast Notification System',
                to,
                subject: 'Access token',
                html: `<div style="height:100%; width:100%; display:flex; align-items:center; justify-content:center;">
                            <a style="display:block; width:20rem; background:blue; color:white; text-align:center; line-height:8rem;" href="${config.server.url}/authentication?token=${token}">Authenticate</a>
                        </div>`
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


class JsonWebToken {
    constructor() {
        this.secret = db.settings.get('auth.secret').value();
        if (!this.secret) {
            this.secret = uuidV4();
            db.settings.get('auth').set('secret', this.secret).write();
        }
        this.email = db.settings.get('auth.email').value();

    }

    signIn(email) {
        this.email = email;
        db.settings.get('auth').set('email', email).write();
        this.generate();
    }

    generate() {
        let token = jwt.sign({
            iss: 'BNS',
            email: this.email,
            iat: Math.floor(Date.now() / 1000) - 30,
            exp: Math.floor(Date.now() / 1000) + (10080 * 60),
        }, this.secret);

        db.settings.get('auth').set('expiration_date', Math.floor(Date.now() / 1000) + (10070 * 60)).write();

        mail.send(this.email, token);
    }
}

const jsonwebtoken = new JsonWebToken();
exports.jsonwebtoken = jsonwebtoken;
