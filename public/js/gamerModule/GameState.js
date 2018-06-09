class GameState {

    constructor(){
        this.animator = null;
        this.players = [];
        this.playersProduction = {}; // used to keep in memory other players production and access it
        this.production = null; // used to store Production class instance
        this.mosaic = {}; // used to store Production class instances of the mosaic
        this.state = {}; // used to keep in memory the name of the current player and the next one
        this.useTimer = false;
        this.globalTimerValue = 0;
        this.indivTimerValue = 0;
        this.globalTimer = 0;
        this.overtime = 0;
        this.globalTimerControler = null;
        this.indivTimer = 0;
        this.indivTimerControler = null;
        this.countdown = 0;
        this.forceEndOfTurnControler = null;
        this.delayForRollingTheDice = 0;
        this.waitsForDice = null;
        this.timersData;
        this.castedProductionData;
    }

    setAnimator(animator){
        this.animator = animator;
    }

    getAnimator(){
        return this.animator;
    }

    getUseTimer(){
        return this.useTimer;
    }

    setTimersData(data){
        this.timersData = data;
    }

    getTimersData(){
        return this.timersData;
    }

    static timerToString(timer){
        let seconds = timer;
        let hours = parseInt(seconds / 3600);
        seconds = seconds % 3600;
        let minutes = parseInt(seconds / 60);
        seconds = seconds % 60;

        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        return (hours + ':' + minutes + ':' + seconds);
    }

    globalTimerManager(){
        if(this.globalTimer > 0){
            this.globalTimer--;
            $('#globalTimer span').text(GameState.timerToString(this.globalTimer));
        }else{
            this.overtime++;
            let globalTimerField = $('#globalTimer span');
            globalTimerField.text(' - ' + GameState.timerToString(this.overtime));
            if(!globalTimerField.parent().hasClass('timeover')){
                globalTimerField.parent().addClass('timeover');
            }
        }
    }

    startGolbalTimer(timer){
        this.useTimer = true;
        if(this.globalTimerControler == null){
            this.globalTimer = timer;
            this.globalTimerControler = setInterval(this.globalTimerManager.bind(this), 1000);
        }
    }

    indivTimerManager(){
        if(this.indivTimer > 0){
            this.indivTimer--;
        }else{
            clearInterval(this.indivTimerControler);
            this.indivTimerControler = null;
        }
    }

    startIndivTimer(begin, duration){
        this.indivTimer = duration;
        indivTimerAnimation(begin, duration);
        if(this.indivTimerControler != null){
            clearInterval(this.indivTimerControler);
            this.indivTimerControler = null;
        }
        this.indivTimerControler = setInterval(this.indivTimerManager.bind(this), 1000);
    }

    stopIndivTimer(){
        clearInterval(this.indivTimerControler);
        this.indivTimerControler = null;
        indivTimerAnimation(0, 0);
    }

    forceEndOfTurnProcess(callback){
        if(this.countdown > 0){
            this.countdown--;
        }else{
            clearInterval(this.forceEndOfTurnControler);
            this.forceEndOfTurnControler = null;
            callback();
        }
    }

    forceEndOfTurn(delay, callback){
        this.countdown = delay;
        if(this.forceEndOfTurnControler != null){
            clearInterval(this.forceEndOfTurnControler);
            this.forceEndOfTurnControler = null;
        }
        this.forceEndOfTurnControler = setInterval(this.forceEndOfTurnProcess.bind(this), 1000, callback);
    }

    stopWaitsForDiceProcess(){
        clearInterval(this.waitsForDice);
        this.waitsForDice = null;
    }

    waitsForDiceProcess(callback){
        if(this.delayForRollingTheDice > 0){
            this.delayForRollingTheDice--;
        }else{
            this.stopWaitsForDiceProcess();
            callback();
        }
    }

    startDiceDelay(delay, callback){
        this.delayForRollingTheDice = delay;
        if(this.waitsForDice != null){
            clearInterval(this.waitsForDice);
            this.waitsForDice = null;
        }
        this.waitsForDice = setInterval(this.waitsForDiceProcess.bind(this), 1000, callback);
    }

    playersOffline(){
        for(let index = 0; index < this.players.length; index++){
            this.players[index]['state'] = 'offline';
        }
    }

    setPlayerOnline(pseudo){
        for(let index = 0; index < this.players.length; index++){
            if(this.players[index]['pseudo'] === pseudo)
                this.players[index]['state'] = 'online';
        }
    }

    updatePlayersState(players){
        this.playersOffline();
        for(let index = 0; index < players.length; index++){
            this.setPlayerOnline(players[index]);
        }
    }

    /**
     * Register all players who are in the players list
     * When a player is registered, the online status is associated to him
     *
     * @param {string array} players : players list ( pseudo of all players )
     */
    setPlayers(players){
        for(let index = 0; index < players.length; index++){
            if(!this.playerExists(players[index])){
                this.players.push({'pseudo': players[index], 'state': 'online'});
            }
        }
    }

    updateMosaic(){
        for(let index = 0; index < this.players.length; index++){
            if(this.players[index]['state'] === 'offline')
                delete this.mosaic[this.players[index]['pseudo']];
        }
    }

    getPlayers(){
        return this.players;
    }

    getPlayersPseudo(){
        let pseudos = [];
        for(let index = 0; index < this.players.length; index++){
            pseudos.push(this.players[index]['pseudo']);
        }
        return pseudos;
    }

    getOnlinePlayers(){
        let res = [];
        for(let index = 0; index < this.players.length; index++){
            if(this.players[index]['state'] === 'online')
                res.push(this.players[index]['pseudo']);
        }
        return res;
    }

    clearMosaic(){
        this.mosaic = {};
    }

    addNewProduction(pseudo, production, legend){
        this.playersProduction[pseudo] = {'production': production, 'legend': legend};
    }

    getPlayersProduction(){
        return this.playersProduction;
    }

    productionAvailable(pseudo){
        return this.playersProduction[pseudo] != null;
    }

    initProduction(container, panning){
        this.production = new Production(container, panning);
        this.production.initToolsListeners();
    }

    getProduction(){
        return this.production;
    }

    createMosaic(container, players){
        this.mosaic = new Mosaic(container);
        let channels = [];
        let onlinePlayers = this.getOnlinePlayers();
        for(let index = 0; index < onlinePlayers.length; index++){
            if(onlinePlayers[index] != sessionStorage.pseudo){
                channels.push(onlinePlayers[index]);
            }
        }
        this.mosaic.initMosaic(channels);
    }

    getMosaicProduction(pseudo){
        return this.mosaic.getMosaicChannels()[pseudo];
    }

    getMosaic(){
        return this.mosaic;
    }

    getNextPlayer(){
        return this.state['nextPlayer'];
    }

    getCurrentPlayer(){
        return this.state['currentPlayer'];
    }

    setState(state){
        this.state = state;
    }

    playerExists(pseudo){
        for(let index = 0; index < this.players.length; index++){
            if(pseudo == this.players[index]['pseudo']){
                return true;
            }
        }
        return false;
    }

    setPlayersList(players){
        for(let index = 0; index < players.length; index++){
            if(!this.playerExists(players[index]['pseudo'])){
                this.players.push(players[index]);
            }
        }
    }

    /**
     * Used to save the data about the casted production until the player has
     * accepted the cast or not
     * @param {Object} data : {'pseudo': owner of the casted production,
     *                         'question': question of the production's owner,
     *                         'production': production data,
     *                         'legend': production's legend}
     */
    setCastedProductionData(data){
        this.castedProductionData = data;
    }

    /**
     * Used to display the casted production of the player has accepted the cast
     * @return {Object} : {'pseudo': owner of the casted production,
     *                     'question': question of the production's owner,
     *                     'production': production data,
     *                     'legend': production's legend}
     */
    getCastedProductionData(){
        return this.castedProductionData;
    }

// -----------------------------------------------------------------------------
// Functions used to saved and restored the game's state
// /!\ We used "try ... catch" in these functions to prevent error with the
// functions "JSON.stringify" and "JSON.parse".
// -----------------------------------------------------------------------------

    /**
     * Saves the last version of the player's production (production + legend)
     * - if player is working on his production, the last version is the current
     *   state of the production on which he works
     * - if player is consulting an other production, the last version is the one
     *   stored in 'playersProduction' dictionnary
     */
    saveProduction(){
        try{
            let currentProductionOwner = $('.selectedProduction')[0].id.split('_')[0];
            if(currentProductionOwner === sessionStorage.pseudo){
                sessionStorage.productionData = JSON.stringify(this.getProduction().saveProduction());
                sessionStorage.legendData = JSON.stringify(this.getProduction().saveLegend());
            }else{
                sessionStorage.productionData = JSON.stringify(this.getPlayersProduction()[sessionStorage.pseudo]['production']);
                sessionStorage.legendData = JSON.stringify(this.getPlayersProduction()[sessionStorage.pseudo]['legend']);
            }
        }catch(err){
            console.log(err);
        }
    }

    restoreProduction(){
        try{
            this.getProduction().restoreProduction(JSON.parse(sessionStorage.productionData));
            this.getProduction().restoreLegend(JSON.parse(sessionStorage.legendData));
        }catch(err){
            console.log(err);
        }
        delete sessionStorage.productionData;
        delete sessionStorage.legendData;
    }

    savePlayersList(){
        try{
            sessionStorage.players = JSON.stringify(this.players);
        }catch(err){
            console.log(err);
        }
    }

    restorePlayersList(){
        try{
            this.setPlayersList(JSON.parse(sessionStorage.players));
        }catch(err){
            console.log(err);
        }
        delete sessionStorage.players;
    }

    savePlayersProductionList(){
        try{
            sessionStorage.playersProduction = JSON.stringify(this.playersProduction);
        }catch(err){
            console.log(err);
        }
    }

    restorePlayersProductionList(){
        try{
            this.playersProduction = JSON.parse(sessionStorage.playersProduction);
        }catch(err){
            console.log(err);
        }
        delete sessionStorage.playersProduction;
    }

    saveState(){
        try{
            sessionStorage.state = JSON.stringify(this.state);
        }catch(err){
            console.log(err);
        }
    }

    restoreState(){
        try{
            this.state = JSON.parse(sessionStorage.state);
        }catch(err){
            console.log(err);
        }
        delete sessionStorage.state;
    }

    saveGameState(){
        sessionStorage.animator = this.animator;
        this.savePlayersList();
        if(sessionStorage.pseudo != this.getAnimator()) this.saveProduction();
        this.savePlayersProductionList();
        this.saveState();
        sessionStorage.useTimer = this.useTimer;
        sessionStorage.globalTimerValue = this.globalTimerValue;
        sessionStorage.indivTimerValue = this.indivTimerValue;
        if (this.useTimer) clearInterval(this.globalTimerControler);
        sessionStorage.globalTimer = this.globalTimer;
        sessionStorage.overtime = this.overtime;
        if (this.indivTimerControler != null) clearInterval(this.indivTimerControler);
        sessionStorage.indivTimer = this.indivTimer;
        sessionStorage.isDiceDisplayed = isDiceDisplayed();
    }

    restoreGameState(){
        this.animator = sessionStorage.animator === "" ? null : sessionStorage.animator;
        this.restorePlayersList();
        createPlayersProductionList(this.getPlayersPseudo());
        actualizeChatPlayersList(this.getOnlinePlayers());
        if(sessionStorage.role === 'animator'){
            this.createMosaic($('.SWA_Master'), this.getOnlinePlayers());
        }else{
            this.restoreProduction();
        }
        this.restorePlayersProductionList();
        this.restoreState();
        this.useTimer = (sessionStorage.useTimer === 'true');
        this.globalTimerValue = parseInt(sessionStorage.globalTimerValue);
        this.indivTimerValue = parseInt(sessionStorage.indivTimerValue);
        this.globalTimer = parseInt(sessionStorage.globalTimer);
        this.overtime = parseInt(sessionStorage.overtime);
        if(this.useTimer){
            this.startGolbalTimer(this.globalTimer);
        }
        this.indivTimer = parseInt(sessionStorage.indivTimer);
        if(this.indivTimer > 0){
            this.startIndivTimer(0, this.indivTimer);
        }
        if(this.getCurrentPlayer() !== sessionStorage.pseudo){
            deactivateNextPlayerButton();
        }else if(sessionStorage.isDiceDisplayed === 'true'){
            showDice();
            this.startDiceDelay(delayToRollTheDie, rollTheDice);
        }
        if(this.getCurrentPlayer() === sessionStorage.pseudo){
            individualTimerColor('#1F5473', '#0AA6E1');
        }else{
            individualTimerColor('black', 'grey');
        }
        actualizePlayersProductionList();

        delete sessionStorage.animator;
        delete sessionStorage.useTimer;
        delete sessionStorage.globalTimerValue;
        delete sessionStorage.indivTimerValue;
        delete sessionStorage.globalTimer;
        delete sessionStorage.overtime;
        delete sessionStorage.indivTimer;
        delete sessionStorage.isDiceDisplayed;
    }
}
