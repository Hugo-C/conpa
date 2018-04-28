var fs = require('fs');
var path = require('path');
var Player = require('./Player.js');
var Game = require('./Game.js');
var db = require('../js/db');

const SVG_FILE = "../svg";
const WAITING_PLAYERS = "waiting for players";
const QUESTION_TIME = "question time";
const GAME_TIME = "game time";


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
                'animate': roomData.getHost().isAnimator() ? 'Yes' : 'No',
                'places' : roomData.getNbPlayer() + ' / ' + roomData.getPlaces(),
                'status': roomData.getStatus()});
  }
  return data;
}

/**
 * Add a new entry in the party historic table
 * @param {Game} gameServer : the game server to record
 */
function recordGameServer(gameServer){
    var animator = gameServer.getHost().isAnimator() ? gameServer.getHost().getPseudo() : "party without animator";
    var date = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
    db.recordNewParty(gameServer.getName(), animator, date, function(err, partyId){
        if(err){
            console.log(err);
        }else{
            console.log(partyId);
            gameServer.setHistoricId(partyId);
            gameServer.addPlayersToPartyHistoric(db);
        }
    });
}

/**
 * Add a new entry in the hasPlayedIn table
 * Used to keep a track of the player's production do in a party
 *
 * @param {string} pseudo : player's pseudo
 * @param {number} partyHistoricId : id which represents the party in the party historic table
 * @param {string} production : a string which describe the svg production
 */
function recordProduction(pseudo, partyHistoricId, production){
    db.recordPlayerProduction(partyHistoricId, pseudo, production, function(err){
        if(err) console.log(err);
    });
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
      console.log('==> New player : ' + data['pseudo']);
      clients[data["pseudo"]] = socket.id;
      socket.room = null;
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
          io.to(server.getName()).emit('gameStart', {'server': server.getName(), 'animator': server.getAnimatorPseudo(), 'players': server.getActivePlayers()});
          server.setStatus(QUESTION_TIME);
          io.sockets.emit('serverListUpdate', listAllServers());
          console.log('==> A game start : ' + server.getName());
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
      if(!(data["server"]["name"] in rooms)){
          console.log('==> New game server : ' + data["server"]["name"]);

          var player = new Player(getPseudoWithId(socket.id), data["role"]);
          var server = new Game(data["server"]["name"], data["server"]["places"], player, data["server"]["indivTimer"], data["server"]["globalTimer"], WAITING_PLAYERS);
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
          server.inactivePlayerManager = setInterval(inactivePlayerManager, 5000, server);
      }else{
          socket.emit('serverCreated', {'error': true, 'msg': 'server name not available'}); // informs the creator that the server's name is not available
      }
  });

  /**
   * Process "removeServer" message
   * Players send this message when they want to remove a server they are created
   * When this message is received, we remove from the server the given game server
   *
   * form of received data : {'server': server's name}
   */
  socket.on('removeServer', function(data){
      var server = rooms[data["server"]];
      // A player can only remove his own server if the game has not started
      if(server != null && server.getStatus() == WAITING_PLAYERS
      && server.getHost().getPseudo() == getPseudoWithId(socket.id)){
          console.log('==> Removing game server : ' + server.getName());

          io.sockets.in(socket.room).emit('serverRemoved', null);
          var players = server.getActivePlayers();
          for(var index in players){
              io.sockets.connected[clients[players[index]]].leave();
          }

          clearInterval(server.inactivePlayerManager);
          delete rooms[server.getName()];
          io.sockets.emit('serverListUpdate', listAllServers());
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

      if(server != null){ // to prevent reception of bad data
          if(server.getNbPlayer() < server.getPlaces() && !(server.isInServer(getPseudoWithId(socket.id))) && server.getStatus() == WAITING_PLAYERS){

              var player = new Player(getPseudoWithId(socket.id), "player");
              console.log('==> Player ' + player.getPseudo() + ' joined ' + server.getName());

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
      }
  });

  /**
   * Return the current state of the question time
   * - the number of players who have defined their questions
   * - the questions of each players
   */
  function getQuestionTimeState(server){
      return {'ready': server.nbPlayersReady(), 'playersQuestion': server.getPlayersQuestion()};
  }

  /**
   * Process "exitServer" message
   * Players send this message when they want to leave a game server
   * This message can only be send if the game has not started
   */
  socket.on('exitServer', function(data){
      console.log('==> ' + getPseudoWithId(socket.id) + ' leaved ' + socket.room);

      rooms[data['server']].removePlayerByPseudo(getPseudoWithId(socket.id));
      socket.leave(data['server']);
      socket.room = null;

      io.sockets.emit('serverListUpdate', listAllServers());
  });

 /**
   * Process joinGame message
   * Players send this message automatically when the game starts
   * This message allow the (main) server to know in which room are all players
   *
   * form of received data : {'server': [name of the game server in which player is],
   *                          'pseudo': [player's pseudo]}
   */
  socket.on('joinGame', function(data){
      console.log('--> ' + data['pseudo'] + ' joined ' + data['server']);

      var server = rooms[data['server']];

      if(server != null){
          var player = server.getPlayer(data['pseudo']);
          if(player != null){
              socket.room = server.getName();
              socket.join(socket.room);
              clients[player.getPseudo()] = socket.id;

              if(server.isAllQuestionsDefined()){
                  socket.emit('allQuestionsDefined', getQuestionTimeState(server));
                  io.sockets.in(server.getName()).emit('chatPlayers', server.getActivePlayers());
                  io.sockets.in(server.getName()).emit('actualizeAnimatorMosaic', server.getPlayers());
              }else{
                  socket.emit('initQuestionTime', {'players': server.getPlayers()});
                  socket.emit('actualizeQuestions', getQuestionTimeState(server));
              }
          }
      }
  });

  function sendSystemMessage(server, message){
      let data = {'sender': "system", 'msg': message};
      io.sockets.in(server).emit('message', data);
  }

  function newTurn(gameServer){
      console.log('--> New turn for the server ' + gameServer.getName() + ' : ');
      gameServer.newTurn();
      var data = {'currentPlayer': gameServer.getCurrentPlayer(),
                  'nextPlayer': gameServer.getNextPlayer()};
      console.log(data);
      io.sockets.in(gameServer.getName()).emit('newTurn', data);
      sendSystemMessage(gameServer.getName(), "It's the turn of " + data['currentPlayer']);
  }

  /**
   * Process "recordMyQuestion" message
   * Players send this message when they are defined their question
   * When this message is received :
   * - we send to all players the question of the player
   * - if all players have defined their question, we starts the game
   *
   * form of received data : {'question': player's question}
   */
  socket.on('recordMyQuestion', function(data){
      console.log('--> ' + getPseudoWithId(socket.id) + ' recorded his question');

      var server = rooms[socket.room];
      server.recordPlayerQuestion(getPseudoWithId(socket.id), data['question']);
      if(server.isAllQuestionsDefined()){ // all questions are defined, we can starts the game
          io.sockets.in(server.getName()).emit('allQuestionsDefined', getQuestionTimeState(server));
          io.sockets.in(server.getName()).emit('chatPlayers', server.getActivePlayers());
          io.sockets.in(server.getName()).emit('actualizeAnimatorMosaic', server.getPlayers());
          recordGameServer(server);
          server.setStatus(GAME_TIME);
          server.productionSharingManager = setInterval(productionSharingManager, 5000, server.getName());
          newTurn(server);
      }else{
          io.to(socket.room).emit('actualizeQuestions', getQuestionTimeState(server));
      }
  });

  socket.on('animatorValidation', function(data){
      console.log('--> ' + socket.room + ' : received animator validation');
      var server = rooms[socket.room];
      server.setAnimReady();
      io.sockets.in(server.getName()).emit('allQuestionsDefined', getQuestionTimeState(server));
      io.sockets.in(server.getName()).emit('chatPlayers', server.getActivePlayers());
      io.sockets.in(server.getName()).emit('actualizeAnimatorMosaic', server.getPlayers());
      recordGameServer(server);
      server.setStatus(GAME_TIME);
      server.productionSharingManager = setInterval(productionSharingManager, 5000, server.getName());
      newTurn(server);
  });

  socket.on('endOfTurn', function(data){
      console.log('--> ' + getPseudoWithId(socket.id) + ' finished his turn');
      var server = rooms[socket.room];
      newTurn(server);
  });

  /**
   * Process quitGame message
   * - Inform server that the player has leaved the game server
   * - Remove the player from the game server
   * - Sends the actualized list of players to the game server players
   * - Sends to all players the actualized list of servers
   *
   * form of received data : {'server': [game server name who player currently is],
   *                          'pseudo': [player's name]}
   */
  socket.on('quitGame', function(data){
      console.log('--> ' + data['pseudo'] + ' leaved game server ' + socket.room);

      let server = rooms[data['server']];
      let currentPlayer = server.getCurrentPlayer();

      server.removePlayerByPseudo(data['pseudo']);
      socket.leave(data['server']);
      socket.room = null;
      recordProduction(server.getHistoricId(), data['pseudo'], data['production']);

      if(server.getNbPlayer() == 0){
          clearInterval(server.inactivePlayerManager);
          clearInterval(server.productionSharingManager);
          delete rooms[server.getName()]; // if server is empty, we detroy it
      }else{
          io.sockets.in(server.getName()).emit('chatPlayers', server.getActivePlayers());
          io.sockets.in(server.getName()).emit('actualizeAnimatorMosaic', server.getPlayers());
          sendSystemMessage(server.getName(), data['pseudo'] + " leaved the game !");
          if(currentPlayer == data['pseudo']) newTurn(server);
      }
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
      console.log('--> ' + socket.room + ' new message from ' + getPseudoWithId(socket.id) + ' to ' + data['dest']);
      if(data["dest"] === "all"){
          rep = {"sender": getPseudoWithId(socket.id), "dest": data["dest"], "msg": data["msg"]};
          socket.broadcast.to(socket.room).emit('message', rep);
      } else {
          rep = {"sender": getPseudoWithId(socket.id), "dest": data["dest"], "msg": data["msg"]};
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
      console.log('--> ' + getPseudoWithId(socket.id) + ' picked a new card');
      io.sockets.in(socket.room).emit('cardPicked', data);
  });

  /**
   * Process "processStopGame" message on server side
   * This message is send by client when a player wants to stop the game
   * When this message is received, we ask to all players if they agree with it
   *
   * form of received data : no data sends with this message !
   */
  socket.on('processStopGame', function(data){
      console.log('--> ' + getPseudoWithId(socket.id) + ' started a stop game process');
      var server = rooms[socket.room];
      server.exitBuffer.push(getPseudoWithId(socket.id));
      if(server.exitBuffer.length == server.getNbPlayer()){
          io.sockets.in(server.getName()).emit('gameEnd', null); // only one player in the game, stoped the game
      }else{
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
      console.log('--> ' + getPseudoWithId(socket.id) + ' wants to stop game ? : ' + data['exit']);
      var server = rooms[socket.room];
      if(data['exit']){
          server.exitBuffer.push(getPseudoWithId(socket.id));
          if(server.exitBuffer.length == server.getNbPlayer()){
              io.sockets.in(server.getName()).emit('gameEnd', null); // all players have accepted to stop the game
          }else{
              io.to(server.getName()).emit('refreshExitPanel', server.exitBuffer); // another player have accepted to stop the game
          }
      }else{
          io.to(server.getName()).emit('stopGameProcessAborted', null); // a player have refused to stop  the game
          server.exitBuffer = [];
      }
  });

    /**
     * Process "shareMyProduction" message on server side
     * The message is received when a player has send his production
     * When this message is received, we share the production to the other players
     *
     * form of received data : {'pseudo' : player's pseudo, 'production': player's production}
     */
    socket.on('shareMyProduction', function(data){
        socket.broadcast.to(socket.room).emit('playersProduction', data);
    });

    function productionSharingManager(serverName){
        io.sockets.in(serverName).emit('shareYourProduction', null);
    }

    /**
     * This function is used to manage unexpected disconnections
     * When the server loose the connection with a player in the given game server,
     * he is add to a list of inactive players.
     * The player has then a short delay to reconnect his self
     * If the player don't reconnect his self, he is removed from the game
     *
     * @param {Game} server : the game server for which this function works
     */
    function inactivePlayerManager(server){

        for(var index in server.inactivePlayer){
            if(io.sockets.connected[clients[server.inactivePlayer[index]]] == null
            || io.sockets.connected[clients[server.inactivePlayer[index]]].room == null){

                server.removePlayerByPseudo(server.inactivePlayer[index]);
                console.log(server.inactivePlayer[index] + ' is removed');

                // a player has been removed, we need to inform clients
                if(server.getNbPlayer() == 0){
                    clearInterval(server.productionSharingManager);
                    clearInterval(server.inactivePlayerManager);
                    delete rooms[server.getName()]; // if server is empty, we detroy it
                }else{
                    console.log('updating server data');
                    if(server.getStatus() == QUESTION_TIME){
                        console.log('question time');
                        if(server.isAllQuestionsDefined()){
                            console.log('all questions are defined !');
                            io.sockets.in(server.getName()).emit('allQuestionsDefined', getQuestionTimeState(server));
                            io.sockets.in(server.getName()).emit('chatPlayers', server.getActivePlayers());
                            io.sockets.in(server.getName()).emit('actualizeAnimatorMosaic', server.getPlayers());
                            recordGameServer(server);
                            server.setStatus(GAME_TIME);
                            server.productionSharingManager = setInterval(productionSharingManager, 5000, server.getName());
                        }else{
                            console.log('updating question time');
                            io.sockets.in(server.getName()).emit('initQuestionTime', {'players': server.getPlayers()});
                            io.sockets.in(server.getName()).emit('actualizeQuestions', getQuestionTimeState(server));
                        }
                    }else if(server.getStatus() == GAME_TIME){
                        console.log('updating game time');
                        io.sockets.in(server.getName()).emit('chatPlayers', server.getActivePlayers());
                        io.sockets.in(server.getName()).emit('actualizeAnimatorMosaic', server.getPlayers());
                    }
                }
                io.sockets.emit('serverListUpdate', listAllServers());
            }
        }

        server.inactivePlayer = [];

        var players = server.getActivePlayers();
        for(var index in players){
            if(io.sockets.connected[clients[players[index]]] == null
            || io.sockets.connected[clients[players[index]]].room == null){
                server.inactivePlayer.push(players[index]);
                console.log(players[index] + ' is inactive');
            }
        }
    }

};
