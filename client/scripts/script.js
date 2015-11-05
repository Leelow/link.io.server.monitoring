$( document ).ready(function() {

	var socket = io.connect('http://localhost:8081');

	// On connection
	socket.on('connect', function () {
		socket.emit('getState', null, function (serverState) {

			updateServerState(!serverState.isCrashed);

		});
	});

	// On olg logs receiving
	socket.on('oldLogs', function (data) {
		var logs_array = data.oldLogs.split('\n');
		for(var i = 0; i < logs_array.length; i++){
			addLog(null, 'old', logs_array[i], false); //TODo timestamp
		}
	});

	// When the server crashed
	socket.on('isCrashed', function () {
		updateServerState(false);
	});

	// When the server is started
	socket.on('isStarted', function () {
		updateServerState(true);
	});

	// When the server emit an output
	socket.on('message', function (msg) {
		console.log(msg);
		addLog(msg.ts, msg.type, msg.text, true); //TODo timestamp
	});

	// Restart button
	$('#restart').click(function() {
		socket.emit('start', true);
	});

	// Clear button
	$('#clear').click(function() {
		$('#log').html('');
	});

});

function convertToLog(ts, type, str, printDate) {

	var date_str = '';
	if(printDate) {

		var d = new Date(ts * 1000);
		var date_str = '[' + d.getFullYear()                                         + '-' +
						   ((d.getMonth() + 1) < 10 ? '0' : '') + (d.getMonth() + 1) + '-' +
						    (d.getDate()       < 10 ? '0' : '') + d.getDate()        + ' ' +
						    (d.getHours()      < 10 ? '0' : '') + d.getHours()       + ':' +
							(d.getMinutes()    < 10 ? '0' : '') + d.getMinutes()     + ':' +
							(d.getSeconds()    < 10 ? '0' : '') + d.getSeconds()     + ' ]';

	}

	type='';
	return date_str + str;
}

function addLog(ts, type, str, printDate) {

	$('#log').append("<div class='cmd " + type + "'>" + convertToLog(ts, type, str, printDate) + "</div>");
	
	// Scroll to the bottom of the window if necessary
	window.scrollTo(0,document.body.scrollHeight);
	
}

function updateServerState(active) {

	if (active) {
		$('#toolbar').css('background', '#65A33F');
		$('#restart').attr("disabled", true);
	} else {
		$('#toolbar').css('background', '#D23339');
		$('#restart').attr("disabled", false);
	}
}
