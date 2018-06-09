const delayToRollTheDie = 30;
var clientGame = new GameState();
var castControler = null;
initializeProductionPanel();

/**
 * Create a button to allow a player to access to another player's production
 *
 * @param {string} pseudo : pseudo of the player for which we want to access to his production
 * @param {JQuery object} productionList : button's container
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

/**
 * Create a production's access button for each player
 * @param {string array} players : list of the players
 */
function createPlayersProductionList(players){
    let productionList = $('#productionList');
    for(let index = 0; index < players.length; index++){
        if(players[index] !== sessionStorage.pseudo
        && $('#' + players[index] + '_productionAccess')[0] == null){
            createProductionAccess(players[index], productionList);
        }
    }
}

/**
 * Display a special logo for players who have left the game
 */
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
 * Extracts the pseudo of the production's owner from the button's id used to access
 * to this production
 * @param {JQuery object} accessor
 * @return {String}
 */
function getProductionOwnerFromAccessor(accessor){
    return accessor[0].id.split('_')[0];
}

/**
 * Clear the current production and displays the production of the given player
 * @param {String} productionOwner : pseudo of the production's owner to display
 */
function displayTargetedProduction(productionOwner){
    let playersProduction = clientGame.getPlayersProduction();
    // clear the legend to display the legend of the targeted production
    clientGame.getProduction().clearLegend();
    // remove the current production to replace it by another one
    clientGame.getProduction().clearSVG();
    // production is private, display an image to inform the player
    if(playersProduction[productionOwner]['production'] === ''){
        clientGame.getProduction().productionPrivate();
    }else{ // production is public, we display it
        clientGame.getProduction().productionPublic();
        clientGame.getProduction().restoreProduction(playersProduction[productionOwner]['production']);
        clientGame.getProduction().centerSVGToDefaultPosition();
        clientGame.getProduction().restoreLegend(playersProduction[productionOwner]['legend']);
    }
}

/**
 * @param {JQuery object} currentProduction : displayed production
 * @param {JQuery object} targetedProduction : selected production
 */
function processChangeForPlayer(currentProduction, targetedProduction){
    let currentProductionOwner = getProductionOwnerFromAccessor(currentProduction);
    let targetedProductionOwner = getProductionOwnerFromAccessor(targetedProduction);
    // if we leave our production, we save it before
    if(currentProductionOwner === sessionStorage.pseudo){
        clientGame.addNewProduction(sessionStorage.pseudo,
                                    clientGame.getProduction().saveProduction(),
                                    clientGame.getProduction().saveLegend());
    }
    displayTargetedProduction(targetedProductionOwner);
}

/**
 * @param {JQuery object} currentProduction : displayed production
 * @param {JQuery object} targetedProduction : selected production
 */
function processChangeForAnimator(currentProduction, targetedProduction){
    let currentProductionOwner = getProductionOwnerFromAccessor(currentProduction);
    let targetedProductionOwner = getProductionOwnerFromAccessor(targetedProduction);

    if(targetedProductionOwner === sessionStorage.pseudo){
        clientGame.getMosaic().displayMosaic(); // animator's production is the mosaic
        clientGame.getMosaic().refreshMosaic(clientGame.getPlayersProduction());
    }else{
        if(currentProductionOwner === sessionStorage.pseudo){
            clientGame.getMosaic().hideMosaic(); // we hide mosaic to display only one production
        }
        displayTargetedProduction(targetedProductionOwner);
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
    let targetedProductionOwner = getProductionOwnerFromAccessor(target);
    // used to know on which production we are
    let currentProduction = $('.selectedProduction');
    // if the targeted production is the current one or if production is not available, we do nothing
    if(target[0].id === currentProduction[0].id) return;
    if(!(sessionStorage.pseudo == clientGame.getAnimator() && targetedProductionOwner == clientGame.getAnimator())
    && !clientGame.productionAvailable(targetedProductionOwner)) return;
    // display the targeted production
    if(sessionStorage.role === 'player'){
        processChangeForPlayer(currentProduction, target);
    }else if(sessionStorage.role === 'animator'){
        processChangeForAnimator(currentProduction, target);
    }
    currentProduction.removeClass('selectedProduction');
    target.addClass('selectedProduction');
}

/**
 * Send a trace to the server
 * @param {String} actor : the actor of the action
 * @param {String} action : the action to be traced
 * @param {String} value : the value associate to the action
 * @param {String} target : the action's target
 */
function sendTrace(actor, action, value, target){
    socket.emit('trace', {'actor': actor, 'action': action, 'value': value, 'target': target});
}

let notes = $("#notesArea");
notes.change(notes, onNotesChange);  // call the function when the element loose focus and is changed

/**
 * Handle the change of the notes area
 */
function onNotesChange(event){
    let data = event.data;
    let textarea = data[0];
    sendTrace("me", "changed text", textarea.value, "notes");
}

/**
 * Display the player's interface
 */
function displayPlayerProductionPanel(){
    $('.animatorOnly').css('display', 'none');
    $('.SWA_Production').css('display', 'block');
    $('.SWA_Menu.SWA_Tools').css('display', 'block');
    $('.SWA_Mosaic').css('display', 'none');
    clientGame.getProduction().selectTools(['createRect', 'color', 'moveElement',
                                            'centerSVG', 'legend', 'fullScreen']);
}

/**
 * Display the animator's interface
 */
function displayAnimatorProductionPanel(){
    $('.playerOnly').css('display', 'none');
    $('.animatorOnly').css('display', 'block');
    clientGame.getProduction().selectTools(['moveElement', 'centerSVG', 'legend',
                                            'fullScreen', 'cast']);
    $('.SWA_Production').css('display', 'none');
    $('.SWA_Menu').css('display', 'none');
    $('.SWA_Mosaic').css('display', 'block');
    // Animator doesn't need to have the "next player" button
    $('div#gameBar > div > div:nth-child(7) > div.box > div.row:first-child').
        css('height', '100%');
    $('div#gameBar > div > div:nth-child(7) > div.box > div.row:last-child').
        css('display', 'none');
    // animator has not a privacy button, consequently we can increase
    // the height of the foreign's production access container
    $('.foreingProdAccess').css('height', '72%');
}

function sendTrace(actor, action, value, target){
    socket.emit('trace', {'actor': actor, 'action': action, 'value': value, 'target': target});
}

/**
 * Initialize the production panel interface
 * - creates a button to access to his production
 * - if the player is the animator, hides player's tools
 *   else hides animator's tools
 */
function initializeProductionPanel(){
    $('.myAccess > div')[0].id = sessionStorage.pseudo + '_productionAccess';
    $('.myAccess > div').attr('onclick', 'changeDisplayedProduction(' + $('.myAccess > div')[0].id + ')');
    clientGame.initProduction($('.SWA_Master'), false);
    if(sessionStorage.role === 'player'){
        displayPlayerProductionPanel();
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
    sendTrace("me", cmd, null, "notes");
}

/**
 * Changes the color of the individual timer
 * This function is used to change the current player's individual timer
 *
 * @param {String} sandColor : color of the timer's background
 * @param {String} hourglassColor : color of the timer's circle and lines
 */
function individualTimerColor(sandColor, hourglassColor){
    $('.sandStroke').css('stroke', sandColor);
    $('.sandFill').css('fill', sandColor);
    $('.hourglassStroke').css('stroke', hourglassColor);
}

/**
 * Starts the individual timer's animation
 *
 * @param {Number} begin : delay before than the animation starts
 * @param {Number} duration : animation's duration
 */
function indivTimerAnimation(begin, duration){
    let animations = $('.indivTimerAnimation');
    for(let index = 0; index < animations.length; index++){
        animations[index].setAttribute('dur', duration + 's');
        animations[index].beginElementAt(begin);
    }
}

/**
 * Checks if the button used to roll the die is displayed
 * @return {Boolean} : true : button displayed, false : button hidden
 */
function isDiceDisplayed(){
    return $('#startDice').css('display') !== 'none';
}

/**
 * Displays the button used to roll the die
 */
function showDice() {
    $('svg#hourglassSVG > :first-child > :nth-child(2)').get(0).setAttribute('display', 'none');
    $('svg#hourglassSVG > :nth-child(2)').get(0).setAttribute('display', 'none');
    $('svg#hourglassSVG > :nth-child(3)').get(0).setAttribute('display', 'none');
    $('#startDice').get(0).style.display = "block";
}

/**
 * Hides the button used to roll the die
 */
function hideDice() {
    $('svg#hourglassSVG > :first-child > :nth-child(2)').get(0).setAttribute('display', 'block');
    $('svg#hourglassSVG > :nth-child(2)').get(0).setAttribute('display', 'block');
    $('svg#hourglassSVG > :nth-child(3)').get(0).setAttribute('display', 'block');
    $('#startDice').get(0).style.display = "none";
}

/**
 * Updates colors in the productions access bar
 * - dark blue color for the player who have the die
 * - blue color for the next player
 */
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

/**
 * Displays the scene used play die animation
 */
function displayScene() {
    $('.productionContainer').css('display', 'none');
    let parentScene = $('.productionHeader')[0];
    let scene = document.createElement('div');
    scene.id = 'scene';
    scene.style.display = 'flex';
    scene.style.height = '100%';
    scene.style.width = '91%';
    parentScene.insertBefore(scene, null);
}

function centerMosaicChannel(playerChannel){
    clientGame.getMosaic().getMosaicChannels()[playerChannel].centerSVGToDefaultPosition();
}

/**
 * Force foreign's production refresh even if the player consults it
 * /!\ This function can annoy the player because the viewbox can change
 */
function actualizeForeignProduction(pseudo){
    let currentProductionOwner = getCurrentProductionOwner();
    if(currentProductionOwner === pseudo){
        // hide the background image to display the production
        if(clientGame.getProduction().isPrivate()){
            clientGame.getProduction().productionPublic();
            $('#wizz').css('display', 'none');
        }
        clientGame.getProduction().clearSVG();
        clientGame.getProduction().restoreProduction(clientGame.getPlayersProduction()[pseudo]['production']);
        clientGame.getProduction().restoreLegend(clientGame.getPlayersProduction()[pseudo]['legend']);
    }
}

function sendCastedProductionData(){
    socket.emit('castedProductionData', clientGame.getProduction().getDataToCastProduction());
}

/**
 * Displays the panel on which the animator can choose players with which he wants
 * to share (cast/stream) the production
 */
function displayCastOptionPanel(){
    $('#castOption').css('display', 'block');
    let players = clientGame.getOnlinePlayers();
    let container = $('#castOption select');
    container.children().remove(); // we will replace old data by the data we have received
    for(let index = 0; index < players.length; index++){
        if(players[index] != sessionStorage.pseudo){
            container.append('<option value="' + players[index] + '">' + players[index] + '</option>');
        }
    }
    container.multiselect();
}

/**
 * Displays the animator cast interface and sends the casted production to the
 * selected players
 * @param {string array} players : list of players with which share the
 *                                 casted production
 */
function castProduction(players){
    displayAnimatorCastPanel();
    let currentProductionOwner = getCurrentProductionOwner();
    socket.emit('castProduction', {'pseudo': currentProductionOwner,
                                   'production': clientGame.getProduction().saveProduction(),
                                   'legend': clientGame.getProduction().saveLegend(),
                                   'players': players});
    socket.emit('newSpectator', {'pseudo': sessionStorage.pseudo});
    castControler = setInterval(sendCastedProductionData, 1000);
}

/**
 * Manage the production's bar content
 * If the bar is hidden, only the displayer button is displaying
 */
function hideProductionBar(){
    $('.productionsAccessBar .productionsAccessBarContent').css('display', 'none');
    $('.productionsAccessBar .productionsAccessBarDisplayer').css('width', '100%');
}

/**
 * Manage the production's bar content
 * If the bar is displayed, displayer button and bar's content will are displaying
 */
function displayProductionBar(){
    $('.productionsAccessBar .productionsAccessBarContent').css('display', 'block');
    $('.productionsAccessBar .productionsAccessBarDisplayer').css('width', '10%');
}

function displayQuestionsList(){
    displayPanel($('.questionsList'), 'flex');
}

function hideQuestionsList(){
    $('#productionPanel').css('display', 'block');
    $('.questionsList').css('display', 'none');
}

/**
 * @return {String} : pseudo of the current production owner
 * /!\ : only works if productions accessors id are of the form :
 * "pseudo_productionAccess" ( with pseudo the production's owner pseudo )
 */
function getCurrentProductionOwner(){
    return $('.selectedProduction')[0].id.split('_')[0];
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

// Displays or hides productions selector bar
$("#displayList").on("click", function(){
    let productionList = $(".productionsAccessBar");
    let productionArea = $(".productionContainer");
    let displayButton = $("#displayList");
    if(displayButton.val() == 'hidden'){ // if tool bar is hidden, we display it
        displayButton.val('displayed');
        productionList.css('width', '1%');
        productionArea.css('width', '99%');
        hideProductionBar();
        displayButton.css('background-image', 'url("/img/gamerModule/display.svg")');
    }else{ // if tool bar is displayed, we hide it
        displayButton.val('hidden');
        productionList.css('width', '9%');
        productionArea.css('width', '91%');
        displayProductionBar();
        displayButton.css('background-image', 'url("/img/gamerModule/hide.svg")');
    }
    clientGame.getProduction().resizeProductionArea();
});

/**
  * allow to change the privacy state of the production
  * - public : production is shared with all players
  * - limited : production is shared only with the animator
  * - private : production is shared with nobody
  */
$("#setPrivacy").on("click", function(){
    let privacy = $("button#setPrivacy");
    switch (privacy.val()) {
        case 'public':
            privacy.css('background-image', 'url("/img/gamerModule/limited.svg")');
            privacy.val('limited');
            break;
        case 'limited':
            privacy.css('background-image', 'url("/img/gamerModule/private.svg")');
            privacy.val('private');
            break;
        case 'private':
            privacy.css('background-image', 'url("/img/gamerModule/public.svg")');
            privacy.val('public');
            break;
    }
});

$("#startDice").on("click", function () {
    displayScene();
    initScene();
    throwDie();
    hideDice();
    // if player waits to long to roll the die, the die rolls automatically
    clientGame.stopWaitsForDiceProcess();
    $('circle.hourglassStroke')[0].classList.remove('rollTheDice');
    if(clientGame.getUseTimer()){
        let data = clientGame.getTimersData();
        clientGame.startIndivTimer(0, data['indivTimer']);
        socket.emit('startIndivTimer', {'begin': 0, 'duration': data['indivTimer']});
        if(data['forceEndOfTurn'] && data['currentPlayer'] === sessionStorage.pseudo){
            clientGame.forceEndOfTurn(data['delayBeforeForcing'], skipTurn);
        }
    }
});

$('#endOfTurn').on('click', function(){
    if(clientGame.getCurrentPlayer() === sessionStorage.pseudo){
        socket.emit('endOfTurn', null);
        clientGame.stopIndivTimer();
        hideDice();
    }
});

$('#wizz').on('click', function(){
    let targetedPlayer = getCurrentProductionOwner();
    socket.emit('message', {'dest': targetedPlayer, 'msg': 'I would like to consult your production'});
});

$('#questions').on('click', function(){
    socket.emit('getPlayersQuestion', null);
});

$('.questionsList button').on('click', function(){
    hideQuestionsList();
});

$(window).on('beforeunload', function(){
    if($('.spectatorsList').css('display') !== 'none'){
        $('.spectatorsListBottom button').click();
    }
});

// ---------------------------------------------------------------------
// ----------------------- SOCKET LISTENERS ----------------------------
// ---------------------------------------------------------------------

socket.on('initGameTime', function(data){
    clientGame.setAnimator(data['animator']);
    clientGame.setPlayers(data['players']);
    createPlayersProductionList(data['players']);
    actualizeChatPlayersList(data['players']);
    // init placeholder used in the interface ( we do that with JS to have access to the translater)
    $('#inputBox').attr('placeholder', $.i18n('chatPlaceholder'));
    $('#notesArea').attr('placeholder', $.i18n('notesPlaceholder'));
    if(sessionStorage.pseudo === clientGame.getAnimator()){
        clientGame.createMosaic($('.SWA_Master'), data['players']);
        $('#globalTimer').css('border-right', '2px solid black');
    }
    if(data['useTimer']){
        clientGame.startGolbalTimer(data['globalTimer']);
    }
});

/**
 * Process "changeDuringGameTime" message
 * This message is send by the server when a player leaves the game
 * When we receive this message, we need to update the interface and game state
 *
 * form of received data : {'players': updated list of players}
 */
socket.on('changeDuringGameTime', function(data){
    clientGame.updatePlayersState(data['players']);
    updatePlayersState();
    actualizeChatPlayersList(clientGame.getOnlinePlayers());
    if(sessionStorage.pseudo === clientGame.getAnimator()){
        clientGame.createMosaic($('.SWA_Master'), clientGame.getOnlinePlayers());
        clientGame.getMosaic().refreshMosaic(clientGame.getPlayersProduction());
    }
});

/**
 * Process "playersProduction" message
 * This message is received when the server shares players production
 *
 * form of received data : list of dictionary
 * Dictionaries have this form : {'pseudo': player's pseudo,
 *                                'production': player's production,
 *                                'privacy': production's privacy}
 */
socket.on('playersProduction', function(data){
    clientGame.addNewProduction(data['pseudo'], data['production'], data['legend']);
    actualizePlayersProductionList();
    //actualizeForeignProduction(data['pseudo']);
    if(sessionStorage.pseudo === clientGame.getAnimator() && clientGame.getMosaic().isMosaicDisplayed()){
        clientGame.getMosaic().refreshMosaic(clientGame.getPlayersProduction());
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
    if(sessionStorage.pseudo !== clientGame.getAnimator() && !isCastPanelDisplayed()){
        let currentProduction = $('.selectedProduction');
        let privacy = $("button#setPrivacy");
        let data = {'pseudo': sessionStorage.pseudo,
                    'production': clientGame.getProduction().saveProduction(),
                    'legend': clientGame.getProduction().saveLegend(),
                    'privacy': privacy[0].value};

        if(currentProduction[0].id.split('_')[0] == sessionStorage.pseudo){
            // player works on his production, we send the current version
            data['production'] = clientGame.getProduction().saveProduction();
        }else{
            // player is on another production, the last version of his production has been saved in playersProduction
            data['production'] = clientGame.getPlayersProduction()[sessionStorage.pseudo]['production'];
        }
        socket.emit('shareMyProduction', data);
    }
});

/**
 * Process "newTurn" message
 * This message is send by the server to actualize the game state
 * When we receive this message we actualize the game state and check if
 * we are the player for who it's the turn
 *
 * form of received data : {'currentPlayer': pseudo of the player for who it's the turn
 *                          'nextPlayer': pseudo of the next player,
 *                          'useTimer': boolean used to indicate if we need to activate the individual timer,
 *                          'indivTimer': individual timer's duration,
 *                          'forceEndOfTurn': boolean used to indicate if we need
 *                                            to force the end of the player's turn after a given delay,
 *                          'delayBeforeForcing': delay before than the player's turn will be automatically forced}
 */
socket.on('newTurn', function(data){
    clientGame.setState(data);
    actualizeGameState();
    clientGame.stopIndivTimer();
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

socket.on('startIndivTimer', function(data){
    indivTimerAnimation(data['begin'], data['duration']);
});

/**
 * Process "castProductionRequest" message
 * This message is send by the server when the animator will share a production
 * with a player
 * When we receive this message we display a panel used to retrieve the player's answer
 *
 * form of received data : {'pseudo': pseudo of the casted production's owner,
 *                          'question': question of the casted production's owner,
 *                          'production': casted production's data,
 *                          'legend': casted production's legend}
 */
socket.on('castProductionRequest', function(data){
    clientGame.setCastedProductionData(data);
    displayCastRequestAlert();
});

/**
 * Process "castedProductionQuestion" message
 * This message is send by the server to the animator.
 * It's allow the animator to display the question of the casted production's owner
 *
 * form of received data : {'pseudo': pseudo of the casted production's owner,
 *                          'question': question of the casted production's owner}
 */
socket.on('castedProductionQuestion', function(data){
    $('.spectatorsListBottom input[name="pseudo"]').val(data['pseudo']);
    $('.spectatorsListBottom input[name="question"]').val(data['question']);
});

/**
 * Process "newSpectator" message
 * This message is send by the server to inform all players than a new player
 * has accepted the animator's request
 * It allow to the animator to know which players follow the "cast"
 *
 * form of received data : {'pseudo': pseudo of the player who has accepted the request}
 */
socket.on('newSpectator', function(data){
    let spectatorsList = $('.spectatorsListContent');
    if(spectatorsList.find('#profil' + data['pseudo']).length == 0){
        spectatorsList.append(addPlayerBox(data['pseudo'], 'col-lg-12 col-md-12 col-sm-12'));
        setPP(data['pseudo']);
    }
});

/**
 * Process "castedProductionData" message
 * This message is used to receive data required to apply animator's changes
 * (on the casted production) on the player side.
 */
socket.on('castedProductionData', function(data){
    if(isCastPanelDisplayed()){
        clientGame.getProduction().updateCastedProduction(data);
    }
});


/**
 * Process "leaveCast" message
 * This message is send by the server when a player leaves the cast panel
 * It allow to the animator to know which players follow the "cast"
 *
 * form of received data : {'pseudo': player who has left the cast}
 */
socket.on('leaveCast', function(data){
    let spectatorsList = $('.spectatorsListContent');
    spectatorsList.find('#profil' + data['pseudo']).remove();
});

/**
 * Process "endOfCast" message
 * This message is send by the server when the animator has stoped the "to cast"
 * When we receive this message, we close the cast panel and we restore the
 * production on which we was working before the "cast"
 *
 * form of received data : no data (null)
 */
socket.on('endOfCast', function(data){
    $('.spectatorsListContent').empty();
    if(isCastRequestAlertDisplayed()) hideCastRequestAlert();
    if(isCastPanelDisplayed()){
        hideCastPanel();
        let currentProductionOwner = getCurrentProductionOwner();
        clientGame.getProduction().clearSVG();
        clientGame.getProduction().restoreProduction(clientGame.getPlayersProduction()[currentProductionOwner]['production']);
        clientGame.getProduction().centerSVGToDefaultPosition();
        clientGame.getProduction().restoreLegend(clientGame.getPlayersProduction()[currentProductionOwner]['legend']);
    }
});

/**
 * Process "playersQuestion" message
 * This message allow us to retrieve players question
 *
 * form of received data : {'players': players list (used to build the questions panel),
 *                          'questions': dictionary ('pseudo': 'question') which contains players question}
 */
socket.on('playersQuestion', function(data){
    $('.questionsList').find('.questionsDisplayer').remove();
    displayQuestionsList();
    createQuestionDisplayer($('.questionsListContent'), data['players']);
    displayPlayersQuestion($('.questionsListContent'), data['questions']);
});

socket.on('dataError', function(data){
    switch (data['error']) {
        case 'FATAL':
            sessionStorage.server = null;
            sessionStorage.role = null;
            window.location = '/'; // redirection to the main page
            break;
        default:
            console.log('error !!');
    }
});

// ---------------------------------------------------------------------
// ------------------------ SVG ADDING TOOLS ---------------------------
// ---------------------------------------------------------------------

function fullscreenProduction(){
    // hide around containers
    $('#chatInfos').css('display', 'none');
    $('#gamePanel > :nth-child(2)').css('height', '95%');
    $('.productionBar').css('display', 'none');
    clientGame.getProduction().resizeProductionArea();
}

function exitFullscreenProduction(){
    // display around containers
    $('#chatInfos').css('display', 'block');
    $('#gamePanel > :nth-child(2)').css('height', '70%');
    $('.productionBar').css('display', 'flex');
    clientGame.getProduction().resizeProductionArea();
}

$('button[name="fullScreen"]').on("click", function(){
    let fullscreen = "/img/gamerModule/fullscreen.png";
    let notFullscreen = "/img/gamerModule/notFullscreen.png";
    if($(this).val() === 'off'){
        $(this).css('background-image', 'url("' + notFullscreen + '")');
        $(this).val('on');
        fullscreenProduction();
    }else{
        $(this).css('background-image', 'url("' + fullscreen + '")');
        $(this).val('off');
        exitFullscreenProduction();
    }
});

function displayCastRequestAlert(){
    $('#castRequest').css('display', 'block');
}

function hideCastRequestAlert(){
    $('#castRequest').css('display', 'none');
}

function isCastRequestAlertDisplayed(){
    return $('#castRequest').css('display') !== 'none';
}

function displayCastPanel(){
    $('.productionHeader').css('height', '90%');
    $('.productionBottom').css('display', 'block');
    $('.productionBottom').css('height', '10%');
    $('.productionsAccessBar').css('display', 'none');
    $('.spectatorsList').css('display', 'block');
    $('.spectatorsListBottom').css('display', 'flex');
    $('.productionContainer').css('width', '91%');
    $('#production').css('width', '94%');
    $('.menu').css('width', '6%');
    $('.menu').css('background', 'linear-gradient(to bottom, grey , #1B1919)');
}

function displayAnimatorCastPanel(){
    displayCastPanel();
    clientGame.getProduction().selectTools(['createRect', 'color', 'moveElement',
                                            'centerSVG', 'legend']);
}

function displayPlayerCastPanel(){
    displayCastPanel();
    clientGame.getProduction().selectTools(['legend']);
}

function hideCastPanel(){
    $('.productionHeader').css('height', '');
    $('.productionBottom').css('display', '');
    $('.productionsAccessBar').css('display', '');
    $('.spectatorsList').css('display', '');
    $('.spectatorsListBottom').css('display', '');
    $('.productionContainer').css('width', '');
    $('#svgMenu').css('display', '');
    $('.menu').css('width', '');
    $('.menu > div > :not(#legend').css('display', '');
    $('.menu').css('background', 'linear-gradient(to left, grey , #1B1919)');
    $('#production').css('width', '');
    if(clientGame.getAnimator() == sessionStorage.pseudo){
        $('.playerOnly').css('display', 'none');
        clientGame.getProduction().selectTools(['moveElement', 'centerSVG', 'legend',
                                                'fullScreen', 'cast']);
    }else{
        $('.animatorOnly').css('display', 'none');
        clientGame.getProduction().selectTools(['createRect', 'color', 'moveElement',
                                                'centerSVG', 'legend', 'fullScreen']);
    }
}

function isCastPanelDisplayed(){
    return $('.spectatorsList').css('display') !== 'none';
}

function displayPanel(panel, layout){
    panel.parent().children().css('display', 'none');
    panel.css('display', layout);
}

/**
 * This button is used to accept the cast
 */
$('#castRequest .confirm').on('click', function(){
    hideCastRequestAlert();
    displayPlayerCastPanel();
    // if player work on his production, we save it before
    let currentProductionOwner = getCurrentProductionOwner();
    if(currentProductionOwner === sessionStorage.pseudo){
        clientGame.addNewProduction(sessionStorage.pseudo,
                                    clientGame.getProduction().saveProduction(),
                                    clientGame.getProduction().saveLegend());
    }
    // displays the casted production and the question / pseudo of the owner
    let castedProductionData = clientGame.getCastedProductionData();
    clientGame.getProduction().clearSVG();
    clientGame.getProduction().restoreProduction(castedProductionData['production']);
    clientGame.getProduction().restoreLegend(clientGame.getCastedProductionData()['legend']);
    $('.spectatorsListBottom input[name="pseudo"]').val(castedProductionData['pseudo']);
    $('.spectatorsListBottom input[name="question"]').val(castedProductionData['question']);
    socket.emit('newSpectator', {'pseudo': sessionStorage.pseudo});
});

$('#castRequest .cancel').on('click', function(){
    hideCastRequestAlert();
});

/**
 * This button is used to leave the "cast" panel
 */
$('.spectatorsListBottom button').on('click', function(){
    if(clientGame.getAnimator() !== sessionStorage.pseudo){
        hideCastPanel();
        // the production on which he was working is restored
        let currentProductionOwner = getCurrentProductionOwner();
        clientGame.getProduction().clearSVG();
        clientGame.getProduction().restoreProduction(clientGame.getPlayersProduction()[currentProductionOwner]['production']);
        clientGame.getProduction().centerSVGToDefaultPosition();
        clientGame.getProduction().restoreLegend(clientGame.getPlayersProduction()[currentProductionOwner]['legend']);
        socket.emit('leaveCast', {'pseudo': sessionStorage.pseudo});
    }else{
        clearInterval(castControler);
        socket.emit('endOfCast', null);
    }
});

$('#castOption .confirm').on('click', function(){
    // all options checked in the dropdown
    var selected = $("#castOption select option:selected");
    var players = [];
    selected.each(function () {
        players.push($(this).val());
    });
    castProduction(players);
    // hide cast option panel and reset dropdown
    $('#castOption').css('display', 'none');
    $('li.active input').click();
});

$('#castOption .cancel').on('click', function(){
    // hide cast option panel and reset dropdown
    $('#castOption').css('display', 'none');
    $('li.active input').click();
});

$('button[name="cast"]').on('click', function(){
    let currentProductionOwner = getCurrentProductionOwner();
    if(!clientGame.getProduction().isPrivate()){
        displayCastOptionPanel();
    }
});
