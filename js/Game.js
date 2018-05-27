const logger = require("../js/logger");
const Trace = require("../js/Trace");

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
        this.exitBuffer = []; // nobody wants to quit the game
        this.partyHistoricId = null;

        this.trace = new Trace();
        this.trace.add(this.host.getPseudo(), "create a serveur", this.name);
        this.trace.add(this.host.getPseudo(), "set himself as animator", host.isAnimator());  // FIXME show only if true ?
        if(this.useTimers){  // FIXME add server as target ?
            this.trace.add(this.host.getPseudo(), "set individual timer", this.indivTimer);
            this.trace.add(this.host.getPseudo(), "set global timer", this.globalTimer);
            this.trace.add(this.host.getPseudo(), "set force end of turn", this.forceEndOfTurn);
            if(this.forceEndOfTurn){
                this.trace.add(this.host.getPseudo(), "set delay before forcing end of turn", this.delayBeforeForcing);
            }
        }

        if(!host.isAnimator()){
            this.players.push(host);
        }
    }

    /**
      * Returns the game server name
      * @return {string} : game server name
      */
    getName(){
        return this.name;
    }

    /**
     * Returns the game server capacity
     * @return {integer} : number of players that can accept this game
     */
    getPlaces(){
        return this.places;
    }

    /**
     * Returns how many players are currently in the game
     * @return {integer} : number of players currently in the game
     */
    getNbPlayer(){
        return this.activePlayers.length;
    }

    /**
     * Returns the name of the player who have created this server
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
     * Returns the name of the animator
     * @return {string} : if there is an animator : his name
     *                    else : an empty string
     */
    getAnimatorPseudo(){
        if(this.host.isAnimator()){
            return this.host.getPseudo();
        }else{
            return null;
        }
    }

    /**
     * Returns the list of all players's pseudos (only players, not animator)
     */
    getPlayers(){
        let result = []; // used to store players pseudo
        for(let node = this.players.node; node; node = this.players.next(node)){
            result.push(node.value.getPseudo());
        }
        return result;
    }

    /**
     * Return the list of all players's pseudos (players + animator)
     * @return {string list} : players's pseudo currently in the game
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
     * @return {object array} : list of all players's questions
     *                          the result is an array of objects which have the form :
     *                          { 'player': player's pseudo, 'question': player's question }
     */
    getPlayersQuestion(){
        let result = []; // dictionnary list. Used to store for each player : his pseudo and his question
        for(let node = this.players.node; node; node = this.players.next(node)){
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
            logger.verbose("nb players ready : " + this.nbPlayersReady());
            logger.verbose("nb of players : " + this.players.length);
            logger.verbose("Is anim ready : " + this.host.isReady());
            return this.nbPlayersReady() === this.players.length && this.host.isReady();
        }else{
            logger.verbose("nb players ready : " + this.nbPlayersReady());
            logger.verbose("nb of players : " + this.getNbPlayer());
            return this.nbPlayersReady() === this.getNbPlayer();
        }
    }

    /**
     * Return the node of the fifo list corresponding to the given pseudo
     * @param {string} pseudo : pseudo of the desired player
     * @return {FIFO Node} : player's node corresponding to the given pseudo
     */
    getPlayerNode(pseudo){
        let playerNode = null; // used to retrieve the player's node
        let node = this.players.node; // fist node of the fifo
        while(node && playerNode == null){
            if(node.value.pseudoEquals(pseudo)){
                playerNode = node;
            }
            node = this.players.next(node); // get the next node of the current node
        }
        return playerNode;
    }

    /**
     * Returns the instance of Player corresponding to the given pseudo
     * @param {string} pseudo : pseudo of the desired player
     * @return {Player} : instance of Player
     */
    getPlayer(pseudo){
        if(this.host.pseudoEquals(pseudo)){
            return this.host;
        }else{
            let playerNode = this.getPlayerNode(pseudo);
            return playerNode == null ? null : playerNode.value;
        }
    }

    /**
     * Returns the id of this party in the historic table
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
        this.trace.add("party", "set the turn", this.getCurrentPlayer());
    }

    /**
     * Returns the pseudo of the player of whom it's the turn
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
     * Returns the pseudo of the player who will play to the next turn
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
     * Returns true if the game uses timers, returns false if not
     * @return {Boolean}
     */
    getUseTimers(){
        return this.useTimers;
    }

    /**
     * Returns the value of the global timer
     * @return {number}
     */
    getGlobalTimer(){
        return this.globalTimer;
    }

    /**
     * Retursn the value of the individual timer
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
     * Returns the delay between each productions sharing
     * @return {number}
     */
    getSharingInterval(){
        logger.debug('SHARING INTERVAL : ' + this.sharingInterval * 1000);
        return this.sharingInterval * 1000;
    }

    /**
     * Updates the question of a player
     * @param {string} pseudo : player's pseudo for which we want to update the question
     * @param {string} question : player's question
     */
    recordPlayerQuestion(pseudo, question){
        let playerNode = this.getPlayerNode(pseudo);
        if(playerNode != null) playerNode.value.setQuestion(question);
        this.trace.add(pseudo, "set his question", question);
    }

    setAnimReady(){
        this.host.setIsAnimReady(true);
        this.trace.add(this.host.pseudo, "set his question", question);
    }

    /**
     * Change the status of the party
     * @param {string} newStatus : new status of the party
     */
    setStatus(newStatus){
        this.status = newStatus;
        this.trace.add("party", "set the status", newStatus);
    }

    /**
     * Changes the historic id of the party
     * This function is called only one time when all players have defined their questions
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
        this.trace.add(player.pseudo, "joined the game");
    }

    /**
     * Check if the given player is recorded in this game server
     * @param {string} playerPseudo : pseudo of the player that we are searching for
     */
    isInServer(playerPseudo){
        return this.getPlayerNode(playerPseudo) != null;
    }

    removePlayerFromActivePlayersList(pseudo){
        let index = this.activePlayers.indexOf(pseudo);
        if (index > -1) {
            this.activePlayers.splice(index, 1);
        }
        this.trace.add(pseudo, "is inactive");
    }

    /**
     * Removes a player from this game server
     * @param {Player} player : player to remove from this game server
     */
    removePlayer(player){
        this.removePlayerByPseudo(player.getPseudo());
    }

    /**
     * Remove a player from this game server
     * @param {string} pseudo : pseudo of the player to remove from this game server
     */
    removePlayerByPseudo(pseudo){
        let playerNode = this.getPlayerNode(pseudo);
        if(playerNode != null) this.players.remove(playerNode);
        this.removePlayerFromActivePlayersList(pseudo);
        this.trace.add("party", "remove player", null, pseudo);
    }

    /**
     * Returns the number of players who have already defined their questions
     * (a question is considered as defined when this one is not an empty string)
     * @return {integer} : number of players who have already defined their questions
     */
    nbPlayersReady(){
        let counter = 0;
        for(let node = this.players.node; node; node = this.players.next(node)){
            if(node.value.isReady()){
                counter++;
            }
        }
        return counter;
    }

    addPlayersToPartyHistoric(){
        console.assert(this.partyHistoricId != null, "historic id is null !"); // party historic id should be not null
        for(let node = this.players.node; node; node = this.players.next(node)){
            node.value.recordPlayer(this.partyHistoricId);
        }
        if(this.host.isAnimator()) this.host.recordPlayer(this.partyHistoricId);
    }

    /**
     * Prepare the object to be destroyed
     */
    dispose(){
        clearInterval(this.inactivePlayerManager);
        clearInterval(this.productionSharingManager);
        this.trace.save();  // TODO give a filename based on game server's name and current date
    }
};
