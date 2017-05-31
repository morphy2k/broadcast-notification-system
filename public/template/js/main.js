/* eslint-env browser, commonjs */
/* global version, playSound */
'use strict';

const $ = require('../../../node_modules/jquery/dist/jquery.slim.min.js');
const io = require('../../../node_modules/socket.io-client/dist/socket.io.js');

const socket = io.connect();

class Notification {
  constructor() {}

  parse(data) {

    $('.name').html(data.display_name);

    switch (data.type) {
    case 'subscription':
      $('.subscription-count').html(data.resubs);
      break;
    case 'donation':
      $('.donation-amount').html(data.amount);
      $('.donation-currency').html(data.currency);
      $('.donation-message').html(data.message);
      break;
    case 'host':
      $('.host-views').html(data.viewers);
      break;
    }

    this.show(data.type);

  }

  show(type) {
    $(`.notification`).hide();

    setTimeout(() => $(`#${type}`).css('display', 'flex'), 400);

    if (typeof playSound === 'function') playSound(type);
  }

}

const notification = new Notification();

socket.on('connect', () => {
  socket.on('notification', data => notification.parse(data))
    .on('general', data => {
      if (data.version !== undefined && data.version !== version) {
        location.reload(true);
      }
    });
});
