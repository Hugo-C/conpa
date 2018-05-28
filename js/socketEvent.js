const Player = require('./Player.js');
const Game = require('./Game.js');
const db = require('../js/db');
const logger = require('../js/logger');
const i18n_module = require('i18n-nodejs');

const WAITING_PLAYERS = "waitingForPlayers";
const QUESTION_TIME = "questionTime";
const GAME_TIME = "gameTime";

var clients = {}; // keeps a link between user's pseudo and socket's id
var rooms = {}; // list of available servers (rooms)

module.exports = function(io, socket){

    // -----------------------------------------------------------------------------
    // ------------------------------ FUNCTIONS ------------------------------------
    // -----------------------------------------------------------------------------

    /**
     * Returns the pseudo associated with the given socket id
     *
     * @param {string} id : id associated with the pseudo we are searching for
     * @return {string} : pseudo associated with the given id
     */
    function getPseudoWithId(id){
        for(let key in clients){
            if(clients[key] === id) return key;
        }
    }

    /**
     * Returns an array in which is stored all servers's informations
     * Used to display the list of servers on the client side
     *
     * @return {object array} : description of the servers
     * form of the description : { 'name': server's name,
     *                             'host': server's host,
     *                             'animate': is there an animator ?,
     *                             'places': server's capacity,
     *                             'status': server's status }
     */
    function listAllServers(){
        data = []; // accumulator
        for(let room in rooms){
            let roomData = rooms[room];
            data.push({ 'name': room,
                        'host': roomData.getHost().getPseudo(),
                        'animate': roomData.getHost().isAnimator() ? socket.translater.__('yes') : socket.translater.__('no'),
                        'places' : roomData.getNbPlayer() + ' / ' + roomData.getPlaces(),
                        'status': socket.translater.__(roomData.getStatus()) });
        }
        return data;
    }

    /**
     * Checks if the game server is full and launch the game if it is
     *
     * @param {string} serverName : name of server which is concerned
     */
    function startGameOnServerFull(serverName){
        let server = rooms[serverName];
        if(server.getNbPlayer() === server.getPlaces()){
            io.to(server.getName())
              .emit('gameStart', {'server': server.getName(),
                                  'animator': server.getAnimatorPseudo(),
                                  'players': server.getActivePlayers()});
            server.setStatus(QUESTION_TIME);
            io.sockets.emit('serverListUpdate', listAllServers());
            logger.info('A game start : ' + server.getName());
        }
    }

    /**
     * Returns the current state of the question time
     * - the number of players who have defined their questions
     * - the questions of each player
     *
     * @param {Game} server : the game server for which we want the current state of the game time
     * @return {object} : { 'ready': number of players who are ready,
     *                     'playersQuestion': dictionnary of (pseudo, player's question) couple }
     */
    function getQuestionTimeState(server){
        return {'ready': server.nbPlayersReady(), 'playersQuestion': server.getPlayersQuestion()};
    }

    /**
     * Start the game time
     * - informs all players that we move to the game time
     * - records the party in the database
     *
     * @param {Game} server : the game server for which the game time starts
     */
    function startGameTime(server){
        io.sockets.in(server.getName()).emit('allQuestionsDefined', getQuestionTimeState(server));
        io.sockets.in(server.getName())
                  .emit('initGameTime', {'players': server.getActivePlayers(),
                                         'animator': server.getAnimatorPseudo(),
                                         'useTimer': server.getUseTimers(),
                                         'globalTimer': server.getGlobalTimer()});
        recordGameServer(server);
        server.setStatus(GAME_TIME);
        server.productionSharingManager = setInterval(productionSharingManager,
                                                      server.getSharingInterval(),
                                                      server.getName());
        newTurn(server);
    }

    /**
     * Sends a system message to all players of the game
     * A system message is used to send informations about
     * the current state of the game
     *
     * @param {Game} server : server for which we send this message
     * @param {string} message : body of the message
     */
    function sendSystemMessage(server, message){
        let data = {'sender': "system", 'msg': message};
        io.sockets.in(server).emit('message', data);
    }

    /**
     * Selects the next player and start a new turn
     * @param {Game} gameServer : game server for which we want to start a new turn
     */
    function newTurn(gameServer){
        logger.debug("New turn for the server " + gameServer.getName());
        gameServer.newTurn();
        let data = {'currentPlayer': gameServer.getCurrentPlayer(),
                    'nextPlayer': gameServer.getNextPlayer(),
                    'useTimer': gameServer.getUseTimers(),
                    'indivTimer': gameServer.getIndividualTimer(),
                    'forceEndOfTurn': gameServer.getForceEndOfTurn(),
                    'delayBeforeForcing': gameServer.getDelayBeforeForcing()};
        logger.log("silly", data);
        io.sockets.in(gameServer.getName()).emit('newTurn', data);
        logger.log("silly", socket.translater.__('currentPlayerMessage'));
        sendSystemMessage(gameServer.getName(), socket.translater.__('currentPlayerMessage') + data['currentPlayer']);
    }

    /**
     * stops the game server properly and remove it from the active servers list
     *
     * @param {Game} server : the game server we want to stop
     */
    function removeServer(server){
        server.dispose();
        delete rooms[server.getName()];
    }

    function productionSharingManager(serverName){
        logger.debug("Sharing productions");
        io.sockets.in(serverName).emit('shareYourProduction', null);
    }

    /**
     * Adds a new entry in the party historic table
     *
     * @param {Game} gameServer : the game server to record
     */
    function recordGameServer(gameServer){
        let animator = gameServer.getHost().isAnimator() ? gameServer.getHost().getPseudo() : socket.translater.__('partyWithoutAnimator');
        let date = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
        db.recordNewParty(gameServer.getName(), animator, date, function(err, partyId){
            if(err){
                logger.error(err);
            }else{
                logger.log("silly", partyId);
                gameServer.setHistoricId(partyId);
                gameServer.addPlayersToPartyHistoric();
            }
        });
    }

    /**
     * Adds a new entry in the hasPlayedIn table
     * Used to keep a track of the player's production in a party
     *
     * @param {string} pseudo : player's pseudo
     * @param {number} partyHistoricId : id which represents the party in the party historic table
     * @param {string} production : a string which describes the svg production
     */
    function recordProduction(pseudo, partyHistoricId, production, legend){
        logger.log("silly", production);
        db.recordPlayerProductionWithPartyId(pseudo, partyHistoricId, production, legend, function(err){
            if(err) logger.error(err);
        });
    }

    /**
     * This function is used to manage unexpected disconnections
     * When the server looses the connection with a player in the given game server,
     * he is added to a list of inactive players.
     * Then, the player has a short delay to log in again
     * If the player don't reconnect, he is removed from the game
     *
     * @param {Game} server : the game server for which this function works
     */
    function inactivePlayerManager(server){

        for(let index in server.inactivePlayer){
            if(io.sockets.connected[clients[server.inactivePlayer[index]]] == null
            || io.sockets.connected[clients[server.inactivePlayer[index]]].room == null){

                server.removePlayerByPseudo(server.inactivePlayer[index]);
                sendSystemMessage(server.getName(), server.inactivePlayer[index] + socket.translater.__('playerLeavingMessage'));
                logger.verbose(server.inactivePlayer[index] + ' is removed');

                // a player has been removed, we need to inform clients
                if(server.getNbPlayer() === 0){
                    removeServer(server);
                }else{
                    logger.verbose('updating server data');
                    if(server.getStatus() === QUESTION_TIME){
                        logger.verbose('question time');
                        if(server.isAllQuestionsDefined()){
                            logger.verbose('all questions are defined !');
                            startGameTime(server);
                        }else{
                            logger.verbose('updating question time');
                            io.sockets.in(server.getName())
                                      .emit('initQuestionTime', {'players': server.getPlayers(), 'animator': server.getAnimatorPseudo()});
                            io.sockets.in(server.getName())
                                      .emit('actualizeQuestions', getQuestionTimeState(server));
                        }
                    }else if(server.getStatus() === GAME_TIME){
                        logger.verbose('updating game time');
                        io.sockets.in(server.getName())
                                  .emit('changeDuringGameTime', {'players': server.getActivePlayers()});
                    }
                }
                io.sockets.emit('serverListUpdate', listAllServers());
            }
        }

        server.inactivePlayer = [];

        let players = server.getActivePlayers();
        for(let index in players){
            if(io.sockets.connected[clients[players[index]]] == null
            || io.sockets.connected[clients[players[index]]].room == null){
                server.inactivePlayer.push(players[index]);
                logger.verbose(players[index] + ' is inactive');
            }
        }
    }

    /**
     * Initialize the client's translater with the his browser language
     */
    function initTranslater(){
        let config = {
            "lang": socket.handshake.headers['accept-language'].split(',')[0],
            "langFile": "./../../locale.json"
        };
        //init internationalization / localization class
        socket.translater = new i18n_module(config.lang, config.langFile);
        logger.verbose(socket.translater.__("i18n module initialised : " + config.lang));
    }

    // -----------------------------------------------------------------------------
    // --------------------------- SOCKET LISTENERS --------------------------------
    // -----------------------------------------------------------------------------

    /**
     * Process pseudo message
     * Adds a new player in the clients dictionnaries and
     * sends to him the list of available servers
     *
     * form of received data : { 'pseudo': value }
     */
    socket.on('pseudo', function(data){
        logger.info("New player : " + data['pseudo']);
        clients[data["pseudo"]] = socket.id;
        socket.room = null;
        initTranslater();
        io.sockets.emit('serverListUpdate', listAllServers());
    });

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
            logger.verbose("New game server : " + data["server"]["name"]);

            let player = new Player(getPseudoWithId(socket.id), data["role"]);
            let server = new Game(data["server"]["name"],
                                  data["server"]["places"],
                                  player,
                                  data["server"]["cardGameName"],
                                  data["server"]["cardGameLanguage"],
                                  data["server"]["useTimers"],
                                  data["server"]["indivTimer"],
                                  data["server"]["globalTimer"],
                                  data["server"]["forceEndOfTurn"],
                                  data["server"]["delayBeforeForcing"],
                                  data["server"]["sharingInterval"],
                                  WAITING_PLAYERS);
            server.inactivePlayerManager = setInterval(inactivePlayerManager, 10000, server);

            rooms[data["server"]["name"]] = server;
            socket.room = data["server"]["name"];
            socket.join(socket.room);

            // informs the creator that the server has been created successfully
            socket.emit('serverCreated', {'error': false, 'msg': null});
            // refresh servers list
            io.sockets.emit('serverListUpdate', listAllServers());
            // try to start the game
            startGameOnServerFull(server.getName());
        }else{
            // informs the creator that the server's name is not available
            socket.emit('serverCreated', { 'error': true,
                                           'msg': socket.translater.__('serverNameNotAvailableMessage') });
        }
    });

    /**
     * Process "removeServer" message
     * Players sends their messages when they want to remove a server they have created
     * When this message is received, we remove  the given game server from the server
     *
     * form of received data : {'server': server's name}
     */
    socket.on('removeServer', function(data){
        let server = rooms[data["server"]];
        // A player can only remove his own server if the game hasn't started
        if(server != null && server.getStatus() === WAITING_PLAYERS
        && server.getHost().getPseudo() === getPseudoWithId(socket.id)){
            logger.verbose('Removing game server : ' + server.getName());

            io.sockets.in(socket.room).emit('serverRemoved', null);
            let players = server.getActivePlayers();
            for(let index in players){
                io.sockets.connected[clients[players[index]]].leave();
            }

            server.trace.add(server.getHost().getPseudo(), "removed", null, "party");
            removeServer(server);
            io.sockets.emit('serverListUpdate', listAllServers());
        }
    });

    /**
     * Process joinServer message
     * - Creates a new player (player who wants to join the server)
     *   If the player is already in a server, he is automatically removed form his server
     *   before being added in the new one
     * - Sends to all players the new list of available servers
     * - launch the game if the server is full
     *
     * form of received data : {'server': [destination server's name]}
     */
    socket.on('joinServer', function(data){
        let server = rooms[data["server"]];
        if(server != null){ // to prevent reception of bad data
            if(server.getNbPlayer() < server.getPlaces()
            && !(server.isInServer(getPseudoWithId(socket.id)))
            && server.getStatus() === WAITING_PLAYERS){

                let player = new Player(getPseudoWithId(socket.id), "player");
                logger.info("Player " + player.getPseudo() + " joined " + server.getName());

                if(socket.room != null) rooms[socket.room].removePlayer(player);
                server.addNewPlayer(player);
                socket.room = server.getName();
                socket.join(socket.room);

                 // refresh servers list
                io.sockets.emit('serverListUpdate', listAllServers());
                // there is a new player, try to start the game
                startGameOnServerFull(server.getName());

            }else if(server.isInServer(getPseudoWithId(socket.id))
                  && socket.room == null){ // case of reconnection (if a player has lost his connection)

                socket.room = server.getName();
                socket.join(socket.room);

            }else{
                socket.emit('serverUnreachable', {'msg': socket.translater.__('serverUnreachableMessage')});
            }
        }
    });

    /**
     * Process "exitServer" message
     * Players sends this message when they want to leave a game server
     * This message can only be send if the game has not started
     */
    socket.on('exitServer', function(data){
        logger.info(getPseudoWithId(socket.id) + ' leaved ' + socket.room);
        let server = rooms[data['server']];
        if(server != null){
            server.removePlayerByPseudo(getPseudoWithId(socket.id));
            socket.leave(server.getName());
            socket.room = null;

            io.sockets.emit('serverListUpdate', listAllServers());
        }
    });

    /**
     * Process joinGame message
     * Players sends this message automatically when the game starts
     * This message allow the (main) server to know in which room are all players
     *
     * form of received data : {'server': [name of the game server in which player is],
     *                          'pseudo': [player's pseudo]}
     */
    socket.on('joinGame', function(data){
        logger.info(data['pseudo'] + ' joined ' + data['server']);
        let server = rooms[data['server']];
        if(server != null){
            let player = server.getPlayer(data['pseudo']);
            if(player != null){
                socket.room = server.getName();
                socket.join(socket.room);
                clients[player.getPseudo()] = socket.id;
                initTranslater();

                socket.emit('downloadCardGame', {'cardGameName': server.getCardGameName(),
                                                 'cardGameLanguage': server.getCardGameLanguage()});
                if(server.isAllQuestionsDefined()){
                    socket.emit('allQuestionsDefined', getQuestionTimeState(server));
                    socket.emit('initGameTime', {'players': server.getActivePlayers(),
                                                 'animator': server.getAnimatorPseudo(),
                                                 'useTimer': server.getUseTimers(),
                                                 'globalTimer': server.getGlobalTimer()});
                    socket.broadcast.to(server.getName())
                                    .emit('changeDuringGameTime', {'players': server.getActivePlayers()});
                }else{
                    socket.emit('initQuestionTime', {'players': server.getPlayers(), 'animator': server.getAnimatorPseudo()});
                    socket.emit('actualizeQuestions', getQuestionTimeState(server));
                }
            }
        }
    });

    /**
     * Process "recordMyQuestion" message
     * Players sends this message when they have defined their question
     * When this message is received :
     * - we send to all players the question of the player
     * - if all players have defined their questions, we starts the game
     *
     * form of received data : {'question': player's question}
     */
    socket.on('recordMyQuestion', function(data){
        logger.verbose(getPseudoWithId(socket.id) + ' recorded his question');
        let server = rooms[socket.room];
        if(server != null){
            server.recordPlayerQuestion(getPseudoWithId(socket.id), data['question']);
            if(server.isAllQuestionsDefined()){ // all questions are defined, we can starts the game
                startGameTime(server);
            }else{
                io.to(socket.room).emit('actualizeQuestions', getQuestionTimeState(server));
            }
        }
    });

    /**
     * Process "animatorValidation" message
     * Animator sends this message when all players have defined their questions
     * When this message is received, we can start the game
     *
     * form of received datas : no data are send with this message (null)
     */
    socket.on('animatorValidation', function(data){
        logger.verbose(socket.room + ' : received animator validation');
        let server = rooms[socket.room];
        if(server != null){
            server.setAnimReady();
            startGameTime(server);
        }
    });

    /**
     * Process 'endOfTurn' message
     * Players sends this message when they have finished their turn
     * When this message his received server ask to the next player to play
     *
     * form of received data : no data are send with this message (null)
     */
    socket.on('endOfTurn', function(data){
        logger.verbose(getPseudoWithId(socket.id) + ' finished his turn');
        let server = rooms[socket.room];
        if(server != null){
            newTurn(server);
        }
    });

    /**
     * Process tchat message on server side
     * Redirects message to the good receivers
     * If the destination equals 'all', message is sends to all players of the sender's room
     * else message is sends to the specified receiver
     *
     * form of received datas : {'dest': ["all" or receiver's pseudo],
     *                          'msg': [message body]}
     */
    socket.on('message', function(data){
        let server = rooms[socket.room];
        if(server != null){
            logger.verbose(socket.room + ' new message from ' + getPseudoWithId(socket.id) + ' to ' + data['dest']);
            if(data["dest"] === "all"){
                let rep = {"sender": getPseudoWithId(socket.id), "dest": data["dest"], "msg": data["msg"]};
                socket.broadcast.to(socket.room).emit('message', rep);
                server.trace.add(getPseudoWithId(socket.id), "send public message", data["msg"], data['dest']);
            } else {
                let rep = {"sender": getPseudoWithId(socket.id), "dest": data["dest"], "msg": data["msg"]};
                io.to(clients[data["dest"]]).emit("message", rep);
                server.trace.add(getPseudoWithId(socket.id), "send private message", data["msg"], data['dest']);
            }
        }
    });

    /**
     * Process "cardPicked" message on server side
     * This message is send by client when a player has picked a new card
     * When we receives this message, we send the card picked by the player to other players
     *
     * form of received data : {'family': picked card's family, 'cardContent': picked card's content}
     */
    socket.on('cardPicked', function(data){
        logger.verbose(getPseudoWithId(socket.id) + ' picked a new card');
        io.sockets.in(socket.room).emit('cardPicked', data);
        server.trace.add("party", "set card", JSON.stringify(data));
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

    /**
     * Process "processStopGame" message on server side
     * This message is sent by client when a player wants to stop the game
     * When this message is received, we ask to all players if they agree with it
     *
     * form of received datas : no datas are sent with this message (null)
     */
    socket.on('processStopGame', function(data){
        logger.debug(getPseudoWithId(socket.id) + ' started a stop game process');
        let server = rooms[socket.room];
        if(server != null){
            server.exitBuffer.push(getPseudoWithId(socket.id));
            if(server.exitBuffer.length === server.getNbPlayer()){
                // only one player in the game, stoped the game
                io.sockets.in(server.getName()).emit('gameEnd', null);
            }else{
                // ask to all players if they agree
                socket.broadcast.to(server.getName())
                                .emit('stopGame?', server.exitBuffer);
            }
        }
    });

    /**
     * Process "stopGame" message on server side
     * This message is sent by client to answer at the "stopGame?" message
     *
     * form of received data : {'exit': player's answer (true if he wants to stop, else false)}
     */
    socket.on('stopGame', function(data){
        logger.debug(getPseudoWithId(socket.id) + ' wants to stop game ? : ' + data['exit']);
        let server = rooms[socket.room];
        if(server != null){
            if(data['exit']){
                server.exitBuffer.push(getPseudoWithId(socket.id));
                if(server.exitBuffer.length === server.getNbPlayer()){ // all players have accepted to stop the game
                    io.sockets.in(server.getName()).emit('gameEnd', null);
                }else{  // another player has accepted to stop the game
                    io.to(server.getName()).emit('refreshExitPanel', server.exitBuffer);
                }
            }else{ // a player has refused to stop  the game
                io.to(server.getName()).emit('stopGameProcessAborted', null);
                server.exitBuffer = [];
            }
        }
    });

    /**
     * Process quitGame message
     * - Informs server that the player has leaved the game server
     * - Removes the player from the game server
     * - Sends the actualized list of players to the game server players
     * - Sends to all players the actualized list of servers
     *
     * form of received data : {'server': [game server name who player currently is],
     *                          'pseudo': [player's name]}
     */
    socket.on('quitGame', function(data){
        logger.verbose(data['pseudo'] + ' leaved game server ' + socket.room);
        let server = rooms[data['server']];
        if(server != null){
            let currentPlayer = server.getCurrentPlayer();

            server.removePlayerByPseudo(data['pseudo']);
            socket.leave(data['server']);
            socket.room = null;
            recordProduction(data['pseudo'], server.getHistoricId(), data['production'], data['legend']);

            if(server.getNbPlayer() === 0){
                removeServer(server);
            }else{
                io.sockets.in(server.getName())
                          .emit('changeDuringGameTime', {'players': server.getActivePlayers()});
                sendSystemMessage(server.getName(), data['pseudo'] + socket.translater.__('playerLeavingMessage'));
                if(currentPlayer === data['pseudo']) newTurn(server);
            }
            io.sockets.emit('serverListUpdate', listAllServers());
        }
    });
};
