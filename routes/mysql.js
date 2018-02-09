var express = require("express");
var router = express.Router();
var fs = require("fs");
var mysql = require("mysql");

var parse = require('csv-parse/lib/sync');
require('should');


var con = mysql.createConnection({
    host: "sql11.freemysqlhosting.net",
    user: "sql11219355",
    password: "E13uaGwb3r",
    database: "sql11219355"
});

/**
 * Import the cards of the family to the database
 * @param records {Array.<string, string>} : The records of families to process
 * @param family {string} : The family name, used as key in the record
 * @param familyId {int} : The id of the family
 */
function addCards(records, family, familyId) {
    records = records.slice(3);  // first 3 éléments aren't about cards
    var j = 0;
    while(j < records.length - 1 && records[j][family] !== ""){
        // we process each cards
        var sql = "INSERT INTO Card (content, familyId) VALUES (?, ?);";  // TODO add the cards by batch
        var values = [records[j][family], familyId];
        con.query(sql, values, function (err, result) {
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
    var sql = "INSERT INTO CardFamily (name, logoId, cardGameId) VALUES (?, ?, ?);";
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
    var sql = "INSERT INTO FamilyLogo (logo) VALUES (?);";
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
    for (var i = 1; i < Object.keys(records[0]).length - 1; i++){
        var family = "famille " + i;
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
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = "INSERT INTO CardGame (name, language) VALUES (?, ?);";
        var values = [records[0]['nom jeu'], records[0]['langue']];
        con.query(sql, values, function (err, result) {
            if (err) {
                console.log("err : " + err.message);
            }else {
                console.log("I added a new CardGame");
                processFamilies(records, result.insertId);
            }
        });
    });

}

/**
 * Import a csv file representing a deck/cardGame to a mysql database
 * @param {string} path - The path to the file to import
 */
function addCsv(path){
    fs.readFile(path, function(err, data) {
        var records = parse(data, {columns: true});
        if(records.length > 0){  // TODO check if the parsed csv is valid rather than not empty
            addCardGame(records, processFamilies);
        }
    });
}

router.get('/addCsv', function(req, res, next) {
    var path = req.query.path;
    if (path != null){
        addCsv(path);
    }
    res.send("OK");
});

module.exports = router;
