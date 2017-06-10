'use strict';

const io = require('../server').io;
const settings = require('./settings');
const template = require('../template');


class Socket {
  constructor() {

    this.connected = false;

    io.on('connection', socket => {

      this.connected = true;

      socket.on('dashboard', async (type, data) => {

        const response = (err, res) => {
          if (err) return socket.emit('dashboard', 'response', true);
          socket.emit('dashboard', 'response', null, res);
        };


        if (type === 'set') {

          settings.data = data;
          data.type = type;
          response(null, data);

        } else if (type === 'function') {

          if (data.prop === 'template.search') {

            let result = {};

            try {
              result = await template.search();
            } catch (e) {
              response(true);
              return console.error(new Error(`[TEMPLATE SEARCH]: ${e}`));
            }

            response(null, {
              prop: data.prop,
              templates: result.templates,
              selected: result.selected
            });

          } else if (data.prop === 'template.set') {

            try {
              await template.set(data.value);
            } catch (e) {
              response(true);
              return console.error(e);
            }

            response(null, data);

          } else if (data.prop === 'notification.test') {

            const obj = {
              type: data.value,
              test: true
            };

            io.sockets.emit('notification', obj);

          } else if (data.prop === 'notification.clearQueue') {

            await require('../notification').clearQueue();
            response(null, data);

          }

        }

      });


      socket.on('disconnect', () => {
        this.connected = false;
      });

    });
  }

  emit(channel, data) {
    io.sockets.emit(channel, data);
  }

}

const socket = new Socket();
module.exports = socket;
