var spawn = require('child_process').spawn;
var http = require('http');
var request = require("request");
var fs = require('fs');

// Configuration
var port = 8081;
var file = 'F:\\dev-github\\link.io.server\\server.js';
var logsUrl = 'http://localhost:8080';
//var file = 'crashtest.js';

var isCrashed = false;

function readFile(path, contentType, res) {

    fs.readFile(path, 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": contentType});
        res.end(content);
    });

}

var server = http.createServer(function(req, res) {

    var url = req.url;

    if(url == '/styles/style.css')
        readFile('./client/styles/style.css', 'text/css', res);

    if(url == '/scripts/script.js')
        readFile('./client/scripts/script.js', 'application/javascript', res);

    readFile('./client/manage.html', 'text/html', res);

});

server.listen(port);
console.log('Link.io.server.monitoring started on *:' + port);

// State signal
var io = require('socket.io').listen(server);
var persistentSocket;
io.on('connection', function (socket) {
    persistentSocket = socket;

    // Get olds logs
    request(logsUrl, function(err, res, body) {
        if (err) {
            throw err;
        }

        // Send old logs
        socket.emit('oldLogs', {'oldLogs' : body});

        socket.on('getState', function (name, fn) {
            fn({'isCrashed':isCrashed});
        });

        socket.on('start', function (socket) {
            if(isCrashed)
                execScript(file);
        });

    });



});

function getUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
}

// Exec the command and handle std
function execScript(file) {

    if(persistentSocket != undefined)
        persistentSocket.emit('isStarted');

    console.log('Command executed : "node ' + file + '".');

    // Run node with the child.js file as an argument
    var child = spawn('node', [file]);


    child.stdout.on('data', function (data) {

        if(persistentSocket != undefined) {

            persistentSocket.emit('message', {'ts'   : getUnixTimestamp(),
                                              'type' : 'debug',
                                              'text' : data+''});

        }

    });


    // Listen for any errors:
    child.stderr.on('data', function (data) {

        console.log('There was an error: ' + data);
        child.kill('SIGINT');
        isCrashed = true;

        if(persistentSocket != undefined) {
            persistentSocket.emit('isCrashed', {'isCrashed':isCrashed});
            persistentSocket.emit('message', {'ts'   : getUnixTimestamp(),
                'type' : 'error',
                'text' : data+''});
        }


    });

}

execScript(file);
