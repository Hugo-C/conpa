var myProduction;

/**
 * Displays historic in the historic table
 *
 * @param {dictionnary list} historic : list of dictionnaries
 * dictionnaries are formed like that :
 * {'name': game server name, 'animator': pseudo of the player who have animated the game,
 *  'date': date at which game has been played, 'question': player's question}
 */
function displayHistoric(historic){
    let historicTable = $('#myHistoric').find('tbody');
    historicTable.children().remove(); // we will replace old data by the data we have received
    for(let entry in historic){
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
            if(response === 'ERROR'){
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
    let selectedEntry = $('#myHistoric tbody .selected');
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
                if(response === 'OK'){
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
    let playersList = $('#partyPlayers').find('tbody');
    playersList.children().remove();
    for(let index in players){
        playersList.append($('<tr>')
                   .append($('<td>' + players[index] + '</td>')));
    }
}

function displayProduction(production, legend){
    $('.partySheet #productionViewer > svg').remove();
    $('.partySheet #productionViewer')[0].style.backgroundImage = '';
    if(production !== "" && production != null){
        myProduction = new Production($('.partySheet #productionViewer')[0], true);
        myProduction.restoreProduction(JSON.parse(production));
        if(legend !== '' && legend != null){
            Legend.restoreLegend(JSON.parse(legend));
        }
    }else{
        $('.partySheet #productionViewer')[0].style.backgroundImage = 'url("/img/mainPage/noContent.png")';
    }
    if(myProduction != null && myProduction.isEmpty()){
        $('.partySheet #productionViewer')[0].style.backgroundImage = 'url("/img/mainPage/noContent.png")';
    }
}

function displayPartyDetails(data){
    displayPanel($('#historicTab'), $('#historicTab .partySheet'), '100%', '80%');

    $("#partyName").val(data['server']);
    $("#partyDate").val(data['date']);
    $("#partyAnimator").val(data['animator']);
    $("#partyQuestion").val(data['question']);

    displayPlayersList(data['players']);

    if(data['animator'] === sessionStorage.pseudo){
        $('#editProduction').css('display', 'none'); // animator has no production to edit
        $('.partySheet #productionViewer')[0].style.backgroundImage = 'url("/img/mainPage/animator.png")';
    }else{
        displayProduction(data['production'], data['legend']);
    }
}

/** Joining the selected game server */
$('#open').on('click', function(){
    let selectedParty = $('#myHistoric tbody .selected');
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
                if(response === 'ERROR'){
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
    myProduction.integrateLegendToProduction(Legend.saveLegend(), $('#partyQuestion').val());
    let blob = new Blob([myProduction.getInlineSvg()], {type: "image/svg+xml;charset=utf-8"});
    let urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
}

/** allow to download a production as an svg image */
$('#download').on('click', function(){
    if(myProduction != null && !myProduction.isEmpty()){
        let productionUrl = getProductionImageUrl();
        let partyName = $('#partyName').val();
        let partyDate = $('#partyDate').val();
        let partyQuestion = $('#partyQuestion').val();
        if(productionUrl.match("blob")){
            let downloader = document.createElement("a");
            document.body.appendChild(downloader);
            downloader.href = productionUrl;
            downloader.download = 'production';
            downloader.click();
            downloader.remove();
        }
        let urlCreator = window.URL || window.webkitURL;
        urlCreator.revokeObjectURL(productionUrl);
        let production = myProduction.saveProduction();
        myProduction.clearSVG();
        myProduction.restoreProduction(production);
    }
});

/** Remove the image from the browser buffer */
function freeProductionImage(){
    let productionUrl = getProductionImageUrl();
    if(productionUrl.match("blob")){
        console.log("free image : " + productionUrl);
        let urlCreator = window.URL || window.webkitURL;
        urlCreator.revokeObjectURL(productionUrl);
    }
}

function refreshInfos(data){
    $("#partyQuestion").val(data['question']);
    displayProduction(data['production'], data['legend']);
}

function loadSelectedPlayer(selectedPlayer){
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
                if(response === 'ERROR'){
                    console.log("player's details retrieving has failed");
                }else{
                    console.log(response);
                    refreshInfos(response);
                }
            }
        });
    }
}

/** allows to select a row in the server list */
$('#partyPlayers').on('click', 'tbody tr', function(){
    $('#partyPlayers tbody .selected').removeClass('selected');
    $(this).addClass('selected');
    let selectedPlayer =  $(this).children();
    if(selectedPlayer[0].innerHTML === $('#partyAnimator').val()){
        // animator has no production, we display an image to inform the player
        $('.partySheet #productionViewer > svg').remove();
        $('.partySheet #productionViewer')[0].style.backgroundImage = 'url("/img/mainPage/animator.png")';
    }else{
        // load informations about the selected player
        loadSelectedPlayer(selectedPlayer);
    }
});

$('#close').on('click', function(){
    displayPanel($('#historicTab'), $('#historicTab .tabContent'), '100%', '100%');
    myProduction = null;
    $('#productionViewer > svg').remove();
});

function openProductionEditor(production){
    displayPanel($('#historicTab'), $('#historicTab .productionEditor'), '100%', '100%');

    $('.partySheet #productionViewer > svg').remove();
    myProduction = null;
    Legend.clear();
    myProduction = new Production($('.productionEditor #productionEditor')[0], false, $('#zoomLevel'));
    if(production['production'] == ''){
        myProduction.restoreProduction(production['production']);
    }else{
        myProduction.restoreProduction(JSON.parse(production['production']));
        if(production['legend'] !== ''){
            Legend.restoreLegend(JSON.parse(production['legend']));
        }
    }
}

function getPlayerProduction(callback){
    $.ajax({
        type: 'POST',
        url: '/getPlayerProduction',
        data: {
            username: sessionStorage.pseudo,
            partyName: $('#partyName').val(),
            partyDate: $('#partyDate').val()
        },
        error: function(){
            console.log("production retrieving has failed");
        },
        success: function(response){
            if(response === 'ERROR'){
                console.log("production retrieving has failed");
            }else{
                console.log(response);
                callback(response);
            }
        }
    });
}

$('#editProduction').on('click', function(){
    getPlayerProduction(openProductionEditor);
});

$('#saveProduction').on('click', function(){
    $.ajax({
        type: 'POST',
        url: '/recordPlayerProduction',
        data: {
            username: sessionStorage.pseudo,
            partyName: $('#partyName').val(),
            partyDate: $('#partyDate').val(),
            production: JSON.stringify(myProduction.saveProduction()),
            legend: JSON.stringify(Legend.saveLegend())
        },
        error: function(){
            console.log("backup failed");
        },
        success: function(response){
            if(response === 'ERROR'){
                console.log("backup failed");
            }else if(response === 'OK'){
                console.log("backup success");
                $('#closeEditor').click();
            }
        }
    });
});

function closeProductionEditor(production){
    displayPanel($('#historicTab'), $('#historicTab .partySheet'), '100%', '80%');
    displayProduction(production['production'], production['legend']);
}

$('#closeEditor').on('click', function(){
    getPlayerProduction(closeProductionEditor);
});

// ---------------------------------------------------------------------
// -------------------- EDITOR TOOLS LISTENER --------------------------
// ---------------------------------------------------------------------

$("#color").on("click", function(){
    $("#svgMenu").css('display', 'none');
    $("#colorMenu").css('display', 'block');
});

$("#colorMenu button").on("click", function(){
    let selectedColor = $(this).val();
    $("#colorMenu").css('display', 'none');
    $("#svgMenu").css('display', 'block');
    $("#color").val(selectedColor);
    $("#color").css('background-color', 'url("/img/gamerModule/' + selectedColor + '.jpg")');
    $("#bouton").val(selectedColor);
    myProduction.setSelectedColor(selectedColor);
});

$("#moveElement").on("click", function(){
    let moveImage = "/img/gamerModule/move.png";
    let movingImage = "/img/gamerModule/moving.png";
    if($(this).hasClass("selected")){
        $(this).removeClass("selected");
        $(this).css('background-image', 'url(' + moveImage + ')');
        Production.updatePanningState(false);
    }else{
        $(this).addClass("selected");
        $(this).css('background-image', 'url(' + movingImage + ')');
        Production.updatePanningState(true);
    }
});

$('#legend').on('click', function(){
    if($(this).val() === 'visible'){
        Legend.forceHide();
        $(this).val('hide');
    }else{
        Legend.forceShow();
        $(this).val('visible');
    }
});

$('#centerSVG').on('click', function(){
    myProduction.centerSVGToDefaultPosition();
});

// ---------------------------------------------------------------------
// ---------------- CONTEXTUAL MENU LISTENERS --------------------------
// ---------------------------------------------------------------------

$('#removeLink').on('click', function(){
    myProduction.removeSelectedLink();
});

$('#dashLink').on('click', function(){
    myProduction.setSelectedLinkDasharray(10.10);
});

$('#linearLink').on('click', function(){
    myProduction.setSelectedLinkDasharray(0);
});

$('#increaseWidth').on('click', function(){
    myProduction.increaseSelectedLinkWidth();
});

$('#decreaseWidth').on('click', function(){
    myProduction.decreaseSelectedLinkWidth();
});

$('#navigability').on('click', function(){
    myProduction.addNavigabilityToSelectedLink();
});

$('#reverseNavigability').on('click', function(){
    myProduction.reverseSelectedLinkNavigability();
});

$('#removeNavigability').on('click', function(){
    myProduction.removeSelectedLinkNavigability();
});

$('#linkColor').on('click', function(){
    $('.mainToolEditor').css('display', 'none');
    $('.colorToolEditor').css('display', 'block');
});

$('button.colorToolEditor').on('click', function(){
    myProduction.setSelectedLinkColor($(this).val());
    $('.colorToolEditor').css('display', 'none');
    $('.mainToolEditor').css('display', 'block');
});
