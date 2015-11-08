$(document).ready(function() {

	var url;
	var socket;
	
	var credentialsCookie = Cookies.get('credentials');
	var areCredentialsCookieGood = false;
	var areCredentialsCookieChecked = false;
	
	// Loading page
	loading(function() {
		
		// Get server url
		getMonitoringServerUrl(function(urlMonitoringServer) {
			
			// Get server url
			url = urlMonitoringServer;
			
			// If credentials are stored in a cookie (= login in the past)
			if(credentialsCookie != undefined) {
						
				var credentials = JSON.parse(credentialsCookie)

				// Connect to the server
				socket = io.connect(url);
				socket.on('connect', function () {
						
					socket.on('resCheckCredentials', function(res) {

						socket.removeListener('resCheckCredentials');
											
						if(!areCredentialsCookieChecked) {
							
							areCredentialsCookieChecked = true;
							areCredentialsCookieGood = res;
							if(areCredentialsCookieGood)
								webConsole(socket, false);
						
						}
						
					});
					
					// Check login and password
					socket.emit('checkCredentials', {login: credentials.login, password:credentials.password});
			
				});
			
			} else {
				
				socket = io.connect(url);
				
			}
			
		});
		
	}, function() {
			
		// If cookies credentials are wrong or don't exist	
		if(credentialsCookie == undefined || !areCredentialsCookieGood) {
				
			var isAuth = false;
			
			// Checking response
			socket.on('resCheckCredentials', function(res) {

				// To avoid twice activation
				if(!isAuth) {
				
					// If authentification success
					if(res) {
						
						// We are now authentificated
						isAuth = true;
												
						// Load web console
						webConsole(socket, true);
						
					} else {
						
						// Re-active login form
						reactiveLoginForm();
						
						// Wait for login validation again
						login(function(login, password) {

							// Save credentials in a cookie for a next time
							Cookies.set('credentials', JSON.stringify({'login': login, 'password':password}));
							
							// Check login and password
							socket.emit('checkCredentials', {'login': login, 'password':password});
							
						});
						
					}
				
				}
					
			});		
			
			// After user validation
			login(function(login, password) {

				// Save credentials in a cookie for a next time
				Cookies.set('credentials', JSON.stringify({'login': login, 'password':password}));
				
				// Check login and password
				socket.emit('checkCredentials', {'login': login, 'password':password});
				
			});
		
		}
			
	});
		
});

function stringifyCyclicObject(obj) {
	
	seen = [];
	
	return JSON.stringify(obj, function(key, val) {
	   if (val != null && typeof val == "object") {
			if (seen.indexOf(val) >= 0) {
				return;
			}
			seen.push(val);
		}
		return val;
	});
	
};
