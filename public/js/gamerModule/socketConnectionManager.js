var socket = io();

$("#pseudo").text(sessionStorage.pseudo);

socket.emit('joinGame', {'pseudo': sessionStorage.pseudo,
                         'server': sessionStorage.server});

socket.on('players', function(players){
    console.log(players);
    for(var index in players){
        if(players[index] != sessionStorage.pseudo){
            $('#chatPlayers').append($('<option>', {
                value: players[index],
                text : players[index]
            }));
        }
    }
});
