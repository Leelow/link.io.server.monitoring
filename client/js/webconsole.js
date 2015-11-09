var eventsPerSecondConfig = {
	datas: {
		labels: [],
		datasets: [
			{
				fillColor: "rgba(101, 163, 63, 0.2)",
				strokeColor: "rgb(101, 163, 63)",
				pointColor: "rgba(0, 0, 0, 0)",
				pointStrokeColor: "rgba(0, 0, 0, 0)",
				pointHighlightFill: "rgba(0, 0, 0, 0)",
				pointHighlightStroke: "rgba(0, 0, 0, 0)",
				data: []
			},
			{
				fillColor: "rgba(230, 126, 34, 0.2)",
				strokeColor: "rgba(230, 126, 34,1.0)",
				pointColor: "rgba(0, 0, 0, 0)",
				pointStrokeColor: "rgba(0, 0, 0, 0)",
				pointHighlightFill: "rgba(0, 0, 0, 0)",
				pointHighlightStroke: "rgba(0, 0, 0, 0)",
				data: []
			}
		]
	},
	maxValues: 30, //30 secondes
	chart: undefined
};
var maxEventToKeep = 100;
var currentEventID = 0;
var currentSizeofEvents = 0;


Chart.defaults.global.scaleFontColor = "#fff";

function webConsole(socket, showLoading) {
	
	// If we want to show loading form
	if(showLoading) {
	
		// When the web console is loading
		loading(function() {
			
			whileLoading(socket);
		
		});
	
	} else {
		
		whileLoading(socket);
		
	}
	
	// Logout button
	$('.btn.logout').click(function() {
		Cookies.remove('credentials');
		window.location.href = '/';
	});
	
	// Restart button
	$('.btn.restart').click(function() {
		socket.emit('restart', true);
	});

	// Clear button
	$('.btn.clear').click(function() {
		$('#log-output').html('');
		$('#log-event').html('');
	});

	$("#eventsCanvas").attr("width", $("#eventsChart .wrapper").width());

	var ctx = document.getElementById("eventsCanvas").getContext("2d");
	eventsPerSecondConfig.chart = new Chart(ctx).Line(eventsPerSecondConfig.datas, {
		animationSteps: 15,
		scaleUse2Y: true
	});
}


function whileLoading(socket) {
	
	// Hide the login form
	hideLoginForm();
	
	// Prepare web console displaying
	$('#webconsole').show();
	
	// Update the page title
	updateTitle();

	// On olg logs receiving
	socket.on('getOldLogs', function (oldLogs) {

		var logs_array = oldLogs.split('\n');
		for(var i = 0; i < logs_array.length; i++){
			addLog('old', logs_array[i], false);
		}
	});

	// When the server state changed
	socket.on('serverState', function (serverState) {
		updateServerState(serverState);
	});
	
	// Indicate to the server that user can load some things
	socket.emit('retrieveData');
	
	// When the server emit an output
	socket.on('message', function (msg) {
		
		// Test if it's an event or an output (the type)
		var arr = msg.text.split(' ');
		var res = arr.slice(0, 2);
		var type = res[0];
		var level = res[1];

		if(type == 'INFO')
			addLog(msg.type, msg.text, true, true, false);
		else if(type == 'EVENT')
			addEvent(arr.slice(1)[0]);
		else if(type == 'MONITORING' && level == 'EVENTS_PER_SECOND')
			addEventsPerSecond(arr[2]);
		else
			addLog(msg.type, msg.text, true, true, false);
	});
	
}

function convertToLog(str, full, ms) {
	return getDatePrefix(full, ms) + ' ' + str;
}

function getDatePrefix(full, ms) {

	var d = new Date();
	var date_str = '[';
	if(full)
		date_str +=           d.getFullYear()      + '-' +
				    minDigits(d.getMonth() + 1, 2) + '-' +
				    minDigits(d.getDate(), 2)      + ' ';
	
	date_str += minDigits(d.getHours(), 2)   + ':' +
				minDigits(d.getMinutes(), 2) + ':' +
				minDigits(d.getSeconds(), 2);
	
	if(ms)
		date_str += ':' + minDigits(d.getMilliseconds(), 3);
						
	return date_str + ']';
	
}{}

function addLog(type, str, printDate, full, ms) {

		var logOutput = $('#log-output');
		var children = logOutput.children();

		var log = (printDate ? convertToLog(str, full, ms) : str);

		if (children.size() == 0)
			logOutput.append("<div class='cmd " + type + "'>" + log + "</div>");
		else
			children.first().before("<div class='cmd " + type + "'>" + log + "</div>");
	
}

function addEvent(event_str) {
	// Compute an unique id
	var id = 'json-renderer-' + (currentEventID++);

	//Loop
	currentEventID = currentEventID % maxEventToKeep;

	//Remove existing event (loop)
	$("#" + id).remove();
	
	// Add a new json renderer
	var logEvent = $('#log-event');

	logEvent.prepend('<pre id="' + id + '"></pre>');

	// Get the renderer
	var jsonRenderer = $('#' + id);
	
	// Deserialize data
	var event = JSON.parse(event_str);
	var eventSize = event_str.length;
	currentSizeofEvents += eventSize;

	// Set the name
	var prefix = getDatePrefix(false, true) + ' ' + event.type + ' (' + humanFileSize(eventSize, true) + ')';
	
	// Put data in the renderer
	jsonRenderer.jsonViewer(event);

	// Collaspe all elements
	var first = false;
	jsonRenderer.find('a.json-toggle').map(function(i, jsonToggle) {
		$(jsonToggle).addClass('collapsed');
	});
	jsonRenderer.find('ul.json-dict').map(function(i, jsonDict) {
		$(jsonDict).hide();
		var str = $(jsonDict).children().size() + ' items';
		$(jsonDict).after('<a href="" class="json-placeholder">' + str + '</a>');
	});
	jsonRenderer.find('ol.json-array').map(function(i, jsonDict) {
		$(jsonDict).hide();
		var str = $(jsonDict).children().size() + ' items';
		$(jsonDict).after('<a href="" class="json-placeholder">' + str + '</a>');
	});
	
	// Add the prefix to the renderer
	jsonRenderer.find('a.json-toggle').first().text(prefix + ' ');
	
	// Bind a new event to show the name when the renderer is collaspe manually
	var isCollapsed = true;
	jsonRenderer.find('a.json-toggle').first().click(function() {
		isCollapsed = !isCollapsed;
	});
}

function addEventsPerSecond(nb) {

	var now = new Date();
	eventsPerSecondConfig.chart.addData([nb, currentSizeofEvents / 1000], now.getHours() + ':' + now.getMinutes() + ":" + (now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds()));

	if(now.getSeconds()%5 != 0)
		eventsPerSecondConfig.chart.scale.xLabels[eventsPerSecondConfig.chart.scale.xLabels.length - 1] = "";

	if(eventsPerSecondConfig.chart.scale.xLabels.length > eventsPerSecondConfig.maxValues)
		eventsPerSecondConfig.chart.removeData();

	currentSizeofEvents = 0;
}

function updateServerState(active) {

	// Update toolbar color and buttons states
	if (active) {
		$('#toolbar').css('background', '#65A33F');
		$('.btn.restart').attr("disabled", true);
	} else {
		$('#toolbar').css('background', '#D23339');
		$('.btn.restart').attr("disabled", false);
	}

}

function updateTitle() {
	
	$.getJSON('./infos.json', function(infos) {			
		document.title = 'Link.IO monitoring console (v' + infos.link_io_server_monitoring.version + ')';
		$('#toolbar span.title').text('Link.IO monitoring console (v' + infos.link_io_server_monitoring.version + ')');
	});

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


function getMonitoringServerUrl(func) {

	$.getJSON('./infos.json', function(infos) {
		func('http://' + infos.link_io_server_monitoring.host + ':' +infos.link_io_server_monitoring.port);
	});

}

function sizeof( object ) {

	var objectList = [];
	var stack = [ object ];
	var bytes = 0;

	while ( stack.length ) {
		var value = stack.pop();

		if ( typeof value === 'boolean' ) {
			bytes += 4;
		}
		else if ( typeof value === 'string' ) {
			bytes += value.length;
		}
		else if ( typeof value === 'number' ) {
			bytes += 8;
		}
		else if
		(
			typeof value === 'object'
			&& objectList.indexOf( value ) === -1
		)
		{
			objectList.push( value );

			for( var i in value ) {
				stack.push( value[ i ] );
			}
		}
	}
	return bytes;
}

function humanFileSize(bytes, si) {
	var thresh = si ? 1000 : 1024;
	if(Math.abs(bytes) < thresh) {
		return bytes + ' o';
	}
	var units = si
		? ['Ko','Mo','Go','To','Po','Eo','Zo','Yo']
		: ['Kio','Mio','Gio','Tio','Pio','Eio','Zio','Yio'];
	var u = -1;
	do {
		bytes /= thresh;
		++u;
	} while(Math.abs(bytes) >= thresh && u < units.length - 1);
	return bytes.toFixed(1)+' '+units[u];
}
