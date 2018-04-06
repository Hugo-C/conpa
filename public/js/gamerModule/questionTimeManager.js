var socket = io();

// informs the server that we have joined the game
socket.emit('joinGame', {'pseudo': sessionStorage.pseudo,
                         'server': sessionStorage.server});

// Display the questions guide
$('#projector').on('click', function(){
    var image_on = '/img/gamerModule/power_on.png'; // used to check if projector is on (and to change button's image)
    var image_off = '/img/gamerModule/power_off.png'; // used to check if projector is off (and to change button's image)
    if($('#projector').css('background-image').includes(image_off)){ // projector is off, we turn it on
        $('#projector').css('background-image', 'url("' + image_on + '")');
        $('#guide').css('visibility', 'visible');
        $('#guide').css('opacity', 1);
    }else{ // projector is on, we turn it off
        $('#projector').css('background-image', 'url("' + image_off + '")');
        $('#guide').css('opacity', 0);
        $('#guide').css('visibility', 'hidden');
    }
});

/**
 * Create a "box" to represent a player
 * A player is represented by a box containing his profil image and his pseudo
 *
 * @param {string} pseudo : player's pseudo
 */
function addPlayerBox(pseudo){
    var htmlBox = '<div id="profil' + pseudo + '" class="playerDisplayer col-lg-2 col-md-2">' +
                      '<div class="row">' +
                          '<img class="col-lg-12 col-md-12"/>' +
                      '</div>' +
                      '<div class="row">' +
                          '<div class="col-lg-12 col-md-12">' +
                              '<span>' + pseudo + '</span>' +
                          '</div>' +
                      '</div>' +
                  '</div>';
    return htmlBox;
}

/**
 * Display for each these two players a box which reprensented a player graphicaly
 * and for each these two players a bubble to later display his question
 *
 * Used to display two players and their question. We display two players at once to have
 * two players on the same line
 *
 * @param {string} player1 : first player's pseudo
 * @param {string} player2 : second player's pseudo
 */
function addTwoPlayers(player1, player2){
    var parentTag = $('#playersQuestion');
    var html ='<div class="questionsDisplayer rowFlexContainer">' +
                  addPlayerBox(player1) +
                  '<div class="col-lg-8 col-md-8">' +
                      '<div class="row">' +
                          '<div id="question' + player1 + '" class="rowFlexContainer col-lg-8 col-md-8 oval-thought-left">' +
                              '<span class="col-lg-12 col-md-12"></span>' +
                          '</div>' +
                          '<div id="question' + player2 + '" class="rowFlexContainer col-lg-offset-4 col-lg-8 col-md-offset-4 col-md-8 oval-thought-right">' +
                              '<span class="col-lg-12 col-md-12"></span>' +
                          '</div>' +
                      '</div>' +
                  '</div>' +
                  addPlayerBox(player2) +
              '</div>';
    parentTag.append(html);
}

/**
 * Display a box which reprensented the player graphicaly
 * and a bubble to later display his question
 *
 * Used to display one player and his question when there is only one player in the party
 * or when there is an impair numbers of player
 *
 * @param {string} player : player's pseudo
 */
function addOnePlayer(player){
    var parentTag = $('#playersQuestion');
    var html ='<div class="questionsDisplayer rowFlexContainer">' +
                  addPlayerBox(player) +
                  '<div class="col-lg-8 col-md-8">' +
                      '<div class="row">' +
                          '<div id="question' + player + '" class="rowFlexContainer col-lg-8 col-md-8 oval-thought-left">' +
                              '<span class="col-lg-12 col-md-12"></span>' +
                          '</div>' +
                          '<div class="col-lg-8 col-md-8 oval-thought-left" style="visibility: hidden"/>' +
                      '</div>' +
                  '</div>' +

                  '<div class="col-lg-2 col-md-2" style="visibility: hidden"/>' +
              '</div>';
    parentTag.append(html);
}

/**
 * Actualize the label which is used to display the numbers of player who
 * have already defined their question
 *
 * @param {integer} ready : numbers of player who have already defined their question
 * @param {integer} total : numbers of player in the game
 */
function actualizeNbReady(ready, total){
    var indicatorField = $('#nbReady');
    indicatorField.text(ready + ' / ' + total);
}


/**
 * Process "initQuestionTime" message
 * This message is send by the server when the party starts
 *
 * This function is used to initialize the interface with the list of players
 * in the game
 *
 * form of received data : list of the pseudo of the players in the game
 */
socket.on('initQuestionTime', function(players){
    $('#playersQuestion').empty();
    actualizeNbReady(0, players.length);
    if(players.length < 2){ // only one player in the game, we display it alone
        addOnePlayer(players[0]);
    }else{ // more than one player
        for(var index = 0; index < players.length - 1; index += 2){
            addTwoPlayers(players[index], players[index + 1]); // we display two players in the same line while we can
        }
        if(players.length % 3 == 0){
            addOnePlayer(players[players.length - 1]); // impair numbers of player, we display the last one alone
        }
    }
});

/**
 * Catch click event on the validate button
 * On click in this button, we send our question to the server
 */
$('#validate').on('click', function(){
    var question = $('#myQuestion').val();
    if(question != ''){
        socket.emit('recordMyQuestion', {'question': question});
    }
});

/**
 * Display player's question
 * Used to refresh a question when a player change his question
 *
 * @param {string} pseudo : pseudo of the player for which we want to refresh the question
 * @param {string} question : question to display
 */
function actualizePlayerQuestion(pseudo, question){
    console.log(pseudo + ' : ' + question);
    $('#question' + pseudo + ' > span').text(question);
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
 * Process the "actualizeQuestions" message
 * This message is send by the server when a question has changed
 *
 * form of received data : { 'ready': numbers of player who have already defined their question,
 *                           'playersQuestion': dictionnary of (player's pseudo, player's question) pair }
 */
socket.on('actualizeQuestions', function(data){
    var playersQuestion = data['playersQuestion'];
    actualizeNbReady(data['ready'], playersQuestion.length);

    for(var index = 0; index < playersQuestion.length; index++){
        actualizePlayerQuestion(playersQuestion[index]['player'], playersQuestion[index]['question']);
        if(playersQuestion[index]['question'] != ''){
            actualizeBorderColor(playersQuestion[index]['player']);
        }
    }
});

/**
 * Display the question on the gamer module page when game begin
 *
 * @param {object} playersQuestion : dictionnary of (player's pseudo, player's question) pair
 */
function displayMyQuestion(playersQuestion){
    for(var index = 0; index < playersQuestion.length; index++){
        if(playersQuestion[index]['player'] == sessionStorage.pseudo){
            $('span#question').text(playersQuestion[index]['question']);
        }
    }
}

/**
 * Process the "allQuestionsDefined" message
 * This message is send by the server when all players have defined their question
 *
 * When this message is received, we move to the game module page
 *
 * form of received data : { 'ready': numbers of player who have already defined their question,
 *                           'playersQuestion': dictionnary of (player's pseudo, player's question) pair }
 */
socket.on('allQuestionsDefined', function(data){
    $('#questionContent').css('display', 'none'); // hide question page
    $('#gameContent').css('display', 'block'); // display gamer module page
    displayMyQuestion(data['playersQuestion']);
    $("#pseudo").text(sessionStorage.pseudo); // displays pseudo on the screen
});
