class Socket extends io.connect {
    constructor(host) {
        super(host);

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


// UI
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

        $(this.filter.all).click(() => {
            this.select(null);
        });
        $(types[0].id).click(() => {
            this.select(0);

        });
        $(types[1].id).click(() => {
            this.select(1);

        });
        $(types[2].id).click(() => {
            this.select(2);
        });
        $(types[3].id).click(() => {
            this.select(3);
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

                if (!filter.prop[el.type].visible) {
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
                        .append(` has <span class="amount">${el.amount}</span> donated`);
                }
            }
        }

    }

    time() {
        $('#feed > ul > li > .head > time').each(function () {
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

    compare(data, callback) {

        // Follows
        for (let i = 0; i < data.follows.length; i++) {
            if (data.follows[i] !== chartFollows[i]) {
                chartFollows = data.follows;
                chart1.data.datasets[1].data = chartFollows;

                this.changed.chart1 = true;

                count = count + 1;
                done();

                break;
            } else if (i === data.follows.length - 1) {
                count = count + 1;
                done();
            }
        }

        // Subscriptions
        for (let i = 0; i < data.subs.length; i++) {
            if (data.subs[i] !== chartSubscriptions[i]) {
                chartSubscriptions = data.subs;
                chart1.data.datasets[0].data = chartSubscriptions;

                this.changed.chart1 = true;

                count = count + 1;
                done();

                break;
            } else if (i === data.subs.length - 1) {
                count = count + 1;
                done();
            }
        }

        // Donations
        for (let i = 0; i < data.donations.count.length; i++) {
            if (data.donations.count[i] !== chartDonations.count[i]) {
                chartDonations = data.donations.count;
                chart1.data.datasets[0].data = chartDonations.count;
                chart1.data.datasets[1].data = chartDonations.amount;

                this.changed.chart2 = true;

                count = count + 1;
                done();

                break;
            } else if (i === data.donations.count.length - 1) {
                count = count + 1;
                done();
            }
        }

        if (feed.changed.chart1 || feed.changed.chart2) this.update();

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
        this.testData = {
            follow: {

            },
            subscription: {

            },
            donation: {

            },
            host: {

            }
        };
    }

    parser() {

    }

    show() {

    }

    test() {

    }
}


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
        }

    });

    // notification
    socket.on('notification', (data) => {

        if (dPopups) {

            $("#notificationInfo").hide();

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
                    $("#notiName").html(`${name} ${resubs}`);
                } else {
                    $("#notiName").html(name);
                }

                if (type === 'donation') {

                    $("#amount").empty();
                    $("#message").empty();

                    if (!data.test) {
                        amount = data.amount;
                        currency = data.currency;
                        message = data.message;
                    } else {
                        amount = '25';
                        currency = 'EUR';
                        message = 'This is a test donation';
                    }

                    $("#amount").html(amount);
                    $("#message").html(message);
                }

                if (type === 'follow' || type === 'subscription' || type === 'host') {

                    if (type === 'follow') {
                        $("#notiType").html('New follower');
                    }
                    if (type === 'subscription') {
                        $("#notiType").html('New subscriber');
                    }
                    if (type === 'host') {
                        $("#notiType").html('New host');
                    }

                    $("#notificationInfo").show();
                }

                if (type === 'donation') {
                    $("#notiType").html('New donation');
                    $("#amount").append(`${amount} ${currency}`);
                    $("#message").append(message);
                    $("#notificationInfo").show();
                }

            }, 400);
        }
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
    if (connected && value === true || value === false) {
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
    if (connected) {
        socket.emit('dashboard', {
            type: testType,
            name: 'testNoti'
        });
    }
}
