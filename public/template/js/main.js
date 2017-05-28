/* eslint-env browser, jquery */
/* global version, playSound */
'use strict';

const $ = require('../../../node_modules/jquery/dist/jquery.slim.min.js');
const io = require('../../../node_modules/socket.io-client/dist/socket.io.js');

const socket = io.connect();

socket.on('connect', () => {
  socket.on('notification', (data) => {

    $('.notification').hide();

    setTimeout(() => {
      let type = data.type,
        name,
        resubs,
        amount,
        currency,
        message;

      if (!data.test) {
        name = data.name;
      } else {
        name = 'Mr. X';
      }

      if (type === 'subscription') {
        if (!data.test) {
          resubs = data.resubs;
        } else {
          resubs = '3';
        }
        $('.name').html(name);
        $('#subcount').html(resubs);
      }

      if (type === 'donation') {

        if (!data.test) {
          amount = data.amount;
          currency = data.currency;
          message = data.message;
        } else {
          amount = '25';
          currency = 'EUR';
          message = 'This is a test donation';
        }

        $('#amount').html(`${amount} ${currency}`);
        $('#message').html(message);


      }

      if (type === 'follow' || type === 'subscription' || type === 'host' || type === 'donation') {

        if (type === 'follow') {
          $('#follow').css('display', 'flex');
        }
        if (type === 'subscription') {
          $('#sub').css('display', 'flex');
        }
        if (type === 'host') {
          $('#host').css('display', 'flex');
        }
        if (type === 'donation') {
          $('#donation').css('display', 'flex');
        }

      }

      playSound(type);

    }, 600);

  });

  socket.on('general', (data) => {
    // client-server version matching
    if (data.version !== undefined) {
      if (data.version !== version) {
        location.reload(true);
      }
    }
  });
});
