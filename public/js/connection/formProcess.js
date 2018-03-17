var $register_form = $('.register');
var $register_username = $('.register > div > input[name="username"]');
var $register_email = $('.register > div > input[name="email"]');
var $register_password = $('.register > div > input[name="password"]');

var $login_form = $('.login');
var $login_username = $('.login > div > input[name="username"]');
var $login_password = $('.login > div > input[name="password"]');

function showInvalidRegisterFields(){
    if(!$register_username[0].checkValidity()){
        $register_username.addClass('invalid');
    }
    if(!$register_email[0].checkValidity()){
        $register_email.addClass('invalid');
    }
    if(!$register_password[0].checkValidity()){
        $register_password.addClass('invalid');
    }
}

function processRegisterAnswer(response){
    switch (response) {
      case 'DUP_PSEUDO':
        $('.error_username').text('pseudo not available');
        break;
      case 'DUP_EMAIL':
        $('.error_email').text('email already used');
        break;
      case 'OK':
        $('.register > div > .linkform').click();
        alert('registration successful');
        break;
    }
}

$('input[value="Register"]').on('click', function(){
    if($register_form[0].checkValidity()){
        $.ajax({
            type: 'POST',
            url: '/connection/register',
            data: { username: $register_username.val(),
                    email: $register_email.val(),
                    password: md5($register_password.val())},
            error: function(){
               alert("Request Failed");
            },
            success: function(response){
                console.log(response);
                processRegisterAnswer(response);
            }
        });
    }else{
      showInvalidRegisterFields();
    }
});

function showInvalidLoginFields(){
    if(!$login_username[0].checkValidity()){
        $login_username.addClass('invalid');
    }
    if(!$login_password[0].checkValidity()){
        $login_password.addClass('invalid');
    }
}

function processLoginAnswer(response){
    switch (response) {
      case 'NO_ACCOUNT':
          $('.error_login').text('No account');
          break;
      case 'MISMATCH':
          $('.error_login').text('pseudo / password mismatched');
          break;
      case 'ALREADY_CONNECT':
          $('.error_login').text('You are already connected');
          break;
      case 'OK':
          sessionStorage.pseudo = $login_username.val();
          console.log(sessionStorage.pseudo);
          window.location = '/';
          break;
    }
}

$('input[value="Login"]').on('click', function(){
    if($login_form[0].checkValidity()){
        $.ajax({
            type: 'POST',
            url: '/connection/login',
            data: { username: $login_username.val(),
                    password: md5($login_password.val())},
            error: function(){
               alert("Request Failed");
            },
            success: function(response){
                console.log(response);
                processLoginAnswer(response);
            }
        });
    }else{
      showInvalidLoginFields();
    }
});
