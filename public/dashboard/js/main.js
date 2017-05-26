/* eslint-env browser */
/* global twitch, youtube, streamlabs, tipeee, follows, subscriptions, hosts, donations, chart1, chart2, chartFollows:true,
    chartSubscriptions:true, chartDonations:true, page, popups, notifications version */
'use strict';

const $ = require('../../../node_modules/jquery/dist/jquery.slim.min.js');
const io = require('../../../node_modules/socket.io-client/dist/socket.io.js');
const moment = require('../../../node_modules/moment/min/moment-with-locales.min.js');


class Socket extends io {
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

                if (data.charts !== undefined && page === 'dashboard')
                    charts.compare(data.charts);
                if (data.feed !== undefined && page === 'dashboard')
                    feed.compare(data.feed);

            }).on('dashboard', (type, err, data) => {
                if (err) {
                    popup('ERROR!');

                } else if (type === 'response') {

                    if (data.type === 'notification' || data.type === 'api') {

                        window[data.prop] = data.value;

                        if (data.value) {
                            $(`#${data.type}-${data.prop}`).addClass('enabled');
                        } else {
                            $(`#${data.type}-${data.prop}`).removeClass('enabled');
                        }

                    } else if (data.prop === 'templates') {

                        let arr = data.templates,
                            selected = data.selected;

                        $("#template > div > select option").each(function () {
                            $(this).remove();
                        });

                        for (let el of arr) {
                            if (el === selected) {
                                $("#template > div > select").append(
                                    `<option value="${el}" selected>${el}</option>`
                                );
                            } else {
                                $("#template > div > select").append(
                                    `<option value="${el}">${el}</option>`
                                );
                            }
                        }
                    }

                    if (data.type !== 'testNotification') popup('Success');
                }
            }).on('notification', data => {

                if (popups) notification.parser(data);

            }).on('general', data => {

                // client-server version matching
                if (data.version !== undefined) {

                    if (data.version !== version) {
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
                                document.getElementById("reloadCount").innerHTML = count;
                            } else {
                                location.reload(true);
                            }
                        }, 1000);

                    }
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
            types: [{
                    id: '#feed-follows',
                    class: '.follow',
                    visible: true
                },
                {
                    id: '#feed-subs',
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

        function removeUnfocused() {
            $('#feed > .wrapper > ul > li').removeClass('unfocused');
        }

        $(this.filter.all).click(() => {
            this.select(null);
        });
        $(types[0].id).click(() => {
            this.select(0);
        }).mouseenter(() => {
            this.hide(0);
        }).mouseleave(() => {
            removeUnfocused();
        });

        $(types[1].id).click(() => {
            this.select(1);
        }).mouseenter(() => {
            this.hide(1);
        }).mouseleave(() => {
            removeUnfocused();
        });

        $(types[2].id).click(() => {
            this.select(2);
        }).mouseenter(() => {
            this.hide(2);
        }).mouseleave(() => {
            removeUnfocused();
        });

        $(types[3].id).click(() => {
            this.select(3);
        }).mouseenter(() => {
            this.hide(3);
        }).mouseleave(() => {
            removeUnfocused();
        });

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
            hide = [];

        for (let el in types) {
            if (el != type) {
                hide.push(this.filter.types[el].class);
            }
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

                if (el != type) {
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

                $('#feed > .wrapper > ul')
                    .append(`<li id="${el.uuid}" class="${el.type}"
                    style="display:${visible};">
                  <div class="head">
                    <div class="type">${el.type}</div>
                    <time class="date" datetime="${el.date}">${time}</time>
                  </div>
                  <div class="body">
                    <a href="https://twitch.tv/${el.name}" target="_blank" rel="noopener">${el.name}</a>
                  </div>
                </li>`);

                if (el.type === 'follow') {
                    $(`#${el.uuid} > .body`)
                        .append(' is now following you');
                }
                if (el.type === 'subscription') {
                    if (el.resubs > 0) {
                        $(`#${el.uuid} > .body`)
                            .append(` has re-subscribed (${el.resubs}x) you`);
                    } else {
                        $(`#${el.uuid} > .body`)
                            .append(' has subscribed you');
                    }
                }
                if (el.type === 'host') {
                    $(`#${el.uuid} > .body`)
                        .append(` host you with
                            <span class="viewer">${el.viewer}</span> viewer`);
                }
                if (el.type === 'donation') {
                    $(`#${el.uuid} > .body`)
                        .append(` has
                            <span class="amount">${el.amount}</span> donated
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


class Charts {
    constructor() {
        this.changed = {
            chart1: false,
            chart2: false
        };
    }

    compare(data) {

        // Follows
        for (let i = 0; i < data.follows.length; i++) {
            if (data.follows[i] !== chartFollows[i]) {
                chartFollows = data.follows;
                chart1.data.datasets[1].data = chartFollows;

                this.changed.chart1 = true;

                break;
            }
        }

        // Subscriptions
        for (let i = 0; i < data.subs.length; i++) {
            if (data.subs[i] !== chartSubscriptions[i]) {
                chartSubscriptions = data.subs;
                chart1.data.datasets[0].data = chartSubscriptions;

                this.changed.chart1 = true;

                break;
            }
        }

        // Donations
        for (let i = 0; i < data.donations.count.length; i++) {
            if (data.donations.count[i] !== chartDonations.count[i]) {
                chartDonations = data.donations.count;
                chart1.data.datasets[0].data = chartDonations.count;
                chart1.data.datasets[1].data = chartDonations.amount;

                this.changed.chart2 = true;

                break;
            }
        }

        if (this.changed.chart1 || this.changed.chart2) this.update();

    }

    update() {
        if (this.changed.chart1) {
            chart1.update();
            this.changed.chart1 = false;
        }
        if (this.changed.chart2) {
            chart2.update();
            this.changed.chart2 = false;
        }
    }
}

const charts = new Charts();


class Notification {
    constructor() {
        this.data = {
            name: 'Mr. X',
            resubs: 3,
            amount: '25',
            currency: 'USD',
            message: 'This is a test donation',
            viewer: 38
        };
    }

    parser(data) {

        let str = ``;

        if (!data.test) {
            this.data = data;
        }

        if (data.type === 'follow') {
            str = `<span class="name">${this.data.name}</span> follow you now`;
        } else if (data.type === 'subscription') {
            str = `<span class="name">${this.data.name}</span>
                has subscribed! (${this.data.resubs}x)`;
        } else if (data.type === 'donation') {
            str = `<span class="name">${this.data.name}</span> has <span class="amount">
                    ${this.data.amount} ${this.data.currency}
                    </span> donated!
                    <span class="message">${this.data.message}</span>`;
        } else if (data.type === 'host') {
            str = `<span class="name">${this.data.name}</span>
                    host you with ${this.data.viewer} viewers`;
        }

        popup(str);
    }

    test() {
        let prop = $("#notificationTest > select option:selected")
            .attr('value');

        if (socket.connected) {
            socket.emit('dashboard', {
                type: 'testNotification',
                prop
            });
        }
    }

}

const notification = new Notification();


class Settings {
    constructor() {

        // API buttons
        $('#api-twitch').click(() => {
            this.send('api', 'twitch', twitch);
        });
        $('#api-youtube').click(() => {
            this.send('api', 'youtube', youtube);
        });
        $('#api-streamlabs').click(() => {
            this.send('api', 'streamlabs', streamlabs);
        });
        $('#api-tipeee').click(() => {
            this.send('api', 'tipeee', tipeee);
        });

        // Notification buttons
        $('#notification-follows').click(() => {
            this.send('notification', 'follows', follows);
        });
        $('#notification-subscriptions').click(() => {
            this.send('notification', 'subscriptions', subscriptions);
        });
        $('#notification-hosts').click(() => {
            this.send('notification', 'hosts', hosts);
        });
        $('#notification-donations').click(() => {
            this.send('notification', 'donations', donations);
        });

        // Template
        $('#template-selection').click(() => {
            let value = $('#template-selection').val();
            this.send('template', 'template', value);
        });
        $('#template-search').click(() => {
            this.send('template', 'search', true);
        });
        $('#devButton').click(() => {
            $('#devWindow').show();
        });
        $('#devWindow .closeButton').click(() => {
            $('#devWindow').hide();
        });
        $('#notification-duration').focusout(() => {
            this.send('notification', 'duration', this.value);
        });

        // Misc
        $("#notificationTest > #push").click(() => {
            notification.test();
        });
        $('#clearQueue').click(() => {
            this.send('notification', 'clearQueue', true);
        });
        $('#notificationToggle input').click(() => {
            this.send('notification', 'enabled', notifications);
        });
        $('#popupsToggle input').click(() => {
            this.send('dashboard', 'popups', popups);
        });
    }

    send(type, prop, value) {
        if (socket.connected && (value === true || value === false)) {
            if (value) {
                socket.emit('dashboard', {
                    type,
                    prop,
                    value: false
                });
            } else {
                socket.emit('dashboard', {
                    type,
                    prop,
                    value: true
                });
            }
        } else {
            socket.emit('dashboard', {
                type,
                prop,
                value: value
            });
        }
    }
}

new Settings();


function popup(str) {

    $("#popup").hide();

    setTimeout(() => {
        $("#popup").html(str);
        $("#popup").show();
    }, 400);
}
