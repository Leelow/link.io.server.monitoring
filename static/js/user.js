var socket;
var nbUserPerPage = 13;
var maxPageShortcut = 6;
var totalPage;
var totalUser;
var currentPage;
var currentUsers;
var currentEditUserMail = "";

var searchCritera = {
    name: "",
    fname: "",
    mail: "",
    role: "*",
    getObject: function() {
        var o = {};
        if(this.name != "")
            o.name = {'$regex': '.*' + this.name + '.*', '$options': 'i'}
        if(this.fname != "")
            o.fname = {'$regex': '.*' + this.fname + '.*', '$options': 'i'}
        if(this.mail != "")
            o.mail = {'$regex': '.*' + this.mail + '.*', '$options': 'i'}
        if(this.role != "*") {
            o['api_role.name'] = this.role;
        }

        return o;
    }
};

var currentApps;

$(document).ready(function () {
    if(user.api_role.name == "Developer")
        $(".user-apirole").attr("disabled", "disabled");
    $(".import").fadeOut(0);
    getMonitoringServerUrl(function (url) {
        socket = io.connect(url + "?user=admin");
        socket.on('connect', function () {
            loadUsers();

            $(".search-name").keyup(function() {
                searchCritera.name = $(this).val();
                loadUsers();
            });
            $(".search-fname").keyup(function() {
                searchCritera.fname = $(this).val();
                loadUsers();
            });
            $(".search-mail").keyup(function() {
                searchCritera.mail = $(this).val();
                loadUsers();
            });
            $(".search-role").change(function() {
                searchCritera.role = $(this).val();
                loadUsers();
            });
            $(".search-reset").click(function() {
                $(".search-name").val("");
                $(".search-fname").val("");
                $(".search-mail").val("");
                $(".search-role").val("*");
                searchCritera.name = "";
                searchCritera.fname = "";
                searchCritera.mail = "";
                searchCritera.role = "*";
                loadUsers();
            })

            $("#add-user").click(function () {
                $(".modal-add-user .ok").html("Add");
                currentEditUserMail = "";
                $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                currentApps = [];
                $(".modal-add-user input").val("");
                $('.user-apirole').val("User");
                $(".user-app-container").slideUp(0);

                $(".modal-add-user .user-password1").removeAttr("disabled");
                $(".modal-add-user .user-password2").removeAttr("disabled");

                $(".modal-add-user").modal('show');
            });

            $('.user-apirole').change(function () {
                currentApps = [];
                if ($(this).val() == 'Developer') {
                    $('table.apps tr').not('.head').remove();
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
                else if (p1 == "" && currentEditUserMail == "") {
                    $(".modal-add-user .user-password1").parent().addClass("has-error");
                    $(".modal-add-user .user-password2").parent().addClass("has-error");
                }
                else if (role == "Developer" && currentApps.length == 0)
                    $(".modal-add-user .app-name").parent().addClass("has-error");
                else {
                    if (currentEditUserMail == "") {
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
                                mail: currentEditUserMail
                            },
                            data: {
                                $set: {
                                    name: name,
                                    fname: fname,
                                    mail: mail,
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

            /****** LDAP ********/
            $("#import-user").click(function () {
                $(".modal-ldap").modal('show');
            });

            $(".modal-ldap .ok").click(function () {
                var server_ip = $(".ldap-ip").val();
                var server_port = $(".ldap-port").val();
                var dn = $(".ldap-dn").val();

                if (server_ip != "") {
                    if (server_ip.indexOf("ldap://") < 0 && server_ip.indexOf("ldaps://") < 0)
                        server_ip = "ldap://" + server_ip + ":" + server_port;
                    else
                        server_ip = server_ip + ":" + server_port;

                    socket.emit('ldap.attributes', server_ip, dn, function (data) {
                        $(".modal-ldap").modal('hide');
                        goToImportView(data, function (name, fname, mail, password, max, filter) {
                            socket.emit('ldap.import', name, fname, mail, password, max, filter,
                                function (data) {
                                    if(isNaN(data)) {
                                        $(".modal-ldap-result .body").html("Error: " + data);
                                    }
                                    else {
                                        $(".modal-ldap-result .body").html("Finish. Users imported: " + data);
                                    }
                                    $(".modal-ldap-result").modal('show');
                                    $(".modal-ldap-result .yes").click(function() {
                                        location.reload();
                                    });
                                }
                            );
                        });
                    });
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
    socket.emit('countWithSearch', {table: 'user',data:searchCritera.getObject()}, function (c) {
        totalUser = c;
        totalPage = Math.ceil(totalUser / nbUserPerPage);

        $(".next").off('click').on('click', function () {
            currentPage = (currentPage + 1) % totalPage;
            loadUsersInPage();
        });

        $(".previous").off('click').on('click', function () {
            currentPage = currentPage != 0 ? currentPage - 1 : totalPage - 1;
            loadUsersInPage();
        });

        currentPage = 0;
        loadUsersInPage();
    });
}

function loadUsersInPage() {
    var scroll = $("body").scrollTop();
    var start = Math.max(currentPage - maxPageShortcut/2, 0);
    var end = Math.min(start + maxPageShortcut, totalPage);
    $(".pagination li").not('.previous').not('.next').remove();
    for (var i = start; i < end; i++) {
        var elem = $('<li data-id="' + i + '"><a href="#">' + (i + 1) + '</a></li>');
        elem.click(function () {
            currentPage = parseInt($(this).children("a").html()) - 1;
            loadUsersInPage();
        })
        elem.insertBefore(".next");
    }
    $(".pagination [data-id='" + currentPage + "']").addClass("active");
    var from = currentPage * nbUserPerPage;
    socket.emit('getRangeWithSearch', {
            table: 'user',
            skip: from,
            limit: nbUserPerPage,
            data: searchCritera.getObject(),
            sort: {
                name: 1
            }
    }, function (users) {
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
                currentEditUserMail = u.mail;
                $(".modal-add-user .ok").html("Edit");
                $('table.apps tr').not('.head').remove();
                $(".app-add").attr('disabled', 'disabled').addClass('disabled');
                $(".modal-add-user .user-name").val(u.name);
                $(".modal-add-user .user-fname").val(u.fname);
                $(".modal-add-user .user-mail").val(u.mail);
                $(".modal-add-user .user-password1").attr("disabled", "disabled");
                $(".modal-add-user .user-password2").attr("disabled", "disabled");
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
                            mail: u.mail
                        }
                    });
                    line.remove();
                });
            });

            $('.users').append(line);
        })
    });

    $("body").scrollTop(scroll);
}

function getMonitoringServerUrl(func) {

    $.getJSON('./infos.json', function (infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' + infos.link_io_server_monitoring.port);
    });
}

function goToImportView(data, cb) {
    $("table.users").fadeOut();
    $("#add-user").fadeOut();
    $("#import-user").fadeOut();
    $(".pagination").parent().parent().fadeOut();
    $(".users-preview").parent().parent().hide();
    $(".titleBloc h1").fadeOut(function () {
        $(this).html('<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>' + " LDAP: binding");

        $(this).fadeIn();
        $(".import").fadeIn();

        $(".import .ldap-binding").children().remove();
        data.forEach(function (attr) {
            if (attr.vals.length == 1)
                $(".import .ldap-binding").append($('<option value="' + attr.type + '">' + attr.type + '</option>'));
        });

		$(".ldap-preview").on('click', function() {
            socket.emit('ldap.preview',
                $(".ldap-name").val(),
                $(".ldap-fname").val(),
                $(".ldap-mail").val(),
                10,
                $(".ldap-filter").val(),
                function (data) {
                    if(typeof data != 'undefined' && data.length > 0) {
                        var tab = $('.users-preview');
                        tab.find("tr").not(".head").remove();
                        data.forEach(function(u) {
                            var line = $("<tr class='text-left'>");
                            line.append($("<td>").html(u.name));
                            line.append($("<td>").html(u.fname));
                            line.append($("<td>").html(u.mail));
                            line.append($("<td>").html(u.api_role.name));
                            tab.append(line);
                        });
                        tab.parent().parent().show();
                    }
                }
            );
		});

        $(".ldap-preview").on('click', function () {
            if ($(".ldap-password1").val() != $(".ldap-password2").val()) {
                $(".ldap-password1").parent().parent().addClass("has-error");
                $(".ldap-password2").parent().parent().addClass("has-error");
            }
            else {

            }
        });

        $(".ldap-go").on('click', function () {
            if ($(".ldap-password1").val() != $(".ldap-password2").val()) {
                $(".ldap-password1").parent().parent().addClass("has-error");
                $(".ldap-password2").parent().parent().addClass("has-error");
            }
            else {
                $(".ldap-go").off('click');
                $(".ldap-password1").parent().parent().removeClass("has-error");
                $(".ldap-password2").parent().parent().removeClass("has-error");

                $(this).html("Importing...").addClass("disabled");
                cb(
                    $(".ldap-name").val(),
                    $(".ldap-fname").val(),
                    $(".ldap-mail").val(),
                    $(".ldap-password1").val(),
                    $(".ldap-max").val(),
                    $(".ldap-filter").val()
                );
            }
        });

        var that = $(this);
        $(this).children("span.glyphicon-chevron-left").click(function () {
            $(".import").fadeOut();
            that.fadeOut(function () {
                that.html("Users");
                $("table.users").fadeIn();
                $("#add-user").fadeIn();
                $("#import-user").fadeIn();
                $(".pagination").parent().parent().fadeIn();
                that.fadeIn();
            });
        });
    });
}