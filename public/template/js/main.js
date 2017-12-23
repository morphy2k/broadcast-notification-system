/* eslint-env browser, commonjs */
/* global playSound, customController */
'use strict';

const $ = require('../../../node_modules/jquery/dist/jquery.min.js');
const io = require('../../../node_modules/socket.io-client/dist/socket.io.slim.js');

window.$ = $;

const socket = io.connect();

class Notification {
  constructor() {}

  get testData() {
    return {
      display_name: 'Mr. X',
      resubs: Math.floor(Math.random() * 60),
      amount: Math.floor((Math.random() * 1000) + 1),
      currency: 'USD',
      message: 'This is a test donation!',
      viewers: Math.floor((Math.random() * 1000) + 1)
    };
  }

  parse(data) {

    const type = data.type;

    if (data.test) data = this.testData;

    if (typeof customController === 'function') return customController(type, data);

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
    setTimeout(() => {
      $(`#${type}`).css('display', 'flex');
      if (typeof playSound === 'function') playSound(type);
    }, 200);
  }

}

const notification = new Notification();

socket.on('connect', () => {
  socket.on('notification', data => notification.parse(data))
    .on('general', data => {
      if (data.version !== undefined &&
        data.version !== window.version) location.reload(true);
    });
});
