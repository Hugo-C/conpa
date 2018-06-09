var myProduction;

if(sessionStorage.pseudo !== undefined)
    refreshGameList('historicTab', 'historic'); // display historic on page load

/** allow to select a row in the games historic list */
$('#historicTab .gameList table').on('click', 'tbody tr', function(){
    $('#historicTab .gameList tbody .selected').removeClass('selected');
    $(this).addClass('selected');
});

$('#historicTab .gameList button[name="deleteEntry"]').on('click', function(){
    deleteEntry('historicTab');
});

/**
 * When a player want to access to the detail of a game, we load the game's details
 * from the server before to display the game's details panel
 */
$('#historicTab .gameList button[name="open"]').on('click', function(){
    let selectedParty = $('#historicTab .gameList tbody .selected');
    if(selectedParty != null){
        $.ajax({
            type: 'POST',
            url: '/getDetails',
            data: {
                username: sessionStorage.pseudo,
                partyName: selectedParty.children()[0].innerHTML,
                partyDate: selectedParty.children()[2].innerHTML
            },
            error: function(){
                console.log("details retrieving has failed");
            },
            success: function(response){
                if(response !== 'ERROR'){
                    response['server'] = selectedParty.children()[0].innerHTML;
                    response['animator'] = selectedParty.children()[1].innerHTML;
                    response['date'] = selectedParty.children()[2].innerHTML;
                    response['question'] = selectedParty.children()[3].innerHTML;
                    displayPartyDetails(response);
                }
            }
        });
    }
});

/** Displays the list of players who have played in the same game as you */
function displayPlayersList(players){
    let playersList = $('#partyPlayers').find('tbody');
    playersList.children().remove();
    for(let index in players){
        playersList.append($('<tr>')
                   .append($('<td>' + players[index] + '</td>')));
    }
}

/**
 * Displays the production of the selected player in the viewer box
 */
function displayProduction(production, legend){
    $('.partySheet .SWA_SVGContainer > svg').remove();
    $('.partySheet .SWA_SVGContainer')[0].style.backgroundImage = '';
    if(production !== "" && production != null){
        myProduction = new Production($('.partySheet'), true);
        myProduction.restoreProduction(JSON.parse(production));
        if(legend !== '' && legend != null){
            myProduction.restoreLegend(JSON.parse(legend));
        }
    }else{
        $('.partySheet .SWA_SVGContainer')[0].style.backgroundImage = 'url("/img/mainPage/noContent.png")';
    }
    if(myProduction != null && myProduction.isEmpty()){
        $('.partySheet .SWA_SVGContainer')[0].style.backgroundImage = 'url("/img/mainPage/noContent.png")';
    }
}

/**
 * Displays the game's details with the retrieved data
 * form of the data dictionary :
 * {'server': name of the game, 'date': date at which the game has been played,
 *  'animator': name of the animator, 'question': player's question,
 *  'production': player's production data, 'legend': production's legend's data }
 */
function displayPartyDetails(data){
    displayPanel($('#historicTab'), $('#historicTab .partySheet'), '100%', '80%');

    $("#partyName").val(data['server']);
    $("#partyDate").val(data['date']);
    $("#partyAnimator").val(data['animator']);
    $("#partyQuestion").val(data['question']);

    displayPlayersList(data['players']);

    if(data['animator'] === sessionStorage.pseudo){
        $('#editProduction').css('display', 'none'); // animator has no production to edit
        $('.partySheet .SWA_SVGContainer')[0].style.backgroundImage = 'url("/img/mainPage/animator.png")';
    }else{
        displayProduction(data['production'], data['legend']);
        $('#editProduction').css('display', 'block'); // animator has no production to edit
    }
}

/** allow to download a production as an svg image */
$('#download').on('click', function(){
    let selectedPlayer = $('#partyPlayers tbody .selected').children();
    if(selectedPlayer.length > 0){
        selectedPlayer = selectedPlayer[0].innerHTML;
    }else{
        selectedPlayer = sessionStorage.pseudo;
    }
    getPlayerProductionAndQuestion(selectedPlayer, function(data){
          downloadProduction($('.partySheet')[0], data['production'], data['legend'], data['question']);
    });
});

/** Removes the image from the browser buffer */
function freeProductionImage(){
    let productionUrl = getProductionImageUrl();
    if(productionUrl.match("blob")){
        let urlCreator = window.URL || window.webkitURL;
        urlCreator.revokeObjectURL(productionUrl);
    }
}

/**
 * Displays the production of another player who has played in the same game as
 * the current player
 */
function refreshInfos(data){
    $("#partyQuestion").val(data['question']);
    displayProduction(data['production'], data['legend']);
}

/**
 * Loads information about a player who has played in the same game as the
 * current player and displays the information (production + question)
 */
function getPlayerProductionAndQuestion(pseudo, callback){
    $.ajax({
        type: 'POST',
        url: '/getPlayerDetails',
        data: {
            username: pseudo,
            partyName: $('#partyName').val(),
            partyDate: $('#partyDate').val()
        },
        error: function(){
            console.log("player's details retrieving has failed");
        },
        success: function(response){
            if(response !== 'ERROR'){
                callback(response);
            }
        }
    });
}

/** allows to select a row in the server list */
$('#partyPlayers').on('click', 'tbody tr', function(){
    $('#partyPlayers tbody .selected').removeClass('selected');
    $(this).addClass('selected');
    let selectedPlayer =  $(this).children();
    if(selectedPlayer[0].innerHTML === $('#partyAnimator').val()){
        // animator has no production, we display an image to inform the player
        $('.partySheet .SWA_SVGContainer > svg').remove();
        $('.partySheet .SWA_SVGContainer')[0].style.backgroundImage = 'url("/img/mainPage/animator.png")';
    }else{
        // load informations about the selected player
        getPlayerProductionAndQuestion(selectedPlayer[0].innerHTML, refreshInfos);
    }
});

$('#close').on('click', function(){
    displayPanel($('#historicTab'), $('#historicTab .tabContent'), '100%', '100%');
    myProduction = null;
    $('.SWA_SVGContainer > svg').remove();
});

/**
 * Retrieves the production of the player with the given pseudo
 * @param {String} pseudo : pseudo of the player for which we want to retrieve
 *                          the production
 * @param {callback} callback : function to call when we have retrieved the production
 */
function getPlayerProduction(pseudo, callback){
    $.ajax({
        type: 'POST',
        url: '/getPlayerProduction',
        data: {
            username: pseudo,
            partyName: $('#partyName').val(),
            partyDate: $('#partyDate').val()
        },
        error: function(){
            console.log("production retrieving has failed");
        },
        success: function(response){
            if(response !== 'ERROR'){
                callback(response);
            }
        }
    });
}

$('#editProduction').on('click', function(){
    getPlayerProduction(sessionStorage.pseudo, function(production){
        openProductionEditor($('#historicTab'), production);
    });
});

/**
 * Displays an alert to inform the player than his production has been saved
 * in his private space
 */
function displayDestinationAlert(){
    displayAlert('historicTab', 'prodDest', 'The production has been saved in your personal space', 'confirm');
}

$('#historicTab .alert .confirm').on('click', function(){
    getPlayerProduction(sessionStorage.pseudo, function(production){
        disposeProductionEditor($('#historicTab'));
        displayPanel($('#historicTab'), $('#historicTab .partySheet'), '100%', '80%');
        displayProduction(production['production'], production['legend']);
    });
});

$('#historicTab button[name="saveProduction"]').on('click', function(){
    $.ajax({
        type: 'POST',
        url: '/recordPlayerProduction',
        data: {
            username: sessionStorage.pseudo,
            partyName: $('#partyName').val(),
            partyDate: $('#partyDate').val(),
            production: JSON.stringify(editedProduction.saveProduction()),
            legend: JSON.stringify(editedProduction.saveLegend()),
            returnActList: false
        },
        error: function(){
            console.log("backup failed");
        },
        success: function(response){
            if(response === 'OK'){
                displayDestinationAlert();
            }
        }
    });
});

$('#historicTab button[name="closeEditor"]').on('click', function(){
    getPlayerProduction(sessionStorage.pseudo, function(production){
        disposeProductionEditor($('#historicTab'));
        displayPanel($('#historicTab'), $('#historicTab .partySheet'), '100%', '80%');
        displayProduction(production['production'], production['legend']);
    });
});
