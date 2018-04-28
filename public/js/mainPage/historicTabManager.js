
/**
 * Displays historic in the historic table
 *
 * @param {dictionnary list} historic : list of dictionnaries
 * dictionnaries are formed like that :
 * {'name': game server name, 'animator': pseudo of the player who have animated the game,
 *  'date': date at which game has been played, 'question': player's question}
 */
function displayHistoric(historic){
    var historicTable = $('#myHistoric').find('tbody');
    historicTable.children().remove(); // we will replace old data by the data we have received
    for(var entry in historic){
        historicTable.append($('<tr>')
                      .append($('<td>' + historic[entry]['name'] + '</td>'))
                      .append($('<td>' + historic[entry]['animator'] + '</td>'))
                      .append($('<td>' + historic[entry]['date'] + '</td>'))
                      .append($('<td>' + historic[entry]['question'] + '</td>')));
    }
}

function refreshHistoric(){
    $.ajax({
        type: 'POST',
        url: '/getHistoric',
        data: { username: sessionStorage.pseudo },
        error: function(){
            console.log("historic retrieving has failed");
        },
        success: function(response){
            if(response == 'ERROR'){
                console.log("historic retrieving has failed");
            }else{
                console.log(response);
                displayHistoric(response);
            }
        }
    });
}

refreshHistoric(); // display historic on page load

/** allow to select a row in the server list */
$('#myHistoric').on('click', 'tbody tr', function(){
    $('#myHistoric tbody .selected').removeClass('selected');
    $(this).addClass('selected');
});

/** allow to remove an entry in the player's historic */
$('#deleteEntry').on('click', function(){
    var selectedEntry = $('#myHistoric tbody .selected');
    if(selectedEntry != null){
        $.ajax({
            type: 'POST',
            url: '/removeHistoric',
            data: {
                username: sessionStorage.pseudo,
                server: selectedEntry.children()[0].innerHTML,
                date: selectedEntry.children()[2].innerHTML
            },
            error: function(){
                console.log('removing has failed');
            },
            success: function(response){
                if(response == 'OK'){
                    refreshHistoric();
                }else{
                    console.log('removing has failed');
                }
            }
        });
    }
});

/** Display the list of players who have played in the same game as you */
function displayPlayersList(players){
    var playersList = $('#partyPlayers').find('tbody');
    playersList.children().remove();
    for(var index in players){
        playersList.append($('<tr>')
                    .append($('<td>' + players[index] + '</td>')));
    }
}

/** Display a production in the production viewer */
function displayProduction(production){
    var productionDisplayer = $('#myProduction > img');
    if(production == '' || production == null){
        productionDisplayer.css('background-image', 'url("/img/mainPage/no-data.gif")');
        productionDisplayer.css('height', '100%');
        productionDisplayer.css('width', '100%');
    }else{
        // Building an svg image from the string which describe the production (svg format)
        var img = new Image();
        var blob = new Blob([production], {type: "image/svg+xml;charset=utf-8"});
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL( blob );
        productionDisplayer.css('background-image', 'url("' + imageUrl + '")');
        productionDisplayer.css('height', '200%');
        productionDisplayer.css('width', '200%');
    }
}

function displayPartyDetails(data){
    $("#historicTab > .tabContent").css("display", "none");
    $(".partySheet").animate({"display": "block"}, 1000, function(){
        $(".partySheet").css("display", "block");
    });

    $("#historicTab").css('height', '100%');
    $("#historicTab").css('width', '80%');

    $("#partyName").val(data['server']);
    $("#partyDate").val(data['date']);
    $("#partyAnimator").val(data['animator']);
    $("#partyQuestion").val(data['question']);
    displayPlayersList(data['players']);
    displayProduction(data['production']);
}

/** Joining the selected game server */
$('#open').on('click', function(){
    var selectedParty =  $('#myHistoric tbody .selected');
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
                if(response == 'ERROR'){
                    console.log("details retrieving has failed");
                }else{
                    console.log(response);
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

/** Retrieve the url of the production */
function getProductionImageUrl(){
    var productionUrl = $('#myProduction > img').css('background-image');
    return productionUrl.substring(5, productionUrl.length - 2);
}

/** Remove the image from the browser buffer */
function freeProductionImage(){
    var productionUrl = getProductionImageUrl();
    if(productionUrl.match("blob")){
        console.log("free image : " + productionUrl);
        var urlCreator = window.URL || window.webkitURL;
        urlCreator.revokeObjectURL(productionUrl);
    }
}

/** allow to download a production as an svg image */
$('#download').on('click', function(){
    var productionUrl = getProductionImageUrl();
    var partyName = $('#partyName').val();
    var partyDate = $('#partyDate').val();
    var partyQuestion = $('#partyQuestion').val();
    var fileName = partyName + '(' + partyDate + ')[' + partyQuestion + '].svg';
    if(productionUrl.match("blob")){
        var downloader = document.createElement("a");
        document.body.appendChild(downloader);
        downloader.href = productionUrl;
        downloader.download = fileName;
        downloader.click();
        downloader.remove();
    }
});

$('#close').on('click', function(){
    $(".partySheet").css("display", "none");
    $("#historicTab > .tabContent").animate({"display": "block"}, 1000, function(){
        $("#historicTab > .tabContent").css("display", "block");
    });

    $("#historicTab").css('height', '100%');
    $("#historicTab").css('width', '100%');
    freeProductionImage();
});

function refreshInfos(data){
    $("#partyQuestion").val(data['question']);
    freeProductionImage();
    displayProduction(data['production']);
}

/** allows to select a row in the server list */
$('#partyPlayers').on('click', 'tbody tr', function(){
    $('#partyPlayers tbody .selected').removeClass('selected');
    $(this).addClass('selected');
    var selectedPlayer =  $(this).children();
    if(selectedPlayer != null){
        $.ajax({
            type: 'POST',
            url: '/getPlayerDetails',
            data: {
                username: selectedPlayer[0].innerHTML,
                partyName: $('#partyName').val(),
                partyDate: $('#partyDate').val()
            },
            error: function(){
                console.log("player's details retrieving has failed");
            },
            success: function(response){
                if(response == 'ERROR'){
                    console.log("player's details retrieving has failed");
                }else{
                    console.log(response);
                    refreshInfos(response);
                }
            }
        });
    }
});
