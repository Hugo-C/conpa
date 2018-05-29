const WAITING_PLAYERS = 'waitingForPlayers';
const QUESTION_TIME = "questionTime";
const GAME_TIME = "gameTime";

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
    let serverList = $('#serverList').find('tbody');
    serverList.children().remove();
    for(let server in data){
        serverList.append($('<tr class=' + data[server]['name'] + '>')
            .append($('<td>' + data[server]['name'] + '</td>'))
            .append($('<td>' + data[server]['host'] + '</td>'))
            .append($('<td>' + data[server]['animate'] + '</td>'))
            .append($('<td>' + data[server]['places'] + '</td>'))
            .append($('<td>' + data[server]['status'] + '</td>')));
    }

    if(sessionStorage.server != null && sessionStorage.unload === 'false'){
        $('.' + sessionStorage.server).addClass('joining');
    }
});

/**
 * Process "serverRemoved" message
 * We receive this message when the server in which we are has been removed
 */
socket.on('serverRemoved', function(){
    console.log('my server has been removed');
    sessionStorage.server = null;
    sessionStorage.role = null;
});

/** Process "gameStart" message
 *  When this message is received, we move to the game module page
 */
socket.on('gameStart', function(data){
    console.log("GAME START !!!!");
    sessionStorage.server = data['server'];
    if(data['animator'] !== sessionStorage.pseudo){
        console.log(data['animator'] + " != " + sessionStorage.pseudo);
        sessionStorage.role = 'player';
    }else{
        console.log(data['animator'] + " == " + sessionStorage.pseudo);
        sessionStorage.role = 'animator';
    }
    sessionStorage.unload = 'false';
    window.location = '/gamerModule';
});

/** allows to select a row in the server list */
$('#serverList').on('click', 'tbody tr', function(){
    $('#serverMsg').text(''); // remove alerts
    $('#serverList tbody .selected').removeClass('selected');
    $(this).addClass('selected'); // selected class is used to know which server client want to join

    if($(this).children()[1].innerHTML === sessionStorage.pseudo
    && $(this).children()[4].innerHTML === $.i18n(WAITING_PLAYERS)){
        $('#join').text('Remove'); // if it's his own server and if the game has not started, he can remove it
    }else if($(this).children()[0].innerHTML === sessionStorage.server
          && sessionStorage.unload === 'false'){
        $('#join').text('Exit'); // if he's not in his server and if the game has not started, he can leave it
    }else{
        $('#join').text('Join'); // if he's in no server, he can join it
    }
});

function populateSMTable(data){
    displayCardGames('gameTab', 'cardgames', data);
}

$('#gameTab .cardgameInfoPanel button').on('click', function(){
    displayPanel($('#gameTab'), $('#serverManager'), '90%', '50%');
});

/** displays game server creator window */
$("#create").on("click", function(){
    displayPanel($('#gameTab'), $('#serverManager'), '90%', '50%');
    refreshCardGames([], populateSMTable);
    refreshTags($('#serverManager select'));
    removeAllAlerts(); // in case of player have already try to create a server and he has been errors
});

/** allows to select a row in the server list */
$('#cardgames').on('click', 'tbody tr', function(){
    $('#cardgames tbody .selected').removeClass('selected');
    $(this).addClass('selected');
});

$('#serverManager button.filter').on('click', function(){
    var selected = $("#serverManager select option:selected");
    var tags = [];
    selected.each(function () {
        tags.push($(this).val());
    });
    refreshCardGames(tags, populateSMTable);
});

function sortGameTable(n){
    sortTable(n, 'serverList');
}

function sortSMTable(n){
    sortTable(n, 'cardgames');
}

function displayTimersOption(display){
    $('.timersOption').css('display', display ? 'block' : 'none');
}

function displayForceTurnOption(display){
    $('.forceTurnOption').css('display', display ? 'block' : 'none');
}

$('#role').on('click', function(){
    if($(this).val() === 'player'){
        $(this).val('animator');
    }else if($(this).val() === 'animator'){
        $(this).val('player');
    }
});

$('#timers').on('click', function(){
    if($(this).val() === 'no'){
        $(this).val('yes');
        displayTimersOption(true);
    }else if($(this).val() === 'yes'){
        $(this).val('no');
        displayTimersOption(false);
    }
});

$('#forceTurn').on('click', function(){
    if($(this).val() === 'no'){
        $(this).val('yes');
        displayForceTurnOption(true);
    }else if($(this).val() === 'yes'){
        $(this).val('no');
        displayForceTurnOption(false);
    }
});

$('.settingCategory').on('click', function(){
    let button = $(this).find('button');
    if(button.val() == 'display'){
        button.val('hide');
        button.parent().next().css('display', 'none');
    }else{
        button.val('display');
        button.parent().next().css('display', 'block');
    }
});

function hideGameManagerTabs(){
  let hideButtons = $('#serverManager .settingCategory button[value="display"]');
  for(let index = 0; index < hideButtons.length; index++){
      $(hideButtons[index]).click();
  }
}

/** displays server list */
$("#cancel").on("click", function(){
    displayPanel($('#gameTab'), $('#gameTab .tabContent'), '100%', '100%');
    hideGameManagerTabs();
});

/** Clear all alerts */
function removeAllAlerts(){
    $('.errorBasicSettings').text('');
    $('.errorCardGame').text('');
    $('.errorTimersSettings').text('');
}

/**
 * Check if server parameters are valid
 * This function is used to validate the server creation form
 *
 * @param {object} serverData : object containing all server parameters
 * @return {boolean} : indicates if parameters are valid or not
 */
function checkServerCreationForm(serverData){
    let basicErrorDisplayer = $('span.errorBasicSettings');
    let cardgameErrorDisplayer = $('span.errorCardGame');
    let timersErrorDisplayer = $('span.errorTimersSettings');
    removeAllAlerts();
    let conform = true;

    // Checking basic settings
    if(isNaN(serverData['server']['indivTimer']) || isNaN(serverData['server']['globalTimer'])
    || isNaN(serverData['server']['appropriation']) || isNaN(serverData['server']['places'])){
        basicErrorDisplayer.text($.i18n("noEmptyFields"));
        conform = false;
    }
    if(serverData['server']['name'] === ""){
        basicErrorDisplayer.text($.i18n("nameIsRequired"));
        conform = false;
    }
    if(serverData['role'] === 'animator' && serverData['server']['places'] === 1){
        basicErrorDisplayer.text($.i18n("noAnimatorWithoutPlayers"));
        conform = false;
    }
    if(serverData['server']['places'] <= 0){
        basicErrorDisplayer.text($.i18n("onePlaceMin"));
        conform = false;
    }

    if($('#cardgames tbody .selected').length === 0){
        cardgameErrorDisplayer.text($.i18n("cardgameIsRequired"));
        conform = false;
    }

    // Checking timers settings
    if(serverData['server']['useTimers']
    && (serverData['server']['indivTimer'] <= 0
    || serverData['server']['appropriation'] <= 0
    || serverData['server']['globalTimer'] <= 0)){
        timersErrorDisplayer.text($.i18n("timersValue"));
        conform = false;
    }else{
        if(serverData['server']['appropriation'] > serverData['server']['indivTimer']){
            timersErrorDisplayer.text($.i18n("indivLessThanApp"));
            conform = false;
        }else if(serverData['server']['indivTimer'] > serverData['server']['globalTimer']){
            timersErrorDisplayer.text($.i18n("globalLessThanIndiv"));
            conform = false;
        }
    }
    return conform;
}

/** Creating player game server */
$("#validate").on("click", function(){
    let serverName = $('input#name')[0].value;
    let places = parseInt($('input#places')[0].value);
    let role = $('input#role')[0].value;
    let cardGameName = '';
    let cardGameLanguage = '';
    let selectedTbody = $('#cardgames tbody .selected');
    if(selectedTbody.children().length > 0){
        cardGameName = selectedTbody.children()[0].innerHTML;
        cardGameLanguage = selectedTbody.children()[1].innerHTML;
    }
    let timers = $('input#timers')[0].value;
    let indivTimer = parseInt($('input#indivTimer')[0].value);
    let appropriationTime = parseInt($('input#appropriation')[0].value);
    let globalTimer = parseInt($('input#globalTimer')[0].value);
    let forceTurn = $('input#forceTurn')[0].value;
    let delayBeforeForcing = parseInt($('input#forcingTime')[0].value);
    let sharingInterval = parseInt($('input#prodSharing')[0].value);

    let data = {'role': role,
                'server': {'name': serverName,
                           'places': places,
                           'cardGameName': cardGameName,
                           'cardGameLanguage': cardGameLanguage,
                           'useTimers' : timers === 'yes',
                           'indivTimer': indivTimer,
                           'appropriation': appropriationTime,
                           'globalTimer': globalTimer,
                           'forceEndOfTurn': forceTurn === 'yes',
                           'delayBeforeForcing': delayBeforeForcing,
                           'sharingInterval': sharingInterval}};

    if(checkServerCreationForm(data)){
        socket.emit('createServer', data);
        sessionStorage.server = serverName;
        sessionStorage.role = role;
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

$('#gameTab .alert .confirm').on('click', function(){
    if($('#gameTab .alert').hasClass('removeGame')){
        let selectedServer = $('#serverList tbody .selected').children();
        socket.emit('removeServer', {'server': selectedServer[0].innerHTML});
        sessionStorage.server = null;
        sessionStorage.role = null;
    }
    displayPanel($('#gameTab'), $('#gameTab .tabContent'), '100%', '100%');
});

$('#gameTab .alert .cancel').on('click', function(){
    displayPanel($('#gameTab'), $('#gameTab .tabContent'), '100%', '100%');
});

/** Joining the selected game server */
$("#join").on("click", function(){
    let selectedServer = $('#serverList tbody .selected').children();
    if(selectedServer != null){ // look at the onclick listener on "serverList" to have more details about the below code
        if(selectedServer[1].innerHTML === sessionStorage.pseudo
        && selectedServer[4].innerHTML === $.i18n(WAITING_PLAYERS)){
            displayAlert('gameTab', 'removeGame', 'Are you sure you want to delete it ? (every players will be kicked)', 'both');
            $('#join').text('Join');
        }else if(selectedServer[0].innerHTML === sessionStorage.server){
            socket.emit('exitServer', {'server': selectedServer[0].innerHTML});
            sessionStorage.server = null;
            sessionStorage.role = null;
            $('#join').text('Join');
        }else{
            socket.emit('joinServer', {'server': selectedServer[0].innerHTML});
            sessionStorage.server = selectedServer[0].innerHTML;
            sessionStorage.unload = 'false';
        }
    }
});

socket.on('serverUnreachable', function(data){
    $('#serverMsg').text(data['msg']);
    sessionStorage.server = null;
});

$(window).on("load", function () {
    // If the client reload his page and is connected to a server, we
    // reconnect his socket with his server
    if(sessionStorage.server != null
    && $('.' + sessionStorage.server) != null
    && sessionStorage.unload === 'false'){
        socket.emit('joinServer', {'server': sessionStorage.server});
    }
    $('#join').text('Join');
});
