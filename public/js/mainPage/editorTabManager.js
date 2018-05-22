function populateEditorTable(data){
    displayCardGames('editorTab', 'myCardgames', data);
}

refreshCardGames([], populateEditorTable);
refreshTags($('.tabContent select'));

$('#editorTab button.filter').on('click', function(){
        var selected = $(".tabContent select option:selected");
        var tags = [];
        selected.each(function () {
            tags.push($(this).val());
        });
        refreshCardGames(tags, populateEditorTable);
});

$('.tabContent select').on('click', function(){
    console.log('click');
    if($('.tabContent select .multiselect-item').css('display') == 'none'){
        $('.tabContent select .multiselect-item').css('display', 'block');
    }else{
        $('.tabContent select .multiselect-item').css('display', 'none');
    }
})

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
    $("#importPage").animate({"display": "block"}, 1000, function(){
        $("#importPage").css("display", "block");
        $("#editorTab > .tabContent").css("display", "none");
    });
    let editorTab = $("#editorTab");
    editorTab.css('height', '45%');
    editorTab.css('width', '30%');
}

$('#importCardGame').on('click', function(){
    displayImportPage();
});

/** Display the main card game editor page */
function displayCardGamePage(){
    $("#editorTab > div").css("display", "none");
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
    $('#importButton').text($.i18n("importedFile")); // no selected file
    $('#importAlertMessage').text(''); // reset alert displayer
    displayCardGamePage();
});

$('#importButton').on('click', function(){
    $('#import').click();
});

$('#import').on('change', function(){
    $('#importButton').text($(this).val());
});

$('#editorTab .cardgameInfoPanel button').on('click', function(){
    displayCardGamePage();
});

function sortEditorTable(n){
    sortTable(n, 'myCardgames');
}
