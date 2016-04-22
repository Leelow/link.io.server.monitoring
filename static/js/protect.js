var user = Cookies.getJSON('user');
if(user == null || typeof user == 'undefined')
    window.location = "index.html";
else {
    $(document).ready(function() {
        if(user.api_role.name == "Developer")
            $("#main-nav a[href='db.html']").remove();
        $(".name").html(user.fname + " " + user.name);
        $(".disconnect").click(function() {
            Cookies.remove('user');
            window.location = "index.html";
        });
    });
}