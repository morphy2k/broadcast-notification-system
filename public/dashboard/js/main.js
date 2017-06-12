/* eslint-env browser, commonjs */
/* global charts, page, popups, version */
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

        if (typeof charts === 'object') {
          if (data.charts !== undefined && page === 'dashboard')
            charts.compare(data.charts);
          if (data.feed !== undefined && page === 'dashboard')
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
              $(`#${data.domId}`).addClass('enabled');
            } else {
              $(`#${data.domId}`).removeClass('enabled');
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

        if (popups) notifications.parser(data);

      }).on('general', data => {

        // client-server version matching
        if (data.version !== undefined && data.version !== version) {

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

    const spawnListener = n => {
      $(types[n].id).click(() => {
        this.select(n);
      }).mouseenter(() => {
        this.hide(n);
      }).mouseleave(() => {
        removeUnfocused();
      });
    };

    for (let i = 0; i < types.length; i = i + 1) {
      spawnListener(i);
    }

    $('#feed > .wrapper > ul > .donation').click(() => {
      $(this).class('message').toggle();
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
          append(` has <span class="amount">${el.amount}</span> donated
                    <div class="message">${el.message}</div>`);
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

    // API buttons
    $('#api-twitch').click((e) => {
      const domId = e.target.id;
      const prop = 'api.twitch.enabled';

      if (!$(`#${domId}`).hasClass('noEvent')) {
        this.send('set', {
          prop,
          value: resolve(prop),
          domId
        });
      }
    });
    $('#api-youtube').click((e) => {
      const domId = e.target.id;
      const prop = 'api.youtube.enabled';

      if (!$(`#${domId}`).hasClass('noEvent')) {
        this.send('set', {
          prop,
          value: resolve(prop),
          domId
        });
      }
    });
    $('#api-streamlabs').click((e) => {
      const domId = e.target.id;
      const prop = 'api.streamlabs.enabled';

      if (!$(`#${domId}`).hasClass('noEvent')) {
        this.send('set', {
          prop,
          value: resolve(prop),
          domId
        });
      }
    });
    $('#api-tipeee').click((e) => {
      const domId = e.target.id;
      const prop = 'api.tipeee.enabled';

      if (!$(`#${domId}`).hasClass('noEvent')) {
        this.send('set', {
          prop,
          value: resolve(prop),
          domId
        });
      }
    });

    // Notification buttons
    $('#notification-follows').click((e) => {
      const domId = e.target.id;
      const prop = 'notification.types.follows';

      this.send('set', {
        prop,
        value: resolve(prop),
        domId
      });
    });
    $('#notification-subscriptions').click((e) => {
      const domId = e.target.id;
      const prop = 'notification.types.subscriptions';

      this.send('set', {
        prop,
        value: resolve(prop),
        domId
      });
    });
    $('#notification-hosts').click((e) => {
      const domId = e.target.id;
      const prop = 'notification.types.hosts';

      this.send('set', {
        prop,
        value: resolve(prop),
        domId
      });
    });
    $('#notification-donations').click((e) => {
      const domId = e.target.id;
      const prop = 'notification.types.donations';

      this.send('set', {
        prop,
        value: resolve(prop),
        domId
      });
    });

    // Template
    $('#template-selection').click((e) => {
      const domId = e.target.id;
      const value = $(`#${domId}`).val();

      this.send('function', {
        prop: 'template.set',
        value
      });
    });
    $('#template-search').click(() => {
      this.send('function', {
        prop: 'template.search'
      });
    });
    $('#devButton').click(() => {
      $('#devWindow').show();
    });
    $('#devWindow .closeButton').click(() => {
      $('#devWindow').hide();
    });
    $('#notification-duration').focusout((e) => {
      const domId = e.target.id;
      const value = $(`#${domId}`).val();

      this.send('set', {
        prop: 'notification.duration',
        value: parseInt(value)
      });
    });

    // Misc
    $('#notificationTest > #push').click(() => {
      const value = $('#notificationTest > select').val();

      this.send('function', {
        prop: 'notification.test',
        value
      });
    });
    $('#clearQueue').click(() => {
      this.send('function', {
        prop: 'notification.clearQueue'
      });
    });
    $('#notificationToggle input').click(() => {
      const prop = 'notification.enabled';

      this.send('set', {
        prop,
        value: resolve(prop)
      });
    });
    $('#popupsToggle input').click(() => {
      this.send('set', {
        prop: 'dashboard.popups',
        value: popups
      });
    });

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

new Settings();


const popup = str => {

  $('#popup').hide();

  setTimeout(() => {
    $('#popup').html(str);
    $('#popup').show();
  }, 400);

};
