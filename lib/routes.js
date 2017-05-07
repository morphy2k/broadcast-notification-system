"use strict";

//# express routes

const config = require('../config');
const db = require('./database');
const server = require('./server');
const express = server.express;
const app = server.app;
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const api = require('./api');
const dashboard = require('./dashboard');
const authentication = require('./authentication');
const version = require('../package.json').version;

const auth = express.Router();
const backend = express.Router();
const notification = express.Router();

// libs
app.use('/jquery.slim.min.js', express.static('./node_modules/jquery/dist/jquery.slim.min.js'));
app.use('/socket.io.min.js', express.static('./node_modules/socket.io-client/dist/socket.io.min.js'));
app.use('/moment-with-locales.min.js', express.static('./node_modules/moment/min/moment-with-locales.min.js'));
app.use('/Chart.min.js', express.static('./node_modules/chart.js/dist/Chart.min.js'));


// authentication
let secret = db.settings.get('auth.secret').value(),
    email = db.settings.get('auth.email').value(),
    expires = new Date(Date.now() + (config.security.cookieExp * 60000)),
    cookieOptions = {
        signed: true,
        httpOnly: true,
        secure: false,
        expires
    };

if (!secret) {
    secret = '1337';
    setTimeout(() => secret = db.settings.get('auth.secret').value(), 2000);
}

app.use(cookieParser(secret));

let jwtConfig = jwt({
    secret: secret,
    credentialsRequired: true,
    getToken: function fromHeaderOrCookie(req, res) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.signedCookies.jwt) {
            return req.signedCookies.jwt;
        }
        return null;
    }
});

auth.use(bodyParser.json(),
    bodyParser.urlencoded({
        extended: true
    }));
auth.get('/', (req, res, next) => {
    if (req.query && req.query.token) {
        res.cookie('jwt', req.query.token, cookieOptions).redirect('/dashboard');
    } else if (!email) {
        res.redirect('/authentication/signin');
    } else {
        res.redirect('/');
    }
});
auth.get('/signin', (req, res) => {
    if (!db.settings.get('auth.email').value()) {
        res.render(`authentication/signin`);
    } else {
        res.redirect('/');
    }
});
auth.post('/signin/send', (req, res) => {
    if (req.body.email) {
        authentication.jsonwebtoken.signIn(req.body.email);
        res.send('Please check your mailbox in 1-2 minutes! You can close this window now.');
        email = req.body.email;
    }
});
notification.get('/authentication', (req, res) => {
    if (req.query && req.query.token) res.cookie('jwt', req.query.token, cookieOptions).redirect('/notification');
});



auth.use(express.static(`./views/authentication`));

app.use('/authentication', auth);


// dashboard
backend.use(jwtConfig, (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).render('authentication/locked');
    }
});

backend.get('/', (req, res) => {
    res.redirect(`dashboard`);
});
backend.get('/dashboard', (req, res) => {
    dashboard.getData((data) => {
        res.render('dashboard/dashboard', {
            pageTitle: 'Dashboard',
            stats: data.stats,
            settings: data.settings,
            server: config.server,
            jwt: req.signedCookies.jwt,
            version
        });
    });
});
backend.get('/settings', (req, res) => {

    dashboard.getData((data) => {
        res.render('dashboard/settings', {
            pageTitle: 'Settings',
            stats: data.stats,
            settings: data.settings,
            server: config.server,
            jwt: req.signedCookies.jwt,
            version
        });
    });
});
backend.get('/wait', (req, res) => {

    res.render('dashboard/wait', {
        server: config.server,
        jwt: req.signedCookies.jwt
    });
});
backend.use(express.static('./views/dashboard'));

app.use('/', backend);


// notification
notification.use(jwtConfig);

var template = db.settings.get('notification.template.selected').value();

notification.get('/', (req, res) => {
    res.render(`templates/${template}/index`, {
        pageTitle: 'Notification window',
        server: config.server,
        jwt: req.signedCookies.jwt,
        version
    });
});
notification.use(express.static(`./views/templates/${template}`));

app.use('/notification', notification);


// api
api.routes(app);
