/**
 * Displays card games in the card games table
 *
 * @param {dictionnary list} cardGames : list of dictionnaries
 * dictionnaries are formed like that :
 * {'name': card game name, 'language': card game language}
 */
function displayCardGames(cardGames){
    var cardGamesTable = $('#myCardgames').find('tbody');
    cardGamesTable.children().remove();
    for(var entry in cardGames){
        cardGamesTable.append($('<tr>')
                        .append($('<td>' + cardGames[entry]['name'] + '</td>'))
                        .append($('<td>' + cardGames[entry]['language'] + '</td>')));
    }
}

function refreshCardGames(){
    $.ajax({
        type: 'POST',
        url: '/getCardGames',
        data: null,
        error: function(){
            console.log("card games retrieving has failed");
        },
        success: function(response){
            if(response == 'ERROR'){
                console.log("card games retrieving has failed");
            }else{
                console.log(response);
                displayCardGames(response);
            }
        }
    });
}

refreshCardGames();

/** allows to select a row in the server list */
$('#myCardgames').on('click', 'tbody tr', function(){
    $('#myCardgames tbody .selected').removeClass('selected');
    $(this).addClass('selected');
});

$('#exportCardGame').on('click', function(){
    var selectedCardGame = $('#myCardgames tbody .selected').children();
    if(selectedCardGame != null){

        var exportRequest = '/exportCardGame?name=' + selectedCardGame[0].innerHTML +
                            '&language=' + selectedCardGame[1].innerHTML;

        var downloaderTag = document.createElement("a");
        document.body.appendChild(downloaderTag);
        downloaderTag.href = exportRequest;
        downloaderTag.download = 'myCardGame.csv';
        downloaderTag.click();
        downloaderTag.remove();
    }
});

function displayImportPage(){
    $("#editorTab > .tabContent").css("display", "none");
    $(".importPage").animate({"display": "block"}, 1000, function(){
        $(".importPage").css("display", "block");
        $("#editorTab > .tabContent").css("display", "none");
    });

    $("#editorTab").css('height', '30%');
    $("#editorTab").css('width', '30%');
}

$('#importCardGame').on('click', function(){
    displayImportPage();
});

function displayCardGamePage(){
    $(".importPage").css("display", "none");
    $("#editorTab > .tabContent").animate({"display": "block"}, 1000, function(){
        $("#editorTab > .tabContent").css("display", "block");
    });

    $("#editorTab").css('height', '90%');
    $("#editorTab").css('width', '40%');
}

$('#cancelImport').on('click', function(){
    $('#import').attr('type', ''); // reset input(type="file") content
    $('#import').attr('type', 'file');
    $('#importButton').text('No file chosen'); // no selected file
    $('#importAlertMessage').text(''); // reset alert displayer
    displayCardGamePage();
});

$('#importButton').on('click', function(){
    $('#import').click();
});

$('#import').on('change', function(){
    $('#importButton').text($(this).val());
});
