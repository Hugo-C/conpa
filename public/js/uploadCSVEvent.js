// Array of regex use to check csv conformity
var modelCSV = [/nom jeu,langue(,(famille [1-5]),info sup \2){5}/g,
                  /(.*[A-Za-z].*,){2}(.*[A-Za-z].*,.*,){4}(.*[A-Za-z].*,.*)/g,
                  /,(,cartes famille [1-5],){5}/g,
                  /,,(.*[A-Za-z].*,.*,){4}(.*[A-Za-z].*,.*)/g];


$("#valideImport").on("click", function(){
    let csvImport = $('#import');
    if(csvImport[0].files.length > 0){
        handleFiles(csvImport[0].files);
        csvImport.attr('type', ''); // reset input(type="file") content
        csvImport.attr('type', 'file');
        csvImport.text('No file chosen'); // no selected file
    }else{
        $('#importAlertMessage').text('No file selected');
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
            console.log(e.target.result);
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
    console.log(row);
    if(row.length < modelCSV.length) return false; // csv count less lines than the model
    let success = true; // csv conformity state
    let test = 0; // line to be tested
    while(test < modelCSV.length && success){
        console.log(modelCSV[test] + ' match with ' + row[test]);
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

/**
 * Uploads csv file to the server and ask it to import card game into database
 * If server answers that card game already exists, a confirmation is send to
 * the user to overwrite old card game version.
 */
function uploadCSV(csvFile){
    let formData = new FormData();
    formData.append("uploadCSV", csvFile);

    var request = new XMLHttpRequest();
    request.onload = function(){
        let regex = /\.csv$/;
        if(request.responseText === 'OK'){
            $('#importAlertMessage').text("import successful");
        }else if(request.responseText != null && regex.test(request.responseText)){
            let updateCardGame = confirm("This card game already exists !\nWould you overwrite it ?");
            $.ajax({
                type: 'POST',
                url: '/updateCardGame',
                data: {
                    update: updateCardGame ? "yes" : "no",
                    csv: request.responseText
                },
                error: function(){
                    $('#importAlertMessage').text("Request failed");
                },
                success: function(response){
                    if(response === 'OK'){
                        $('#importAlertMessage').text("Import successful");
                    }else if(response === 'NO UPDATE'){
                        $('#importAlertMessage').text("Data has not been updated");
                    }else{
                        $('#importAlertMessage').text("Request failed");
                    }
                }
            });
        }else{
            $('#importAlertMessage').text("import has failed");
        }
    };

    request.open("post", "/importCardGame", true);
    request.send(formData);
}
