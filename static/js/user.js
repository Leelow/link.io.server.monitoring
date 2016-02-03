var socket;
var nbUserPerPage = 5;
var totalPage;
var totalUser;
var currentPage;
var currentUsers;

var currentApps;

$(document).ready(function () {
    getMonitoringServerUrl(function (url) {
        socket = io.connect(url + "?user=admin");
        socket.on('connect', function () {
            socket.emit('count', {table:'user'}, function(c) {
                totalUser = c;
                totalPage = Math.ceil(totalUser / nbUserPerPage);
                for(var i = 0; i<totalPage; i++) {
                    var elem = $('<li data-id="' + i + '"><a href="#">' + (i + 1) + '</a></li>');
                    elem.click(function() {
                        currentPage = parseInt($(this).children("a").html()) - 1;
                        loadUsers();
                    })
                    elem.insertBefore(".next");
                }

                $(".next").click(function() {
                    currentPage = (currentPage + 1) % totalPage;
                    loadUsers();
                });

                $(".previous").click(function() {
                    currentPage = currentPage != 0 ? currentPage - 1 : totalPage - 1;
                    loadUsers();
                });

                currentPage = 0;
                loadUsers();
            });

            $("#add-user").click(function() {
                $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                currentApps = [];
                $(".modal-add-user input").val("");
                $('.user-apirole').val("User");
                $(".user-app-container").slideUp(0);

                $('.user-apirole').change(function() {
                    if($(this).val() == 'Developer') {
                        $('table.apps tr').not('.head').remove();
                        currentApps = [];
                        $(".app-name").val('');
                        $(".user-app-container").slideDown();
                    }
                    else
                        $(".user-app-container").slideUp();
                });


                $(".modal-add-user").modal('show');
            });

            $(".app-name").typeahead({source: function(query, cb) {
                socket.emit('getWithLimit',
                    {
                        table:'application',
                        limit: 5,
                        data: {
                            name:{'$regex':'.*' + query + '.*'}
                        }
                    }, function(apps) {
                        if(typeof apps != 'undefined' && apps != null) {
                            var result = [];
                            apps.forEach(function(ap) {
                                if($.inArray(ap.name, currentApps) < 0)
                                    result.push(ap.name);
                            });
                            cb(result);
                        }
                    }
                );
            }, afterSelect: function() {
                $(".app-add").removeAttr('disabled').removeClass('disabled');
            }});

            $(".app-name").keyup(function() {
                socket.emit('getWithLimit',
                    {
                        table:'application',
                        limit: 1,
                        data: {
                            name: $(this).val()
                        }
                    }, function(a) {
                        if(typeof a != 'undefined' && a != null && a.length == 0)
                            $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                        else
                            $(".app-add").removeAttr('disabled').removeClass('disabled');
                    }
                );
            });

            $(".app-add").click(function() {
                var app = $(".app-name").val();
                if($.inArray(app, currentApps) < 0) {
                    currentApps.push(app);
                    addNewAppLine(app);

                    $(".app-name").val('');
                    $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                }
            });
        });
    });
});

function addNewAppLine(app) {
    var line = $("<tr>");
    line.append($("<td>").html(app));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

    line.find(".glyphicon-remove").click(function() {
        for (var i=currentApps.length-1; i>=0; i--) {
            if (currentApps[i] == app) {
                currentApps.splice(i, 1);
            }
        }

        line.remove();
    });

    $("table.apps").append(line);
}

function loadUsers() {
    $(".pagination .active").removeClass("active");
    $(".pagination [data-id='" + currentPage + "']").addClass("active");
    var from = currentPage * nbUserPerPage;
    socket.emit('getRange', {table:'user', skip:from, limit:nbUserPerPage}, function(users) {
        currentUsers = users;
        $('.users tr').not(".head").remove();

        currentUsers.forEach(function(u) {
            var line = $("<tr>");
            line.append($("<td>").html(u.name));
            line.append($("<td>").html(u.fname));
            line.append($("<td>").html(u.mail));
            line.append($("<td>").html(u.api_role.name));
            line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>'));
            line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

            $('.users').append(line);
        })
    });
}

function getMonitoringServerUrl(func) {

    $.getJSON('./infos.json', function (infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' + infos.link_io_server_monitoring.port);
    });
}