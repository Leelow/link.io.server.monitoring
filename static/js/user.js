var socket;
var nbUserPerPage = 5;
var totalPage;
var totalUser;
var currentPage;
var currentUsers;

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
                $(".modal-add-user input").val("");
                $('.user-apirole').val("User");
                $(".user-app-container").slideUp(0);

                $('.user-apirole').change(function() {
                    if($(this).val() == 'Developer')
                        $(".user-app-container").slideDown();
                    else
                        $(".user-app-container").slideUp();
                });


                $(".modal-add-user").modal('show');
            });
        });
    });
});

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