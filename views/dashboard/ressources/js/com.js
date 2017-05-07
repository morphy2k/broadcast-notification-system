class Socket extends io.connect {
    constructor(host) {
        super(host, {
            'query': `token=${jwt}`
        });

        this.connected = false;

        this.on('connect', () => {
            this.connected = true;

            $('body').removeClass('greyOut');
            $('#message').remove();

        }).on('disconnect', () => {
            this.connected = false;

            $('body').addClass('greyOut');
            $('body').append(`<div id=message>
                <div class="text">
                  <div class="line1">Lost connection to server!</div>
                </div>
              </div>`);

        });
    }
}

const socket = new Socket(host);


class Feed {
    constructor() {

        $(document).ready(() => {
            this.time();
        });

        // Filter
        this.filter = {
            all: '#all-btn',
            types: [{
                    id: '#follow-btn',
                    class: '.follow',
                    visible: true
                },
                {
                    id: '#sub-btn',
                    class: '.subscription',
                    visible: true
                },
                {
                    id: '#donation-btn',
                    class: '.donation',
                    visible: true
                },
                {
                    id: '#host-btn',
                    class: '.host',
                    visible: true
                }
            ]
        };

        let types = this.filter.types;

        function removeUnfocused() {
            $('#feed > .wrapper > .list > li').removeClass('unfocused');
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

        $('#feed > .wrapper > .list > .donation').click(() => {
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
            $('#feed > ul > li').show();

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

                if (i === data.list.length - 1 && arr.length) {
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

                $('#feed > .list')
                    .append(`<li id="${el.uuid}" class="${el.type}" style="display:${visible};">
                  <div class="head">
                    <div class="type">${el.type}</div><time class="date" datetime="${el.date}">${time}</time>
                  </div>
                  <div class="body">
                    <a href="https://twitch.tv/${el.name}" target="_blank">${el.name}</a>
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
                        .append(` host you with <span class="viewer">${el.viewer}</span> viewer`);
                }
                if (el.type === 'donation') {
                    $(`#${el.uuid} > .body`)
                        .append(` has <span class="amount">${el.amount}</span> donated
                        <div class="message">${el.message}</div>`);
                }
            }
        }

    }

    time() {
        $('#feed > .wrapper > ul > li > .head > time').each(function() {
            var datetime = $(this).attr('datetime'),
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


class Notifications {
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
            str = `<span class="name">${this.data.name}</span> has subscribed! (${this.data.resubs}x)`;
        } else if (data.type === 'donation') {
            str = `<span class="name">${this.data.name}</span> has <span class="amount">${this.data.amount} ${this.data.currency}</span> donated!
                <span class="message">${this.data.message}</span>`;
        } else if (data.type === 'host') {
            str = `<span class="name">${this.data.name}</span> host you with ${this.data.viewer} viewers`;
        }

        this.show(str);
    }

    show(data) {

        $("#notification").hide();

        setTimeout(() => {
            $("#notification").html(data);
            $("#notification").show();
        }, 400);

    }

}

const notifications = new Notifications();


socket.on('connect', () => {

    socket.on('stats', (data) => {

        if (data.charts !== undefined && page === 'dashboard') charts.compare(data.charts);
        if (data.feed !== undefined && page === 'dashboard') feed.compare(data.feed);

    });

    // settings
    socket.on('dashboard', (type, data) => {

        window[data.name] = data.value;

        if (data.type === 'notification' || 'service') {
            if (data.value) {
                $(`#${data.name}`).addClass('active');
            } else {
                $(`#${data.name}`).removeClass('active');
            }

            $(`#${data.name}`).removeClass('saved');
            setTimeout(() => {
                $(`#${data.name}`).addClass('saved');
            }, 200);
        }

    });

    // notification
    socket.on('notification', (data) => {
        if (dPopups) notifications.parser(data);
    });

    socket.on('general', (data) => {

        // client-server version matching
        if (data.version !== undefined) {
            if (data.version !== version) {
                let count = 10;

                $('body').addClass('greyOut');
                $('body').append(`
                <div id=message>
                  <div class="text">
                    <div class="line1">Server has been updated!</div>
                    <div class="line2">page reload in <span id="reloadCount">${count}</span></div>
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

                version = data.version;
            }
        }
    });

});

function set(type, option, value) {
    if (socket.connected && value === true || value === false) {
        if (value) {
            socket.emit('dashboard', {
                type: type,
                name: option,
                value: false
            });
        } else {
            socket.emit('dashboard', {
                type: type,
                name: option,
                value: true
            });
        }
    } else {
        socket.emit('dashboard', {
            type: type,
            name: option,
            value: value
        });
    }
}

// notification test
testType = 'follow';

function typeTest(value) {
    testType = value;
}

function pushTest() {
    if (socket.connected) {
        socket.emit('dashboard', {
            type: testType,
            name: 'testNoti'
        });
    }
}
