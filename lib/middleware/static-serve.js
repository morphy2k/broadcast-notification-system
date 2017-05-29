'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const stream = require('stream');

const config = require('./../../config');
const server = require('./../server');
const app = server.app;


class StaticServe {
  constructor(route, mount) {

    this.route = route;
    this.mount = mount;

    this.extensions = [
      'json',
      'css',
      'js',
      'svg',
      'png',
      'jpg',
      'gif',
      'apng',
      'ttf',
      'otf',
      'woff',
      'woff2',
      'mp3'
    ];

    this.mimes = {

      // application
      json: 'application/json',
      js: 'application/javascript',

      // text
      css: 'text/css',

      // image
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      gif: 'image/gif',
      apng: 'image/apng',

      // font
      ttf: 'font/ttf',
      otf: 'font/oft',
      woff: 'font/woff',
      woff2: 'font/woff2',

      // audio
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      webm: 'audio/webm'

    };

  }

  serve() {
    return async(ctx, next) => {

      let url = ctx.url;

      if ((ctx.method === 'HEAD' || ctx.method === 'GET') && (url.startsWith(this.route))) {

        const file = await new Promise(resolve => {
          for (let el of this.extensions) {

            let ext = `.${el}`,
              query = `.${el}?`;

            if (url.indexOf(ext) !== -1) {

              if (url.indexOf(query) !== -1) url = url.substring(0, url.indexOf(query) + query.length - 1);

              url = url.replace(this.route, '');
              ctx.type = `${this.mimes[el]}`;

              return resolve(path.join(`${this.mount}${url}`));
            }
          }

          resolve();

        });

        if (file) {

          const data = fs.createReadStream(file);

          ctx.set('Cache-Control', `private, max-age=${24 * 60 * 60}`);

          data.on('error', err => {
            app.emit('error', err, this);
            ctx.status = 404;
            ctx.res.end();
          });

          if (config.server.compression && ctx.acceptsEncodings('gzip')) {
            ctx.set('Content-Encoding', 'gzip');
            ctx.body = data.pipe(zlib.createGzip()).pipe(stream.PassThrough());
          } else {
            ctx.body = data.pipe(stream.PassThrough());
          }

        }

      }

      await next();

    };
  }

}

module.exports = StaticServe;
