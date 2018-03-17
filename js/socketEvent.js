var Player = require('./Player.js');
var Game = require('./Game.js');

var clients = {}; // keep a link between user's pseudo and socket's id
var rooms = {};

function getPseudoWithId(id){
    for(key in clients){
        if(clients[key] == id) return key;
    }
}

function listAllServers(){
  data = [];
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

  socket.on('pseudo', function(data){
      console.log('user ' + data['pseudo'] + ' is connected');
      clients[data["pseudo"]] = socket.id;
      io.sockets.emit('serverListUpdate', listAllServers());
  });

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

  socket.on('joinGame', function(data){
      console.log('player ' + data['pseudo'] + ' join the game' + data['server']);

      socket.room = data['server'];
      socket.join(socket.room);
      clients[data['pseudo']] = socket.id;

      io.to(socket.room).emit('players', rooms[socket.room].getPlayers());
  })

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

}
