var exec = require('child_process').exec;
var http = require('http');
var fs = require('fs');

// Configuration
var port = 8080;
var command = 'node crashtest.js';

var isCrashed = false;

var server = http.createServer(function(req, res) {

    fs.readFile('./client/manage.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });

});

server.listen(8080);
console.log('Server started on *:' + port);

// State signal
var io = require('socket.io').listen(server);
var persistentSocket;
io.on('connection', function (socket) {
    persistentSocket = socket;

    socket.on('getState', function (name, fn) {
        fn({'isCrashed':isCrashed});
    });

    persistentSocket.on('restart', function (socket) {
        if(isCrashed)
            execCommand(command);
    });

});

// Exec the command and handle std
function execCommand(command) {

    if(persistentSocket != undefined)
        persistentSocket.emit('isStarted');

    exec(command, function(error, stdout, stderr) {

        console.log('Command executed : "' + command + '".');

        if (stderr != '') {
            isCrashed = true;
            if(persistentSocket != undefined)
                persistentSocket.emit('isCrashed', {'isCrashed':isCrashed});
            console.log('The server crashed.');
        }

        if (error !== null)
            console.log('Execution error : ' + error);
    });

}

execCommand(command);
