/**
 * Displays historic in the historic table
 *
 * @param {dictionnary list} historic : list of dictionnaries
 * dictionnaries are formed like that :
 * {'name': game server name, 'animator': pseudo of the player who have animated the game,
 *  'date': date at which game has been played, 'question': player's question}
 */
function displayHistoric(tabID, historic){
    let historicTable = $('#' + tabID + ' .gameList').find('tbody');
    historicTable.children().remove(); // we will replace old data by the data we have received
    for(let entry in historic){
        historicTable.append($('<tr>')
            .append($('<td>' + historic[entry]['name'] + '</td>'))
            .append($('<td>' + historic[entry]['animator'] + '</td>'))
            .append($('<td>' + historic[entry]['date'] + '</td>'))
            .append($('<td>' + historic[entry]['question'] + '</td>')));
    }
}

function refreshGameList(tabID, folder){
    $.ajax({
        type: 'POST',
        url: folder == 'historic' ? '/getHistoric' : '/getArchive',
        data: { username: sessionStorage.pseudo },
        error: function(){
            console.log("historic retrieving has failed");
        },
        success: function(response){
            if(response === 'ERROR'){
                console.log("historic retrieving has failed");
            }else{
                displayHistoric(tabID, response);
            }
        }
    });
}

function deleteEntry(tabID){
    let selectedEntry = $('#' + tabID + ' .gameList tbody .selected');
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
                    refreshGameList(tabID, 'historic');
                }else{
                    console.log('removing has failed');
                }
            }
        });
    }
}
