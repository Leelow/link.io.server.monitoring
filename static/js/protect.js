var user = Cookies.getJSON('user');
if(user == null || typeof user == 'undefined')
    window.location = "index.html";
else {
    $(document).ready(function() {
        $(".name").html(user.fname + " " + user.name);
        $(".disconnect").click(function() {
            Cookies.remove('user');
            window.location = "index.html";
        });
    });
}