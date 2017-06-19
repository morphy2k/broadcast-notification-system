/* eslint-env browser, commonjs */
/* global playSound */
'use strict';

const $ = require('../../../node_modules/jquery/dist/jquery.slim.min.js');
const io = require('../../../node_modules/socket.io-client/dist/socket.io.slim.js');

const socket = io.connect();

class Notification {
  constructor() {
    this.data = {
      display_name: 'Mr. X',
      resubs: 6,
      amount: '25',
      currency: 'USD',
      message: 'This is a test donation!',
      viewers: 38
    };
  }

  parse(data) {

    const type = data.type;

    if (data.test) data = this.data;

    $('.name').html(data.display_name);

    switch (type) {
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

    this.show(type);

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
      if (data.version !== undefined && data.version !== window.version) {
        location.reload(true);
      }
    });
});
