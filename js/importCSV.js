var fs = require("fs");
var parse = require('csv-parse/lib/sync');
var keys = require('../js/dbConstants');
var db = require('../js/db');


// create a connection to the database
var pass = function(){};
db.connect(db.MODE_TEST, pass);
var con = db.get();

/**
 * Import the cards of the family to the database
 * @param records {Array.<string, string>} : The records of families to process
 * @param family {string} : The family name, used as key in the record
 * @param familyId {int} : The id of the family
 */
function addCards(records, family, familyId) {
    records = records.slice(4);  // first 4 éléments aren't about cards
    var j = 0;
    while(j < records.length && records[j][family] !== ""){
        // we process each cards
        // TODO add the cards by batch
        var sql = ["INSERT INTO ", keys.CARD_TABLE, " (", keys.CT_KEY_CONTENT, ", ", keys.CT_KEY_INFORMATION, ", ",
            keys.CT_KEY_CARD_FAMILY, ") VALUES (?, ?, ?);"].join("");
        var values = [records[j][family], records[j]["info sup " + family], familyId];
        con.query(sql, values, function (err) {
            if (err) {
                console.log("err : " + err.message);
            } else {
                console.log("I added a card");
            }
        });
        j++;
    }
}

/**
 * Import the family'name to the database then add it's cards
 * @param records {Array.<string, string>} : The records of families to process
 * @param family {string} : The family name, used as key in the record
 * @param cardGameId {int} : The id of the card game
 * @param logoId {int} : The id of the logo of the family
 * @param addCards {function} : The function that will add the family's cards
 */
var addFamily = function (records, family, cardGameId, logoId, addCards) {
    var sql = ["INSERT INTO ", keys.CARD_FAMILY_TABLE, " (", keys.CFT_KEY_NAME, ", ",  keys.CFT_KEY_LOGO, ", ",
        keys.CFT_KEY_CARD_GAME, ") VALUES (?, ?, ?);"].join("");
    var values = [records[0][family], logoId, cardGameId];
    con.query(sql, values, function (err, result) {
        if (err) {
            console.log("err : " + err.message);
        }else {
            console.log("I added a cardFamily : " + family);
            addCards(records, family, result.insertId);
        }
    });
};

/**
 * Process the family of the record, by adding a logo, a name and all the cards that belong to the family
 * @param records {Array.<string, string>} : The records of families to process
 * @param family {string} : The family name, used as key in the record
 * @param cardGameId {int} : The id of the card game
 * @param addFamily {function} : The function that will add the family name and it's cards
 */
function processFamily(records, family, cardGameId, addFamily) {
    var sql = ["INSERT INTO ", keys.FAMILY_LOGO_TABLE, " (", keys.FLT_KEY_LOGO, ") VALUES (?);"].join("");
    var values = [records[2][family]];
    con.query(sql, values, (function (err, result) {
        if (err) {
            console.log("err : " + err.message);
        } else {
            console.log("I added a new Logo : " + result.insertId);
            addFamily(records, family, cardGameId, result.insertId, addCards);
        }
    }));
}

/**
 * Process all the families of the record by calling processFamily to each one
 * @param records {Array.<string, string>} : The records of families to process
 * @param cardGameId {int} : The id of the card game
 */
var processFamilies = function(records, cardGameId) {
    let nbrFamilies = (Object.keys(records[0]).length - 1) / 2;
    // divided by 2 since we don't want supplement informations to be counted as families

    for (let i = 1; i < nbrFamilies; i++){
        let family = "famille " + i;
        processFamily(records, family, cardGameId, addFamily);
    }
};

/**
 * Add a new card game to the database and process it's families
 * @param records {Array.<string, string>} : The records of elements to add
 * @param processFamilies {function} : The function to process the families of the card game
 */
function addCardGame(records, processFamilies) {
    // TODO we may want to handle errors in a way that failed request revert DB to a previous state
    console.log("Connected!");
    var sql = ["INSERT INTO ", keys.CARD_GAME_TABLE, " (", keys.CGT_KEY_NAME, ", ", keys.CGT_KEY_LANGUAGE, ") VALUES (?, ?);"].join("");
    var values = [records[0]['nom jeu'], records[0]['langue']];
    con.query(sql, values, function (err, result) {
        if (err) {
            console.log("err : " + err.message);
        } else {
            console.log("I added a new CardGame");
            processFamilies(records, result.insertId);
        }
    });
}

/**
 * Import a csv file representing a deck/cardGame to a mysql database
 * @param {string} path - The path to the file to import
 */
exports.importFromCsv = function(path){
    fs.readFile(path, function(err, data) {
        var records = parse(data, {columns: true});
        console.log(records);
        if(records.length > 0)
            addCardGame(records, processFamilies);
    });
};
