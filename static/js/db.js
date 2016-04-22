var socket;

if(user.api_role.name == "Developer")
    window.location = "home.html";

$(document).ready(function () {
    getMonitoringServerUrl(function (url) {
        socket = io.connect(url + "?user=admin");
        socket.on('connect', function () {
            $("#add-dump").click(function () {
                $(this).html("Dump in progress...").addClass("disabled");
                socket.emit("db.save", function(nb) {
                    $(".modal-added-dump .modal-dump-id").html(nb);
                    $(".modal-added-dump .yes").click(function() {
                        location.reload();
                    })
                    $(".modal-added-dump").modal("show");
                })
            });

            socket.emit("db.list", function(dumps) {
                dumps.forEach(function(d) {
                    var line = $("<tr>");
                    line.append($("<td>").html(d));
                    line.append($("<td>").html(new Date(parseInt(d)).toString()));
                    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>'));
                    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

                    line.find(".glyphicon-pencil").click(function () {
                        $(".modal-restore-dump .modal-dump-id").html(d);
                        $(".modal-restore-dump").modal("show");
                        $(".modal-restore-dump .yes").click(function() {
                            socket.emit("db.restore", d, function() {
                                $(".modal-restored-dump .modal-dump-id").html(d);
                                $(".modal-restored-dump .yes").click(function() {
                                    location.reload();
                                })
                                $(".modal-restored-dump").modal("show");
                            })
                        })
                    });

                    line.find(".glyphicon-remove").click(function () {
                        $(".modal-delete-dump .modal-dump-id").html(d);
                        $(".modal-delete-dump").modal("show");
                        $(".modal-delete-dump .yes").click(function() {
                            socket.emit("db.delete", d, function() {
                                location.reload();
                            })
                        })
                    });

                    $('.dumps').append(line);
                });
            })
        });
    });
});


function getMonitoringServerUrl(func) {

    $.getJSON('./infos.json', function (infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' + infos.link_io_server_monitoring.port);
    });
}
