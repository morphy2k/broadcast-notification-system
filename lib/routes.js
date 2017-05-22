'use strict';

const fs = require('fs');

const bodyParser = require('body-parser');

const config = require('../config');
const db = require('./database');
const server = require('./server');
const express = server.express;
const app = server.app;
const api = require('./api');
const dashboard = require('./dashboard');
const authentication = require('./authentication');
const version = require('../package.json').version;


//# define routers
const auth = express.Router();
const backend = express.Router();
const notification = express.Router();


//# authentication
app.use('/authentication', auth);
auth.use('/ressources', express.static(`./public/authentication`));

let email = db.settings.get('auth.email').value();

auth.get('/', (req, res) => {
    if (email) res.redirect('/');
});
auth.get('/signin', (req, res) => {
    if (!email) {
        res.render(`authentication/signin`, {
            days: config.authentication.tokenExp
        });
    } else {
        res.redirect('/');
    }
});
auth.use('/signin/send', bodyParser.urlencoded({
    extended: true
}));
auth.post('/signin/send', (req, res) => {
    if (req.body.email) {
        authentication.signIn(req.body.email);
        res.send(`Please check your mailbox in 1-2 minutes!
            You can close this window now.`);
        email = req.body.email;
    } else {
        res.status(401).send('No access...');
    }
});


//# dashboard
app.use('/', backend);
backend.use('/ressources', express.static('./public/dashboard'));

backend.get('/', (req, res) => {
    res.redirect(`dashboard`);
});
backend.get('/dashboard', (req, res) => {
    dashboard.getData((data) => {
        res.render('dashboard/dashboard', {
            pageTitle: 'Dashboard',
            stats: data.stats,
            settings: data.settings,
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
            version
        });
    });
});


//# notifications
app.use('/notification', notification);
notification.use(express.static(`./views/template/`));

notification.get('/:page?', (req, res) => {
    let page = req.params.page;
    if (page) {
        fs.stat(`./views/template/${page}.pug`, (err) => {
            if (err) return res.status(404).send(`404 '/${page}' not found!`);

            res.render(`template/${page}`, {
                pageTitle: 'Notification window',
                version
            });
        });
    } else {
        res.render(`template/index`, {
            pageTitle: 'Notification window',
            version
        });
    }
});


//# api module routes
api.routes(app);
