//the form wrapper (includes all forms)
var $form_wrapper	= $('#form_wrapper');
//the current form is the one with class "active"
var $currentForm	= $form_wrapper.children('form.active');
//the switch form links
var $linkform	 = $form_wrapper.find('.linkform');

//move to another form on click (with animation)
$linkform.bind('click',function(e){
    let $link = $(this);
    let $target = $link.attr('rel');

    $currentForm.css("display", "none");
    $form_wrapper.children('form.' + $target).animate({"display": "block"}, 1000, function () {
        $form_wrapper.children('form.' + $target).css("display", "block");
    });

    switch ($target) {
        case 'register':
            $form_wrapper.css('width', '23%');
            $form_wrapper.css('height', '55%');
            break;
        case 'login':
            $form_wrapper.css('width', '20%');
            $form_wrapper.css('height', '50%');
            break;
        case 'forgot_password':
            $form_wrapper.css('width', '23%');
            $form_wrapper.css('height', '35%');
            break;
    }
    $currentForm = $form_wrapper.children('form.' + $target);
    clearAllInput();
    e.preventDefault();
});

$form_wrapper.find('input[type="submit"]').click(function(e){
  	e.preventDefault();
});
