
const WAITING_PLAYERS = "waiting for players";
const QUESTION_TIME = "question time";
const GAME_TIME = "game time";

// connection with the server socket
var socket = io();

// registered the client on server
socket.emit('pseudo', {'pseudo': sessionStorage.pseudo});

/**
 * Process serverListUpdate message
 * Displays available servers in the html table
 *
 * form of received data : data is a list of dictionnaries
 * dictionnaries are formed like that :
 * {'name': server's name, 'host': player who have create the game server,
 *  'animate': "yes" or "no", 'places': game server's capacity,
 *  'status' : "waiting for players" or "in game"}
 */
socket.on('serverListUpdate', function(data){
    var serverList = $('#serverList').find('tbody');
    serverList.children().remove();
    for(var server in data){
        serverList.append($('<tr class=' + data[server]['name'] + '>')
                    .append($('<td>' + data[server]['name'] + '</td>'))
                    .append($('<td>' + data[server]['host'] + '</td>'))
                    .append($('<td>' + data[server]['animate'] + '</td>'))
                    .append($('<td>' + data[server]['places'] + '</td>'))
                    .append($('<td>' + data[server]['status'] + '</td>')));
    }

    if(sessionStorage.server != null && sessionStorage.unload == 'false'){
        $('.' + sessionStorage.server).addClass('joining');
    }

});

/**
 * Process "serverRemoved" message
 * We receive this message when the server in which we are has been removed
 */
socket.on('serverRemoved', function(data){
    console.log('my server has been removed');
    sessionStorage.server = null;
});

/** Process "gameStart" message
 *  When this message is received, we move to the game module page
 */
socket.on('gameStart', function(data){
    console.log("GAME START !!!!");
    sessionStorage.server = data['server'];
    sessionStorage.unload = 'false';
    window.location = '/gamerModule';
});

/** allows to select a row in the server list */
$('#serverList').on('click', 'tbody tr', function(){
    $('#serverList tbody .selected').removeClass('selected');
    $(this).addClass('selected'); // selected class is used to know which server client want to join
    if($(this).children()[0].innerHTML == sessionStorage.server
    && $(this).children()[1].innerHTML == sessionStorage.pseudo
    && $(this).children()[4].innerHTML == WAITING_PLAYERS){
        $('#join').text('Remove'); // if it's his own server and if the game has not started, he can remove it
    }else if($(this).children()[0].innerHTML == sessionStorage.server
          && sessionStorage.unload == 'false'){
        $('#join').text('Exit'); // if he's not in his server and if the game has not started, he can leave it
    }else{
        $('#join').text('Join'); // if he's in no server, he can join it
    }
});

/** displays game server creator window */
$("#create").on("click", function(){

    $(".tabContent").css("display", "none");
    $(".serverManager").animate({"display": "block"}, 1000, function(){
        $(".serverManager").css("display", "block");
    });

    $("#gameTab").css('height', '70%');
    $("#gameTab").css('width', '50%');
    removeAllAlerts(); // in case of player have already try to create a server and he has been errors
});

/** displays server list */
$("#cancel").on("click", function(){

    $(".serverManager").css("display", "none");
    $(".tabContent").animate({"display": "block"}, 1000, function(){
        $(".tabContent").css("display", "block");
    });

    $("#gameTab").css('height', '100%');
    $("#gameTab").css('width', '100%');
});

/** Clear all alerts */
function removeAllAlerts(){
    $('.error_places').text('');
    $('.error_timers').text('');
}

/**
 * Check if server parameters are valid
 * This function is used to validate the server creation form
 *
 * @param {object} serverData : object containing all server parameters
 * @return {boolean} : indicates if parameters are valid or not
 */
function checkServerCreationForm(serverData){
    var placesErrorDisplayer = $('span.error_places');
    var timersErrorDisplayer = $('span.error_timers');
    removeAllAlerts();
    var conform = true;

    if(isNaN(serverData['server']['indivTimer']) || isNaN(serverData['server']['globalTimer'])
    || isNaN(serverData['server']['appropriation']) || isNaN(serverData['server']['places'])){
        placesErrorDisplayer.text("Fields can't be empty");
        conform = false;
    }

    if(serverData['server']['name'] == ""){
        placesErrorDisplayer.text("Server name can't be empty");
        conform = false;
    }

    if(serverData['server']['places'] <= 0){
        placesErrorDisplayer.text("server can't have less than 1 places");
        conform = false;
    }

    if(serverData['server']['indivTimer'] <= 0
    || serverData['server']['appropriation'] <= 0
    || serverData['server']['globalTimer'] <= 0){
        timersErrorDisplayer.text("timer can't be less than 0");
        conform = false;
    }else{

        if(serverData['server']['appropriation'] > serverData['server']['indivTimer']){
            timersErrorDisplayer.text("individual timer can't be less than the appropriation time");
            conform = false;
        }else if(serverData['server']['indivTimer'] > serverData['server']['globalTimer']){
            timersErrorDisplayer.text("global timer can't be less than the individual timer");
            conform = false;
        }

    }
    return conform;
}

/** Creating player game server */
$("#validate").on("click", function(){
    var serverName = $('input#name')[0].value;
    var role = $('input#role')[0].value;
    var indivTimer = parseInt($('input#indivTimer')[0].value);
    var appropriationTime = parseInt($('input#appropriation')[0].value);
    var places = parseInt($('input#places')[0].value);
    var globalTimer = parseInt($('input#globalTimer')[0].value);

    var data = {'role': role,
                'server': {'name': serverName,
                           'places': places,
                           'indivTimer': indivTimer,
                           'appropriation': appropriationTime,
                           'globalTimer': globalTimer}};

    if(checkServerCreationForm(data)){
        socket.emit('createServer', data);
        sessionStorage.server = serverName;
        sessionStorage.unload = 'false';
    }
});

/** Proccess server response send after the creation of a new server */
socket.on('serverCreated', function(data){
    if(data['error']){
        $('span.error_places').text(data['msg']);
    }else{
        $('#cancel').click(); // come back to the server list
    }
});

/** Joining the selected game server */
$("#join").on("click", function(){
    var selectedServer =  $('#serverList tbody .selected').children();
    if(selectedServer != null){ // look at the onclick listener on "serverList" to have more details about the below code
        if(selectedServer[0].innerHTML == sessionStorage.server
        && selectedServer[1].innerHTML == sessionStorage.pseudo
        && selectedServer[4].innerHTML == WAITING_PLAYERS){
            socket.emit('removeServer', {'server': selectedServer[0].innerHTML});
            sessionStorage.server = null;
            $('#join').text('Join');
        }else if(selectedServer[0].innerHTML == sessionStorage.server){
            socket.emit('exitServer', {'server': selectedServer[0].innerHTML});
            sessionStorage.server = null;
            $('#join').text('Join');
        }else{
            socket.emit('joinServer', {'server': selectedServer[0].innerHTML});
            sessionStorage.server = selectedServer[0].innerHTML;
            sessionStorage.unload = 'false';
        }
    }
});

$(window).on("load", function (evt) {
    // If the client reload his page and is connected to a server, we
    // reconnect his socket with his server
    if(sessionStorage.server != null
    && $('.' + sessionStorage.server) != null
    && sessionStorage.unload == 'false'){
        socket.emit('joinServer', {'server': sessionStorage.server});
    }
    $('#join').text('Join');
});
