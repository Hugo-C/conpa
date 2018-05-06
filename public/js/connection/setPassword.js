var $reset_form = $('.reset');
var $reset_password = $('.reset input[name="password"]');
var $reset_confirm = $('.reset input[name="confirm"]');
var $error_mismatch = $('.reset .error_mismatch');
var $recaptcha = $('.g-recaptcha');
var token = window.location.href.toString();  // retrieve the token from url
token = token.split("/");
token = token[token.length - 1];
console.log(token);

$($reset_form).on("submit", function(evt){
    evt.preventDefault();  // FIXME
    if($reset_password.val() !== $reset_confirm.val()){
        $error_mismatch.text("both field must be equal");
    } else if($reset_form[0].checkValidity()){
        $.ajax({
            type: 'POST',
            url: '/connection/setPassword',
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
                window.location = '/connection';
            }
        });
    }else{
        console.log("ERR");
    }
});

$('form.reset input').on('keyup', function(evt){
    if($(this)[0].checkValidity() || $(this)[0].value == ''){
        $($(this)[0]['nextSibling']).css('display', 'none');
    }else{
        $($(this)[0]['nextSibling']).css('display', 'inline-block');
    }
});
