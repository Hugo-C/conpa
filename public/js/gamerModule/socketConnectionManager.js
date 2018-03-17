var socket = io();

// displays pseudo on the screen
$("#pseudo").text(sessionStorage.pseudo);

// informs the server that we have joined the game
socket.emit('joinGame', {'pseudo': sessionStorage.pseudo,
                         'server': sessionStorage.server});

/**
 * Process the players message
 * Displays the list of player in the tchat
 *
 * @param {string array} players : array which contain the list of players's pseudo
 */
socket.on('players', function(players){
    console.log(players);
    var playerSelector = $('#chatPlayers');
    playerSelector.children().remove();
    playerSelector.append('<option value="all">general</option>');
    for(var index in players){
        if(players[index] != sessionStorage.pseudo){ // we not displays the pseudo of the current player
            playerSelector.append($('<option>', {
                value: players[index],
                text : players[index]
            }));
        }
    }
});

$("#exit").on("click", function(){
    socket.emit('quitGame', {'pseudo': sessionStorage.pseudo, 'server': sessionStorage.server});
    sessionStorage.server = null;
    window.location = '/';
});
