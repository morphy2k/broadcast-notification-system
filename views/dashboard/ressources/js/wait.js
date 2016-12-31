var socket = io.connect(host);

socket.on('general', (data) => {

    console.log(data);

    if (data.redirect) {
        window.location.href = data.redirect;
    }

});
