
module.exports = class Game {
    constructor(name, places, host, cardGameName, cardGameLanguage, useTimers,
                indivTimer, globalTimer, forceEndOfTurn, delayBeforeForcing,
                sharingInterval, status){
        this.name = name;
        this.places = places;
        this.host = host;
        this.players = require('fifo')();
        this.activePlayers = [];
        this.activePlayers.push(host.getPseudo());
        this.cardGameName = cardGameName;
        this.cardGameLanguage = cardGameLanguage;
        this.useTimers = useTimers;
        this.indivTimer = indivTimer;
        this.globalTimer = globalTimer;
        this.forceEndOfTurn = forceEndOfTurn;
        this.delayBeforeForcing = delayBeforeForcing;
        this.status = status;
        this.inactivePlayerManager = null;
        this.productionSharingManager = null;
        this.sharingInterval = sharingInterval;
        this.inactivePlayer = [];
        this.exitBuffer = []; // nobody wants quit the game
        this.partyHistoricId = null;

        if(!host.isAnimator()){
            this.players.push(host);
        }
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
        return this.activePlayers.length;
    }

    /**
     * Return the name of the player who have created this server
     * @return {string} : name of the game server's creator
     */
    getHost(){
        return this.host;
    }

    getCardGameName(){
        return this.cardGameName;
    }

    getCardGameLanguage(){
        return this.cardGameLanguage;
    }

    /**
     * Return the name of the animator
     * @return {string} : if there is an animator : his name
     *                    else : the empty string
     */
    getAnimatorPseudo(){
        if(this.host.isAnimator()){
            return this.host.getPseudo();
        }else{
            return null;
        }
    }

    /**
     * Return the list of all players pseudo (only players, not animator)
     */
    getPlayers(){
        var result = []; // used to store players pseudo
        for(var node = this.players.node; node; node = this.players.next(node)){
            result.push(node.value.getPseudo());
        }
        return result;
    }

    /**
     * Return the list of all players pseudo (players + animator)
     * @return {string list} : players pseudo currently in the game
     */
    getActivePlayers(){
        return this.activePlayers;
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
     * Check if all players have defined their question
     * @return {Boolean}
     */
    isAllQuestionsDefined(){
        if(this.host.isAnimator()){
            console.log("nb players ready : " + this.nbPlayersReady());
            console.log("nb of players : " + this.players.length);
            console.log("Is anim ready : " + this.host.isReady());
            return this.nbPlayersReady() == this.players.length && this.host.isReady();
        }else{
            console.log("nb players ready : " + this.nbPlayersReady());
            console.log("nb of players : " + this.getNbPlayer());
            return this.nbPlayersReady() == this.getNbPlayer();
        }
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
        if(this.host.pseudoEquals(pseudo)){
            return this.host;
        }else{
            var playerNode = this.getPlayerNode(pseudo);
            return playerNode == null ? null : playerNode.value;
        }
    }

    /**
     * Return the id of this party in the historic table
     * @return {number} : historic id of this party
     */
    getHistoricId(){
        return this.partyHistoricId;
    }

    /**
     * Move the next player to the top of the list
     */
    newTurn(){
        if(this.players.length > 0){
            this.players.bump(this.players.node);
        }
    }

    /**
     * Return the pseudo of the player for whom it's the turn
     * @return {string} : a player's pseudo
     */
    getCurrentPlayer(){
        if(this.players.length > 0){
            return this.players.first().getPseudo();
        }else{
            return "";
        }
    }

    /**
     * Return the pseudo of the player who will played to the next turn
     * @return {string} : a player's pseudo
     */
    getNextPlayer(){
        if(this.players.length > 1){
            return this.players.next(this.players.node).value.getPseudo();
        }else{
            return this.getCurrentPlayer();
        }
    }

    /**
     * Return true if the game use timers, return false if not
     * @return {Boolean}
     */
    getUseTimers(){
        return this.useTimers;
    }

    /**
     * Return the value of the global timer
     * @return {number}
     */
    getGlobalTimer(){
        return this.globalTimer;
    }

    /**
     * Return the value of the individual timer
     * @return {number}
     */
    getIndividualTimer(){
        return this.indivTimer;
    }

    getForceEndOfTurn(){
        return this.forceEndOfTurn;
    }

    getDelayBeforeForcing(){
        return this.delayBeforeForcing * this.indivTimer;
    }

    /**
     * Return the delay between each productions sharing
     * @return {number}
     */
    getSharingInterval(){
        console.log('SHARING INTERVAL : ' + this.sharingInterval * 1000);
        return this.sharingInterval * 1000;
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

    setAnimReady(){
        this.host.setIsAnimReady(true);
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
        this.activePlayers.push(player.getPseudo());
    }

    /**
     * Check if the given player is recorded in this game server
     * @param {string} playerPseudo : pseudo of the player that we searched
     */
    isInServer(playerPseudo){
        return this.getPlayerNode(playerPseudo) != null;
    }

    removePlayerFromActivePlayersList(pseudo){
        let index = this.activePlayers.indexOf(pseudo);
        if (index > -1) {
            this.activePlayers.splice(index, 1);
        }
    }

    /**
     * Remove a player from this game server
     * @param {Player} player : player to remove from this game server
     */
    removePlayer(player){
        var playerNode = this.getPlayerNode(player.getPseudo());
        if(playerNode != null) this.players.remove(playerNode);
        this.removePlayerFromActivePlayersList(player.getPseudo());
    }

    /**
     * Remove a player from this game server
     * @param {string} pseudo : pseudo of the player to remove from this game server
     */
    removePlayerByPseudo(pseudo){
        var playerNode = this.getPlayerNode(pseudo);
        if(playerNode != null) this.players.remove(playerNode);
        this.removePlayerFromActivePlayersList(pseudo);
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
        if(this.host.isAnimator()) this.host.recordPlayer(database, this.partyHistoricId);
    }
}
