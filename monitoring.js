var spawn = require('child_process').spawn;
var http = require('http');
var serveStatic = require('serve-static');
var finalHandler = require('finalHandler');
var request = require('request');

// Necessary to get the configs
var configurator = require('./lib/configurator.js')();
var version = configurator.getLinkIOMonitoringServerVersion();

// Generate public infos file
configurator.generatePublicInfosFile();

// Configuration
var port = configurator.getLinkIOMonitoringServerPort();
var script_path = configurator.getLinkIOServerScript();
var logsUrl = configurator.getLinkIOServerUrl();

var isCrashed = false;

// State signal
var server = http.createServer(function(req, res) {
    var done = finalHandler(req, res);
    serve(req, res, done);
});

// Serve static files
var serve = serveStatic("./client/");

// Initialize socket.io
var io = require('socket.io')(server);

// Start server in the good port
server.listen(port);
console.log('Link.io.server.monitoring (v' + version + ') started on *:' + port);

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

execScript(script_path);
