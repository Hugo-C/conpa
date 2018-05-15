const register_form = $('.register');
const register_username = $('.register input[name="username"]');
const register_email = $('.register input[name="email"]');
const register_password = $('.register input[name="password"]');
const login_form = $('.login');
const login_username = $('.login input[name="username"]');
const login_password = $('.login input[name="password"]');
const reset_email = $('.forgot_password input[name="email"]');

function clearInput(type){
    let myInputs = $('input[type="' + type + '"]');
    for(let index = 0; index < myInputs.length; index++){
        myInputs[index].value = ''; // reset input(type="email") content
    }
}

function removeAllAlerts() {
    $('.error_username').text('');
    $('.error_email').text('');
    $('.error_login').text('');
}

function clearAllInput(){
    $('.myTooltip').css('display', 'none');
    $('.invalid').removeClass('invalid');
    clearInput('text');
    clearInput('email');
    clearInput('password');
}

function showInvalidRegisterFields(){
    if(!register_username[0].checkValidity()){
        register_username.addClass('invalid');
    }
    if(!register_email[0].checkValidity()){
        register_email.addClass('invalid');
    }
    if(!register_password[0].checkValidity()){
        register_password.addClass('invalid');
    }
}

function processRegisterAnswer(response){
    removeAllAlerts();
    switch (response) {
        case 'DUP_PSEUDO':
            $('.error_username').text($.i18n("pseudoAlert"));
            break;
        case 'DUP_EMAIL':
            $('.error_email').text($.i18n("emailAlert"));
            break;
        case 'OK':
            $('.register .linkform').click(); // redirection to the login form
            alert($.i18n("registrationSuccessful"));
            break;
    }
}

$('input[value="Register"]').on('click', function(){
    if(register_form[0].checkValidity()){
        $.ajax({
            type: 'POST',
            url: '/connection/register',
            data: { username: register_username.val(),
                    email: register_email.val(),
                    password: md5(register_password.val())},
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
    if(!login_username[0].checkValidity()){
        login_username.addClass('invalid');
    }
    if(!login_password[0].checkValidity()){
        login_password.addClass('invalid');
    }
}

function processLoginAnswer(response){
    removeAllAlerts();
    switch (response) {
        case 'NO_ACCOUNT':
            $('.error_login').text($.i18n("noAccountAlert"));
            break;
        case 'MISMATCH':
            $('.error_login').text($.i18n("loginAlert"));
            break;
        case 'ALREADY_CONNECT':
            $('.error_login').text($.i18n("alreadyConnectedAlert"));
            break;
        case 'OK':
            sessionStorage.pseudo = login_username.val();
            console.log(sessionStorage.pseudo);
            window.location = '/';
            break;
    }
}

$('input[value="Login"]').on('click', function(){
    if(login_form[0].checkValidity()){
        $.ajax({
            type: 'POST',
            url: '/connection/login',
            data: { username: login_username.val(),
                    password: md5(login_password.val())},
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

$('form.register input').on('keyup', function(){
    if($(this)[0].checkValidity() || $(this)[0].value === ''){
        $($(this)['context']['nextSibling']).css('display', 'none');
    }else{
        $($(this)['context']['nextSibling']).css('display', 'inline-block');
    }
});

$('input[value="Send reminder"]').on('click', function(){
    $.ajax({
        type: 'POST',
        url: '/connection/resetPassword',
        data: { email: reset_email.val() },
        error: function(){
            console.log("Request Failed, try reloading the page to reset your password");
        },
        success: function(){
            alert($.i18n("checkMailBox"));
        }
    });
});
