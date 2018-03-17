// display current time
setInterval(function(){
    document.getElementById('clock').innerHTML = new Date().toLocaleTimeString();
}, 1000);

// display user pseudo
$('#pseudo').text(sessionStorage.pseudo);

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
