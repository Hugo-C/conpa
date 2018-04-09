
module.exports = class Game {
    constructor(name, places, host, indivTimer, globalTimer, status){
        this.name = name;
        this.places = places;
        this.host = host;
        this.players = require('fifo')();
        this.players.push(host);
        this.indivTimer = indivTimer;
        this.globalTimer = globalTimer;
        this.status = status;
        this.inactivePlayerManager = null;
        this.productionSharingManager = null;
        this.inactivePlayer = [];
        this.exitBuffer = []; // nobody wants quit the game
        this.partyHistoricId = null;
    }

    /**
      * Return game server name
      * @return {string} : game server name
      */
    getName(){
        return this.name;
    }

    /**
     * Return game server capacity
     * @return {integer} : number of players that can accept this game
     */
    getPlaces(){
        return this.places;
    }

    /**
     * Return how many players are currently in the game
     * @return {integer} : number of players currently in the game
     */
    getNbPlayer(){
        return this.players.length;
    }

    /**
     * Return the name of the player who have created this server
     * @return {string} : name of the game server's creator
     */
    getHost(){
        return this.host;
    }

    /**
     * Return the list of players pseudo who are in the game
     * @return {string list} : players pseudo currently in the game
     */
    getPlayers(){
        var result = []; // used to store players pseudo
        for(var node = this.players.node; node; node = this.players.next(node)){
            result.push(node.value.getPseudo());
        }
        return result;
    }

    /**
     * Return the status of the game server
     * @return {string} : game server's status
     * status is used as indicator for player who are not in the game to know the
     * current state of the server
     */
    getStatus(){
        return this.status;
    }

    /**
     * Return the question of all players in the game
     * @return {object array} : list of all players question
     *                          the result is an array of object which have the form :
     *                          { 'player': player's pseudo, 'question': player's question }
     */
    getPlayersQuestion(){
        var result = []; // dictionnary list. Used to store for each player : his pseudo and his question
        for(var node = this.players.node; node; node = this.players.next(node)){
            result.push({'player': node.value.getPseudo(), 'question': node.value.getQuestion()});
        }
        return result;
    }

    /**
     * Return the node of the fifo list corresponding to the given pseudo
     * @param {string} pseudo : pseudo of the desired player
     * @return {FIFO Node} : player's node corresponding to the given pseudo
     */
    getPlayerNode(pseudo){
         var playerNode = null; // used to retrieve the player's node
         var node = this.players.node; // fist node of the fifo
         while(node && playerNode == null){
            if(node.value.pseudoEquals(pseudo)){
                playerNode = node;
            }
            node = this.players.next(node); // get the next node of the current node
        }
        return playerNode;
    }

    /**
     * Return the instance of Player which corresponding to the given pseudo
     * @param {string} pseudo : pseudo of the desired player
     * @return {Player} : instance of Player
     */
    getPlayer(pseudo){
        var playerNode = this.getPlayerNode(pseudo);
        return playerNode == null ? null : playerNode.value;
    }

    /**
     * Return the id of this party in the historic table
     * @return {number} : historic id of this party
     */
    getHistoricId(){
        return this.partyHistoricId;
    }

    /**
     * Update the question of a player
     * @param {string} pseudo : player's pseudo for which we want to update the question
     * @param {string} question : player's question
     */
    recordPlayerQuestion(pseudo, question){
        var playerNode = this.getPlayerNode(pseudo);
        if(playerNode != null) playerNode.value.setQuestion(question);
    }

    /**
     * Change the status of the party
     * @param {string} status : new status of the party
     */
    setStatus(newStatus){
        this.status = newStatus;
    }

    /**
     * Change the historic id of the party
     * This function is called only one time when all players have defined their question
     * Indeed there is no reason for which this id can change during the game
     * @param {number} historicId : new id of the party in the historic table
     */
    setHistoricId(historicId){
        this.partyHistoricId = historicId;
    }

    /**
     * Add a new player to the game
     * @param {Player} player : player to add in the game
     */
    addNewPlayer(player){
        this.players.push(player);
    }

    /**
     * Check if the given player is recorded in this game server
     * @param {string} playerPseudo : pseudo of the player that we searched
     */
    isInServer(playerPseudo){
        return this.getPlayerNode(playerPseudo) != null;
    }

    /**
     * Remove a player from this game server
     * @param {Player} player : player to remove from this game server
     */
    removePlayer(player){
        var playerNode = this.getPlayerNode(player.getPseudo());
        if(playerNode != null) this.players.remove(playerNode);
    }

    /**
     * Remove a player from this game server
     * @param {string} pseudo : pseudo of the player to remove from this game server
     */
    removePlayerByPseudo(pseudo){
        var playerNode = this.getPlayerNode(pseudo);
        if(playerNode != null) this.players.remove(playerNode);
    }

    /**
     * Return the number of players who have already defined their question
     * (a question is considered as defined when this one is different than the empty string)
     * @return {integer} : number of players who have already defined their question
     */
    nbPlayersReady(){
        var counter = 0;
        for(var node = this.players.node; node; node = this.players.next(node)){
            if(node.value.isReady()){
                counter++;
            }
        }
        return counter;
    }

    addPlayersToPartyHistoric(database){
        console.assert(this.partyHistoricId != null, "historic id is null !"); // party historic id should be not null
        for(var node = this.players.node; node; node = this.players.next(node)){
            node.value.recordPlayer(database, this.partyHistoricId);
        }
    }
}
