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
                    line.append($("<td>").html(getDatePrefix(parseInt(d), false)));
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

function getDatePrefix(ms, addMs) {
    var d = new Date(ms);
    var date_str = d.getFullYear()                                         + '-' +
        ((d.getMonth() + 1) < 10 ? '0' : '') + (d.getMonth() + 1) + '-' +
        (d.getDate()       < 10 ? '0' : '') + d.getDate()        + ' ' +
        (d.getHours()      < 10 ? '0' : '') + d.getHours()       + ':' +
        (d.getMinutes()    < 10 ? '0' : '') + d.getMinutes()     + ':' +
        (d.getSeconds()    < 10 ? '0' : '') + d.getSeconds()     +
        (addMs ? ':' + minDigits(d.getMilliseconds(), 3) : '');
    return date_str;
}

function minDigits(n, digits) {
    var str = n + '';
    var length = str.length;
    var i = 0;
    while(i < (digits - length)) {
        str = '0' + str;
        i++;
    }

    return str + '';
}