$(document).ready(function () {
    var token = getQueryVariable("token");

    if(token != "") {
        getMonitoringServerUrl(function (url) {
            socket = io.connect(url + "?user=admin_password");
            socket.on('connect', function () {
                socket.emit('validToken', token, function (mail) {
                    if(typeof mail == 'undefined')
                        $(".changePassword").hide();
                    else {
                        $(".alert.alert-danger").hide();
                        $(".mail").html(mail);


                    }
                });
            });
        });
    }
    else
        $(".changePassword").hide();
});

function getMonitoringServerUrl(func) {
    $.getJSON('./infos.json', function (infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' + infos.link_io_server_monitoring.port);
    });
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return "";
}