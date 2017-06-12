'use strict';

const config = require('../config');
const server = require('./server');
const app = server.app;
const StaticServe = require('./middleware/static-serve');
const db = require('./database');
const api = require('./api');
const dashboard = require('./dashboard');
const authentication = require('./authentication');
const version = require('../package.json').version;


//# dashboard
app.use(async(ctx, next) => {

  if (ctx.method === 'GET') {

    if (ctx.url === '/') {
      ctx.redirect('/dashboard');

    } else if (ctx.url === '/dashboard' || '/settings') {

      let data = await dashboard.data();
      data.version = version;

      if (ctx.url === '/dashboard') {
        await ctx.render('dashboard/dashboard', {
          pageTitle: 'Dashboard',
          data
        });
      } else if (ctx.url === '/settings') {
        await ctx.render('dashboard/settings', {
          pageTitle: 'Settings',
          data
        });
      }

    }
  }

  await next();

});

const staticDashboard = new StaticServe('/ressources', './public/dashboard');
app.use(staticDashboard.serve());


//# authentication
if (config.authentication.enabled) {

  let email = db.settings.get('auth.email').value();

  app.use(async(ctx, next) => {

    if (ctx.method === 'GET') {

      if (ctx.url === '/authentication') {
        if (email) ctx.redirect('/');

      } else if (ctx.url.startsWith('/authentication?token=')) {
        ctx.redirect('/dashboard');

      } else if (ctx.url === '/authentication/signup') {

        if (!email) {

          await ctx.render(`authentication/signup`, {
            days: config.authentication.tokenExp
          });

        } else {
          ctx.redirect('/');
        }

      } else if (ctx.url.startsWith('/authentication/signup/send?')) {

        if (!email && ctx.request.get('email')) {
          ctx.status = 202;
          email = ctx.request.get('email');
          authentication.signUp(email);

        } else {
          ctx.throw(403);
        }
      }
    }

    await next();

  });

  const staticAuthentication = new StaticServe('/authentication/ressources', './public/authentication');
  app.use(staticAuthentication.serve());
}


//# notifications
app.use(async(ctx, next) => {

  if (ctx.method === 'GET') {

    if (ctx.url === '/notification') {

      await ctx.render(`template/index`, {
        pageTitle: 'Notification window',
        version
      });

    } else if (ctx.url.startsWith('/notification/')) {

      const page = ctx.url.replace('/notification/', '');

      if (page.length > 0 && page.indexOf('/') === -1) {

        await ctx.render(`template/${page}`, {
          pageTitle: 'Notification window',
          version
        });

      }
    }
  }

  await next();

});

const staticNotification = new StaticServe('/notification/ressources', './views/template/ressources');
app.use(staticNotification.serve());


//# api module routes
api.routes(app);
