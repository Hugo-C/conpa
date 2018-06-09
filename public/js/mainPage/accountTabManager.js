
function initProfilPanel(email){
    $('#accountTab input[name="pseudo"]').val(sessionStorage.pseudo);
    $('#accountTab input[name="email"]').val(email);
    setPPFromEmail($('.accountProfil img'), email);
    $('#accountTab .gameList .bottom > div').css('visibility', 'visible');
}

if(sessionStorage.pseudo !== undefined)
    getEmail(sessionStorage.pseudo, initProfilPanel);

$('.myProductions button').on('click', function(){
    displayPanel($('#accountTab'), $('#accountTab .gameList'), '100%', '100%');
    refreshGameList('accountTab', 'archive');
});

/** allow to select a row in the server list */
$('#accountTab .gameList table').on('click', 'tbody tr', function(){
    $('#accountTab .gameList tbody .selected').removeClass('selected');
    $(this).addClass('selected');
});

/** allow to select a row in the production list */
$('#accountTab .productionsList table').on('click', 'tbody tr', function(){
    $('.productionsList tbody .selected').removeClass('selected');
    $(this).addClass('selected');
});

function displayProductions(productions){
    let productionsTable = $('#accountTab .productionsList').find('tbody');
    productionsTable.children().remove(); // we will replace old data by the data we have received
    for(let index = 0; index < productions.length; index++){
        productionsTable.append($('<tr>')
            .append($('<td>' + (index + 1) + '</td>'))
            .append($('<td>' + productions[index]['prodDate'] + '</td>')));
    }
}

function refreshProductionsList(name, date){
    $.ajax({
        type: 'POST',
        url: '/getArchivedProductions',
        data: {
            username: sessionStorage.pseudo,
            partyName: name,
            partyDate: date
        },
        error: function(){
            console.log("failed to retrieve productions from archive");
        },
        success: function(response){
            if(response !== 'ERROR'){
                displayProductions(response);
            }
        }
    });
}

$('#accountTab .gameList button[name="open"]').on('click', function(){
    displayPanel($('#accountTab'), $('.productionsList'), '80%', '60%');
    let selectedEntry = $('#accountTab .gameList tbody .selected');
    refreshProductionsList(selectedEntry.children()[0].innerHTML,
                           selectedEntry.children()[2].innerHTML);
});

/**
 * Removes all the archived productions of a game
 * @param {String} name : game's name
 * @param {String} date : date at which the game has been played
 */
function deleteGameArchive(name, date){
    $.ajax({
        type: 'POST',
        url: '/deleteArchive',
        data: {
            username: sessionStorage.pseudo,
            partyName: name,
            partyDate: date
        },
        error: function(){
            console.log("failed to retrieve productions from archive");
        },
        success: function(response){
            if(response !== 'ERROR'){
                refreshGameList('accountTab', 'archive');
            }
        }
    });
}

/**
 * Removes the production which has been added to the archive table at the
 * given date
 * @param {String} insertDate : date at which the production has been added to
 *                              the archive table
 */
function deleteProduction(insertDate){
    $.ajax({
        type: 'POST',
        url: '/deleteArchivedProduction',
        data: {
            username: sessionStorage.pseudo,
            insertDate: insertDate
        },
        error: function(){
            console.log("failed to retrieve productions from archive");
        },
        success: function(response){
            if(response !== 'ERROR'){
                let selectedGame = $('#accountTab .gameList tbody .selected');
                refreshProductionsList(selectedGame.children()[0].innerHTML,
                                       selectedGame.children()[2].innerHTML);
            }
        }
    });
}

/**
 * Retrieves the production's data which has been saved at the given date
 * @param {String} insertDate : date at which the production has been added to the
 *                              archive table
 * @param {callback} callback : function used to return the result
 */
function getProductionFromArchive(insertDate, callback){
    $.ajax({
        type: 'POST',
        url: '/getProductionFromArchive',
        data: {
            username: sessionStorage.pseudo,
            insertDate: insertDate
        },
        error: function(){
            console.log("failed to retrieve productions from archive");
        },
        success: function(response){
            if(response !== 'ERROR'){
                callback(response)
            }
        }
    });
}

$('#accountTab .gameList button[name="deleteEntry"]').on('click', function(){
    let selectedEntry = $('#accountTab .gameList tbody .selected');
    if(selectedEntry != null){
        deleteGameArchive(selectedEntry.children()[0].innerHTML,
                          selectedEntry.children()[2].innerHTML);
    }
});

$('#accountTab .gameList button[name="comeBack"]').on('click', function(){
    displayPanel($('#accountTab'), $('.accountProfil'), '80%', '30%');
});

$('.productionsList button[name="comeBack"]').on('click', function(){
    displayPanel($('#accountTab'), $('#accountTab .gameList'), '100%', '100%');
});

$('.productionsList button[name="deleteEntry"]').on('click', function(){
    let selectedProduction = $('.productionsList tbody .selected');
    if(selectedProduction != null){
        deleteProduction(selectedProduction.children()[1].innerHTML);
    }
});

$('.productionsList button[name="edit"]').on('click', function(){
    let selectedProduction = $('.productionsList tbody .selected');
    if(selectedProduction != null){
        getProductionFromArchive(selectedProduction.children()[1].innerHTML, function(production){
            openProductionEditor($('#accountTab'), production);
        });
    }
});

$('#accountTab button[name="closeEditor"]').on('click', function(){
    disposeProductionEditor($('#accountTab'));
    displayPanel($('#accountTab'), $('.productionsList'), '80%', '60%');
});

$('#accountTab button[name="saveProduction"]').on('click', function(){
    displayPanel($('#accountTab'), $('.overwriteAlert'), '45%', '35%');
});

/**
 * Updates the production which has been added to the archive table at the
 * given date
 * @param {String} insertDate : date at which the production has been added to
 *                              the archive table
 */
function overwriteProduction(insertDate){
    $.ajax({
        type: 'POST',
        url: '/overwriteProduction',
        data: {
            username: sessionStorage.pseudo,
            insertDate: insertDate,
            production: JSON.stringify(editedProduction.saveProduction()),
            legend: JSON.stringify(editedProduction.saveLegend())
        },
        error: function(){
            console.log("failed to retrieve productions from archive");
        },
        success: function(response){
            if(response !== 'ERROR'){
                displayPanel($('#accountTab'), $('.productionsList'), '80%', '60%');
            }
        }
    });
}

$('.overwriteAlert .overwrite').on('click', function(){
    let selectedProduction = $('.productionsList tbody .selected');
    if(selectedProduction != null){
        overwriteProduction(selectedProduction.children()[1].innerHTML);
    }
});

/**
 * Adds a new production to the archive table
 * @param {String} partyName : name of the game in which the original production
 *                             has been created
 * @param {String} partyDate : date at which the game has been played
 * @param {String} productionData : data which describe the production
 * @param {String} legendData : data which describe the production's legend
 */
function addNewProductionToArchive(partyName, partyDate, productionData, legendData){
    $.ajax({
        type: 'POST',
        url: '/recordPlayerProduction',
        data: {
            username: sessionStorage.pseudo,
            partyName: partyName,
            partyDate: partyDate,
            production: productionData,
            legend: legendData,
            returnActList: true
        },
        error: function(){
            console.log("backup failed");
        },
        success: function(response){
            if(response !== 'ERROR'){
                displayPanel($('#accountTab'), $('.productionsList'), '80%', '60%');
                displayProductions(response);
            }
        }
    });
}

$('.overwriteAlert .add').on('click', function(){
    let selectedEntry = $('#accountTab .gameList tbody .selected');
    if(selectedEntry != null){
        addNewProductionToArchive(selectedEntry.children()[0].innerHTML,
                                  selectedEntry.children()[2].innerHTML,
                                  JSON.stringify(editedProduction.saveProduction()),
                                  JSON.stringify(editedProduction.saveLegend()));
    }
});

/**
 * Retrieves the production and the question of a player during a given game
 * @param {String} pseudo : pseudo of the production's owner
 * @param {String} partyName : game's name during which the production has been created
 * @param {String} partyDate : date at which the game has been played
 * @param {String} prodInsertDate : date at which the production has been added to
 *                                  the archive table
 */
function getProductionAndQuestion(pseudo, partyName, partyDate, prodInsertDate){
    $.ajax({
        type: 'POST',
        url: '/downloadArchivedProduction',
        data: {
            username: pseudo,
            partyName: partyName,
            partyDate: partyDate,
            insertDate: prodInsertDate
        },
        error: function(){
            console.log("download failed");
        },
        success: function(response){
            if(response !== 'ERROR'){
                downloadProduction($('.productionsList')[0], response['production'], response['legend'], response['question']);
            }
        }
    });
}

$('.productionsList button[name="download"]').on('click', function(){
    let selectedEntry = $('#accountTab .gameList tbody .selected');
    let selectedProduction = $('.productionsList tbody .selected');
    if(selectedEntry != null && selectedProduction != null){
        getProductionAndQuestion(sessionStorage.pseudo,
                                 selectedEntry.children()[0].innerHTML,
                                 selectedEntry.children()[2].innerHTML,
                                 selectedProduction.children()[1].innerHTML);
    }
});
