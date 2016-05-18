var spawn = require('child_process').spawn;
var http = require('http');
var serveStatic = require('serve-static');
var finalHandler = require('finalhandler');
var request = require('request');
var chartData = require('./lib/chart.data.js');
var os = require('os-utils');
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var ldap = require('ldapjs');
var fs = require('fs');
var rmdir = require('rimraf');

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

app.use(express.static(__dirname + '/static'));

// Serve static files
server.listen(port);

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
        else if (socket.handshake.query.user == 'admin_login') {  //monitoring <-> login for admin web page
            socket.on('canConnect', function(mail, password, cb) {
                db.collection('user').find({mail: mail, password: password}, function(err, cursor) {
                    cursor.toArray(function(err, users) {
                        cb(users);
                    })
                });
            })
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
            socket.on('countWithSearch', function (d, ack) {
                db.collection(d.table).count(d.data, function(err, count) {
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
            socket.on('getRangeWithSearch', function (d, ack) {
                db.collection(d.table).find(d.data).sort(typeof d.sort != 'undefined' ? d.sort : {}).skip(d.skip).limit(d.limit).toArray(function (err, items) {
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

            /***** LDAP ******/
            var client;
            var dn;
            var nb = 0;

            socket.on('ldap.attributes', function (server, d, cb) {
                dn = d;
                client = ldap.createClient({
                    url: server
                });

                var opts = {
                    filter: '(uid=*)',
                    scope: 'sub',
                    sizeLimit: 1
                };

                client.search(dn, opts, function(err, res) {
                    res.on('searchEntry', function(entry) {
                        cb(entry.attributes);
                    });
                    res.on('searchReference', function(referral) {});
                    res.on('error', function(err) {});
                    res.on('end', function(result) {});
                });
            });
            socket.on('ldap.import', function (name, fname, mail, password, max, filter, callback) {
                var opts = {
                    filter: filter,
                    scope: 'sub',
                    attributes: [name, fname, mail],
                    sizeLimit: parseInt(max)
                };

                client.search(dn, opts, function(err, res) {
                    if(err)
                        throw err;

                    res.on('searchEntry', function(entry) {
                        nb++;
                        setTimeout(function() {
                            db.collection('user').updateOne({
                                mail: entry.object[mail]
                            }, {
                                $set: {
                                    name: entry.object[name].toUpperCase(),
                                    fname: entry.object[fname][0].toUpperCase() + entry.object[fname].substr(1),
                                    mail: entry.object[mail].toLowerCase(),
                                    password: password,
                                    api_role: {
                                        name: "User",
                                        applications: []
                                    }
                                }
                            }, {
                                upsert: true
                            });
                        }, 0);
                    });
                    res.on('searchReference', function(referral) {});
                    res.on('error', function(err) {
                        callback(err.message);
                    });
                    res.on('end', function() {
                        callback(nb);
                    });
                });
            });

            /******* SAVE *******/
            socket.on("db.save", function(cb) {
                var dumpID = getDumpDate();
                var child = spawn('mongodump', ["--out", __dirname + "/dump/" + dumpID, "--db", "linkio"]);

                child.stdout.on('data', function (data) {
                });

                child.stderr.on('data', function (data) {
                });

                child.on('close', function () {
                    if(typeof cb == 'function')
                        cb(dumpID);
                });
            });

            socket.on("db.restore", function(nb, cb) {
                db.dropDatabase(function() {
                    var child = spawn('mongorestore', ["--dir", __dirname + "/dump/" + nb + "/linkio", "--db", "linkio"]);

                    child.on('close', function () {
                        if(typeof cb == 'function')
                            cb();
                    });
                });
            });

            socket.on("db.delete", function(nb, cb) {
                rmdir(__dirname + "/dump/" + nb, function(error){
                    if(typeof cb == 'function')
                        cb(error);
                });

            });

            socket.on("db.list", function(cb) {
                fs.readdir(__dirname + "/dump/", function(err, files) {
                    if(typeof cb == "function")
                        cb(files);
                });
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

function getDumpDate() {
    var now = new Date();
    //return (now.getMonth()+1) + "_" + now.getDate() + "_" + now.getFullYear() + "__" + now.getHours() + "_" + now.getMinutes();
    return now.getTime();
}

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
