
module.exports = class Game {
    constructor(name, places, host, indivTimer, globalTimer){
        this.name = name;
        this.places = places;
        this.host = host;
        this.players = require('fifo')();
        this.players.push(host);
        this.indivTimer = indivTimer;
        this.globalTimer = globalTimer;
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

    addNewPlayer(player){
        this.players.push(player);
    }

    removePlayer(player){
        this.players.remove(player);
        for(var node = this.players.node; node; node = this.players.next(node)){
            if(node.value.pseudoEquals(player.getPseudo())){
                this.players.remove(node);
                return;
            }
        }
    }
}
