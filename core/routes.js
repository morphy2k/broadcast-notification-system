"use strict";

// # express routes

const
    config = require('../config'),
    db = require('./database'),
    server = require('./server'),
    express = server.express,
    app = server.app,
    router = express.Router(),
    api = require('./api'),
    dashboard = require('./dashboard');

// global
router.use('/jquery.min.js', express.static('./views/ressources/jquery.min.js'));
router.use('/socket.io.min.js', express.static('./views/ressources/socket.io.min.js'));

// dashboard
router.get('/', (req, res) => {
    if (config.server.type === 0 || 1) {
        dashboard.getData((data) => {
            res.render('dashboard/index', {
                pageTitle: 'Landingpage',
                stats: data.stats,
                settings: data.settings,
                server: config.server
            });
        });
    } else if (config.server.type == 2) {
        server.getExternalIp((externalIp) => {
            dashboard.getData((data) => {
                res.render('dashboard/settings', {
                    pageTitle: 'Settings',
                    stats: data.stats,
                    settings: data.settings,
                    externalIp: externalIp,
                    server: config.server
                });
            });
        });
    }
});
router.get('/dashboard', (req, res) => {
    if (config.server.type === 0 || 1) {
        dashboard.getData((data) => {
            res.render('dashboard/dashboard', {
                pageTitle: 'Dashboard',
                stats: data.stats,
                settings: data.settings,
                server: config.server
            });
        });
    } else if (config.server.type == 2) {
        server.getExternalIp((externalIp) => {
            dashboard.getData((data) => {
                res.render('dashboard/settings', {
                    pageTitle: 'Settings',
                    stats: data.stats,
                    settings: data.settings,
                    externalIp: externalIp,
                    server: config.server
                });
            });
        });
    }
});
router.get('/settings', (req, res) => {
    if (config.server.type === 0 || 1) {
        dashboard.getData((data) => {
            res.render('dashboard/settings', {
                pageTitle: 'Settings',
                stats: data.stats,
                settings: data.settings,
                server: config.server
            });
        });
    } else if (config.server.type == 2) {
        server.getExternalIp((externalIp) => {
            dashboard.getData((data) => {
                res.render('dashboard/settings', {
                    pageTitle: 'Settings',
                    stats: data.stats,
                    settings: data.settings,
                    externalIp: externalIp,
                    server: config.server
                });
            });
        });
    }
});
router.get('/wait', (req, res) => {
    res.render('dashboard/wait');
});
router.use('/ressources', express.static('./views/dashboard/ressources'));

// templates
var template = db.settings.get('notification.template.selected').value();

router.get('/notifications/', (req, res) => {
    if (config.server.type === 0 || 1) {
        res.render('templates/' + template + '/index', {
            pageTitle: 'Notification window',
            server: config.server
        });
    } else if (config.server.type == 2) {
        server.getExternalIp((externalIp) => {
            res.render('templates/' + template + '/index', {
                pageTitle: 'Notification window',
                externalIp: externalIp,
                server: config.server
            });
        });
    }
});
router.use('/template/ressources', express.static('./views/templates/' + template + '/ressources'));

app.use('/', router);

// api
api.routes(app);
