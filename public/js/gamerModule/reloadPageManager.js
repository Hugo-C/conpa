
function saveCurrentState(){

    sessionStorage.unload = 'true';
    sessionStorage.players = JSON.stringify(playersList);
    sessionStorage.tchat = $('#messages')[0].outerHTML;
    sessionStorage.productionData = JSON.stringify(saveProduction());
    sessionStorage.cards = JSON.stringify(cards);
    sessionStorage.currentCardLogo = $('#familyLogoText').text();
    sessionStorage.currentCardContent = $('#cardContent').text();
    sessionStorage.currentQuestion = $('#playerQuestion > span').text();
}

function restoreCurrentState(){

    playersList = JSON.parse(sessionStorage.players);
    $('#messages')[0].outerHTML = sessionStorage.tchat;
    restoreProduction(JSON.parse(sessionStorage.productionData));
    cards = JSON.parse(sessionStorage.cards);
    displayCard(sessionStorage.currentCardLogo, sessionStorage.currentCardContent);
    $('#playerQuestion > span').text(sessionStorage.currentQuestion);

    delete sessionStorage.players;
    delete sessionStorage.tchat;
    delete sessionStorage.productionData;
    delete sessionStorage.cards;
    delete sessionStorage.currentCardLogo;
    delete sessionStorage.currentCardContent;
    delete sessionStorage.currentQuestion;
}

$(window).on('unload', function(evt){
    saveCurrentState();
});

$(window).on('load', function(evt){
    if(sessionStorage.unload != null && sessionStorage.unload == 'true'){
        restoreCurrentState();
    }
    //sessionStorage.unload = 'false';
    //delete sessionStorage.unload;
});
