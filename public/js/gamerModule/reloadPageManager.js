
function saveCurrentState(){
    sessionStorage.unload = 'true';
    clientGame.saveGameState();
    sessionStorage.tchat = $('#messages')[0].outerHTML;
    sessionStorage.cards = JSON.stringify(cards);
    sessionStorage.currentCardLogo = $('#familyLogoText').text();
    sessionStorage.currentCardContent = $('#cardContent').text();
    sessionStorage.currentPlayer = $('#playerTurn > span').text();
    sessionStorage.currentQuestion = $('#playerQuestion > span').text();
}

function restoreCurrentState(){
    clientGame.restoreGameState();
    // restore the tchat content
    $('#messages')[0].outerHTML = sessionStorage.tchat;
    // restore the state of the card game
    cards = JSON.parse(sessionStorage.cards);
    // restore the current card
    if(sessionStorage.currentCardLogo != '' && sessionStorage.currentCardContent != ''){
        displayCard(sessionStorage.currentCardLogo, sessionStorage.currentCardContent);
    }
    // restore the current question
    $('#playerQuestion > span').text(sessionStorage.currentQuestion);
    $('#playerTurn > span').text(sessionStorage.currentPlayer);

    delete sessionStorage.tchat;
    delete sessionStorage.cards;
    delete sessionStorage.currentCardLogo;
    delete sessionStorage.currentCardContent;
    delete sessionStorage.currentQuestion;
    delete sessionStorage.currentPlayer;
}

$(window).on('unload', function(evt){
    saveCurrentState();
});

$(window).on('load', function(evt){
    if(sessionStorage.unload != null && sessionStorage.unload == 'true'){
        restoreCurrentState();
    }
});
