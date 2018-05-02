var $reset_form = $('.reset');
var $reset_password = $('.reset input[name="password"]');
var $reset_confirm = $('.reset input[name="confirm"]');
var $recaptcha = $('.g-recaptcha');
var token = window.location.href.toString();  // retrieve the token from url
token = token.split("/");
token = token[token.length - 1];
console.log(token);

$($reset_form).on("submit", function(evt){
    evt.preventDefault();  // FIXME
    if($reset_password.val() !== $reset_confirm.val()){
        alert("both field must be equal");
    } else if($reset_form[0].checkValidity()){
        $.ajax({
            type: 'POST',
            url: '/connection/setPassword',
            timeout: 5000,
            data: {
                password: md5($reset_password.val()),
                token: token,
                recaptcha: grecaptcha.getResponse()
            },
            error: function(err){
                console.log(err);
                alert("Request Failed : " + err);
            },
            success: function(response){
                console.log("succes");
                console.log(response);
            }
        });
    }else{
        console.log("ERR");
    }
});