var express = require('express');
var db = require('../js/db');
var keys = require('../js/dbConstants');
var fs = require('fs');
var csv = require('fast-csv');

const FAMILY_NAME = 0;
const LOGO_HEADER = 1;
const FAMILY_LOGO = 2;
const FAMILY_CARDS_HEADER = 3;
const FAMILY_CARD = 4;

/**
 * Write records into csv file
 *
 * @param {object array} records : data to write in csv file
 * @param {boolean array} familiesExport : current state of the families cards recovery
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 */
function finalizeWriting(records, familiesExport, onFileReady){
    for(task = 0; task < familiesExport.length; task++){
        if(!familiesExport[task]) return; // if all families cards have not been recovered, not write data
    }

    var stream = fs.createWriteStream('./public/myCardGame.csv'); // writable stream to csv file
    stream.on("finish", function(){
        onFileReady(); // call alert function when file is ready
    });

    csv.write(records, {headers:["nom jeu", "langue",
                                 "famille 1", "info sup famille 1",
                                 "famille 2", "info sup famille 2",
                                 "famille 3", "info sup famille 3",
                                 "famille 4", "info sup famille 4",
                                 "famille 5", "info sup famille 5"]}).pipe(stream);
}

/**
 * Write datas into the specified column
 *
 * @param {object array} records : array of data to write in the csv file
 * @param {integer} familyNb : number of the family concerned by the data to add
 *                             this number is used to write in the correct column
 * @param {integer} object : type of data to add. Used to write in the correct line
 * @param {object} content : data to add
 */
function writeIntoColumn(records, familyNb, object, content){
    console.log(records);
    var family = "famille " + (familyNb + 1); // header of the family column
    var infoFamily = "info sup famille " + (familyNb + 1); // header of the family informations column
    switch (object) {
        case FAMILY_CARD:
            var line = FAMILY_CARD + content["cardNumber"];
            if(records.length == line){ // no data have been written on this line, we add new one
                records.push({[family]: content["content"],
                              [infoFamily]: content["information"]});
            }else{ // we add data on the line
                records[line][family] = content["content"];
                records[line][infoFamily] = content["information"];
            }
            break;
        default: // no data have been written on this line, we add new one
            if(records.length < object + 1){
                records.push({[family]: content});
            }else{ // we add data on the line
                records[object][family] = content;
            }
            break;
    }
}

/**
 * Add cards of a game family as data to be written in the csv
 *
 * @param {error} err : error returned by sql query if this one has failed
 * @param {object array} records : array of data to write in the csv file
 * @param {object array} rows : cards to add in the records array
 * @param {integer} column : csv column of the cards family [0-4]
 * @param {boolean array} familiesExport : current state of the families cards recovery
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 */
function processFamilyCards(err, records, rows, column, familiesExport, onFileReady){
    if(err){
        console.log(err);
    }else{
        for(card = 0; card < rows.length; card++){
            writeIntoColumn(records, column, FAMILY_CARD,
                {"cardNumber" : card,
                 "content" : rows[card][keys.CT_KEY_CONTENT],
                 "information" : rows[card][keys.CT_KEY_INFORMATION]});
        }
        familiesExport[column] = true; // all cards of this family have been add to records array
        finalizeWriting(records, familiesExport, onFileReady); // this family may be the last to be add
                                                               // we try to write data in csv
    }
}

/**
 * Retrieves cards of a card game family and call processFamilyCards function to process data
 *
 * @param {unsigned integer} familyId : id of the family for which we want to retrieve cards
 * @param {object array} records : array of data to write in the csv file
 * @param {callback} onDataRecovered : function called to process retrieved data
 * @param {integer} destColumn : csv column of the cards family [0-4]
 * @param {boolean array} familiesExport : current state of the families cards recovery
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 */
function recoverFamilyCards(familyId, records, onDataRecovered, destColumn, familiesExport, onFileReady){
    db.getFamilyCards(familyId, function(err, result){
        if(err) onDataRecovered(err);
        else onDataRecovered(null, records, result, destColumn, familiesExport, onFileReady);
    });
}

/**
 * Add card game families as data to be written in the csv
 *
 * @param {error} err : error returned by sql query if this one has failed
 * @param {object array} records : array of data to write in the csv file
 * @param {object array} rows : cards to add in the records array
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 *
 */
function processFamilies(err, records, rows, onFileReady){
    if(err){
        console.log(err);
    }else{
        var familiesExport = [false, false, false, false, false]; // used to track families recovery process when all
                                                                  // values are 'true', we can write records data in csv
        for(fafa = 0; fafa < rows.length; fafa++){
            writeIntoColumn(records, fafa, FAMILY_NAME, rows[fafa][keys.CFT_KEY_NAME]);
            writeIntoColumn(records, fafa, LOGO_HEADER, "logo");
            writeIntoColumn(records, fafa, FAMILY_LOGO, rows[fafa][keys.FLT_KEY_LOGO]);
            writeIntoColumn(records, fafa, FAMILY_CARDS_HEADER, "cartes famille " + (fafa + 1));
            recoverFamilyCards(rows[fafa][keys.CFT_KEY_ID], records, processFamilyCards, fafa, familiesExport, onFileReady);
        }
    }
}

/**
 * Retrieves families of a card game and call processFamilies function to process data
 *
 * @param {unsigned integer} cardGameId : id of the card game for which we want to retrieve families
 * @param {object array} records : array of data to write in the csv file
 * @param {callback} onDataRecovered : function called to process retrieved data
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 */
function recoverFamiliesAndLogos(cardGameId, records, onDataRecovered, onFileReady){
    db.getFamiliesAndLogos(cardGameId, function(err, result){
        if(err) onDataRecovered(err);
        else onDataRecovered(null, records, result, onFileReady);
    });
}

/**
 * Add card game informations as data to be written in the csv
 *
 * @param {error} err : error returned by sql query if this one has failed
 * @param {object array} records : array of data to write in the csv file
 * @param {object array} rows : cards to add in the records array
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 */
function processCardGame(err, records, rows, onFileReady){
    if(err){
        console.log(err);
    }else{
        records.push({"nom jeu" : rows[0][keys.CGT_KEY_NAME],
                      "langue" : rows[0][keys.CGT_KEY_LANGUAGE]}); // adding name and card game language as data to be written
        recoverFamiliesAndLogos(rows[0][keys.CGT_KEY_ID], records, processFamilies, onFileReady);
    }
}

/**
 * Retrieves card game informations and call processCardGame function to process data
 *
 * @param {string} cardGame : name of card game we want to retrieve
 * @param {string} language : language of card game we want to retrieve
 * @param {object array} records : array of data to write in the csv file
 * @param {callback} onDataRecovered : function called to process retrieved data
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 */
function recoverCardGame(cardGame, language, records, onDataRecovered, onFileReady){
    db.getCardGame(cardGame, language, function(err, result){
        if(err) onDataRecovered(err);
        else onDataRecovered(null, records, result, onFileReady);
    });
}

/**
 * Start data recovery
 *
 * @param {string} cardGame : name of card game we want to export
 * @param {string} language : language of card game we want to export
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 */
exports.exportToCSV = function(cardGame, language, onFileReady){
    records = new Array(); // array used to store retrieved data before to be write into csv file
    recoverCardGame(cardGame, language, records, processCardGame, onFileReady);
};
