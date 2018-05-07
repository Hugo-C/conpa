/**
 * Displays card games in the card games table
 *
 * @param {dictionnary list} cardGames : list of dictionnaries
 * dictionnaries are formed like that :
 * {'name': card game name, 'language': card game language}
 */
function displayCardGames(cardGames){
    let cardGamesTable = $('#myCardgames').find('tbody');
    cardGamesTable.children().remove(); // we will replace old data by the data we have received
    for(let entry in cardGames){
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
            if(response === 'ERROR'){
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
    let selectedCardGame = $('#myCardgames tbody .selected').children();
    if(selectedCardGame != null){
        let exportRequest = '/exportCardGame?name=' + selectedCardGame[0].innerHTML +
                            '&language=' + selectedCardGame[1].innerHTML;

        // we use an "a" tag to download the file ("a" tag has a download property)
        let downloaderTag = document.createElement("a");
        document.body.appendChild(downloaderTag);
        downloaderTag.href = exportRequest;
        downloaderTag.download = 'myCardGame.csv';
        downloaderTag.click();
        downloaderTag.remove();
    }
});

/** Display the form used to import a card game in the database */
function displayImportPage(){
    $("#editorTab > .tabContent").css("display", "none");
    $(".importPage").animate({"display": "block"}, 1000, function(){
        $(".importPage").css("display", "block");
        $("#editorTab > .tabContent").css("display", "none");
    });
    let editorTab = $("#editorTab");
    editorTab.css('height', '30%');
    editorTab.css('width', '30%');
}

$('#importCardGame').on('click', function(){
    displayImportPage();
});

/** Display the main card game editor page */
function displayCardGamePage(){
    $(".importPage").css("display", "none");
    $("#editorTab > .tabContent").animate({"display": "block"}, 1000, function(){
        $("#editorTab > .tabContent").css("display", "block");
    });
    let editorTab = $("#editorTab");
    editorTab.css('height', '90%');
    editorTab.css('width', '40%');
}

/** allow to come back to the main card game editor page */
$('#cancelImport').on('click', function(){
    let myImport = $('#import');
    myImport.attr('type', ''); // reset input(type="file") content
    myImport.attr('type', 'file');
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
