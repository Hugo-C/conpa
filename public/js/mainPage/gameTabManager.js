// connection with the server socket
var socket = io();

// registered the client on server
socket.emit('pseudo', {'pseudo': sessionStorage.pseudo});

/*
 * Process serverListUpdate message
 * Displays available servers in the html table
 */
socket.on('serverListUpdate', function(data){
    var serverList = $('#serverList').find('tbody');
    serverList.children().remove();
    for(var server in data){
        serverList.append($('<tr>')
                    .append($('<td>' + data[server]['name'] + '</td>'))
                    .append($('<td>' + data[server]['host'] + '</td>'))
                    .append($('<td>' + data[server]['animate'] + '</td>'))
                    .append($('<td>' + data[server]['places'] + '</td>'))
                    .append($('<td>' + data[server]['status'] + '</td>')));
      }
});

/* Process gameStart message
 * When this message is received, we move to the game module page
 */
socket.on('gameStart', function(data){
    console.log("GAME START !!!!");
    sessionStorage.server = data['server'];
    window.location = '/gamerModule';
});

// allows to select a row in the server list
$('#serverList').on('click', 'tbody tr', function(){
  $('#serverList tbody .selected').removeClass('selected');
  $(this).addClass('selected');
});

// displays game server creator window
$("#create").on("click", function(){
    $(".serverList").css("display", "none");
    $(".serverManager").css("display", "block");
});

// displays server list
$("#cancel").on("click", function(){
    $(".serverList").css("display", "block");
    $(".serverManager").css("display", "none");
});

// Creating player game server
$("#validate").on("click", function(){
    var serverName = $('input#name')[0].value;
    var role = $('input#role')[0].value;
    var indivTimer = $('input#indivTimer')[0].value;
    var places = $('input#places')[0].value;
    var globalTimer = $('input#globalTimer')[0].value;
    var data = {'role': role,
                'server': {'name': serverName,
                           'places': places,
                           'indivTimer': indivTimer,
                           'globalTimer': globalTimer}};

    socket.emit('createServer', data);
});

// Joining the selected game server
$("#join").on("click", function(){
    var selectedServer =  $('#serverList tbody .selected').children()[0];
    if(selectedServer != null){
        console.log("joining server : " + selectedServer.innerHTML);
        socket.emit('joinServer', {'server': selectedServer.innerHTML});
    }
});
