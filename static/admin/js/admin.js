var socket;
var apps;

$(document).ready(function() {
    getMonitoringServerUrl(function(url) {

        socket = io.connect(url + "?user=admin");
        socket.on('connect', function () {
            socket.emit('getAll', 'application', function(res) {
                apps = res;
                res.forEach(function(user) {
                    var line = $("<tr>");
                    line.append($("<td>").html(user.name));
                    line.append($("<td>").html(user.api_key));

                    $("table").append(line);
                });
            });
        });


        $("#add-app").click(function() {
            $(".modal-add-app").modal('show');
        });


        $(".modal-add-app .ok").click(function() {
            var name = $(".modal-add-app input").val();
            if(name != "") {
                var apiKey = generateAPIKey();
                socket.emit("insert", {
                    table: "application",
                    data: {
                        name: name,
                        api_key: apiKey
                    }
                });
                var line = $("<tr>");
                line.append($("<td>").html(name));
                line.append($("<td>").html(apiKey));

                $("table").append(line);

                $(".modal-add-app").modal('hide');
                $(".modal-add-app .form-group").removeClass("has-error");
            }
            else {
                $(".modal-add-app .form-group").addClass("has-error");
            }
        });
    });
});

function getMonitoringServerUrl(func) {

    $.getJSON('../monitoring/infos.json', function(infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' +infos.link_io_server_monitoring.port);
    });
}

var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateAPIKey() {
    var apiKey = "";

    for(var i = 0; i<20; i++)
        apiKey += chars[Math.round(Math.random() * chars.length)];

    return apiKey;
}