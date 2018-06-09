
function turnOnPath(color){
    $('.header2 > div').css('border-color', color);
    $('.header3 > div').css('border-color', color);
}

function displayPanelWithoutAnimation(parent, panel, height, width){
    parent.children().css("display", "none");
    panel.css("display", "block");
    parent.css('height', height);
    parent.css('width', width);
}

$('#Game').on('click', function(){
    $('#gameTab').css('display', 'block');
    displayPanelWithoutAnimation($('#gameTab'), $('#gameTab .tabContent'), '100%', '100%');
    $('#historicTab').css('display', 'none');
    $('#editorTab').css('display', 'none');
    $('#accountTab').css('display', 'none');
    turnOnPath($('#Game').css('color'));
});

$('#Historic').on('click', function(){
    $('#historicTab').css('display', 'block');
    displayPanelWithoutAnimation($('#historicTab'), $('#historicTab .tabContent'), '100%', '100%');
    $('#gameTab').css('display', 'none');
    $('#editorTab').css('display', 'none');
    $('#accountTab').css('display', 'none');
    turnOnPath($('#Historic').css('color'));
});

$('#Editor').on('click', function(){
    $('#editorTab').css('display', 'block');
    displayPanelWithoutAnimation($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
    $('#gameTab').css('display', 'none');
    $('#historicTab').css('display', 'none');
    $('#accountTab').css('display', 'none');
    turnOnPath($('#Editor').css('color'));
});

$('#Account').on('click', function(){
    $('#accountTab').css('display', 'block');
    displayPanelWithoutAnimation($('#accountTab'), $('#accountTab .tabContent'), '80%', '30%');
    $('#gameTab').css('display', 'none');
    $('#editorTab').css('display', 'none');
    $('#historicTab').css('display', 'none');
    turnOnPath($('#Account').css('color'));
});
