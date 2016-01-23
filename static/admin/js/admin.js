var socket;

$(document).ready(function() {
    getMonitoringServerUrl(function(url) {
        socket = io.connect(url + "?user=admin");
        socket.on('connect', function () {

        });
    });
});

function getMonitoringServerUrl(func) {

    $.getJSON('../monitoring/infos.json', function(infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' +infos.link_io_server_monitoring.port);
    });

}