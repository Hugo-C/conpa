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
});

/** Process gameStart message
 *  When this message is received, we move to the game module page
 */
socket.on('gameStart', function(data){
    console.log("GAME START !!!!");
    sessionStorage.server = data['server'];
    window.location = '/gamerModule';
});

/** allows to select a row in the server list */
$('#serverList').on('click', 'tbody tr', function(){
    $('#serverList tbody .selected').removeClass('selected');
    $(this).addClass('selected');
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

    if(serverData['server']['name'] == ""){
        placesErrorDisplayer.text("Server name can't be empty");
        conform = false;
    }

    if(serverData['server']['places'] <= 0){
        placesErrorDisplayer.text("server can't have less than 1 places");
        conform = false;
    }

    if(serverData['server']['indivTimer'] <= 0 || serverData['server']['appropriation'] <= 0 || serverData['server']['globalTimer'] <= 0){
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
    var selectedServer =  $('#serverList tbody .selected').children()[0];
    if(selectedServer != null){
        console.log("joining server : " + selectedServer.innerHTML);
        socket.emit('joinServer', {'server': selectedServer.innerHTML});
    }
});
