var socket;
var apps;

$(document).ready(function() {
    getMonitoringServerUrl(function(url) {

        socket = io.connect(url + "?user=admin");
        socket.on('connect', function () {
            socket.emit('getAll', 'application', function(res) {
                apps = res;
                res.forEach(function(app) {
                    addNewLine(app._id, app.name, app.api_key);
                });
            });
        });


        $("#add-app").click(function() {
            $(".modal-add-app").modal('show');
            setTimeout(function() {
                $($(".modal-add-app input")[0]).focus();
            }, 500);
        });


        $(".modal-add-app .ok").click(function() {
            var name = $(".modal-add-app input").val();
            if(name != "") {
                var apiKey = generateAPIKey();
                var id = new ObjectId();
                socket.emit("insert", {
                    table: "application",
                    data: {
                        _id: id,
                        name: name,
                        api_key: apiKey
                    }
                });

                addNewLine(id, name, apiKey);
                $(".modal-add-app").modal("hide");
                $(".modal-add-app .form-group").removeClass("has-error");
                $(".modal-add-app .form-group input").val("");
            }
            else {
                $(".modal-add-app .form-group").addClass("has-error");
            }
        });

        $(".modal-add-app .form-group input").keydown(function() {
            $(".modal-add-app .form-group").removeClass("has-error");
        });
    });
});

function addNewLine(id, name, apiKey) {
    var line = $("<tr id='" + id + "'>");
    line.append($("<td>").html(name));
    line.append($("<td>").html(apiKey));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>'));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

    line.find(".glyphicon-remove").click(function() {
        $(".modal-delete-name").html(name);
        $(".modal-delete-app").modal('show');

        $(".modal-delete-app .yes").on('click', function() {
            $(".modal-delete-app .yes").off('click');

            socket.emit("deleteOne", {
                table: "application",
                critera: {
                    _id: id
                }
            });
            line.remove();
        });
    });

    line.find(".glyphicon-pencil").click(function() {
        $("table.apps").fadeOut();
        $("#add-app").fadeOut();
        $(".titleBloc h1").fadeOut(function() {
            $(this).html(name);
            $(this).fadeIn();


        });
    });

    $("table.apps").append(line);
}

function getMonitoringServerUrl(func) {

    $.getJSON('./infos.json', function(infos) {
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