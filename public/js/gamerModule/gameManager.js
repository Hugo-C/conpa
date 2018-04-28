var playersProduction = {}; // used to keep in memory other players production and access it
var production; // used to store Production class instance
var mosaic = {}; // used to store Production class instances of the mosaic
var gameState = {}; // used to keep in memory the name of the current player and the next one

console.log(sessionStorage.role);
initializeProductionPanel();

/**
 * Process the players message
 * Displays the list of player in the tchat
 *
 * form of received data : array which contain the list of players's pseudo
 */
socket.on('actualizeAnimatorMosaic', function(players){
    if(sessionStorage.role == 'animator'){
        createMosaic(players);
    }
});

/**
 * Process "playersProduction" message
 * This message is received when the server shares players production
 *
 * form of received data : list of dictionary
 * Dictionaries have this form : {'pseudo': player's pseudo, 'production': player's production}
 */
socket.on('playersProduction', function(data){
    playersProduction[data['pseudo']] = data['production'];
    let productionList = $('#productionPanel > div > div#productionList');
    actualizePlayersProductionList(productionList);
    if(sessionStorage.role == 'animator' && isMosaicDisplayed()){
        refreshMosaic();
    }
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
        if(currentProduction[0].id.split('_')[0] == sessionStorage.pseudo){ // player works on his production, we send the current version
            socket.emit('shareMyProduction', {'pseudo': sessionStorage.pseudo, 'production': production.saveProduction()});
        }else{ // player is on another production, the last version of his production has been saved in playersProduction
            socket.emit('shareMyProduction', {'pseudo': sessionStorage.pseudo, 'production': playersProduction[sessionStorage.pseudo]});
        }
    }else{
        socket.emit('shareMyProduction', {'pseudo': sessionStorage.pseudo, 'production': ""});
    }
});

/**
 * Create a button to allow a player to access to another player's production
 *
 * @param {string} pseudo : pseudo of the player for which we want to access to his production
 * @param {DOM element} productionList : button's container
 */
function createProductionAccess(pseudo, productionList){
    var parent = document.createElement('div');
    parent.id = pseudo + '_productionAccess';
    parent.setAttribute('onclick', 'changeDisplayedProduction(' + parent.id + ')');
    var prodStatus = document.createElement('img');
    prodStatus.src = '/img/gamerModule/privateFlag.svg';
    parent.appendChild(prodStatus);
    var prodName = document.createElement('span');
    prodName.innerHTML = pseudo;
    parent.appendChild(prodName);
    productionList.get(0).appendChild(parent);
    actualizeGameState();
}

/**
 * This function is used to refresh the list of buttons which are used to access
 * other players production
 */
function actualizePlayersProductionList(productionList){
    for(var pseudo in playersProduction){
        if(pseudo != sessionStorage.pseudo){ // we already have a button to come back to our production
            if($('#' + pseudo + '_productionAccess')[0] == null){ // we create buttons to access at the production of other players
                createProductionAccess(pseudo, productionList);
            }
            var playerProd = $('#' + pseudo + '_productionAccess');
            if(playersProduction[pseudo] == ""){
                playerProd.children()[0].src = '/img/gamerModule/privateFlag.svg';
            }else{
                playerProd.children()[0].src = '/img/gamerModule/publicFlag.svg';
            }
        }
    }
    actualizeGameState();
}

/**
 * Replace old productions by the new ones
 */
function refreshMosaic(){
    for(let pseudo in playersProduction){
        mosaic[pseudo].clearSVG();
        mosaic[pseudo].restoreProduction(playersProduction[pseudo]);
    }
}

function activateNavigation(){
    var navButton = $('#moveElement');
    if(!navButton.hasClass("selected")){
        navButton.click();
    }
}

function deactivateNavigation(){
    var navButton = $('#moveElement');
    if(navButton.hasClass("selected")){
        navButton.click();
    }
}

function centerMosaicChannels(){
    for(let pseudo in playersProduction){
        mosaic[pseudo].centerSVGToDefaultPosition();
    }
}

/**
 * Display the mosaic panel and hide the panel used to display only one production
 */
function displayMosaic(){
    $('#productionPanel > div > div#production').css('display', 'none');
    $('#productionPanel > div > div#svgMenu').css('display', 'none');
    $('#productionPanel > div > div#mosaic').css('display', 'block');
    refreshMosaic();
    centerMosaicChannels();
    activateNavigation(); // allow to navigate in players production
}

/**
 * Display the panel used to display only one production and hide the mosaic panel
 */
function hideMosaic(){
    $('#productionPanel > div > div#production').css('display', 'block');
    $('#productionPanel > div > div#svgMenu').css('display', 'block');
    $('#productionPanel > div > div#mosaic').css('display', 'none');
    deactivateNavigation(); // default state of the navigation button
}

/**
 * Check if the mosaic panel is displayed
 * @return {Boolean}
 */
function isMosaicDisplayed(){
    return $('#productionPanel > div > div#mosaic').css('display') == 'block';
}

/**
 * @param {DOM element} currentProduction : displayed production
 * @param {DOM element} targetedProduction : selected production
 */
function processChangeForPlayer(currentProduction, targetedProduction){
    // if we leave our production, we save it before
    if(currentProduction[0].id.split('_')[0] == sessionStorage.pseudo){
        playersProduction[currentProduction[0].id.split('_')[0]] = production.saveProduction();
    }
    production.clearSVG();
    // display the production on which we want to go
    production.restoreProduction(playersProduction[targetedProduction[0].id.split('_')[0]]);
    production.centerSVGToDefaultPosition();
}

/**
 * @param {DOM element} currentProduction : displayed production
 * @param {DOM element} targetedProduction : selected production
 */
function processChangeForAnimator(currentProduction, targetedProduction){
    if(targetedProduction[0].id.split('_')[0] == sessionStorage.pseudo){
        displayMosaic(); // animator's production is the mosaic
    }else{
        if(currentProduction[0].id.split('_')[0] == sessionStorage.pseudo){
            hideMosaic(); // we hide mosaic to display only one production
        }
        production.clearSVG();
        // display the production on which we want to go
        production.restoreProduction(playersProduction[targetedProduction[0].id.split('_')[0]]);
        production.centerSVGToDefaultPosition();
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
    if(target[0].id == currentProduction[0].id) return;
    if(sessionStorage.role == 'player'){
        processChangeForPlayer(currentProduction, target);
    }else if(sessionStorage.role == 'animator'){
        processChangeForAnimator(currentProduction, target);
    }
    currentProduction.removeClass('selectedProduction');
    target.addClass('selectedProduction');
}

/**
 * Add a new "channel" to the mosaic
 * A "channel" is equivalent to a player's production and his pseudo
 *
 * @param {DOM element} parent : The place in the mosaic in which we add the new channel
 * @param {player} player : player's pseudo (used to create the id of the channel)
 */
function addElementToRow(parent, player){
    var prod = document.createElement('div');
    prod.setAttribute('id', player + '_production');
    prod.setAttribute('style', 'width: 50%; height: 100%;');
    parent.appendChild(prod);
    var bar = document.createElement('div');
    var textContainer = document.createElement('div');
    textContainer.classList.add('rotated-text');
    bar.appendChild(textContainer);
    var playerLabel = document.createElement('span');
    playerLabel.classList.add('rotated-text__inner');
    playerLabel.classList.add('myCustomTitle');
    playerLabel.innerHTML = player;
    textContainer.appendChild(playerLabel);
    prod.appendChild(bar);
    mosaic[player] = new Production(prod, false);
}

/**
 * Add a new row to the mosaic
 */
function createNewRow(){
    var mosaic = $('#mosaic');
    var newRow = document.createElement('div');
    newRow.setAttribute('style', 'width: 100%; height: 50%;');
    newRow.classList.add('row');
    mosaic.get(0).appendChild(newRow);
}

/**
 * Add a new "channel" to the mosaic's last row
 * A "channel" is equivalent to a player's production and his pseudo
 * If the mosaic's last row is full, we create a new one
 *
 * @param {string} player : player's pseudo (used to create the id of the channel)
 */
function addElementToMosaic(player){
    var mosaic = $('#mosaic');
    var lastRow = $('#mosaic > div.row:last-child');
    if(lastRow.children().length == 0 || lastRow.children().length == 2){
        createNewRow();
        lastRow = $('#mosaic > div.row:last-child');
    }
    addElementToRow(lastRow[0], player);
}

/**
 * Create the animator's mosaic
 * This function creates the mosaic and add a channel per players
 *
 * @param {string list} players : list of all players
 */
function createMosaic(players){
    for(var index in players){
        if(players[index] != sessionStorage.pseudo)
            addElementToMosaic(players[index]);
    }
    activateNavigation();
}

/**
 * Display the player's interface
 */
function displayProductionPanel(){
    $('.animatorOnly').css('display', 'none');
}

/**
 * Display the animator's interface
 */
function displayAnimatorProductionPanel(){
    $('.playerOnly').css('display', 'none');
    $('.animatorOnly').css('display', 'block');
    $('#productionPanel > div > div#production').css('display', 'none');
    $('#productionPanel > div > div#svgMenu').css('display', 'none');
    // Animator doesn't need to have the "next player" button
    $('div#gameBar > div > div:nth-child(7) > div.box > div.row:first-child').
        css('height', '100%');
    $('div#gameBar > div > div:nth-child(7) > div.box > div.row:last-child').
        css('display', 'none');
}

function initializeProductionPanel(){
    let myProductionAccess = '#productionPanel > :first-child > :nth-child(1) > div';
    $(myProductionAccess)[0].id = sessionStorage.pseudo + '_productionAccess';
    $(myProductionAccess).attr('onclick', 'changeDisplayedProduction(' + $(myProductionAccess)[0].id + ')');
    production = new Production($('#productionPanel > div > div#production')[0], false);
    if(sessionStorage.role == 'player'){
        displayProductionPanel();
    }else if(sessionStorage.role == 'animator'){
        displayAnimatorProductionPanel();
    }
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
    var productionList = $("#gamePanel > :nth-child(2) > div > :first-child");
    var productionArea = $("#gamePanel > :nth-child(2) > div > :last-child");
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

/** allow to change the privacy state of the production */
$("#setPrivacy").on("click", function(){
    var button = $("button#setPrivacy");
    if(button.css('background-image').match(/.*\/img\/gamerModule\/private\.svg.*/)){
        button.css('background-image', 'url("/img/gamerModule/public.svg")');
        button[0].value = 'public';
    }else{
        button.css('background-image', 'url("/img/gamerModule/private.svg")');
        button[0].value = 'private';
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
    $('#productionPanel > :first-child').css('display', 'none');
    $('#productionPanel > :last-child').css('height', '100%');
    $('#productionPanel > :last-child').css('width', '100%');
    $('#production').css('width', '93%');
}

function exitFullscreenProduction(){
    $('#chatInfos').css('display', 'block');
    $('#displayList').css('display', 'block');
    $('#gamePanel > :nth-child(2)').css('height', '');
    $('#productionPanel > :first-child').css('display', 'block');
    $('#productionPanel > :last-child').css('height', '');
    $('#productionPanel > :last-child').css('width', '');
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
    hideDice();
});

function timerAnimation(duration){
  var animations = $('.hourglassAnimation');
  for(var index = 0; index < animations.length; index++){
      animations[index].setAttribute('dur', duration + 's');
      animations[index].beginElement();
  }
}

function isDiceDisplayed(){
    return $('#startDice').get(0).style.display == "block";
}

function showDice(){
  $('svg#hourglassSVG > :first-child > :nth-child(2)').get(0).setAttribute('display', 'none');
  $('svg#hourglassSVG > :nth-child(2)').get(0).setAttribute('display', 'none');
  $('svg#hourglassSVG > :nth-child(3)').get(0).setAttribute('display', 'none');
  $('#startDice').get(0).style.display = "block";
}

function hideDice(){
  $('svg#hourglassSVG > :first-child > :nth-child(2)').get(0).setAttribute('display', 'block');
  $('svg#hourglassSVG > :nth-child(2)').get(0).setAttribute('display', 'block');
  $('svg#hourglassSVG > :nth-child(3)').get(0).setAttribute('display', 'block');
  $('#startDice').get(0).style.display = "none";
}

function actualizeGameState(){
    $('.nextPlayer').removeClass('nextPlayer');
    $('.currentPlayer').removeClass('currentPlayer');
    $('#' + gameState['nextPlayer'] + '_productionAccess').addClass('nextPlayer');
    $('#' + gameState['currentPlayer'] + '_productionAccess').addClass('currentPlayer');
}

socket.on('newTurn', function(data){
    gameState = data;
    actualizeGameState();
    if(data['currentPlayer'] == sessionStorage.pseudo){
        showDice();
    }
});

$('#endOfTurn').on('click', function(){
    if(gameState['currentPlayer'] == sessionStorage.pseudo){
        socket.emit('endOfTurn', null);
        hideDice();
    }
});
