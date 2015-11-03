var http = require('http').Server();

// Default port
var port = 7979;
var delay = 3000;


http.listen(port, function(){

    setTimeout(function() {
        throw new Error('Crash !')
    }, delay);

    console.log('Server started on *:' + port);
});