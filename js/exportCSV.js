const db = require('../js/db');
const keys = require('../js/dbConstants');
const fs = require('fs');
const csv = require('fast-csv');
const logger = require('../js/logger');

const FAMILY_NAME = 0;
const CARDS_HEADER = 1;
const CARD = 2;

/**
 * Generates random names for uploaded csv file
 * Used to face file conflicts between users
 *
 * @return {string} : random file name with csv extension
 */
function generateRandomCsvFileName(){
    return Math.random().toString(36).substr(2, 16) + '.csv';
}

/**
 * Writes records into csv file
 *
 * @param {object array} records : data to write in csv file
 * @param {boolean array} familiesExport : current state of the families cards recovery
 * @param {callback} onFileReady : function charged of alerting that the csv file is ready to be downloaded
 */
function finalizeWriting(records, familiesExport, onFileReady){
    for(let task = 0; task < familiesExport.length; task++){
        if(!familiesExport[task]) return; // if all cards's families  have not been recovered, do not writes datas
    }

    let csvFileName = generateRandomCsvFileName();

    let stream = fs.createWriteStream('./public/' + csvFileName); // writable stream to csv file
    stream.on("finish", function(){
        onFileReady(csvFileName); // call alert function when file is ready
    });

    csv.write(records, {headers:["famille 1", "info sup famille 1",
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
    logger.log("silly", records);
    var family = "famille " + (familyNb + 1); // header of the family column
    var infoFamily = "info sup famille " + (familyNb + 1); // header of the family informations column
    switch (object) {
        case CARD:
            let line = CARD + content["cardNumber"];
            if(records.length === line){ // no data have been written on this line, we add a new one
                records.push({[family]: content["content"],
                              [infoFamily]: content["information"]});
            }else{ // we the add data on the line
                records[line][family] = content["content"];
                records[line][infoFamily] = content["information"];
            }
            break;
        default: // no data have been written on this line, we add a new one
            if(records.length < object + 1){
                records.push({[family]: content});
            }else{ // we add the data on the line
                records[object][family] = content;
            }
            break;
    }
}

/**
 * Add cards of a game family as datas to be written in the csv
 *
 * @param {error} err : error returned by sql query if this one has failed
 * @param {object array} records : array of datas to write in the csv file
 * @param {object array} rows : cards to add in the records array
 * @param {integer} column : csv column of the cards family [0-4]
 * @param {boolean array} familiesExport : current state of the families's cards recovery
 * @param {callback} onFileReady : function charged of alerting that the csv file is ready to be downloaded
 */
function processFamilyCards(err, records, rows, column, familiesExport, onFileReady){
    if(err){
        logger.error(err);
    }else{
        for(card = 0; card < rows.length; card++){
            writeIntoColumn(records, column, CARD,
                {"cardNumber" : card,
                 "content" : rows[card][keys.CT_KEY_CONTENT],
                 "information" : rows[card][keys.CT_KEY_INFORMATION] === "NULL" ? "" : rows[card][keys.CT_KEY_INFORMATION]});
        }
        familiesExport[column] = true; // all cards of this family have been add to records array
        // this family may be the last to be added, we try to write data in csv
        finalizeWriting(records, familiesExport, onFileReady);
    }
}

/**
 * Retrieves cards of a card game family and call processFamilyCards function to process data
 *
 * @param {unsigned integer} familyId : id of the family for which we want to retrieve cards
 * @param {object array} records : array of datas to write in the csv file
 * @param {callback} processFamilyCards : function called to process retrieved data
 * @param {integer} destColumn : csv column of the cards family [0-4]
 * @param {boolean array} familiesExport : current state of the families cards recovery
 * @param {callback} onFileReady : function charged of alerting that the csv file is ready to be downloaded
 */
function recoverFamilyCards(familyId, records, processFamilyCards, destColumn, familiesExport, onFileReady){
    db.getFamilyCards(familyId, function(err, result){
        if(err) processFamilyCards(err);
        else processFamilyCards(null, records, result, destColumn, familiesExport, onFileReady);
    });
}

/**
 * Add card game families as data to be written in the csv
 *
 * @param {error} err : error returned by sql query if this one has failed
 * @param {object array} records : array of datsa to write in the csv file
 * @param {object array} rows : cards to add in the records array
 * @param {callback} onFileReady : function charged of alerting that the csv file is ready to be downloaded
 *
 */
function processFamilies(err, records, rows, onFileReady){
    if(err){
        logger.error(err);
    }else{
        let familiesExport = [false, false, false, false, false]; // used to track families recovery process when all
        for(fafa = 0; fafa < rows.length; fafa++){
            writeIntoColumn(records, fafa, FAMILY_NAME, rows[fafa][keys.CFT_KEY_NAME]);
            writeIntoColumn(records, fafa, CARDS_HEADER, "cartes famille " + (fafa + 1));
            recoverFamilyCards(rows[fafa][keys.CFT_KEY_ID], records, processFamilyCards, fafa, familiesExport, onFileReady);
        }
    }
}

/**
 * Retrieves families of a card game and call processFamilies function to process data
 *
 * @param {unsigned integer} cardGameId : id of the card game for which we want to retrieve families
 * @param {object array} records : array of datas to write in the csv file
 * @param {callback} processFamilies : function called to process retrieved data
 * @param {callback} onFileReady : function charged of alerting that csv file is ready to be downloaded
 */
function recoverFamilies(cardGameId, records, processFamilies, onFileReady){
    db.getFamilies(cardGameId, function(err, result){
        if(err) processFamilies(err);
        else processFamilies(null, records, result, onFileReady);
    });
}

/**
 * Retrieves card game informations and call processCardGame function to process data
 *
 * @param {string} cardGame : name of card game we want to retrieve
 * @param {string} language : language of card game we want to retrieve
 * @param {object array} records : array of data to write in the csv file
 * @param {callback} processCardGame : function called to process retrieved data
 * @param {callback} onFileReady : function charged of alerting that the csv file is ready to be downloaded
 */
function recoverCardGameId(cardGame, language, records, onFileReady){
    db.getCardGame(cardGame, language, function(err, result){
        if(err) logger.error(err);
        else recoverFamilies(result[0][keys.CGT_KEY_ID], records, processFamilies, onFileReady);
    });
}

/**
 * Start data recovery
 *
 * @param {string} cardGame : name of card game we want to export
 * @param {string} language : language of card game we want to export
 * @param {callback} onFileReady : function charged of alerting that the csv file is ready to be downloaded
 */
exports.exportToCSV = function(cardGame, language, onFileReady){
    let records = []; // array used to store retrieved data before to be write into csv file
    recoverCardGameId(cardGame, language, records, onFileReady);
};
