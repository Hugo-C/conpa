// Array of regex use to check csv conformity
var modelCSV = [/((famille [1-5]),info sup \2,?){5}/g,
                /(.*[A-Za-z].*,.*,?){5}/g,
                /(cartes famille [1-5],.*,?){5}/g,
                /(.*[A-Za-z].*,.*,?){5}/g];

function isImportFormValid(){
    let files = $('#import')[0].files;
    let name = $('#importPage input[name="cardgameName"]').val();
    let language = $('#importPage input[name="cardgameLanguage"]').val();
    if(files.length == 0 || name == '' || name == null
    || language == '' || language == null){
        return false;
    }
    return true;
}

$("#valideImport").on("click", function(){
    let csvImport = $('#import');
    if(isImportFormValid()){
        $('#importAlertMessage').text('Please wait !'); // reset alert displayer
        handleFiles(csvImport[0].files);
    }else{
        $('#importAlertMessage').text('Some fields are empty !');
    }
});

/**
 * Check if csv can be read by browser
 *
 * @param {file array} files : files to process
 */
function handleFiles(files){
    if(window.FileReader){
        getAsText(files[0]);
    }else{
        $('#importAlertMessage').text("FileReader are not supported in this browser");
    }
}

/**
 * Retrieves file content in a string
 *
 * @param {file} fileToRead : file to process
 */
function getAsText(fileToRead){
    let reader = new FileReader();

    reader.onload = (function () {
        return function (e) {
            loadHandler(e, fileToRead);
        };
    })();
    reader.readAsText(fileToRead);
    reader.onerror = errorHandler;
}

/**
 * Splits csv content to retrieve each line independently
 * Check file conformity
 * If csv file is conformed, it's send to the server
 *
 * @param {event} event : event returned by FileReader when file has been loaded
 * @param {fileToRead} fileToRead : csv content to process
 */
function loadHandler(event, fileToRead){
    let csv = event.target.result;
    csv = processData(csv); // retrieves each csv lines

    if(checkConformity(csv)){
        uploadCSV(fileToRead);
    }else{
        $('#importAlertMessage').text('Invalid CSV file !');
    }
}

/**
 * Splits csv content to retrieve each line independently
 *
 * @param {string} csv : csv content
 * @return {string array} : lines of the csv file
 */
function processData(csv){
    let allTextLines = csv.split(/\r\n|\n/);
    let row = [];
    for(let i = 0; i < allTextLines.length; i++){
        let data = allTextLines[i].split(';');
        for(let j = 0; j < data.length; j++){
            row.push(data[j]);
        }
    }
    return row;
}

/**
 * Check if first csv lines match with modelCSV lines
 *
 * @param {string array} row : csv lines array
 */
function checkConformity(row){
    if(row.length < modelCSV.length) return false; // csv count less lines than the model
    let success = true; // csv conformity state
    let test = 0; // line to be tested
    while(test < modelCSV.length && success){
        success = modelCSV[test].test(row[test]);
        test++;
    }
    return success;
}

/**
 * Inform developper when an error occurred while loading csv file
 *
 * @param {event} event : event returned by FileReader when an error occurred
 */
function errorHandler(event){
    console.log(event.target.error.name);
}

function overwriteCardgame(overwrite){
    $('#importAlertMessage').text('Please wait !'); // reset alert displayer
    $.ajax({
        type: 'POST',
        url: '/editor/updateCardGame',
        data: {
            name: $('#importPage input[name="cardgameName"]').val(),
            language: $('#importPage input[name="cardgameLanguage"]').val(),
            author: sessionStorage.pseudo,
            update: overwrite,
            csv: sessionStorage.tempCSV
        },
        error: function(){
            alert("Request failed");
            displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
        },
        success: function(response){
            if(response['send'] === 'OK'){
                displayPanel($('#editorTab'), $('#tagsPanel'), '85%', '60%');
                refreshTagsPanel(response);
            }else{
                displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
            }
        }
    });
    delete sessionStorage.tempCSV;
}

$('#editorTab .alert .confirm').on('click', function(){
    if($('#editorTab .alert').hasClass('overwrite')){
        overwriteCardgame("yes");
    }else if($('#editorTab .alert').hasClass('access')){
        displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
    }
    $('#importAlertMessage').text(''); // reset alert displayer
});

$('#editorTab .alert .cancel').on('click', function(){
    overwriteCardgame("no");
    $('#importAlertMessage').text(''); // reset alert displayer
});

function refreshTagsDatalist(tags){
    let tagsDatalist = $('#tags');
    tagsDatalist.children().remove(); // we will replace old data by the data we have received
    for(let index = 0; index < tags.length; index++){
        tagsDatalist.append('<option value="' + tags[index] + '"/>');
    }
}

function refreshTagsPanel(data){
    $('#tagsPanel input[name="cardgameName"]').val(data['name']);
    $('#tagsPanel input[name="cardgameLanguage"]').val(data['language']);
    let desc = data['description'] == null ? 'No description' : data['description'];
    $('#tagsPanel textarea').val(desc);

    refreshCardgameTagsList($('#tagsPanel table'), data['tags']);

    refreshTagsDatalist(data['allTags']);

}

$('#tagsPanel textarea').on('focus', function(){
    if($('#tagsPanel textarea').val() == 'No description'){
        $('#tagsPanel textarea').val('');
    }
});

$('#addTag').on('click', function(){
    let tagToAdd =  $('#tagsPanel input[name="cardgameTag"]').val();
    if(tagToAdd != null && tagToAdd != ''){
        $.ajax({
            type: 'POST',
            url: '/editor/addATag',
            data: {
                name: $('#tagsPanel input[name="cardgameName"]').val(),
                language: $('#tagsPanel input[name="cardgameLanguage"]').val(),
                tag: tagToAdd
            },
            error: function(){
                console.log('request failed');
            },
            success: function(response){
                if(response['msg'] === 'OK'){
                    refreshCardgameTagsList($('#tagsPanel table'), response['tags']);
                }
            }
        });
    }
});

$('#removeTag').on('click', function(){
    let tagToAdd =  $('#tagsPanel input[name="cardgameTag"]').val();
    if(tagToAdd != null && tagToAdd != ''){
        $.ajax({
            type: 'POST',
            url: '/editor/removeATag',
            data: {
                name: $('#tagsPanel input[name="cardgameName"]').val(),
                language: $('#tagsPanel input[name="cardgameLanguage"]').val(),
                tag: tagToAdd
            },
            error: function(){
                console.log('request failed');
            },
            success: function(response){
                if(response['msg'] === 'OK'){
                    refreshCardgameTagsList($('#tagsPanel table'), response['tags']);
                }
            }
        });
    }
});

function newCardGameHasBeenAdded(){
    displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
    refreshCardGames([], function(data){
        displayCardGames('editorTab', 'myCardgames', data);
    });
}

$('#valideUpdate').on('click', function(){
    let updatedDescription = $('#tagsPanel textarea').val();
    if(updatedDescription != '' && updatedDescription != 'No description'){
        $.ajax({
            type: 'POST',
            url: '/editor/updateCardgameDescription',
            data: {
                name: $('#tagsPanel input[name="cardgameName"]').val(),
                language: $('#tagsPanel input[name="cardgameLanguage"]').val(),
                description: updatedDescription
            },
            error: function(){
                console.log('request failed');
                displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
            },
            success: function(response){
                newCardGameHasBeenAdded();
            }
        });
    }else{
        newCardGameHasBeenAdded();
    }
});

$('#cancelUpdate').on('click', function(){
    displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
});

/**
 * Uploads csv file to the server and ask it to import card game into database
 * If server answers that card game already exists, a confirmation is send to
 * the user to overwrite old card game version.
 */
function uploadCSV(csvFile){
    let formData = new FormData();
    formData.append("uploadCSV", csvFile);

    let request = new XMLHttpRequest();
    request.onload = function(){
        let response = JSON.parse(request.responseText);
        if(response['msg'] === 'OK'){
            displayPanel($('#editorTab'), $('#tagsPanel'), '85%', '60%');
            refreshTagsPanel(response);
        }else if(response['msg'] === 'UPDATE?'){
            sessionStorage.tempCSV = response['file'];
            displayAlert('editorTab', 'overwrite', 'This card game already exists ! Would you overwrite it ?', 'both');
        }else if(response['msg'] === 'UNAUTHORIZED'){
            displayAlert('editorTab', 'access', 'This cardgame already exists and you are not allowed to overwrite it !', 'confirm');
        }else{
            displayPanel($('#editorTab'), $('#editorTab .tabContent'), '90%', '40%');
        }
    };

    let query = "/editor/importCardGame?author=" + sessionStorage.pseudo +
                "&name=" + $('#importPage input[name="cardgameName"]').val() +
                "&language=" + $('#importPage input[name="cardgameLanguage"]').val();

    request.open("post", query, true);
    request.send(formData);
}
