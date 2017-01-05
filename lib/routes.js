"use strict";

// # express routes

const config = require('../config');
const db = require('./database');
const server = require('./server');
const express = server.express;
const app = server.app;
const router = express.Router();
const api = require('./api');
const dashboard = require('./dashboard');

const version = require('../package.json').version;

// global
router.use('/jquery.min.js', express.static('./views/ressources/jquery.min.js'));
router.use('/socket.io.min.js', express.static('./views/ressources/socket.io.min.js'));

// dashboard
router.get('/', (req, res) => {
    dashboard.getData((data) => {
        res.render('dashboard/index', {
            pageTitle: 'Landingpage',
            stats: data.stats,
            settings: data.settings,
            server: config.server,
            version
        });
    });
});
router.get('/dashboard', (req, res) => {
    dashboard.getData((data) => {
        res.render('dashboard/dashboard', {
            pageTitle: 'Dashboard',
            stats: data.stats,
            settings: data.settings,
            server: config.server,
            version
        });
    });
});
router.get('/settings', (req, res) => {
    dashboard.getData((data) => {
        res.render('dashboard/settings', {
            pageTitle: 'Settings',
            stats: data.stats,
            settings: data.settings,
            server: config.server,
            version
        });
    });
});
router.get('/wait', (req, res) => {
    res.render('dashboard/wait', {
        server: config.server
    });
});
router.use('/ressources', express.static('./views/dashboard/ressources'));

// templates
var template = db.settings.get('notification.template.selected').value();

router.get('/notifications/', (req, res) => {
    res.render(`templates/${template}/index`, {
        pageTitle: 'Notification window',
        server: config.server,
        version
    });
});
router.use('/template/ressources', express.static(`./views/templates/${template}/ressources`));

app.use('/', router);

// api
api.routes(app);
