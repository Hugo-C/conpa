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

$('#importCardGame').on('click', function(){
    displayPanel($('#editorTab'), $('#importPage'), '45%', '30%');
});

/** allow to come back to the main card game editor page */
$('#cancelImport').on('click', function(){
    let myImport = $('#import');
    myImport.attr('type', ''); // reset input(type="file") content
    myImport.attr('type', 'file');
    $('#importButton').text($.i18n("importedFile")); // no selected file
    $('#importAlertMessage').text(''); // reset alert displayer
    displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
});

$('#importButton').on('click', function(){
    $('#import').click();
});

$('#import').on('change', function(){
    $('#importButton').text($(this).val());
});

$('#editorTab .cardgameInfoPanel button').on('click', function(){
    displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
});

function sortEditorTable(n){
    sortTable(n, 'myCardgames');
}
