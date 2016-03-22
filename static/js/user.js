var socket;
var nbUserPerPage = 5;
var totalPage;
var totalUser;
var currentPage;
var currentUsers;
var currentEditUserId = "";

var currentApps;

$(document).ready(function () {
    getMonitoringServerUrl(function (url) {
        socket = io.connect(url + "?user=admin");
        socket.on('connect', function () {
            socket.emit('count', {table: 'user'}, function (c) {
                totalUser = c;
                totalPage = Math.ceil(totalUser / nbUserPerPage);
                for (var i = 0; i < totalPage; i++) {
                    var elem = $('<li data-id="' + i + '"><a href="#">' + (i + 1) + '</a></li>');
                    elem.click(function () {
                        currentPage = parseInt($(this).children("a").html()) - 1;
                        loadUsers();
                    })
                    elem.insertBefore(".next");
                }

                $(".next").click(function () {
                    currentPage = (currentPage + 1) % totalPage;
                    loadUsers();
                });

                $(".previous").click(function () {
                    currentPage = currentPage != 0 ? currentPage - 1 : totalPage - 1;
                    loadUsers();
                });

                currentPage = 0;
                loadUsers();
            });

            $("#add-user").click(function () {
                $(".modal-add-user .ok").html("Add");
                currentEditUserId = "";
                $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                currentApps = [];
                $(".modal-add-user input").val("");
                $('.user-apirole').val("User");
                $(".user-app-container").slideUp(0);

                $(".modal-add-user").modal('show');
            });

            $('.user-apirole').change(function () {
                if ($(this).val() == 'Developer') {
                    $('table.apps tr').not('.head').remove();
                    currentApps = [];
                    $(".app-name").val('');
                    $(".user-app-container").slideDown();
                }
                else
                    $(".user-app-container").slideUp();
            });

            $(".app-name").typeahead({
                source: function (query, cb) {
                    socket.emit('getWithLimit',
                        {
                            table: 'application',
                            limit: 5,
                            data: {
                                name: {'$regex': '.*' + query + '.*'}
                            }
                        }, function (apps) {
                            if (typeof apps != 'undefined' && apps != null) {
                                var result = [];
                                apps.forEach(function (ap) {
                                    if ($.inArray(ap.name, currentApps) < 0)
                                        result.push(ap.name);
                                });
                                cb(result);
                            }
                        }
                    );
                }, afterSelect: function () {
                    $(".app-add").removeAttr('disabled').removeClass('disabled');
                }
            });

            $(".app-name").keyup(function () {
                socket.emit('getWithLimit',
                    {
                        table: 'application',
                        limit: 1,
                        data: {
                            name: $(this).val()
                        }
                    }, function (a) {
                        if (typeof a != 'undefined' && a != null && a.length == 0)
                            $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                        else
                            $(".app-add").removeAttr('disabled').removeClass('disabled');
                    }
                );
            });

            $(".app-add").click(function () {
                var app = $(".app-name").val();
                if ($.inArray(app, currentApps) < 0) {
                    currentApps.push(app);
                    addNewAppLine(app);

                    $(".app-name").val('');
                    $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                }
            });

            $(".modal-add-user .ok").click(function () {
                var name = $(".modal-add-user .user-name").val();
                var fname = $(".modal-add-user .user-fname").val();
                var mail = $(".modal-add-user .user-mail").val();
                var p1 = $(".modal-add-user .user-password1").val();
                var p2 = $(".modal-add-user .user-password2").val();
                var role = $(".modal-add-user .user-apirole").val();

                if (name == "")
                    $(".modal-add-app .user-name").parent().addClass("has-error");
                else if (fname == "")
                    $(".modal-add-app .user-fname").parent().addClass("has-error");
                else if (fname == "")
                    $(".modal-add-user .user-mail").parent().addClass("has-error");
                else if (p1 != p2) {
                    $(".modal-add-user .user-password1").parent().addClass("has-error");
                    $(".modal-add-user .user-password2").parent().addClass("has-error");
                }
                else if (role == "Developer" && currentApps.length == 0)
                    $(".modal-add-user .app-name").parent().addClass("has-error");
                else {
                    if (currentEditUserId == "") {
                        var id = new ObjectId().toString();

                        socket.emit("insert", {
                            table: "user",
                            data: {
                                _id: id,
                                name: name,
                                fname: fname,
                                mail: mail,
                                password: p1,
                                api_role: {
                                    name: role,
                                    applications: currentApps
                                }
                            }
                        });

                        location.reload();
                    }
                    else {
                        socket.emit('updateOne', {
                            table: 'user',
                            critera: {
                                _id: currentEditUserId
                            },
                            data: {
                                $set: {
                                    name: name,
                                    fname: fname,
                                    mail: mail,
                                    password: p1,
                                    api_role: {
                                        name: role,
                                        applications: currentApps
                                    }
                                }
                            }
                        });
                        location.reload();
                    }
                }
            });
        });
    });
});

function addNewAppLine(app) {
    var line = $("<tr>");
    line.append($("<td>").html(app));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

    line.find(".glyphicon-remove").click(function () {
        for (var i = currentApps.length - 1; i >= 0; i--) {
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
    socket.emit('getRange', {table: 'user', skip: from, limit: nbUserPerPage}, function (users) {
        currentUsers = users;
        $('.users tr').not(".head").remove();

        currentUsers.forEach(function (u) {
            var line = $("<tr>");
            line.append($("<td>").html(u.name));
            line.append($("<td>").html(u.fname));
            line.append($("<td>").html(u.mail));
            line.append($("<td>").html(u.api_role.name));
            line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>'));
            line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

            line.find(".glyphicon-pencil").click(function () {
                currentEditUserId = u._id;
                $(".modal-add-user .ok").html("Edit");
                $('table.apps tr').not('.head').remove();
                $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                $(".modal-add-user .user-name").val(u.name);
                $(".modal-add-user .user-fname").val(u.fname);
                $(".modal-add-user .user-mail").val(u.mail);
                $(".modal-add-user .user-password1").val(u.password);
                $(".modal-add-user .user-password2").val(u.password);
                $('.user-apirole').val(u.api_role.name);
                if (u.api_role.name == "Developer")
                    $(".user-app-container").slideDown(0);
                else
                    $(".user-app-container").slideUp(0);

                currentApps = u.api_role.applications;
                currentApps.forEach(function (app) {
                    addNewAppLine(app);
                });

                $(".modal-add-user").modal('show');
            });

            line.find(".glyphicon-remove").click(function () {
                $(".modal-delete-name").html(u.mail);
                $(".modal-delete-user").modal('show');

                $(".modal-delete-user .yes").on('click', function () {
                    $(".modal-delete-user .yes").off('click');

                    socket.emit("deleteOne", {
                        table: "user",
                        critera: {
                            _id: u._id
                        }
                    });
                    line.remove();
                });
            });

            $('.users').append(line);
        })
    });
}

function getMonitoringServerUrl(func) {

    $.getJSON('./infos.json', function (infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' + infos.link_io_server_monitoring.port);
    });
}