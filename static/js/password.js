$(document).ready(function () {
	$(".alert.alert-success").hide();
	$(".alert.alert-danger").hide();
    var token = getQueryVariable("token");

    if(token != "") {
        getMonitoringServerUrl(function (url) {
            socket = io.connect(url + "?user=admin_password");
            socket.on('connect', function () {
                socket.emit('validToken', token, function (mail) {
                    if(typeof mail == 'undefined') {
						$(".alert.alert-danger").show();
						$(".changePassword").hide();
					}
                    else {
						$(".alert.alert-danger").hide();
                        $(".mail").html(mail);

                        $(".go").click(function() {
							var p1 = $(".password1");
							var p2 = $(".password2");

							if(p1.val() == "" || p1.val() != p2.val()) {
								p1.parent().addClass("has-error");
								p2.parent().addClass("has-error");
							}
							else {
								p1.parent().removeClass("has-error");
								p2.parent().removeClass("has-error");

								socket.emit('changePassword', token, mail, p1.val(), function (ok) {
									if(ok) {
										$(".changePassword").hide();
										$(".alert.alert-success").show();
									}
								})
							}
						})
                    }
                });
            });
        });
    }
    else {
		$(".alert.alert-danger").show();
		$(".changePassword").hide();
	}
});

function getMonitoringServerUrl(func) {
    $.getJSON('./infos.json', function (infos) {
        func('http://' + infos.link_io_server_monitoring.host + ':' + infos.link_io_server_monitoring.port);
    });
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return "";
}