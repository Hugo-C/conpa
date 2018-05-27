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
        url: '/updateCardGame',
        data: {
            name: $('#importPage input[name="cardgameName"]').val(),
            language: $('#importPage input[name="cardgameLanguage"]').val(),
            author: sessionStorage.pseudo,
            update: overwrite,
            csv: sessionStorage.tempCSV
        },
        error: function(){
            alert("Request failed");
            displayCardGamePage();
        },
        success: function(response){
            if(response['send'] === 'OK'){
                displayTagsPanel();
                refreshTagsPanel(response);
            }else{
                console.log(response['send']);
                displayCardGamePage();
            }
        }
    });
    delete sessionStorage.tempCSV;
}

$('#editorTab .alert .confirm').on('click', function(){
    if($('#editorTab .alert').hasClass('overwrite')){
        overwriteCardgame("yes");
    }else if($('#editorTab .alert').hasClass('access')){
        displayCardGamePage();
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

function displayTagsPanel(){
    $("#editorTab > div").css("display", "none");
    $("#tagsPanel").animate({"display": "block"}, 1000, function(){
        $("#tagsPanel").css("display", "block");
        $("#editorTab > div:not(#tagsPanel)").css("display", "none");
    });
    let editorTab = $("#editorTab");
    editorTab.css('height', '85%');
    editorTab.css('width', '60%');
}

$('#addTag').on('click', function(){
    console.log('add a new tag');
    let tagToAdd =  $('#tagsPanel input[name="cardgameTag"]').val();
    if(tagToAdd != null && tagToAdd != ''){
        console.log('adding a new tag');
        $.ajax({
            type: 'POST',
            url: '/addATag',
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
                }else{
                    console.log(response['msg']);
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
            url: '/removeATag',
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
                }else{
                    console.log(response['msg']);
                }
            }
        });
    }
});

$('#valideUpdate').on('click', function(){
    let updatedDescription = $('#tagsPanel textarea').val();
    console.log(updatedDescription);
    if(updatedDescription != '' && updatedDescription != 'No description'){
        $.ajax({
            type: 'POST',
            url: '/updateCardgameDescription',
            data: {
                name: $('#tagsPanel input[name="cardgameName"]').val(),
                language: $('#tagsPanel input[name="cardgameLanguage"]').val(),
                description: updatedDescription
            },
            error: function(){
                console.log('request failed');
            },
            success: function(response){
                if(response === 'OK'){
                    displayCardGamePage();
                }else{
                    console.log(response);
                }
            }
        });
    }else{
        displayCardGamePage();
    }
});

$('#cancelUpdate').on('click', function(){
    displayCardGamePage();
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
            displayTagsPanel();
            refreshTagsPanel(response);
        }else if(response['msg'] === 'UPDATE?'){
            sessionStorage.tempCSV = response['file'];
            displayAlert('editorTab', 'overwrite', 'This card game already exists ! Would you overwrite it ?', 'both');
        }else if(response['msg'] === 'UNAUTHORIZED'){
            displayAlert('editorTab', 'access', 'This cardgame already exists and you are not allowed to overwrite it !', 'confirm');
        }else{
            console.log(response['msg']);
            displayCardGamePage();
        }
    };

    let query = "/importCardGame?author=" + sessionStorage.pseudo +
                "&name=" + $('#importPage input[name="cardgameName"]').val() +
                "&language=" + $('#importPage input[name="cardgameLanguage"]').val();

    request.open("post", query, true);
    request.send(formData);
}
