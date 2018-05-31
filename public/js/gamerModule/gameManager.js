const delayToRollTheDie = 30;
var clientGame = new GameState();
initializeProductionPanel();

/**
 * Create a button to allow a player to access to another player's production
 *
 * @param {string} pseudo : pseudo of the player for which we want to access to his production
 * @param {DOM element} productionList : button's container
 */
function createProductionAccess(pseudo, productionList){
    // create the main container
    let parent = document.createElement('div');
    parent.id = pseudo + '_productionAccess';
    parent.setAttribute('onclick', 'changeDisplayedProduction(' + parent.id + ')');
    // create an image to display the state of the production
    let prodStatus = document.createElement('img');
    if(pseudo === clientGame.getAnimator()){
        prodStatus.src = '/img/gamerModule/animator.png';
    }else{
        prodStatus.src = '/img/gamerModule/privateFlag.svg';
    }
    parent.appendChild(prodStatus);
    // create a span to display the player's pseudo
    let prodName = document.createElement('span');
    prodName.innerHTML = pseudo;
    parent.appendChild(prodName);
    productionList.get(0).appendChild(parent);
    actualizeGameState();
}

function createPlayersProductionList(players){
    let productionList = $('#productionPanel > div > div#productionList');
    for(let index = 0; index < players.length; index++){
        if(players[index] !== sessionStorage.pseudo
        && $('#' + players[index] + '_productionAccess')[0] == null){
            createProductionAccess(players[index], productionList);
        }
    }
}

function updatePlayersState(){
    let playersState = clientGame.getPlayers();
    let playerProd;
    for(let index = 0; index < playersState.length; index++){
        if(playersState[index]['state'] === 'offline'){
            playerProd = $('#' + playersState[index]['pseudo'] + '_productionAccess');
            playerProd.children()[0].src = '/img/gamerModule/offline.png';
        }
    }
}

/**
 * This function is used to refresh the list of buttons which are used to access
 * other players production
 */
function actualizePlayersProductionList(){
    let playersProduction = clientGame.getPlayersProduction();
    let playerProd;
    for(let pseudo in playersProduction){
        if(pseudo !== sessionStorage.pseudo){ // we already have a button to come back to our production
            playerProd = $('#' + pseudo + '_productionAccess');
            if(playerProd.children()[0] != null){
                if(playersProduction[pseudo]['production'] === ""){
                    playerProd.children()[0].src = '/img/gamerModule/privateFlag.svg';
                }else{
                    playerProd.children()[0].src = '/img/gamerModule/publicFlag.svg';
                }
            }
        }
    }
    actualizeGameState();
}

/**
 * Replace old productions by the new ones
 */
function refreshMosaic(){
    let playersProduction = clientGame.getPlayersProduction();
    for(let pseudo in playersProduction){
        clientGame.getMosaicProduction(pseudo).clearSVG();
        if(playersProduction[pseudo]['production'] == ''){
            $('#' + pseudo + '_production').css('background-image', 'url("/img/gamerModule/privateContent.png")');
        }else{
            $('#' + pseudo + '_production').css('background-image', '');
            clientGame.getMosaicProduction(pseudo).restoreProduction(playersProduction[pseudo]['production']);
        }
    }
}

function activateNavigation(){
    let navButton = $('#moveElement');
    if(!navButton.hasClass("selected")){
        navButton.click();
    }
}

function deactivateNavigation(){
    let navButton = $('#moveElement');
    if(navButton.hasClass("selected")){
        navButton.click();
    }
}

function centerMosaicChannels(){
    let playersProduction = clientGame.getPlayersProduction();
    for(let pseudo in playersProduction){
        clientGame.getMosaicProduction(pseudo).centerSVGToDefaultPosition();
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
    return $('#productionPanel > div > div#mosaic').css('display') === 'block';
}

/**
 * @param {DOM element} currentProduction : displayed production
 * @param {DOM element} targetedProduction : selected production
 */
function processChangeForPlayer(currentProduction, targetedProduction){
    let playersProduction = clientGame.getPlayersProduction();
    let currentProductionOwner = currentProduction[0].id.split('_')[0];
    let targetedProductionOwner = targetedProduction[0].id.split('_')[0];
    // if we leave our production, we save it before
    if(currentProductionOwner === sessionStorage.pseudo){
        clientGame.addNewProduction(sessionStorage.pseudo, clientGame.getProduction().saveProduction(), Legend.saveLegend());
    }
    // clear the legend to display the legend of the targeted production
    Legend.clear();
    // remove the current production to replace it by another one
    clientGame.getProduction().clearSVG();
    // production is private, display an image to inform the player
    if(playersProduction[targetedProductionOwner]['production'] === ''){
        clientGame.getProduction().productionPrivate();
        $('#wizz').css('display', 'block');
    }else{ // production is public, we display it
        $('#wizz').css('display', 'none');
        clientGame.getProduction().productionPublic();
        clientGame.getProduction().restoreProduction(playersProduction[targetedProductionOwner]['production']);
        clientGame.getProduction().centerSVGToDefaultPosition();
        Legend.restoreLegend(playersProduction[targetedProductionOwner]['legend']);
    }
}

/**
 * @param {DOM element} currentProduction : displayed production
 * @param {DOM element} targetedProduction : selected production
 */
function processChangeForAnimator(currentProduction, targetedProduction){
    let playersProduction = clientGame.getPlayersProduction();
    let currentProductionOwner = currentProduction[0].id.split('_')[0];
    let targetedProductionOwner = targetedProduction[0].id.split('_')[0];

    if(targetedProductionOwner === sessionStorage.pseudo){
        displayMosaic(); // animator's production is the mosaic
    }else{
        if(currentProductionOwner === sessionStorage.pseudo){
            hideMosaic(); // we hide mosaic to display only one production
        }
        // clear the legend to display the legend of the targeted production
        Legend.clear();
        // remove the current production to replace it by another one
        clientGame.getProduction().clearSVG();
        // production is private, display an image to inform the player
        if(playersProduction[targetedProductionOwner]['production'] === ''){
            clientGame.getProduction().productionPrivate();
            $('#wizz').css('display', 'block');
        }else{ // production is public, we display it
            $('#wizz').css('display', 'none');
            clientGame.getProduction().productionPublic();
            clientGame.getProduction().restoreProduction(playersProduction[targetedProductionOwner]['production']);
            clientGame.getProduction().centerSVGToDefaultPosition();
            Legend.restoreLegend(playersProduction[targetedProductionOwner]['legend']);
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
    // button on which player has clicked
    let target = $(id);
    // used to know on which production we are
    let currentProduction = $('.selectedProduction');
    // if the targeted production is the current one or if production if not available, we do nothing
    if(target[0].id === currentProduction[0].id) return;
    if(sessionStorage.role !== 'animator' && !clientGame.productionAvailable(target[0].id.split('_')[0])) return;
    // display the targeted production
    if(sessionStorage.role === 'player'){
        processChangeForPlayer(currentProduction, target);
    }else if(sessionStorage.role === 'animator'){
        processChangeForAnimator(currentProduction, target);
    }
    currentProduction.removeClass('selectedProduction');
    target.addClass('selectedProduction');
}

$('#wizz').on('click', function(){
    let targetedPlayer = $('.selectedProduction')[0].id.split('_')[0];
    socket.emit('message', {'dest': targetedPlayer, 'msg': 'I would like to consult your production'});
});

function addCenterButtonToToolBar(toolBar, player){
    // button used to center the view on the modified production's area
    let centerButton = document.createElement('button');
    centerButton.setAttribute('onclick', 'centerMosaicChannel("' + player + '")');
    centerButton.setAttribute('style', 'background-image: url("/img/gamerModule/Centrer2.png");');
    centerButton.classList.add('col-lg-offset-1', 'col-lg-10',
                               'col-md-offset-1', 'col-md-10',
                               'col-sm-offset-1', 'col-sm-10',
                               'col-xs-offset-1', 'col-xs-10',
                               'imageButton');
    centerButton.style.height = '15%';
    centerButton.style.padding = '0';

    toolBar.appendChild(centerButton);
}

function addPseudoDisplayerToToolBar(toolBar, player){
    // create a container to center the label for the pseudo
    let textContainer = document.createElement('div');
    textContainer.classList.add('rotated-text');
    textContainer.style.height = '70%';
    // create a label to display the player's pseudo
    let playerLabel = document.createElement('span');
    playerLabel.classList.add('rotated-text__inner');
    playerLabel.classList.add('myCustomTitle');
    playerLabel.innerHTML = player;
    textContainer.appendChild(playerLabel);

    toolBar.appendChild(textContainer);
}

function addZoomIndicatorToToolBar(toolBar, player){
    // used to center the label
    let zoomLevelContainer = document.createElement('div');
    zoomLevelContainer.classList.add('rowFlexContainer');
    zoomLevelContainer.setAttribute('style', 'height: 15%; padding: 0;');
    // label used to display the zoom level
    let zoomLevel = document.createElement('label');
    zoomLevel.id = player + '_zoomLevel';
    zoomLevel.innerHTML = 'Zoom x1.00';
    zoomLevel.classList.add('rowFlexContainer', 'myCustomIndicator',
                            'col-lg-10', 'col-md-10',
                            'col-sm-10', 'col-xs-10');
    zoomLevel.setAttribute('style', 'height: 90%; font-size: 0.6vw; ' +
                           'font-family: "Georgia", "Helvetica", "Times New Roman"; ' +
                           'padding: 0; text-align: center;');
    zoomLevelContainer.appendChild(zoomLevel);
    toolBar.appendChild(zoomLevelContainer);
}

function createChannelToolBar(channel, player){
    // create a tool bar for channel tools
    let bar = document.createElement('div');
    bar.style.paddingTop = '5px';
    bar.style.paddingBottom = '5px';
    // Add tools to the bar
    addCenterButtonToToolBar(bar, player);
    addPseudoDisplayerToToolBar(bar, player);
    addZoomIndicatorToToolBar(bar, player);

    channel.appendChild(bar);
}

/**
 * Add a new "channel" to the mosaic
 * A "channel" is equivalent to a player's production and his pseudo
 *
 * @param {DOM element} parent : The place in the mosaic in which we add the new channel
 * @param {player} player : player's pseudo (used to create the id of the channel)
 */
function addElementToRow(parent, player){
    // create the main container of the channel
    let prod = document.createElement('div');
    prod.setAttribute('id', player + '_production');
    prod.setAttribute('style', 'width: 50%; height: 100%;');
    prod.classList.add('imageBackground');
    prod.style.backgroundImage = 'url("/img/gamerModule/privateContent.png")';
    parent.appendChild(prod);
    createChannelToolBar(prod, player);
    clientGame.attachProductionToMosaicChannel(player, prod, false, $('#' + player + '_zoomLevel'));
}

/**
 * Add a new row to the mosaic
 */
function createNewRow(){
    let mosaic = $('#mosaic');
    let newRow = document.createElement('div');
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
    let mosaic = $('#mosaic');
    let lastRow = $('#mosaic > div.row:last-child');
    if(lastRow.children().length === 0 || lastRow.children().length === 2){
        createNewRow();
        lastRow = $('#mosaic > div.row:last-child');
    }
    addElementToRow(lastRow[0], player);
}

function clearMosaic(){
    $('#mosaic').empty();
    clientGame.clearMosaic();
}

/**
 * Create the animator's mosaic
 * This function creates the mosaic and add a channel per players
 *
 * @param {string list} players : list of all players
 */
function createMosaic(players){
    for(let index in players){
        if(players[index] !== sessionStorage.pseudo)
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
    clientGame.setProduction($('#productionPanel > div > div#production')[0], false, $('#zoomLevel'));
    if(sessionStorage.role === 'player'){
        displayProductionPanel();
    }else if(sessionStorage.role === 'animator'){
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

function individualTimerColor(sandColor, hourglassColor){
    $('.sandStroke').css('stroke', sandColor);
    $('.sandFill').css('fill', sandColor);
    $('.hourglassStroke').css('stroke', hourglassColor);
}

function indivTimerAnimation(begin, duration){
    let animations = $('.indivTimerAnimation');
    for(let index = 0; index < animations.length; index++){
        animations[index].setAttribute('dur', duration + 's');
        animations[index].beginElementAt(begin);
    }
}

function isDiceDisplayed(){
    return $('#startDice').get(0).style.display === "block";
}

function showDice() {
    $('svg#hourglassSVG > :first-child > :nth-child(2)').get(0).setAttribute('display', 'none');
    $('svg#hourglassSVG > :nth-child(2)').get(0).setAttribute('display', 'none');
    $('svg#hourglassSVG > :nth-child(3)').get(0).setAttribute('display', 'none');
    $('#startDice').get(0).style.display = "block";
}

function hideDice() {
    $('svg#hourglassSVG > :first-child > :nth-child(2)').get(0).setAttribute('display', 'block');
    $('svg#hourglassSVG > :nth-child(2)').get(0).setAttribute('display', 'block');
    $('svg#hourglassSVG > :nth-child(3)').get(0).setAttribute('display', 'block');
    $('#startDice').get(0).style.display = "none";
}

function actualizeGameState(){
    $('.nextPlayer').removeClass('nextPlayer');
    $('.currentPlayer').removeClass('currentPlayer');
    $('#' + clientGame.getNextPlayer() + '_productionAccess').addClass('nextPlayer');
    $('#' + clientGame.getCurrentPlayer() + '_productionAccess').addClass('currentPlayer');
}

function deactivateNextPlayerButton(){
    $('#endOfTurn').addClass('nextPlayerDeactivate');
}

function activateNextPlayerButton(){
    $('#endOfTurn').removeClass('nextPlayerDeactivate');
}

function skipTurn(){
    $('#endOfTurn').click();
}

function rollTheDice(){
    $('#startDice').click();
}

function displayScene() {
    //$('#scene').css('display', 'flex');
    $('#divProduction').css('display', 'none');
    let parentScene = document.getElementById('productionPanel');
    let scene = document.createElement('div');
    scene.id = 'scene';
    scene.style.display = 'flex';
    scene.style.height = '100%';
    parentScene.insertBefore(scene, null);
}

function centerMosaicChannel(playerChannel){
    clientGame.getMosaicProduction(playerChannel).centerSVGToDefaultPosition();
}

function actualizeForeignProduction(pseudo){
    let currentProductionOwner = $('.selectedProduction')[0].id.split('_')[0];
    if(currentProductionOwner === pseudo){
        // hide the background1 image to display the production
        if(clientGame.getProduction().isPrivate()){
            clientGame.getProduction().productionPublic();
            $('#wizz').css('display', 'none');
        }
        clientGame.getProduction().clearSVG();
        clientGame.getProduction().restoreProduction(clientGame.getPlayersProduction()[pseudo]['production']);
        Legend.restoreLegend(clientGame.getPlayersProduction()[pseudo]['legend']);
    }
}

// ---------------------------------------------------------------------
// ----------------------- BUTTONS LISTENER ----------------------------
// ---------------------------------------------------------------------

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
    let productionList = $("#gamePanel > :nth-child(2) > div > :first-child");
    let productionArea = $("#gamePanel > :nth-child(2) > div > :last-child");
    let displayButton = $("#displayList");
    if(productionList.css('display') === 'none'){ // if tool bar is hidden, we display it
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
    let button = $("button#setPrivacy");
    if(button.css('background-image').match(/.*\/img\/gamerModule\/private\.svg.*/)){
        button.css('background-image', 'url("/img/gamerModule/public.svg")');
        button[0].value = 'public';
    }else{
        button.css('background-image', 'url("/img/gamerModule/private.svg")');
        button[0].value = 'private';
    }
});

$("#startDice").on("click", function () {
    displayScene();
    initScene();
    throwDie();
    hideDice();
    clientGame.stopWaitsForDiceProcess();
    $('circle.hourglassStroke')[0].classList.remove('rollTheDice');
    if(clientGame.getUseTimer()){
        let data = clientGame.getTimersData();
        clientGame.startIndivTimer(0, data['indivTimer']);
        if(data['forceEndOfTurn'] && data['currentPlayer'] === sessionStorage.pseudo){
            clientGame.forceEndOfTurn(data['delayBeforeForcing'], skipTurn);
        }
    }
});

$('#endOfTurn').on('click', function(){
    if(clientGame.getCurrentPlayer() === sessionStorage.pseudo){
        socket.emit('endOfTurn', null);
        hideDice();
    }
});

$('#legend').on('click', function(){
    if($(this).val() === 'visible'){
        Legend.forceHide();
        $(this).val('hide');
    }else{
        Legend.forceShow();
        $(this).val('visible');
    }
});

$('#centerSVG').on('click', function(){
    clientGame.getProduction().centerSVGToDefaultPosition();
});

// ---------------------------------------------------------------------
// ----------------------- SOCKET LISTENERS ----------------------------
// ---------------------------------------------------------------------

socket.on('initGameTime', function(data){
    clientGame.setAnimator(data['animator']);
    clientGame.setPlayers(data['players']);
    createPlayersProductionList(data['players']);
    actualizeChatPlayersList(data['players']);
    $('#inputBox').attr('placeholder', $.i18n('chatPlaceholder'));
    $('#notesArea').attr('placeholder', $.i18n('notesPlaceholder'));
    if(sessionStorage.role === 'animator'){
        clearMosaic();
        createMosaic(data['players']);
        $('#globalTimer').css('border-right', '2px solid black');
    }
    if(data['useTimer']){
        clientGame.startGolbalTimer(data['globalTimer']);
    }
});

socket.on('changeDuringGameTime', function(data){
    clientGame.updatePlayersState(data['players']);
    updatePlayersState();
    actualizeChatPlayersList(clientGame.getOnlinePlayers());
    if(sessionStorage.role === 'animator'){
        clearMosaic();
        createMosaic(clientGame.getOnlinePlayers());
        refreshMosaic();
    }
});

/**
 * Process "playersProduction" message
 * This message is received when the server shares players production
 *
 * form of received data : list of dictionary
 * Dictionaries have this form : {'pseudo': player's pseudo,
                                  'production': player's production,
                                  'privacy': production's privacy}
 */
socket.on('playersProduction', function(data){
    clientGame.addNewProduction(data['pseudo'], data['privacy'] === 'public' ? data['production'] : "", data['legend']);
    actualizePlayersProductionList();
    //actualizeForeignProduction(data['pseudo']);
    if(sessionStorage.role === 'animator' && isMosaicDisplayed()){
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
    let currentProduction = $('.selectedProduction');
    let privacy = $("button#setPrivacy");
    if(sessionStorage.role != 'animator'){
        // player works on his production, we send the current version
        if(currentProduction[0].id.split('_')[0] == sessionStorage.pseudo){
            socket.emit('shareMyProduction', {'pseudo': sessionStorage.pseudo,
                        'production': clientGame.getProduction().saveProduction(),
                        'legend': Legend.saveLegend(),
                        'privacy': privacy[0].value});
        // player is on another production, the last version of his production has been saved in playersProduction
        }else{
            socket.emit('shareMyProduction', {'pseudo': sessionStorage.pseudo,
                        'production': clientGame.getPlayersProduction()[sessionStorage.pseudo]['production'],
                        'legend': clientGame.getPlayersProduction()[sessionStorage.pseudo]['legend'],
                        'privacy': privacy[0].value});
        }
    }
});

socket.on('newTurn', function(data){
    clientGame.setState(data);
    actualizeGameState();
    if(data['currentPlayer'] === sessionStorage.pseudo){
        showDice();
        activateNextPlayerButton();
        individualTimerColor('#1F5473', '#0AA6E1');
        clientGame.startDiceDelay(delayToRollTheDie, rollTheDice);
        $('circle.hourglassStroke')[0].classList.add('rollTheDice');
    }else{
        deactivateNextPlayerButton();
        individualTimerColor('black', 'grey');
    }
    if(data['useTimer']){
        clientGame.setTimersData(data);
    }
});

// ---------------------------------------------------------------------
// ---------------------- SVG TOOLS LISTENERS --------------------------
// ---------------------------------------------------------------------

$("#color").on("click", function(){
    $("#svgMenu").css('display', 'none');
    $("#colorMenu").css('display', 'block');
});

$("#colorMenu button").on("click", function(){
    let selectedColor = $(this).val();
    $("#colorMenu").css('display', 'none');
    $("#svgMenu").css('display', 'block');
    let color = $("#color");
    color.val(selectedColor);
    color.css('background-color', 'url("/img/gamerModule/' + selectedColor + '.jpg")');
    $("#bouton").val(selectedColor);
    clientGame.getProduction().setSelectedColor(selectedColor);
});

$("#moveElement").on("click", function(){
    let moveImage = "/img/gamerModule/move.png";
    let movingImage = "/img/gamerModule/moving.png";
    if($(this).hasClass("selected")){
        $(this).removeClass("selected");
        $(this).css('background-image', 'url(' + moveImage + ')');
        Production.updatePanningState(false);
    }else{
        $(this).addClass("selected");
        $(this).css('background-image', 'url(' + movingImage + ')');
        Production.updatePanningState(true);
    }
});

function fullscreenProduction(){
    // hide around containers
    $('#chatInfos').css('display', 'none');
    $('#displayList').css('display', 'none');
    $('#gamePanel > :nth-child(2)').css('height', '95%');
    $('#productionPanel > :first-child').css('display', 'none');
    let lastChild = $('#productionPanel > :last-child');
    lastChild.css('height', '100%');
    lastChild.css('width', '100%');
    $('#production').css('width', '93%');
    // resize the SVG to fill all the available space
    clientGame.getProduction().resizeSVG();
}

function exitFullscreenProduction(){
    // display around containers
    $('#chatInfos').css('display', 'block');
    $('#displayList').css('display', 'block');
    $('#gamePanel > :nth-child(2)').css('height', '');
    $('#productionPanel > :first-child').css('display', 'block');
    let lastChild = $('#productionPanel > :last-child');
    lastChild.css('height', '');
    lastChild.css('width', '');
    $('#production').css('width', '92%');
    // resize the SVG to fill all the available space
    clientGame.getProduction().resizeSVG();
}

$("#fullScreen").on("click", function(){
    let fullscreen = "/img/gamerModule/fullscreen.png";
    let notFullscreen = "/img/gamerModule/notFullscreen.png";
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

$('#question > div').on('mouseover', function(){
    if($(this)[0].offsetHeight < $(this)[0].scrollHeight){
        $(this).css('height', $(this)[0].scrollHeight + 'px');
        $(this).css('background-color', 'white');
        $(this).css('border-bottom', '2px solid black');
        $(this).css('overflow-y', 'hidden');
        $(this).parent().css('border-left', 'none');
        $(this).css('border-left', '2px solid black');
    }
});

$('#question > div').on('mouseleave', function(){
    $(this).css('height', '');
    $(this).css('background-color', '');
    $(this).css('border-bottom', '');
    $(this).css('overflow-y', 'auto');
    $(this).parent().css('border-left', '');
    $(this).css('border-left', '');
});

// ---------------------------------------------------------------------
// ---------------- CONTEXTUAL MENU LISTENERS --------------------------
// ---------------------------------------------------------------------

$('#removeLink').on('click', function(){
    clientGame.getProduction().removeSelectedLink();
});

$('#dashLink').on('click', function(){
    clientGame.getProduction().setSelectedLinkDasharray(10.10);
});

$('#linearLink').on('click', function(){
    clientGame.getProduction().setSelectedLinkDasharray(0);
});

$('#increaseWidth').on('click', function(){
    clientGame.getProduction().increaseSelectedLinkWidth();
});

$('#decreaseWidth').on('click', function(){
    clientGame.getProduction().decreaseSelectedLinkWidth();
});

$('#navigability').on('click', function(){
    clientGame.getProduction().addNavigabilityToSelectedLink();
});

$('#reverseNavigability').on('click', function(){
    clientGame.getProduction().reverseSelectedLinkNavigability();
});

$('#removeNavigability').on('click', function(){
    clientGame.getProduction().removeSelectedLinkNavigability();
});

$('#linkColor').on('click', function(){
    $('.mainTool').css('display', 'none');
    $('.colorTool').css('display', 'block');
});

$('button.colorTool').on('click', function(){
    clientGame.getProduction().setSelectedLinkColor($(this).val());
    $('.colorTool').css('display', 'none');
    $('.mainTool').css('display', 'block');
});
