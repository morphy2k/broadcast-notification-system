// UI
function datetime() {
    $('#feed > .list > li').each(function() {
        var datetime = $(`#${this.id} > .head > time`).attr('datetime'),
            time = moment(datetime).fromNow();

        $(`#${this.id} > .head > time`).html(time);
    });
}
setInterval(function() {
    datetime();
}, 60000);

function feedFilter() {
    $(".follow")
        .mouseover(function() {
            $('.list > .subscription, .list > .host, .list > .donation').css('opacity', '0.3');
        })
        .mouseout(function() {
            $('.list > .subscription, .list > .host, .list > .donation').css('opacity', '1');
        });
    $(".subscription")
        .mouseover(function() {
            $('.list > .follow, .list > .host, .list > .donation').css('opacity', '0.3');
        })
        .mouseout(function() {
            $('.list > .follow, .list > .host, .list > .donation').css('opacity', '1');
        });
    $(".host")
        .mouseover(function() {
            $('.list > .follow, .list > .subscription, .list > .donation').css('opacity', '0.3');
        })
        .mouseout(function() {
            $('.list > .follow, .list > .subscription, .list > .donation').css('opacity', '1');
        });
    $(".donation")
        .mouseover(function() {
            $('.list > .follow, .list > .host, .list > .subscription').css('opacity', '0.3');
        })
        .mouseout(function() {
            $('.list > .follow, .list > .host, .list > .subscription').css('opacity', '1');
        });
}

$(document).ready(function() {
    feedFilter();
    datetime();
});


var socket = io.connect(host),
    connected = false;

socket.on('connect', () => {
    connected = true;

    $('body').removeClass('lost');
    $('#message').remove();

    socket.on('stats', (data) => {

        if (data.qCount !== undefined) {
            if (data.qCount !== qCount) {
                qCount = data.qCount;
                $("#qCount").html(qCount);
            }
        }

        if (data.charts !== undefined && page === 'dashboard') {

            // subscriptions
            chartSubscriptions = data.charts.subs;
            chart1.data.datasets[0].data = chartSubscriptions;
            chart1.update();

            // follows
            chartFollows = data.charts.follows;
            chart1.data.datasets[1].data = chartFollows;
            chart1.update();

            // donations
            chartDonations.count = data.charts.donations.count;
            chartDonations.amount = data.charts.donations.amount;
            chart2.data.datasets[0].data = data.charts.donations.count;
            chart2.data.datasets[1].data = data.charts.donations.amount;
        }

        if (data.feed !== undefined && page === 'dashboard') {
            if (data.feed.remove) {
                $(`#${data.feed.remove}`).remove();
            }

            if (data.feed.list !== feed && page === 'dashboard') {
                feed = data.feed.list;

                for (let el of feed) {

                    var uuid = $(`#${el.uuid}`).length,
                        time = moment(el.date).fromNow();

                    if (uuid === 0) {

                        $('#feed > .list')
                            .append(`<li id="${el.uuid}" class="${el.type}">
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
                    } else {
                        //console.log('already exists ' + el.uuid);
                    }

                }

                feedFilter();
            }
        }

    });

    // settings
    socket.on('dashboard', (type, data) => {

        window[data.name] = data.value;

        if (data.type === 'notification' || 'service') {
            if (data.value) {
                $("#" + data.name).addClass('active');
            } else {
                $("#" + data.name).removeClass('active');
            }
        }

    });

    // notification
    socket.on('notification', (data) => {

        if (dPopups) {

            $("#notificationInfo").hide();

            setTimeout(function() {

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

});

socket.on('disconnect', () => {
    connected = false;

    $('body').addClass('lost');
    $('body').append(`<div id=message>Lost connection to the server!</div>`);
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
