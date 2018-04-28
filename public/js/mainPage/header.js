const GRAVATAR_URL = "//www.gravatar.com/avatar/";
const DEFAULT_IMG_URL = "//a0.muscache.com/im/pictures/87d6d531-78e2-43d5-9ccc-6a34aeba880f.jpg?aki_policy=x_medium";

// display current time
setInterval(function(){
    document.getElementById('clock').innerHTML = new Date().toLocaleTimeString();
}, 1000);

// display user pseudo
$('#pseudo').text(sessionStorage.pseudo);

// change profile picture to gravatar
function setPP(pseudo){
    $.ajax({
        type: 'POST',
        url: '/users/email',
        data: { username: pseudo },
        error: function(){
            console.log("Request Failed, cannot use gravatar PP");
        },
        success: function(response){
            $(document).ready(function(){
                let picture_url = GRAVATAR_URL + md5(response["pp"]) + "?d=" + DEFAULT_IMG_URL;
                $('#profilePicture').attr("src", picture_url);
            });
        }
    });
}
setPP(sessionStorage.pseudo);

$('#disconnect').on('click', function(){
    $.ajax({
        type: 'POST',
        url: '/connection/logout',
        data: { username: sessionStorage.pseudo },
        error: function(){
           alert("Request Failed");
        },
        success: function(response){
            window.location = '/connection';
        }
    });
});
