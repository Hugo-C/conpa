
const WAITING_PLAYERS = "waiting for players";
const IN_GAME = "in game";

module.exports = class Game {
    constructor(name, places, host, indivTimer, globalTimer){
        this.name = name;
        this.places = places;
        this.host = host;
        this.players = require('fifo')();
        this.players.push(host);
        this.indivTimer = indivTimer;
        this.globalTimer = globalTimer;
        this.status = WAITING_PLAYERS;
        this.exitBuffer = []; // nobody wants quit the game
    }

    getName(){
        return this.name;
    }

    getPlaces(){
        return this.places;
    }

    getNbPlayer(){
        return this.players.length;
    }

    getHost(){
        return this.host;
    }

    getPlayers(){
        var result = [];
        for(var node = this.players.node; node; node = this.players.next(node)){
            result.push(node.value.getPseudo());
        }
        return result;
    }

    getStatus(){
        return this.status;
    }

    /**
     * Retrieves the question for all players in the game
     *
     * @return {object array} : list of all players question
     *                          the result is an array of object which have the form :
     *                          { 'player': player's pseudo, 'question': player's question }
     */
    getPlayersQuestion(){
        var result = [];
        for(var node = this.players.node; node; node = this.players.next(node)){
            result.push({'player': node.value.getPseudo(), 'question': node.value.getQuestion()});
        }
        return result;
    }

    getPlayerNode(pseudo){
         var playerNode = null;
         var node = this.players.node;
         while(node && playerNode == null){
            if(node.value.pseudoEquals(pseudo)){
                playerNode = node;
            }
            node = this.players.next(node);
        }
        return playerNode;
    }

    recordPlayerQuestion(pseudo, question){
        var playerNode = this.getPlayerNode(pseudo);
        if(playerNode != null) playerNode.value.setQuestion(question);
    }

    setStatusInGame(){
        this.status = IN_GAME;
    }

    addNewPlayer(player){
        this.players.push(player);
    }

    isInServer(playerPseudo){
        return this.getPlayerNode(playerPseudo) != null;
    }

    removePlayer(player){
        var playerNode = this.getPlayerNode(player.getPseudo());
        if(playerNode != null) this.players.remove(playerNode);
        //this.players.remove(player);
        /*for(var node = this.players.node; node; node = this.players.next(node)){
            if(node.value.pseudoEquals(player.getPseudo())){
                this.players.remove(node);
                return;
            }
        }*/
    }

    removePlayerByPseudo(pseudo){
        var playerNode = this.getPlayerNode(pseudo);
        if(playerNode != null) this.players.remove(playerNode);
        //this.players.remove(player);
        /*for(var node = this.players.node; node; node = this.players.next(node)){
            if(node.value.pseudoEquals(pseudo)){
                this.players.remove(node);
                return;
            }
        }*/
    }

    nbPlayersReady(){
        var counter = 0;
        for(var node = this.players.node; node; node = this.players.next(node)){
            if(node.value.isReady()){
                counter++;
            }
        }
        return counter;
    }
};
