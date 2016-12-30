var socket = io.connect(host),
    hash = window.location.hash.substr(1);

if (hash) {
    socket.emit('wait', 'waiting', hash);
    console.log(hash);
} else {
    window.location.href = "/";
}

socket.on('wait', function(response) {

    if (response == 'goSettings') {
        window.location.href = "/settings";
    }

    if (response == 'goHome') {
        window.location.href = "/";
    }

});
