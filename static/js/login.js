if (typeof Cookies.get("user") != "undefined")
    window.location = "home.html";
else
    $(document).ready(function () {
        $(".alert-danger").slideUp(0);
        getMonitoringServerUrl(function (url) {
            socket = io.connect(url + "?user=admin_login");
            socket.on('connect', function () {
                $('.go').click(function () {
                    var mail = $('.mail').val();
                    var password = $('.password').val();

                    if (mail == "")
                        $('.mail').parent().parent().addClass("has-error");
                    else
                        $('.mail').parent().parent().removeClass("has-error");

                    if (password == "")
                        $('.password').parent().parent().addClass("has-error");
                    else
                        $('.password').parent().parent().removeClass("has-error");

                    if (mail != "" && password != "") {
                        socket.emit('canConnect', mail, password, function (users) {
                            console.log(users);
                            if (users == null || users.length == 0) {
                                $('.mail').parent().parent().addClass("has-error");
                                $('.password').parent().parent().addClass("has-error");
                            }
                            else {
                                var user = users[0];
                                if(user.api_role.name == "User") {
                                    $(".alert-danger").slideDown();
                                }
                                else {
                                    delete user.password;
                                    delete user._id;
                                    Cookies.set('user', user);
                                    window.location = "home.html";
                                }
                            }
                        });
                    }
                });
            });
        });
    });

function getMonitoringServerUrl(func) {
    $.getJSON('./infos.json', function (infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' + infos.link_io_server_monitoring.port);
    });
}