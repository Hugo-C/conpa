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

    addNewProduction(pseudo, production){
        this.playersProduction[pseudo] = production;
    }

    getPlayersProduction(){
        return this.playersProduction;
    }

    productionAvailable(pseudo){
        return this.playersProduction[pseudo] != null;
    }

    setProduction(container, panning){
        this.production = new Production(container, panning);
    }

    getProduction(){
        return this.production;
    }

    getMosaicProduction(pseudo){
        return this.mosaic[pseudo];
    }

    addMosaicChannel(pseudo, container, panning){
        this.mosaic[pseudo] = new Production(container, panning);
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

    saveMosaicProductions(){
        let productions = {};
        for(let pseudo in this.mosaic){
            productions[pseudo] = this.mosaic[pseudo].saveProduction();
        }
        return productions;
    }

    restoreMosaicProductions(productions){
        for(let pseudo in this.mosaic){
            this.mosaic[pseudo].restoreProduction(productions[pseudo]);
            this.mosaic[pseudo].centerSVGToDefaultPosition();
        }
    }

    playerExists(pseudo){
        for(let index = 0; index < this.players.length; index++){
            if(pseudo == this.players[index]['pseudo']){
                return true;
            }
        }
        return false;
    }

    restorePlayersList(players){
        for(let index = 0; index < players.length; index++){
            if(!this.playerExists(players[index]['pseudo'])){
                this.players.push(players[index]);
            }
        }
    }

    saveGameState(){
        sessionStorage.animator = this.animator;
        sessionStorage.players = JSON.stringify(this.players);
        sessionStorage.playersProduction = JSON.stringify(this.playersProduction);
        sessionStorage.productionData = JSON.stringify(this.production.saveProduction());
        sessionStorage.state = JSON.stringify(this.state);
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
        this.restorePlayersList(JSON.parse(sessionStorage.players));
        createPlayersProductionList(this.getPlayersPseudo());
        this.playersProduction = JSON.parse(sessionStorage.playersProduction);
        actualizeChatPlayersList(this.getOnlinePlayers());
        this.production.restoreProduction(JSON.parse(sessionStorage.productionData));
        if(sessionStorage.role === 'animator'){
            clearMosaic();
            createMosaic(this.getOnlinePlayers());
            refreshMosaic();
        }
        this.state = JSON.parse(sessionStorage.state);
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
        }
        if(this.getCurrentPlayer() === sessionStorage.pseudo){
            individualTimerColor('#1F5473', '#0AA6E1');
        }else{
            individualTimerColor('black', 'grey');
        }
        actualizePlayersProductionList();
        updatePlayersState();

        delete sessionStorage.animator;
        delete sessionStorage.players;
        delete sessionStorage.playersProduction;
        delete sessionStorage.productionData;
        delete sessionStorage.state;
        delete sessionStorage.useTimer;
        delete sessionStorage.globalTimerValue;
        delete sessionStorage.indivTimerValue;
        delete sessionStorage.globalTimer;
        delete sessionStorage.overtime;
        delete sessionStorage.indivTimer;
        delete sessionStorage.isDiceDisplayed;
    }
}
