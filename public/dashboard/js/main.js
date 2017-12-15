/* eslint-env browser, commonjs */
'use strict';

const $ = require('../../../node_modules/jquery/dist/jquery.slim.min.js');
const IO = require('../../../node_modules/socket.io-client/dist/socket.io.slim.js');
const moment = require('../../../node_modules/moment/min/moment-with-locales.min.js');


class Socket extends IO {
  constructor() {

    super();
    this.connect();

    this.connected = undefined;

    this.on('connect', () => {

      this.connected = true;

      if ($('.greyOut')) {
        $('body').removeClass('greyOut');
        $('body').css('overflow', 'auto');
        $('#message-overlay').remove();
      }

      // Listeners
      this.on('stats', data => {

        if (typeof window.charts === 'object') {
          if (data.charts !== undefined && window.page === 'dashboard')
            window.charts.compare(data.charts);

          if (data.feed !== undefined && window.page === 'dashboard')
            feed.compare(data.feed);
        }

      }).on('dashboard', (type, err, data) => {
        if (err) {
          popup('ERROR!');

        } else if (type === 'response') {
          if (data.type === 'set') {

            const prop = data.prop,
              value = data.value;

            let obj = window;

            if (prop.indexOf('.') !== -1) {

              const props = prop.split('.');

              let i = 1;

              for (let prop of props) {
                if (i === props.length) {
                  obj[prop] = value;
                } else {
                  obj = obj[prop];
                  i = i + 1;
                }
              }
            } else {
              obj[prop] = value;
            }

            if (value) {
              $(`#${data.domId}`).removeClass('disabled');

            } else {
              $(`#${data.domId}`).addClass('disabled');
            }

          } else if (data.type === 'function') {
            if (data.prop === 'template.search') {

              let arr = data.templates,
                selected = data.selected;

              $('#template > div > select option').each(function () {
                $(this).remove();
              });

              for (let el of arr) {
                if (el === selected) {

                  $('#template > div > select').append(
                    `<option value="${el}" selected>${el}</option>`
                  );

                } else {
                  $('#template > div > select').append(
                    `<option value="${el}">${el}</option>`
                  );
                }
              }
            }

          }

          if (data.prop !== 'notification.test') popup('Success');

        }
      }).on('notification', data => {

        if (window.dashboard.popups) notifications.parser(data);

      }).on('general', data => {

        // client-server version matching
        if (data.version !== undefined && data.version !== window.version) {

          let count = 10;

          $('body').addClass('greyOut');
          $('body').append(`
                      <div id="message-overlay">
                        <div class="text">
                          <div class="line1">Server has been updated!</div>
                          <div class="line2">page reload in
                          <span id="reloadCount">${count}</span></div>
                        </div>
                      </div>`);

          setInterval(() => {

            if (count) {
              count = count - 1;
              document.getElementById('reloadCount').innerHTML = count;
            } else {
              location.reload(true);
            }

          }, 1000);

        }
      });
    }).on('disconnect', () => {

      this.connected = false;

      if ($('.greyOut')) {

        $('body').addClass('greyOut');
        $('body').css('overflow', 'hidden');
        $('body').append(`
                    <div id="message-overlay">
                        <div class="text">
                          <div class="line1">Lost connection to server!</div>
                        </div>
                    </div>`);
      }

    });
  }

}

const socket = new Socket();


class Feed {
  constructor() {

    $(document).ready(() => {
      this.time();
    });

    // Filter
    this.filter = {
      all: '#feed-all',
      types: [
        {
          id: '#feed-follows',
          class: '.follow',
          visible: true
        },
        {
          id: '#feed-subscriptions',
          class: '.subscription',
          visible: true
        },
        {
          id: '#feed-donations',
          class: '.donation',
          visible: true
        },
        {
          id: '#feed-hosts',
          class: '.host',
          visible: true
        }
      ]
    };

    let types = this.filter.types;

    const removeUnfocused = () => {
      $('#feed > .wrapper > ul > li').removeClass('unfocused');
    };

    $(this.filter.all).click(() => {
      this.select(null);
    });

    const addEventHandler = n => {
      $(types[n].id).click(() => {
        this.select(n);
      }).mouseenter(() => {
        this.hide(n);
      }).mouseleave(() => {
        removeUnfocused();
      });
    };

    for (let i = 0; i < types.length; i = i + 1) {
      addEventHandler(i);
    }

    $('#feed > .wrapper > ul > .donation').click((e) => {
      $(`#${e.currentTarget.id} > .body > span > .message`).toggle();
    });

  }

  get prop() {
    return {
      follow: this.filter.types[0],
      subscription: this.filter.types[1],
      donation: this.filter.types[2],
      host: this.filter.types[3]
    };
  }

  hide(type) {

    let types = this.filter.types,
      hide = [],
      i = 0;

    while (i < types.length) {
      if (i !== type) {
        hide.push(this.filter.types[i].class);
      }

      i = i + 1;
    }

    $(`${hide}`).addClass('unfocused');

  }

  select(type) {

    let types = this.filter.types,
      id;

    if (type === null) {

      id = this.filter.all;
      $('#feed > .wrapper > .list > li').show();

      for (let el in this.filter.types) {
        this.filter.types[el].visible = true;
      }

    } else {

      id = types[type].id;

      let classes = [];

      for (let el in types) {

        if (el !== type) {

          classes.push(this.filter.types[el].class);
          this.filter.types[el].visible = false;

        } else {
          this.filter.types[el].visible = true;
        }
      }

      $(`${classes}`).hide();
      $(`${types[type].class}`).show();

    }

    $(`.feed-btn`).removeClass('selected');
    $(id).addClass('selected');

  }

  compare(data) {

    if (data.remove) {
      this.update(data);
    } else {

      let arr = [],
        i = 0;

      for (let el of data.list) {

        i = i + 1;

        if (!$(`#${el.uuid}`).length) arr.push(el);

        if (i === data.list.length && arr.length) {
          this.update(arr);
        }

      }
    }
  }

  update(data) {

    if (data.remove) {
      $(`#${data.remove}`).remove();
    } else {

      for (let el of data) {

        let time = moment(el.date).fromNow(),
          visible = 'block';

        if (!feed.prop[el.type].visible) {
          visible = 'none';
        }

        const id = el.uuid;

        $('#feed > .wrapper > ul')
          .append(`<li id="${id}" class="${el.type}"
                    style="display:${visible};">
                  <div class="head">
                    <div class="type">${el.type}</div>
                    <time class="date" datetime="${el.date}">${time}</time>
                  </div>
                  <div class="body">
                    <a href="https://twitch.tv/${el.name}" target="_blank" rel="noopener">${el.display_name || el.name}</a>
                  </div>
                </li>`);


        const append = str => $(`#${id} > .body`).append(str);

        if (el.type === 'follow') {
          append(' is now following you');
        }

        if (el.type === 'subscription') {
          if (el.resubs > 0) {
            append(` has re-subscribed (${el.resubs}x) you`);
          } else {
            append(' has subscribed you');
          }
        }

        if (el.type === 'host') {
          append(` host you with <span class="viewers">${el.viewers}</span> viewers`);
        }

        if (el.type === 'donation') {
          append(`<span> has <span class="amount">${el.amount}</span> ${el.currency} donated
                    <div class="message">${el.message}</div></span>`);
        }
      }
    }
  }

  time() {

    $('#feed > .wrapper > ul > li > .head > time').each(function () {

      let datetime = $(this).attr('datetime'),
        time = moment(datetime).fromNow();

      $(this).html(time);

    });

    setTimeout(() => this.time(), 60000);

  }

}

const feed = new Feed();


class Notifications {
  constructor() {

    this.data = {
      name: 'Mr. X',
      resubs: 6,
      amount: '25',
      currency: 'USD',
      message: 'This is a test donation!',
      viewers: 38
    };

  }

  parser(data) {

    let str = ``;

    if (!data.test) this.data = data;

    const name = `<span class="name">${this.data.display_name || this.data.name}</span>`;

    switch (data.type) {
    case 'follow':
      str = `${name} follow you now`;
      break;
    case 'subscription':
      str = `${name} has subscribed! (${this.data.resubs}x)`;
      break;
    case 'donation':
      str = `${name} has
                  <span class="amount">
                    ${this.data.amount} ${this.data.currency}
                  </span> donated!
                  <span class="message">${this.data.message}</span>`;
      break;
    case 'host':
      str = `${name} host you with <b>${this.data.viewers}</b> viewers`;
      break;
    }

    popup(str);

  }

}

const notifications = new Notifications();


class Settings {
  constructor() {

    const sendEventHandlers = [

      // API buttons
      {
        type: 'set',
        event: 'click',
        id: 'api-twitch',
        prop: 'api.twitch.enabled',
        value: 'prop',
        sendId: true
      },
      // {
      //   type: 'set',
      //   event: 'click',
      //   id: 'api-youtube',
      //   prop: 'api.youtube.enabled',
      //   value: 'prop',
      //   sendId: true
      // },
      {
        type: 'set',
        event: 'click',
        id: 'api-streamlabs',
        prop: 'api.streamlabs.enabled',
        value: 'prop',
        sendId: true
      },
      // {
      //   type: 'set',
      //   event: 'click',
      //   id: 'api-tipeee',
      //   prop: 'api.tipeee.enabled',
      //   value: 'prop',
      //   sendId: true
      // },

      // Notification buttons
      {
        type: 'set',
        event: 'click',
        id: 'notification-follows',
        prop: 'notification.types.follows',
        value: 'prop',
        sendId: true
      },
      {
        type: 'set',
        event: 'click',
        id: 'notification-subscriptions',
        prop: 'notification.types.subscriptions',
        value: 'prop',
        sendId: true
      },
      {
        type: 'set',
        event: 'click',
        id: 'notification-hosts',
        prop: 'notification.types.hosts',
        value: 'prop',
        sendId: true
      },
      {
        type: 'set',
        event: 'click',
        id: 'notification-donations',
        prop: 'notification.types.donations',
        value: 'prop',
        sendId: true
      },

      // Template
      {
        type: 'function',
        event: 'click',
        id: 'template-selection',
        prop: 'template.set',
        value: 'id',
        sendId: false
      },
      {
        type: 'function',
        event: 'click',
        id: 'template-search',
        prop: 'template.search',
        value: null,
        sendId: false
      },
      {
        type: 'set',
        event: 'focusout',
        id: 'notification-duration',
        prop: 'notification.duration',
        value: 'id',
        sendId: false
      },

      // Misc
      {
        type: 'function',
        event: 'click',
        id: 'notificationTest > #push',
        prop: 'notification.test',
        value: '#notificationTest > select',
        sendId: false
      },
      {
        type: 'function',
        event: 'click',
        id: 'cleanupQueue',
        prop: 'notification.cleanupQueue',
        value: null,
        sendId: false
      },
      {
        type: 'set',
        event: 'click',
        id: 'notificationToggle input',
        prop: 'notification.enabled',
        value: 'prop',
        sendId: false
      },
      {
        type: 'set',
        event: 'click',
        id: 'popupsToggle input',
        prop: 'dashboard.popups',
        value: 'prop',
        sendId: false
      }
    ];

    for (let el of sendEventHandlers) {
      this.addEventHandler(el);
    }

    $('#devButton').click(() => {
      $('#devWindow').show();
    });
    $('#devWindow .closeButton').click(() => {
      $('#devWindow').hide();
    });

  }

  addEventHandler(obj) {

    const resolve = path => {

      let obj = window;

      if (path.indexOf('.') !== -1) {

        const props = path.split('.');

        let i = 1;

        for (let prop of props) {
          if (i === props.length) {
            return obj[prop];
          } else {
            obj = obj[prop];
            i = i + 1;
          }
        }
      } else {
        return obj[path];
      }
    };

    const type = obj.type;
    const domId = obj.id;
    const prop = obj.prop;
    const sendId = obj.sendId;

    let value = obj.value;

    if (value === 'prop') {
      value = resolve(prop);
    } else if (value === 'id') {
      value = `#${domId}`;
    }

    let object = {
      prop,
      value
    };

    if (sendId) object.domId = domId;

    if (!$(`#${domId}`).hasClass('noEvent')) {

      $(`#${domId}`)[obj.event](() => {
        if (typeof value === 'string') {
          if (value.startsWith('#')) object.value = $(value).val();
          if (!isNaN(object.value)) object.value = parseInt(object.value);
        }

        this.send(type, object);
      });

    }

  }

  send(type, obj) {

    if (socket.connected) {
      if (obj.value === true || obj.value === false) {
        if (obj.value) {
          obj.value = false;
        } else {
          obj.value = true;
        }
      }

      socket.emit('dashboard', type, obj);
    }
  }

}

if (window.page === 'settings') new Settings();


const popup = str => {

  $('#popup').hide();

  setTimeout(() => {
    $('#popup').html(str);
    $('#popup').show();
  }, 400);

};
