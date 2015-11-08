function login(validate) {
	
    var user = {},
        flg = {};
	
    init();
	
	// Flag name if it's autocomplete by the browser
	function checkAutocompletion() {
		var len = $('#name').val().length;
		if (len > 13 || len == 0) {
			blsp();
			flg.name = 1
		} else {
			flg.name = 0;
			user.name = $('#name').val();
			tcheck()
		}
	}
	checkAutocompletion();
	
    $('.upload').click(function () {
        if (flg.upd == 0) {
            upd('upload');
            flg.upd = 1
        } else {
            upd('');
            flg.upd = 0
        }
    });
    $('#login').click(function () {
        initub();
        $('#logmsk').fadeIn();
        ub(0)
    });
    $('#logint').click(function () {
        initub();
        if (flg.logt == 0) {
            ub(1);
            flg.logt = 1
        } else {
            ub(0);
            flg.logt = 0
        }
    });
    $("#name").keyup(function () {
        var len = $('#name').val().length;
        if (len > 13 || len == 0) {
            blsp();
            flg.name = 1
        } else {
            flg.name = 0;
			user.name = $('#name').val();
            tcheck()
        }
    });
    $("#pass").keyup(function () {
        var len = $('#pass').val().length;
        if (len > 10 || len == 0) {
            blsp();
            flg.pass = 1
        } else {
            flg.pass = 0;
			user.pass = $('#pass').val();
            tcheck()
        }
    });

    function tcheck() {
        if (flg.name == 0 && flg.pass == 0) {
            $('#signupb').css('opacity', '1').css('cursor', 'pointer')
        } else {
            blsp()
        }
    }
	
	function validation() {
        if (flg.name == 0 && flg.pass == 0) {
            $('#sumsk').fadeIn();
            $('#name, #pass, #logint, #nameal, #passal, #signupb').css('opacity', '0.2');
			//console.log('click');
			$('#signupb').css('opacity', '0.2')
			
			// Validation function
			if(typeof validate === 'function')
				validate(user.name, user.pass);
			
        }
	}
	
	$('#name, #pass').keypress(function (e) {
	  if (e.which == 13) {
		validation();
	  }
	});
	
    $('#signupb').click(function () {
		validation();
    });
    $('#close').click(function () {
        init();
        initub();
        $('#close').hide()
    });

    function init() {
        flg.logt = 0		
    }

    function initub() {
        flg.name = -1;
        flg.pass = -1;
        $('#sumsk').hide();
        $('#nameal').hide();
        $('#passal').hide();
        $('#name, #pass, #logint, #nameal, #passal, #signupb').css('opacity', '1');
        $('#signupb').css('opacity', '0.2').css('cursor', 'default');
        $('#name, #pass').val('');
    }

    function upd(button) {
        location.hash = button;
        if (flg.upd == 0) {
            $('#drop').fadeIn();
        } else {
            $('#drop').fadeOut();
        }
    }

    function ub(flg) {
        if (flg == 0) {
            $('#signupb').text('Sign up');
            $('#logint').text('Login as an existing user');
        } else {
            $('#signupb').text('Login');
            $('#logint').text('Sign up as a new user');
        }
    }

    function blsp() {
        $('#signupb').css('opacity', '0.2').css('cursor', 'default');
    }
}

function reactiveLoginForm() {
	
	// Display error message
	$('#sumsk').text('Bad credentials');
	
	// Re-active login form
	setTimeout(function() {
		$('#sumsk').fadeOut({queue: false, duration: 750});
		$('#name, #pass, #signupb').animate({opacity:1}, {queue: false, duration: 500});
		$('#signupb').css('cursor', 'pointer');
	}, 1000);
	
}

function hideLoginForm() {
	$('#logmsk').remove();
}