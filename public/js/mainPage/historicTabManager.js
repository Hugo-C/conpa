
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
    historicTable.children().remove();
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

refreshHistoric();

/** allows to select a row in the server list */
$('#myHistoric').on('click', 'tbody tr', function(){
    $('#myHistoric tbody .selected').removeClass('selected');
    $(this).addClass('selected');
});

function displayPlayersList(players){
    var playersList = $('#partyPlayers').find('tbody');
    playersList.children().remove();
    for(var index in players){
        playersList.append($('<tr>')
                    .append($('<td>' + players[index] + '</td>')));
    }
}

function displayProduction(production){
    var productionDisplayer = $('#myProduction > img');
    if(production == '' || production == null){
        productionDisplayer.css('background-image', 'url("/img/mainPage/no-data.gif")');
        productionDisplayer.css('height', '100%');
        productionDisplayer.css('width', '100%');
    }else{
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
    var selectedParty =  $('#myHistoric tbody .selected').children();
    if(selectedParty != null){
        console.log(selectedParty[0].innerHTML);
        console.log(selectedParty[2].innerHTML);
        $.ajax({
            type: 'POST',
            url: '/getDetails',
            data: {
                username: sessionStorage.pseudo,
                partyName: selectedParty[0].innerHTML,
                partyDate: selectedParty[2].innerHTML
            },
            error: function(){
                console.log("details retrieving has failed");
            },
            success: function(response){
                if(response == 'ERROR'){
                    console.log("details retrieving has failed");
                }else{
                    console.log(response);
                    response['server'] = selectedParty[0].innerHTML;
                    response['animator'] = selectedParty[1].innerHTML;
                    response['date'] = selectedParty[2].innerHTML;
                    response['question'] = selectedParty[3].innerHTML;
                    displayPartyDetails(response);
                }
            }
        });
    }
});

function getProductionImageUrl(){
    var productionUrl = $('#myProduction > img').css('background-image');
    return productionUrl.substring(5, productionUrl.length - 2);
}

function freeProductionImage(){
    var productionUrl = getProductionImageUrl();
    if(productionUrl.match("blob")){
        console.log("free image : " + productionUrl);
        var urlCreator = window.URL || window.webkitURL;
        urlCreator.revokeObjectURL(productionUrl);
    }
}

$('#download').on('click', function(){
    var productionUrl = getProductionImageUrl();
    console.log(productionUrl);
    var partyName = $('#partyName').val();
    var partyDate = $('#partyDate').val();
    var fileName = partyName + '(' + partyDate + ').svg';
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
