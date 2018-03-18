var Player = require('./Player.js');
var Game = require('./Game.js');

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
                'status': 'waiting for players'});
  }
  return data;
}

module.exports = function(io, socket){

  /**
   * Process pseudo message
   * Adds a new player in the clients dictionnary and
   * sends to him the list of available servers
   *
   * form of accepted data : { 'pseudo': value }
   */
  socket.on('pseudo', function(data){
      console.log('user ' + data['pseudo'] + ' is connected');
      clients[data["pseudo"]] = socket.id;
      io.sockets.emit('serverListUpdate', listAllServers());
  });

  /**
   * Process createServer message
   * - Creates a new player (the host of the server)
   * - Creates a new server (a new Game) with given parameters
   * - Sends to all players the new list of available servers
   * ( - launch the game for the server's host )
   *
   * form of accepted data :
   * { 'role': [host's role],
   *   'server': {'name': ['server's name], 'places': [max nb of players],
   *              'indivTimer': [value of the individual timer],
   *              'globalTimer': [value of the global timer] } }
   */
  socket.on('createServer', function(data){
      console.log('creation of a new server');
      var player = new Player(getPseudoWithId(socket.id), data["role"]);
      var server = new Game(data["server"]["name"], data["server"]["places"], player, data["server"]["indivTimer"], data["server"]["globalTimer"]);
      rooms[data["server"]["name"]] = server;
      socket.room = data["server"]["name"];

      var newServer = {'name': data["server"]["name"],
                  'host': getPseudoWithId(socket.id),
                  'animate': data['role'] == 'player' ? 'No' : 'Yes',
                  'places' : '1 / ' + data["server"]["places"],
                  'status': 'waiting for players'};
      io.sockets.emit('serverListUpdate', listAllServers());
      socket.emit('gameStart', {'server': server.getName()});
  });

  /**
   * Process joinServer message
   * - Creates a new player (player who wants to join the server)
   *   If the player is already in a server, he is automatically removed form his server
   *   before to be added in the new one
   * - Sends to all players the new list of available servers
   * ( - launch the game for the player )
   *
   * form of accepted data : {'server': [destination server's name]}
   */
  socket.on('joinServer', function(data){
      console.log('player ' + getPseudoWithId(socket.id) + ' join ' + data["server"] + ' server');
      var server = rooms[data["server"]];
      if(server.getNbPlayer() < server.getPlaces() && socket.room != server.getName()){
          var player = new Player(getPseudoWithId(socket.id), "player");

          if(socket.room != null) rooms[socket.room].removePlayer(player);
          server.addNewPlayer(player);
          socket.room = server.getName();

          io.sockets.emit('serverListUpdate', listAllServers());
          socket.emit('gameStart', {'server': server.getName()});
      }
  });

 /**
   * Process joinGame message
   * Players send this message automatically when the game starts
   * This message allow the (main) server to know in which room are all players
   *
   * form of accepted data : {'server': [name of the game server in which player is],
   *                          'pseudo': [player's pseudo]}
   */
  socket.on('joinGame', function(data){
      console.log('player ' + data['pseudo'] + ' join the game' + data['server']);

      socket.room = data['server'];
      socket.join(socket.room);
      clients[data['pseudo']] = socket.id;

      io.to(socket.room).emit('players', rooms[socket.room].getPlayers());
  });

  /**
   * Process quitGame message
   * - Informs (main) server that the player has exited his game server
   * - Remove the player from the game server
   * - Sends the actualized list of players to the game server players
   * - Sends to all players the actualized list of servers
   *
   * form of accepted data : {'server': [game server name who player currently is],
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
   * form of accepted data : {'dest': ["all" or receiver's pseudo],
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

  socket.on('cardPicked', function(data){
    socket.broadcast.to(socket.room).emit('cardPicked', data);
  });

}
