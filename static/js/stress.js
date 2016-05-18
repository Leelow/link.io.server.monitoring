var user = Cookies.getJSON('user');
if(user == null || typeof user == 'undefined')
	window.location = "index.html";

var logContainer;

$(document).ready(function() {
	logContainer = $(".log");
	$(".go").click(function() {
		linkIO.connect("http://localhost:8080", "bastien.baret@insa-rennes.fr", "123", "YvSGLCu54NQmXOl80lIJ", function() {
			log("connected");
			linkIO.joinRoom("stress", function() {
				log("joined room 'stress'");
				log("Sending 10,000 events...");

				var nbReceived = 0;
				linkIO.on("stress", function() {
					nbReceived++;
					if(nbReceived == 10000) {
						log("Done. Total time: " + (new Date().getTime() - from.getTime()) + "ms");
					}
				})

				var from = new Date();
				for(var i = 0; i<10000; i++)
					linkIO.emit("stress", 42, true);
			})
		});
	});
});

function log(message) {
	logContainer.html(logContainer.html() +
		"<br/>" +
		getDatePrefix(true) +
		" " + message);
}

function getDatePrefix(ms) {
	var d = new Date();
	var date_str = '[' + d.getFullYear()                                         + '-' +
		((d.getMonth() + 1) < 10 ? '0' : '') + (d.getMonth() + 1) + '-' +
		(d.getDate()       < 10 ? '0' : '') + d.getDate()        + ' ' +
		(d.getHours()      < 10 ? '0' : '') + d.getHours()       + ':' +
		(d.getMinutes()    < 10 ? '0' : '') + d.getMinutes()     + ':' +
		(d.getSeconds()    < 10 ? '0' : '') + d.getSeconds()     +
		(ms ? ':' + minDigits(d.getMilliseconds(), 3) : '') + ']';
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