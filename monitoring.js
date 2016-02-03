var spawn = require('child_process').spawn;
var http = require('http');
var serveStatic = require('serve-static');
var finalHandler = require('finalhandler');
var request = require('request');
var chartData = require('./lib/chart.data.js');
var os = require('os-utils');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

// Necessary to get the configs
var configurator = require('./lib/configurator.js')();
var version = configurator.getLinkIOMonitoringServerVersion();

// Generate public infos file
configurator.generatePublicInfosFile();

// Configuration
var port = configurator.getLinkIOMonitoringServerPort();
var script_path = configurator.getLinkIOServerScript();
var script_arguments = configurator.getLinkIOServerArguments();
var logsUrl = 'http://' + configurator.getLinkIOServerHost() + ':' + configurator.getLinkIOServerPort();

// State signal
var server = http.createServer(function (req, res) {
    var done = finalHandler(req, res);
    serve(req, res, done);
});

// Serve static files
var serve = serveStatic("./static/");

// Initialize socket.io
var io = require('socket.io')(server);

// Start server in the good port
server.listen(port);
console.log('Link.io.server.monitoring (v' + version + ') started on *:' + port);

// Server state
var serverState = false;

// Server socket
var socketServer = undefined;

var _db = undefined;
MongoClient.connect('mongodb://localhost:27017/linkio', function (err, db) {
    _db = db;

    // On user connection
    io.on('connection', function (socket) {
        var firstAuth = true;
        var isAuth = false;


        if (socket.handshake.query.user == 'server') { //Link.IO server <-> monitoring
            socketServer = socket;

            socketServer.on('event', function (event) {
                io.to('auth-room').emit('event', event);
                chartData.newEvent(event);
            });

            var cpuPercent = 0;

            setInterval(function () {
                os.cpuUsage(function (v) {
                    cpuPercent = v;
                });
            }, 1000);

            socketServer.on('monitoring', function (event) {
                event.cpu = cpuPercent * 100;
                io.to('auth-room').emit('monitoring', chartData.appendData(event));
            });
        }
        else if (socket.handshake.query.user == 'admin') {  //monitoring <-> admin web page
            socket.on('insert', function (d) {
                db.collection(d.table).insertOne(d.data);
            });
            socket.on('count', function (d, ack) {
                db.collection(d.table).count(function(err, count) {
                    ack(count);
                });
            });
            socket.on('getAll', function (table, ack) {
                db.collection(table).find().toArray(function (err, items) {
                    ack(items);
                });
            });
            socket.on('getRange', function (d, ack) {
                db.collection(d.table).find().skip(d.skip).limit(d.limit).toArray(function (err, items) {
                    ack(items);
                });
            });
            socket.on('getWithLimit', function (d, ack) {
                db.collection(d.table).find(d.data).limit(d.limit).toArray(function (err, items) {
                    ack(items);
                });
            });
            socket.on('get', function (d, ack) {
                db.collection(d.table).find(d.critera).toArray(function (err, items) {
                    ack(items);
                });
            });
            socket.on('updateOne', function (d) {
                db.collection(d.table).updateOne(d.critera, d.data);
            });

            socket.on('updateMany', function (d) {
                db.collection(d.table).updateMany(d.critera, d.data);
            });

            socket.on('deleteOne', function (d) {
                db.collection(d.table).deleteOne(d.critera);
            });

            socket.on('deleteMany', function (d) {
                db.collection(d.table).deleteMany(d.critera);
            });
        }
        else {  //monitoring <-> monitoring web page
            socket.join('auth-room');

            socket.on('retrieveData', function () {
                // Send old logs
                sendOldLogs(socket);

                //Send old chart data
                socket.emit('oldMonitoring', chartData.getOldData());

                // Emit server state
                socket.emit('serverState', serverState);
            });

            // Allow the user to restart the server after a crash
            socket.on('restart', function () {
                execScript(script_path, script_arguments);
            });
        }
    });
});

function sendOldLogs(socket) {

    request(logsUrl, function (err, res, oldLogs) {

        // Send old logs
        socket.emit('getOldLogs', oldLogs);

    });

}

// Exec the command and handle std
function execScript(file, args) {

    serverState = true;
    io.to('auth-room').emit('serverState', serverState);

    console.log('Command executed : "node ' + file + '".');

    // Run node with the child.js file as an argument
    var child = spawn('node', [file].concat(args));


    child.stdout.on('data', function (data) {
        io.to('auth-room').emit('message', {'type': 'debug', 'text': data + ''});
    });


    // Listen for any errors:
    child.stderr.on('data', function (data) {
        console.log(data);
        console.log('There was an error: ' + data);
        child.kill('SIGINT');

        serverState = false;
        io.to('auth-room').emit('serverState', serverState);
        io.to('auth-room').emit('message', {'type': 'error', 'text': data + ''});
    });

}

process.on('SIGINT', function () {
    if(typeof _db != 'undefined') {
        _db.close();
    }
    process.exit();
});

execScript(script_path, script_arguments);
