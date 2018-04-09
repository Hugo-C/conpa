/**
 * Create a "box" to represent a player
 * A player is represented by a box containing his profil image and his pseudo
 *
 * @param {string} pseudo : player's pseudo
 */
function addPlayerBox(pseudo){
    var htmlBox = '<div id="profil' + pseudo + '" class="playerDisplayer col-lg-12 col-md-12 col-sm-12 col-xs-12">' +
                      '<div class="row">' +
                          '<img class="col-lg-12 col-md-12 col-sm-12 col-xs-12"/>' +
                      '</div>' +
                      '<div class="row">' +
                          '<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">' +
                              '<span>' + pseudo + '</span>' +
                          '</div>' +
                      '</div>' +
                  '</div>';
    return htmlBox;
}

/**
 * Change the border color of a player's box
 * Used to have a graphic visual to the players who have already defined their question
 *
 * @param {string} pseudo : pseudo of the player for which we want to change the box border color
 */
function actualizeBorderColor(pseudo){
    $('#profil' + pseudo).css('border-color', '#4FAB1A');
    $('#profil' + pseudo + '> div').css('border-color', '#4FAB1A');
}

/**
 * Initialize the exit panel. Display all players of the game
 */
function initGUI(){
  var parentTag = $("#exitPanel > :nth-child(2) > div");
  parentTag.empty(); // remove all child nodes to refresh the list
  $('#exitMessage').text(''); // remove old messages
  for(var index = 0; index < playersList.length; index++){
      parentTag.append(addPlayerBox(playersList[index]));
      setPP(playersList[index]);
  }
}

/**
 * Catch click event on exit button
 * On click in this button, we display the exit panel
 */
$("#exit").on("click", function(){
    $('#gamePanel > :nth-child(2)').css('display', 'none'); // hide productionArea panel
    $('#exitPanel').css('display', 'block'); // display exit panel
    initGUI(); // initialize exit panel
    //convertSvgTagToSvgFile();
});

/**
 * Catch click event on closeExitPanel button
 * On click in this button, hide the exit panel and display the productionArea panel
 */
$("#closeExitPanel").on("click", function(){
    $('#gamePanel > :nth-child(2)').css('display', 'block'); // display productionArea panel
    $('#exitPanel').css('display', 'none'); // hide exit panel
});

/**
 * Catch click event on leaveAlone button
 * This button his used to leave the game alone
 */
$("#leaveAlone").on("click", function(){
    socket.emit('quitGame', {'pseudo': sessionStorage.pseudo,
                             'server': sessionStorage.server,
                             'production': getInlineSvg()}); // inform server that we leave the game
    sessionStorage.server = null;
    window.location = '/'; // redirection to the main web page
});

/**
 * Catch click event on leaveAlone button
 * This button is used to start a "stop game" processus
 *
 * Stop Game Processus :
 * When a player wants to stop the game, we asked to all players if they agree
 * - If all players agree, game is stoped
 * - If one or more players refused, game will not be stoped
 */
$("#stopGame").on("click", function(){
    socket.emit('processStopGame', null);
    actualizeBorderColor(sessionStorage.pseudo);
    $('#exitMessage').text('Waiting for other players');
});

/**
 * Catch click event on validateExit button
 * This button is used to accept a stop game processus
 */
$("#validateExit").on("click", function(){
    socket.emit('stopGame', {'exit': true}); // sends our answer to the server
    $('#exitMessage').text('Waiting for other players');
});

/**
 * Catch click event on cancelExit button
 * This button is used to refuse a stop game processus
 */
$("#cancelExit").on("click", function(){
    socket.emit('stopGame', {'exit': false}); // sends our answer to the server
    $("#closeExitPanel").click();
});

/**
 * Process the "stopGame?" message
 * This message is send by the server when a player wants to stop the game
 * When this message is received, we display the exit game panel to ask to
 * the player if he agree with it
 *
 * form of received data (playersWhoWantStop) : list of players who want to stop the game
 */
socket.on('stopGame?', function(playersWhoWantStop){
    $('#exitPanelTitle').text(playersWhoWantStop[0] + ' wants to stop game, agree ?');
    // hide "leaveAlone", "stopGame" and "closeExitPanel" buttons
    // When a "Stop Game Processus" is started, we need only the buttons used to answer
    $('#leaveAlone').css('display', 'none');
    $('#stopGame').css('display', 'none');
    $('#closeExitPanel').css('display', 'none');
    // display buttons used to answer
    $('#validateExit').css('display', 'block');
    $('#cancelExit').css('display', 'block');
    $('#exit').click(); // display the exit panel
    actualizeBorderColor(playersWhoWantStop[0]); // change border color of the player who have start the "Stop Game Processus"
});

/**
 * Process "refreshExitPanel" message
 * This message is send by the server when a change occured
 * When this message is received, we display the message sends with it
 *
 * form of received data (playersWhoWantStop) : list of players who want to stop the game
 */
socket.on('refreshExitPanel', function(playersWhoWantStop){
    for(var index = 0; index < playersWhoWantStop.length; index++){
        actualizeBorderColor(playersWhoWantStop[index]);
    }
});

/**
 * Process "stopGameProcessAborted" message
 * This message is send by the server when a "Stop Game Processus" is aborted (a player has refused)
 * When this message is received, we display the basic exit panel interface
 *
 * form of received data : no data is send with this message !
 */
socket.on('stopGameProcessAborted', function(data){
    $('#exitMessage').text('Game will not be stopped because more than one player want continue');
    $('#exitPanelTitle').text('Exit the game ?');
    // We are not in a "Stop Game Processus", we display the basic buttons
    $('#leaveAlone').css('display', 'block');
    $('#stopGame').css('display', 'block');
    $('#closeExitPanel').css('display', 'block');
    // We don't need buttons used in a "Stop Game Processus", we hide these
    $('#validateExit').css('display', 'none');
    $('#cancelExit').css('display', 'none');
});

/**
 * Process "gameEnd" message
 * This message is sends by the server when all players have agree to stop the game
 * When this message is received, we exit the game
 *
 * form of received data : no data is send with this message !
 */
socket.on('gameEnd', function(data){
    console.log("EXIT GAME");
    $('#leaveAlone').click();
});
