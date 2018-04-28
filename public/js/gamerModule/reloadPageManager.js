
function saveCurrentState(){
    sessionStorage.unload = 'true';
    sessionStorage.players = JSON.stringify(playersList);
    sessionStorage.tchat = $('#messages')[0].outerHTML;
    sessionStorage.productionData = JSON.stringify(production.saveProduction());
    sessionStorage.cards = JSON.stringify(cards);
    sessionStorage.currentCardLogo = $('#familyLogoText').text();
    sessionStorage.currentCardContent = $('#cardContent').text();
    sessionStorage.currentQuestion = $('#playerQuestion > span').text();
    sessionStorage.gameState = JSON.stringify(gameState);
}

function restoreCurrentState(){
    // restore the list of players (used for the tchat)
    playersList = JSON.parse(sessionStorage.players);
    // restore the tchat content
    $('#messages')[0].outerHTML = sessionStorage.tchat;
    // restore the player's production
    production.restoreProduction(JSON.parse(sessionStorage.productionData));
    // restore the state of the card game
    cards = JSON.parse(sessionStorage.cards);
    // restore the current card
    if(sessionStorage.currentCardLogo != '' && sessionStorage.currentCardContent != ''){
        displayCard(sessionStorage.currentCardLogo, sessionStorage.currentCardContent);
    }
    // restore the current question
    $('#playerQuestion > span').text(sessionStorage.currentQuestion);
    // restore the state of the game (player who playing and the next player)
    gameState = JSON.parse(sessionStorage.gameState);

    delete sessionStorage.players;
    delete sessionStorage.tchat;
    delete sessionStorage.productionData;
    delete sessionStorage.cards;
    delete sessionStorage.currentCardLogo;
    delete sessionStorage.currentCardContent;
    delete sessionStorage.currentQuestion;
    delete sessionStorage.gameState;
}

$(window).on('unload', function(evt){
    saveCurrentState();
});

$(window).on('load', function(evt){
    if(sessionStorage.unload != null && sessionStorage.unload == 'true'){
        restoreCurrentState();
    }
});
