$(document).ready(function() {

	var url;
	var socket;

	// Loading page
		
	// Get server url
	getMonitoringServerUrl(function(urlMonitoringServer) {

		// Get server url
		url = urlMonitoringServer;

			// Connect to the server
			socket = io.connect(url + "?user=monitoring");
			socket.on('connect', function () {
				webConsole(socket);
			});
	});
		
});