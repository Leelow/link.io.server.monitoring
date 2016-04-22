var socket;
var apps;
var currentApp;
var currentUsers = [];
var currentRights = [];
var currentEditRoleIndex = -1;

var rightsTypes = [
    ["CONNECT", false],
    ["CREATE_ROOM", false],
    ["JOIN_ROOM", false],
    ["SEND_MESSAGE", false],
    ["SEND_FILE", true]
];

$(document).ready(function () {
    if(user.api_role.name == "Developer")
        $(".addBloc").remove();

    getMonitoringServerUrl(function (url) {

        socket = io.connect(url + "?user=admin");
        socket.on('connect', function () {
            socket.emit('getAll', 'application', function (res) {
                apps = res;
                res.forEach(function (app) {
                    if(user.api_role.name == "Administrator")
                        addNewApplicationLine(app);
                    else {
                        user.api_role.applications.forEach(function(a) {
                            if(a == app.name)
                                addNewApplicationLine(app);
                        });
                    }
                });

                $("#add-app").removeClass("btn-warning")
                    .addClass("btn-primary")
                    .html('<span class="glyphicon glyphicon-plus"></span> Add')
                    .click(function () {
                        $(".modal-add-app").modal('show');
                        setTimeout(function () {
                            $($(".modal-add-app input")[0]).focus();
                        }, 500);
                    });

                $("#add-role").click(function () {
                    currentEditRoleIndex = -1;
                    $(".modal-add-role").modal('show');
                    $(".modal-add-role .app-name").html(currentApp.name);
                    $(".right-param").attr("disabled", "disabled");
                    currentRights = [];
                    currentUsers = [];

                    $(".right-type").children().remove();
                    rightsTypes.forEach(function (rt) {
                        $(".right-type").append($('<option value="' + rt[0] + '">' + rt[0] + '</option>'));
                    });

                    $(".rights").find("tr").not(".head").remove();
                    $(".users").find("tr").not(".head").remove();

                    $(".role-name").val("");
                    $(".mail-user").val("");
                    $(".right-param").val("");

                    setTimeout(function () {
                        $($(".modal-add-role input")[0]).focus();
                    }, 500);
                });

                $(".mail-user").typeahead({
                    source: function (query, cb) {
                        socket.emit('getWithLimit',
                            {
                                table: 'user',
                                limit: 5,
                                data: {
                                    mail: {'$regex': '.*' + query + '.*'}
                                }
                            }, function (users) {
                                if (typeof users != 'undefined' && users != null) {
                                    var mails = [];
                                    users.forEach(function (us) {
                                        if ($.inArray(us.mail, currentUsers) < 0)
                                            mails.push(us.mail);
                                    });
                                    cb(mails);
                                }
                            }
                        );
                    }, afterSelect: function () {
                        $(".user-add").removeAttr('disabled').removeClass('disabled');
                    }
                });

                $(".mail-user").keyup(function () {
                    socket.emit('getWithLimit',
                        {
                            table: 'user',
                            limit: 1,
                            data: {
                                mail: $(this).val()
                            }
                        }, function (a) {
                            if (typeof a != 'undefined' && a != null && a.length == 0)
                                $(".user-add").attr('disabled', 'disabled').addClass('disabled');
                            else
                                $(".user-add").removeAttr('disabled').removeClass('disabled');
                        }
                    );
                });

                $(".role-default").change(function () {
                    $(".role-user-container").slideToggle().prev().fadeToggle();
                });

                $(".right-type").change(function () {
                    $(".right-param").val("");
                    for (var i = 0; i < rightsTypes.length; i++) {
                        if ($(this).val() == rightsTypes[i][0]) {
                            if (rightsTypes[i][1])
                                $(".right-param").removeAttr("disabled");
                            else
                                $(".right-param").attr("disabled", "disabled");
                            i = rightsTypes.length;
                        }
                    }
                });

                $(".right-add").click(function () {
                    var right = $(".right-type").val();
                    if (right != null) {
                        var param = $(".right-param").val();
                        currentRights.push([right, param]);
                        addNewRightLine(right, param);
                    }
                });

                $(".user-add").click(function () {
                    var user = $(".mail-user").val();
                    if (user != null && user != "" && $.inArray(user, currentUsers) < 0) {
                        currentUsers.push(user);
                        addNewUserLine(user);

                        $(".mail-user").val('');
                        $(".user-add").attr('disabled', 'disabled').addClass('disabled');
                    }
                });


                $(".modal-add-role .ok").click(function () {
                    var role = {
                        name: $(".role-name").val(),
                        is_default: $(".role-default").is(":checked"),
                        users: currentUsers,
                        rights: currentRights
                    };

                    if (role.is_default)
                        role.users = currentUsers;

                    var roles;
                    if (typeof currentApp.roles != 'undefined')
                        roles = currentApp.roles;
                    else
                        roles = [];

                    if (role.is_default) {
                        roles.forEach(function (r) {
                            socket.emit('updateOne', {
                                table: 'application',
                                critera: {
                                    name: currentApp.name,
                                    'roles.is_default': true
                                },
                                data: {
                                    '$set': {
                                        'roles.$.is_default': false
                                    }
                                }
                            })
                        });
                        $(".roles tr").not(".head").each(function () {
                            $($(this).children()[1]).html("No");
                        });
                    }

                    if (currentEditRoleIndex < 0) {
                        roles.push(role);

                        socket.emit('updateOne', {
                            table: 'application',
                            critera: {
                                name: currentApp.name
                            },
                            data: {
                                '$push': {
                                    'roles': role
                                }
                            }
                        });
                        addNewRoleLine(role, roles.length - 1);
                    }
                    else {
                        currentApp.roles[currentEditRoleIndex] = role;

                        var s = {};
                        s['roles.' + currentEditRoleIndex] = role;

                        socket.emit('updateOne', {
                            table: 'application',
                            critera: {
                                name: currentApp.name
                            },
                            data: {
                                '$set': s
                            }
                        });

                        var line = $($("table.roles tr").not(".head")[currentEditRoleIndex]);
                        $(line.children()[0]).html(role.name);
                        $(line.children()[1]).html(role.is_default ? "Yes" : "No");
                        $(line.children()[2]).html(role.rights.length);
                    }

                    $(".modal-add-role").modal('hide');
                });
            });
        });

        $(".modal-add-app .ok").click(function () {
            var name = $(".modal-add-app input").val();
            if (name != "") {
                var apiKey = generateAPIKey();
                var id = new ObjectId().toString();
                socket.emit("insert", {
                    table: "application",
                    data: {
                        _id: id,
                        name: name,
                        api_key: apiKey
                    }
                });

                addNewApplicationLine({
                    _id: id,
                    name: name,
                    api_key: apiKey
                });
                $(".modal-add-app").modal("hide");
                $(".modal-add-app .form-group").removeClass("has-error");
                $(".modal-add-app .form-group input").val("");
            }
            else {
                $(".modal-add-app .form-group").addClass("has-error");
            }
        });

        $(".modal-add-app .form-group input").keydown(function () {
            $(".modal-add-app .form-group").removeClass("has-error");
        });
    });
});

function addNewApplicationLine(app) {
    var line = $("<tr id='" + app._id + "'>");
    line.append($("<td>").html(app.name));
    line.append($("<td>").html(app.api_key));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>'));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

    line.find(".glyphicon-remove").click(function () {
        $(".modal-delete-name").html(app.name);
        $(".modal-delete-app").modal('show');

        $(".modal-delete-app .yes").on('click', function () {
            $(".modal-delete-app .yes").off('click');

            socket.emit("deleteOne", {
                table: "application",
                critera: {
                    _id: app._id
                }
            });
            line.remove();
        });
    });

    line.find(".glyphicon-pencil").click(function () {
        currentApp = app;
        $("table.apps").fadeOut();
        $("#add-app").fadeOut();
        $(".titleBloc h1").fadeOut(function () {
            $(this).html('<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>' + app.name + " : Roles management");

            $("table.roles").find("tr").not(".head").remove();
            if (typeof app.roles != 'undefined' && app.roles.length > 0) {
                var i = 0;
                app.roles.forEach(function (role) {
                    addNewRoleLine(role, i);
                    i++;
                })
            }

            $(this).fadeIn();
            $(".roles").fadeIn();
            $("#add-role").fadeIn();

            var that = $(this);
            $(this).children("span.glyphicon-chevron-left").click(function () {
                currentApp = undefined;
                $(".roles").fadeOut();
                $("#add-role").fadeOut();
                that.fadeOut(function () {
                    that.html("Applications");
                    $("table.apps").fadeIn();
                    $("#add-app").fadeIn();
                    that.fadeIn();
                });
            });
        });
    });

    $("table.apps").append(line);
}

function addNewRoleLine(role, index) {
    var line = $("<tr>");
    line.append($("<td>").html(role.name));
    line.append($("<td>").html(role.is_default ? "Yes" : "No"));
    line.append($("<td>").html(role.rights.length));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>'));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

    line.find(".glyphicon-remove").click(function () {
        $(".modal-delete-app").modal('show');
        $(".modal-delete-name").html(role.name);

        $(".modal-delete-app .yes").on('click', function () {
            $(".modal-delete-app .yes").off('click');

            socket.emit("updateOne", {
                table: "application",
                critera: {
                    name: currentApp.name
                },
                data: {
                    "$pull": {
                        "roles": {
                            name: role.name
                        }
                    }
                }
            });
            line.remove();
        });
    });


    line.find(".glyphicon-pencil").click(function () {
        currentEditRoleIndex = index;
        $(".modal-add-role").modal('show');
        $(".modal-add-role .app-name").html(currentApp.name);
        //$(".right-param").attr("disabled", "disabled");
        currentRights = role.rights || [];
        currentUsers = role.users || [];

        $(".rights").find("tr").not(".head").remove();
        $(".users").find("tr").not(".head").remove();

        $(".right-type").children().remove();
        rightsTypes.forEach(function (rt) {
            $(".right-type").append($('<option value="' + rt[0] + '">' + rt[0] + '</option>'));
        });

        currentRights.forEach(function (r) {
            addNewRightLine(r[0], r[1]);
        });

        if (!role.is_default) {
            currentUsers.forEach(function (u) {
                addNewUserLine(u);
            });
        }
        else {
            $(".role-default").attr("checked", "checked")
            $(".role-user-container").slideToggle(0).prev().fadeToggle(0);
        }

        $(".role-name").val(role.name);
        $(".mail-user").val("");
        $(".right-param").val("");

        setTimeout(function () {
            $($(".modal-add-role input")[0]).focus();
        }, 500);
    });

    $("table.roles").append(line);
}

function addNewUserLine(user) {
    $(".mail-user").val("");

    var line = $("<tr>");
    line.append($("<td>").html(user));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

    line.find(".glyphicon-remove").click(function () {
        for (var i = currentUsers.length - 1; i >= 0; i--) {
            if (currentUsers[i] == user) {
                currentUsers.splice(i, 1);
            }
        }
        line.remove();
    });

    $("table.users").append(line);
}

function addNewRightLine(right, param) {
    if (typeof param == 'undefined')
        param = $(".right-param").val();

    $(".right-type option[value='" + right + "']").remove();
    $(".right-type").trigger("change");

    var line = $("<tr id='" + right + "'>");
    line.append($("<td>").html(right));
    line.append($("<td>").html(param));
    line.append($("<td class='action'>").html('<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'));

    line.find(".glyphicon-remove").click(function () {
        for (var i = currentRights.length - 1; i >= 0; i--) {
            if (currentRights[i][0] == right) {
                currentRights.splice(i, 1);
            }
        }
        $(".right-type").append($('<option value="' + right + '">' + right + '</option>'));
        $(".right-type").trigger("change");
        line.remove();
    });

    $("table.rights").append(line);
}

function getMonitoringServerUrl(func) {

    $.getJSON('./infos.json', function (infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' + infos.link_io_server_monitoring.port);
    });
}

var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateAPIKey() {
    var apiKey = "";

    for (var i = 0; i < 20; i++)
        apiKey += chars[Math.round(Math.random() * chars.length)];

    return apiKey;
}