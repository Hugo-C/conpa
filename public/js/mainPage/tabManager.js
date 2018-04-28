
function turnOnPath(color){
   $('.header2 > div').css('border-color', color);
   $('.header3 > div').css('border-color', color);
}

$('#Game').on('click', function(){
    $('#gameTab').css('display', 'block');
    $('#historicTab').css('display', 'none');
    $('#editorTab').css('display', 'none');
    turnOnPath($('#Game').css('color'));
});

$('#Historic').on('click', function(){
    $('#historicTab').css('display', 'block');
    $('#gameTab').css('display', 'none');
    $('#editorTab').css('display', 'none');
    turnOnPath($('#Historic').css('color'));
});

$('#Editor').on('click', function(){
    $('#editorTab').css('display', 'block');
    $('#gameTab').css('display', 'none');
    $('#historicTab').css('display', 'none');
    turnOnPath($('#Editor').css('color'));
});
