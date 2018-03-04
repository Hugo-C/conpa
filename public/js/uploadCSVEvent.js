// Array of regex use to check csv conformity
var modelCSV = [/nom jeu,langue(,(famille [1-5]),info sup \2){5}/g,
                  /(.*[A-Za-z].*,){2}(.*[A-Za-z].*,.*,){4}(.*[A-Za-z].*,.*)/g,
                  /,(,logo,){5}/g,
                  /,(,.*,){5}/g,
                  /,(,cartes famille [1-5],){5}/g,
                  /,,(.*[A-Za-z].*,.*,){4}(.*[A-Za-z].*,.*)/g];


$("#importToCSV").on("change", function(){
    handleFiles(this.files);
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
        alert("FileReader are not supported in this browser");
    }
}

/**
 * Retrieves file content in a string
 *
 * @param {file} fileToRead : file to process
 */
function getAsText(fileToRead){
    var reader = new FileReader();
    // read file into memory as UTF-8
    reader.readAsText(fileToRead);
    // handle errors load
    reader.onload = function(){
        loadHandler(event, fileToRead);
    };
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
    var csv = event.target.result;
    csv = processData(csv); // retrieves each csv lines
    if(checkConformity(csv)){
        uploadCSV(fileToRead);
    }else{
        alert("CSV invalid");
    }
}

/**
 * Splits csv content to retrieve each line independently
 *
 * @param {string} csv : csv content
 * @return {string array} : lines of the csv file
 */
function processData(csv){
    var allTextLines = csv.split(/\r\n|\n/);
    var row = [];
    for(var i = 0; i < allTextLines.length; i++){
        var data = allTextLines[i].split(';');
        for(var j = 0; j < data.length; j++){
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
    success = true; // csv conformity state
    test = 0; // line to be tested
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

/**
 * Uploads csv file to the server and ask it to import card game into database
 * If server answers that card game already exists, a confirmation is send to
 * the user to overwrite old card game version.
 */
function uploadCSV(csvFile){
    var formData = new FormData();
    formData.append("uploadCSV", csvFile);

    var request = new XMLHttpRequest();

    request.onload = function(){
        console.log("request loaded");
        if(request.status == 200) console.log("import successful");
        else if(request.status == 256){
            console.log("already have this game");
            console.log(request.responseText);
            var updateCardGame = confirm("This card game already exists !\nWould you overwrite it ?");
            var req;
            if(updateCardGame)
                req = "/editor/updateCardGame?cardGame=" + request.responseText + "&update=yes";
            else
                req = "/editor/updateCardGame?cardGame=" + request.responseText + "&update=no";
            var updateRequest = new XMLHttpRequest();
            updateRequest.open("post", req, true);
            updateRequest.send();
        }
    }

    request.open("post", "/editor/uploadCSV", true);
    request.send(formData);
}
