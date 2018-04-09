var playersProduction = {}; // used to keep in memory other players production and access it
$('#getMyProduction')[0].value = sessionStorage.pseudo;
$('#getMyProduction').attr('onclick', 'changeDisplayedProduction(' + $('#getMyProduction')[0].id + ')');

/**
 * Process "playersProduction" message
 * This message is received when the server shares players production
 *
 * form of received data : list of dictionary
 * Dictionaries have this form : {'pseudo': player's pseudo, 'production': player's production}
 */
socket.on('playersProduction', function(data){
    playersProduction[data['pseudo']] = data['production'];
    actualizePlayersProductionList();
});

/**
 * Process "shareYourProduction" message
 * This message is send by the server to retrieve players production
 * When we receive this message, we need to send our production to the server
 *
 * form of received data : no data (null)
 */
socket.on('shareYourProduction', function(data){
    var currentProduction = $('.selectedProduction');
    var privacy = $("button#setPrivacy");
    if(privacy[0].value == 'public'){ // we send the production if and only if player has set the privacy to public
        if(currentProduction[0].value == sessionStorage.pseudo){ // player works on his production, we send the current version
            socket.emit('shareMyProduction', {'pseudo': sessionStorage.pseudo, 'production': saveProduction()});
        }else{ // player is on another production, the last version of his production has been saved in playersProduction
            socket.emit('shareMyProduction', {'pseudo': sessionStorage.pseudo, 'production': playersProduction[sessionStorage.pseudo]});
        }
    }else{
        socket.emit('shareMyProduction', {'pseudo': sessionStorage.pseudo, 'production': ""});
    }
});

/**
 * This function is used to refresh the list of buttons which are used to access
 * other players production
 */
function actualizePlayersProductionList(){
    var productionList = $('#productionList > :nth-child(4)');
    for(var key in playersProduction){
        if(key != sessionStorage.pseudo){ // we already have a button to come back to our production
            if($('#' + key + 'production')[0] == null){ // we create buttons to access at the production of other players
                var newButton = document.createElement('button');
                newButton.id = key + 'production';
                newButton.value = key;
                newButton.innerText = key;
                newButton.classList.add('myCustomButton');
                newButton.setAttribute('onclick', 'changeDisplayedProduction(' + newButton.id + ')');
                productionList.get(0).appendChild(newButton);
            }
            var button = $('#' + key + 'production');
            if(playersProduction[key] == ""){
                button[0].style.color = 'red'; // player has update the privacy to private
            }else{
                button[0].style.color = 'green'; // player has update the privacy to public
            }
        }
    }
}

/**
 * This function is used to replace the current production by an other production
 * If player wants to replace is own production, we save it before to replace it
 *
 * @param {number} id : id of the calling button
 */
function changeDisplayedProduction(id){
    var target = $(id); // button on which player has clicked
    var currentProduction = $('.selectedProduction'); // used to know on which production we are
    if(currentProduction[0].value == sessionStorage.pseudo){ // if we leave our production, we save it before
        playersProduction[currentProduction[0].value] = saveProduction();
    }
    currentProduction.removeClass('selectedProduction');
    target.addClass('selectedProduction');
    clearSVG();
    restoreProduction(playersProduction[target[0].value]); // display the production on which we want to go
}

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
        doPanning = false;
    }else{
        $(this).addClass("selected");
        $(this).css('background-image', 'url(' + movingImage + ')');
        doPanning = true;
    }
});

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
