function loading(during, callback) {
	
	// Add loading overlay and anim
	$('body').append('<div id="loading-overlay"></div>');
	$('#loading-overlay').append('<div id="loading-div">');
	$('#loading-div').append('<video id="anim" width="355" height="200" preload="auto" ><source src="./img/anim.mp4" type="video/mp4" /></video>');


	// Fadein logo
	$('#loading-div').fadeIn('750', function() {

		$('#anim').get(0).play();
		
		// Before action
		if(typeof during === 'function')
			during();
		
		// Fadeout overlay
		setTimeout(function() {
			$('#loading-div').fadeOut('750');
			$('#loading-overlay').fadeOut('750', function() {
				$('#loading-overlay').remove();
				
				// Callback
				if(typeof callback === 'function')
					callback();
			});
		}, 1500);
		
	});
	
}