var fs = require('fs');
var path = require('path');
var Player = require('./Player.js');
var Game = require('./Game.js');

const SVG_FILE = "../svg";

var clients = {}; // keep a link between user's pseudo and socket's id
var rooms = {}; // list of available servers (rooms)

/**
 * Return the pseudo associated with the given socket id
 *
 * @param {string} id : id associated with the pseudo searched
 * @return {string} : pseudo associated with the given id
 */
function getPseudoWithId(id){
    for(key in clients){
        if(clients[key] == id) return key;
    }
}

/**
 * Return an array in which is stored all servers informations
 * Use to display the list of servers on the client side
 */
function listAllServers(){
  data = []; // accumulator
  for(var room in rooms){
    var roomData = rooms[room];
    data.push({'name': room,
                'host': roomData.getHost().getPseudo(),
                'animate': roomData.getHost().getRole() == 'player' ? 'No' : 'Yes',
                'places' : roomData.getNbPlayer() + ' / ' + roomData.getPlaces(),
                'status': roomData.getStatus()});
  }
  return data;
}

module.exports = function(io, socket){

  /**
   * Process pseudo message
   * Adds a new player in the clients dictionnary and
   * sends to him the list of available servers
   *
   * form of received data : { 'pseudo': value }
   */
  socket.on('pseudo', function(data){
      console.log('user ' + data['pseudo'] + ' is connected');
      clients[data["pseudo"]] = socket.id;
      io.sockets.emit('serverListUpdate', listAllServers());
  });

  /**
   * Check if game server is full and launch the game if is it
   *
   * @param {string} serverName : name of server which is concerned
   */
  function startGameOnServerFull(serverName){
    var server = rooms[serverName];

    if(server.getNbPlayer() == server.getPlaces()){
      io.to(server.getName()).emit('gameStart', {'server': server.getName(), 'players': server.getPlayers()});
      server.setStatusInGame();
      io.sockets.emit('serverListUpdate', listAllServers());
    }
  }

  /**
   * Process createServer message
   * - Creates a new player (the host of the server)
   * - Creates a new server (a new Game) with given parameters
   * - Sends to all players the new list of available servers
   * - launch the game if the server is full
   *
   * form of received data :
   * { 'role': [host's role],
   *   'server': {'name': ['server's name], 'places': [max nb of players],
   *              'indivTimer': [value of the individual timer],
   *              'globalTimer': [value of the global timer] } }
   */
  socket.on('createServer', function(data){
      console.log('creation of a new server');

      if(!(data["server"]["name"] in rooms)){

          var player = new Player(getPseudoWithId(socket.id), data["role"]);
          var server = new Game(data["server"]["name"], data["server"]["places"], player, data["server"]["indivTimer"], data["server"]["globalTimer"]);
          rooms[data["server"]["name"]] = server;
          socket.room = data["server"]["name"];
          socket.join(socket.room);

          var newServer = {'name': data["server"]["name"],
                      'host': getPseudoWithId(socket.id),
                      'animate': data['role'] == 'player' ? 'No' : 'Yes',
                      'places' : server.getNbPlayer() + ' / ' + server.getPlaces(),
                      'status': server.getStatus()};

          socket.emit('serverCreated', {'error': false, 'msg': null}); // informs the creator that server has been created successfully
          io.sockets.emit('serverListUpdate', listAllServers()); // refresh servers list
          startGameOnServerFull(server.getName()); // try to start the game
      }else{
          socket.emit('serverCreated', {'error': true, 'msg': 'server name not available'}); // informs the creator that the server's name is not available
      }
  });

  /**
   * Process joinServer message
   * - Creates a new player (player who wants to join the server)
   *   If the player is already in a server, he is automatically removed form his server
   *   before to be added in the new one
   * - Sends to all players the new list of available servers
   * - launch the game if the server is full
   *
   * form of received data : {'server': [destination server's name]}
   */
  socket.on('joinServer', function(data){

      var server = rooms[data["server"]];

      if(server.getNbPlayer() < server.getPlaces() && !(server.isInServer(getPseudoWithId(socket.id)))){
          var player = new Player(getPseudoWithId(socket.id), "player");

          if(socket.room != null) rooms[socket.room].removePlayer(player);
          server.addNewPlayer(player);
          socket.room = server.getName();
          socket.join(socket.room);

          io.sockets.emit('serverListUpdate', listAllServers()); // refresh servers list
          startGameOnServerFull(server.getName()); // there is a new player, try to start the game

      }else if(server.isInServer(getPseudoWithId(socket.id)) && socket.room == null){ // case of reconnection (if a player has lost his connection)
          socket.room = server.getName();
          socket.join(socket.room);
      }
  });

  function getQuestionTimeState(server){
      return {'ready': server.nbPlayersReady(), 'playersQuestion': server.getPlayersQuestion()};
  }

 /**
   * Process joinGame message
   * Players send this message automatically when the game starts
   * This message allow the (main) server to know in which room are all players
   *
   * form of received data : {'server': [name of the game server in which player is],
   *                          'pseudo': [player's pseudo]}
   */
  socket.on('joinGame', function(data){
      console.log('player ' + data['pseudo'] + ' join the game' + data['server']);

      socket.room = data['server'];
      socket.join(socket.room);
      clients[data['pseudo']] = socket.id;

      //io.to(socket.room).emit('playersQuestion', getQuestionTimeState(rooms[socket.room]));
      socket.emit('initQuestionTime', rooms[socket.room].getPlayers());
  });

  socket.on('recordMyQuestion', function(data){
      var server = rooms[socket.room];
      server.recordPlayerQuestion(getPseudoWithId(socket.id), data['question']);
      if(server.nbPlayersReady() == server.getNbPlayer()){
          io.to(socket.room).emit('allQuestionsDefined', getQuestionTimeState(server));
          io.to(socket.room).emit('players', server.getPlayers());
      }else{
          io.to(socket.room).emit('actualizeQuestions', getQuestionTimeState(server));
      }
  });

  /**
   * Process quitGame message
   * - Informs (main) server that the player has exited his game server
   * - Remove the player from the game server
   * - Sends the actualized list of players to the game server players
   * - Sends to all players the actualized list of servers
   *
   * form of received data : {'server': [game server name who player currently is],
   *                          'pseudo': [player's name]}
   */
  socket.on('quitGame', function(data){
      console.log('player ' + data['pseudo'] + ' quit the game ' + data['server']);

      rooms[data['server']].removePlayerByPseudo(data['pseudo']);
      socket.leave(data['server']);
      socket.room = null;

      console.log(rooms[data['server']].getPlayers());

      io.to(data['server']).emit('players', rooms[data['server']].getPlayers());
      io.sockets.emit('serverListUpdate', listAllServers());
  });

  /**
   * Process tchat message on server side
   * Redirects message to the good receivers
   * If destination equals 'all', message is sends to all players of the sender's room
   * else message is sends to the specified receiver
   *
   * form of received data : {'dest': ["all" or receiver's pseudo],
   *                          'msg': [message body]}
   */
  socket.on('message', function(data){
      console.log('message from ' + getPseudoWithId(socket.id) + ' to ' + data["dest"]);
      if(data["dest"] === "all"){
          rep = {"sender": getPseudoWithId(socket.id), "msg": data["msg"], "whisper": false};
          socket.broadcast.to(socket.room).emit('message', rep);
      } else {
          rep = {"sender": getPseudoWithId(socket.id), "msg": data["msg"], "whisper": true};
          io.to(clients[data["dest"]]).emit("message", rep);
      }
  });

  /**
   * Process "cardPicked" message on server side
   * This message is send by client when a player has picked a new card
   * When we received this message, we send the card picked by the player to other players
   *
   * form of received data : {'family': picked card's family, 'cardContent': picked card's content}
   */
  socket.on('cardPicked', function(data){
    socket.broadcast.to(socket.room).emit('cardPicked', data);
  });

  /**
   * Process "processStopGame" message on server side
   * This message is send by client when a player wants to stop the game
   * When this message is received, we ask to all players if they agree with it
   *
   * form of received data : no data sends with this message !
   */
  socket.on('processStopGame', function(data){
    console.log("A player wants stop the game");
    var server = rooms[socket.room];
    server.exitBuffer.push(getPseudoWithId(socket.id));
    console.log("There is " + server.exitBuffer.length + " players in this room " + server.getNbPlayer());
    if(server.exitBuffer.length == server.getNbPlayer()){
        console.log("exit game");
        io.to(server.getName()).emit('gameEnd', null); // only one player in the game, stoped the game
    }else{
        console.log("ask to everyone");
        socket.broadcast.to(server.getName()).emit('stopGame?', server.exitBuffer); // ask to all players if they agree
    }
  });


  /**
   * Process "stopGame" message on server side
   * This message is send by client to answer at the "stopGame?" message
   *
   * form of received data : {'exit': player's answer (true if he wants to stop, else false)}
   */
  socket.on('stopGame', function(data){
      var server = rooms[socket.room];
      if(data['exit']){
          server.exitBuffer.push(getPseudoWithId(socket.id));
          if(server.exitBuffer.length == server.getNbPlayer()){
              io.to(server.getName()).emit('gameEnd', null); // all players have accepted to stop the game
          }else{
              io.to(server.getName()).emit('refreshExitPanel', server.exitBuffer); // another player have accepted to stop the game
          }
      }else{
          io.to(server.getName()).emit('stopGameProcessAborted', null); // a player have refused to stop  the game
          server.exitBuffer = [];
      }
  });

    /**
     * Process "saveSvg" message on server side
     * This message is send by client when he wants the server to save his production
     *
     * form of received data : {'svg': player's production as svg}
     */
    socket.on('saveSvg', function (data) {
        fs.writeFile(path.join(SVG_FILE, "wow.svg"), data["svg"], function (err) {
            if (err) {
                console.log("error while saving a svg file, maybe you just need to create the directory 'svg' ?");
                console.log(err);
            } else {
                console.log("A svg file was saved!");
            }
        });
    });
};
