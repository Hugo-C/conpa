function refreshCardGames(myTags, callback){
    $.ajax({
        type: 'POST',
        url: '/getCardGames',
        data: {
            tags: JSON.stringify(myTags)
        },
        error: function(){
            console.log("card games retrieving has failed");
        },
        success: function(response){
            if(response === 'ERROR'){
                console.log("card games retrieving has failed");
            }else{
                callback(response);
            }
        }
    });
}

/**
 * Displays card games in the card games table
 *
 * @param {dictionnary list} cardGames : list of dictionnaries
 * dictionnaries are formed like that :
 * {'name': card game name, 'language': card game language}
 */
function displayCardGames(parentId, tableId, cardGames){
    let cardGamesTable = $('#' + tableId).find('tbody');
    cardGamesTable.children().remove(); // we will replace old data by the data we have received
    for(let entry in cardGames){
        cardGamesTable.append($('<tr>')
            .append($('<td>' + cardGames[entry]['name'] + '</td>'))
            .append($('<td>' + cardGames[entry]['language'] + '</td>'))
            .append($('<td>' + cardGames[entry]['author'] + '</td>'))
            .append($('<td class="rowFlexContainer">' + '<button class="myCustomButton" onclick="getCardGameInfo(' + parentId + ', ' + tableId + ')">More...</button>' + '</td>')));
    }
}

function refreshTagsSelector(container, tags){
    let tagsSelector = $('.tabContent select');
    container.children().remove(); // we will replace old data by the data we have received
    for(let index = 0; index < tags.length; index++){
        container.append('<option value="' + tags[index] + '">' + tags[index] + '</option>');
    }
    container.multiselect();
}

function refreshTags(container){
    $.ajax({
        type: 'POST',
        url: '/getAllTags',
        data: null,
        error: function(){
            console.log("tags retrieving has failed");
        },
        success: function(response){
            if(response['msg'] === 'ERROR'){
                console.log("tags retrieving has failed");
            }else if(response['msg'] === 'OK'){
                refreshTagsSelector(container, response['tags']);
            }else{
                console.log('an error has occured');
            }
        }
    });
}

function refreshCardgameTagsList(table, tags){
    let tagsTable = table.find('tbody');
    tagsTable.children().remove(); // we will replace old data by the data we have received
    for(let index = 0; index < tags.length; index++){
        tagsTable.append($('<tr>')
            .append($('<td>' + tags[index] + '</td>')));
    }
}

/** Display the cardgame's information panel */
function displayPanel(parent, panel, height, width){
    parent.children().css("display", "none");
    panel.animate({"display": "block"}, 1000, function(){
        panel.css("display", "block");
    });

    parent.css('height', height);
    parent.css('width', width);
}

/** Display the cardgame's information panel */
function displayCardGameInfoPage(parentId, data){
    displayPanel($('#' + parentId), $('#' + parentId + ' > .cardgameInfoPanel'), '90%', '30%');

    $('.cardgameInfoPanel input[name="cardgameName"]').val(data['name']);
    $('.cardgameInfoPanel input[name="cardgameLanguage"]').val(data['language']);

    refreshCardgameTagsList($('#' + parentId + ' .cardgameInfoPanel table'), data['tags']);
    $('.cardgameInfoPanel textarea').val(data['description']);
}

function getCardGameInfo(parent, table){
    let selectedCardGame = $('#' + table.id + ' tbody .selected').children();
    if(selectedCardGame != null){
        $.ajax({
            type: 'POST',
            url: '/getCardGameInfo',
            data: {
                name: selectedCardGame[0].innerHTML,
                language: selectedCardGame[1].innerHTML
            },
            error: function(){
                console.log("card games retrieving has failed");
            },
            success: function(response){
                if(response['msg'] === 'ERROR'){
                    console.log('error getCardGameInfo');
                }else if(response['msg'] === 'OK'){
                    displayCardGameInfoPage(parent.id, response);
                }
            }
        });
    }
}

function displayAlert(parentId, type, message, button){
    $('#' + parentId + ' > div').css("display", "none");
    $(".alert").animate({"display": "block"}, 1000, function(){
        $(".alert").css("display", "block");
        $("#editorTab > div:not(.alert)").css("display", "none");
    });
    $('#' + parentId + ' .alertTitle').text('Confirmation');
    $('#' + parentId + ' .alertMessage').text(message);

    $('#' + parentId + ' .alert').addClass(type);
    if(button == 'confirm'){
        $('#' + parentId + ' .alert .cancel').css('display', 'none');
    }

    let tab = $('#' + parentId);
    tab.css('height', '40%');
    tab.css('width', '35%');
}

function sortTable(n, tableId) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById(tableId);
    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc";
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        rows = table.getElementsByTagName("TR");
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for (i = 1; i < (rows.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Get the two elements you want to compare,
            one from current row and one from the next: */
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /* Check if the two rows should switch place,
            based on the direction, asc or desc: */
            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                  // If so, mark as a switch and break the loop:
                  shouldSwitch = true;
                  break;
                }
            } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    // If so, mark as a switch and break the loop:
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
            and mark that a switch has been done: */
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            // Each time a switch is done, increase this count by 1:
            switchcount ++;
        } else {
            /* If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again. */
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}
