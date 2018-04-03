/**
 * Executes command on text editor like textarea
 *
 * @param {string} cmd : command to execute
 */
function execNotesAreaCommand(cmd){
    document.getElementById("notesArea").select();
    document.execCommand(cmd);
}

$("#clear").on("click", function(){
    execNotesAreaCommand("delete");
});

$("#copy").on("click", function(){
    execNotesAreaCommand("copy");
});

$("#undo").on("click", function(){
    execNotesAreaCommand("undo");
});

// Displays or hides productions selector bar
$("#displayList").on("click", function(){
    var productionList = $("#gamePanel > :nth-child(2) > :first-child");
    var productionArea = $("#gamePanel > :nth-child(2) > :last-child");
    var displayButton = $("#displayList");
    if(productionList.css('display') == 'none'){ // if tool bar is hidden, we display it
        productionList.css('display', 'block');
        productionArea.css('width', '');
        displayButton.css('background-image', 'url("/img/gamerModule/hide.svg")');
    }else{ // if tool bar is displayed, we hide it
        productionList.css('display', 'none');
        productionArea.css('width', '100%');
        displayButton.css('background-image', 'url("/img/gamerModule/display.svg")');
    }
});

$("#setPrivacy").on("click", function(){
    var button = $("button#setPrivacy");
    if(button.css('background-image').match(/.*\/img\/gamerModule\/private\.svg.*/)){
        button.css('background-image', 'url("/img/gamerModule/public.svg")');
    }else{
        button.css('background-image', 'url("/img/gamerModule/private.svg")');
    }
});

// remove default text when user wants to enter text
$("#notesArea").on("focus", function(){
    var value = $("textarea#notesArea").val();
    if(value.match(/^Write your notes here !/)){
        execNotesAreaCommand("delete");
    }
});

// displays default text if the area is empty and has not the focus
$("#notesArea").focusout(function(){
    var value = $("textarea#notesArea").val();
    var value = $.trim(value);
    if(value == ""){
        $("textarea#notesArea").val("Write your notes here !");
    }
});

// remove default text when user wants to enter text
$("#inputBox").on("focus", function(){
    var value = $("input#inputBox").val();
    if(value.match(/^Write your message here !/)){
        $("input#inputBox").val("");
    }
});

// displays default text if the area is empty and has not the focus
$("#inputBox").focusout(function(){
    var value = $("input#inputBox").val();
    var value = $.trim(value);
    if(value === ""){
        $("input#inputBox").val("Write your message here !");
    }
});

$("#color").on("click", function(){
    $("#svgMenu").css('display', 'none');
    $("#colorMenu").css('display', 'block');
});

$("#colorMenu button").on("click", function(){
    var selectedColor = $(this).val();
    $("#colorMenu").css('display', 'none');
    $("#svgMenu").css('display', 'block');
    $("#color").val(selectedColor);
    $("#color").css('background-color', 'url("/img/gamerModule/' + selectedColor + '.jpg")');
});

$("#moveElement").on("click", function(){
    var moveImage = "/img/gamerModule/move.png";
    var movingImage = "/img/gamerModule/moving.png";
    if($(this).hasClass("selected")){
        $(this).removeClass("selected");
        $(this).css('background-image', 'url(' + moveImage + ')');
    }else{
        $(this).addClass("selected");
        $(this).css('background-image', 'url(' + movingImage + ')');
    }
})

function fullscreenProduction(){
    $('#chatInfos').css('display', 'none');
    $('#displayList').css('display', 'none');
    $('#gamePanel > :nth-child(2)').css('height', '95%');
    $('#productionList').css('display', 'none');
    $('#productionArea').css('height', '100%');
    $('#productionArea').css('width', '100%');
    $('#production').css('width', '93%');
}

function exitFullscreenProduction(){
    $('#chatInfos').css('display', 'block');
    $('#displayList').css('display', 'block');
    $('#gamePanel > :nth-child(2)').css('height', '');
    $('#productionList').css('display', 'block');
    $('#productionArea').css('height', '');
    $('#productionArea').css('width', '');
    $('#production').css('width', '92%');
}

$("#fullScreen").on("click", function(){
    var fullscreen = "/img/gamerModule/fullscreen.png";
    var notFullscreen = "/img/gamerModule/notFullscreen.png";
    if($(this).hasClass('off')){
        $(this).css('background-image', 'url("' + notFullscreen + '")');
        $(this).removeClass('off');
        $(this).addClass('on');
        fullscreenProduction();
    }else{
        $(this).css('background-image', 'url("' + fullscreen + '")');
        $(this).removeClass('on');
        $(this).addClass('off');
        exitFullscreenProduction();
    }
});

$("#startDice").on("click", function(){
    initScene();
    throwDie();
});
