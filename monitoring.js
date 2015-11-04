var spawn = require('child_process').spawn;
var http = require('http');
var fs = require('fs');

// Configuration
var port = 8081;
var file = 'server.js';

var isCrashed = false;

var server = http.createServer(function(req, res) {

    fs.readFile('./client/manage.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });

});

server.listen(port);
console.log('Link.io.server.monitoring started on *:' + port);

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
            execScript(file);
    });

});

// Exec the command and handle std
function execScript(file) {

    if(persistentSocket != undefined)
        persistentSocket.emit('isStarted');

    console.log('Command executed : "node ' + file + '".');

    // Run node with the child.js file as an argument
    var child = spawn('node', [file]);

    // Print the first stdout
    var printed = false;
    child.stdout.on('data', function (data) {
        if(!printed)
            console.log('' + data);
        printed = true;
    });

    // Listen for any errors:
    child.stderr.on('data', function (data) {
        console.log('There was an error: ' + data);
        child.kill('SIGINT');
        isCrashed = true;
        if(persistentSocket != undefined)
            persistentSocket.emit('isCrashed', {'isCrashed':isCrashed});
    });

    // Listen for any errors:
    child.stderr.on('data', function (data) {
        console.log('There was an error: ' + data);
        child.kill('SIGINT');
        isCrashed = true;
        if(persistentSocket != undefined)
            persistentSocket.emit('isCrashed', {'isCrashed':isCrashed});
    });

}

execScript(file);
