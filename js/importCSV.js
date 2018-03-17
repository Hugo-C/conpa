var fs = require("fs");
var parse = require('csv-parse/lib/sync');
var keys = require('../js/dbConstants');
var db = require('../js/db');

/**
 * Import the cards of the family to the database
 *
 * @param {Array.<string, string>} records : The records of families to process
 * @param {string} family : The family name, used as key in the record
 * @param {int} familyId : The id of the family
 */
function addCards(records, family, familyId) {
    records = records.slice(2);  // first 4 éléments aren't about cards
    var j = 0;
    while(j < records.length && records[j][family] !== ""){
        // we process each cards
        // TODO add the cards by batch
        db.addCard(records[j][family], records[j]["info sup " + family], familyId, function(err, result){
            if(err){
                console.log("err : " + err.message);
            }else{
                console.log("I added a card");
            }
        });
        j++;
    }
}

/**
 * Import the family'name to the database then add it's cards
 *
 * @param {Array.<string, string>} records : The records of families to process
 * @param {string} family : The family name, used as key in the record
 * @param {int} cardGameId : The id of the card game
 * @param {int} logoId : The id of the logo of the family
 * @param {callack} addCards : The function that will add the family's cards
 */
function addFamily(records, family, cardGameId, addCards) {

    function onFamilyAdded(err, result){
        if (err) {
            console.log("err family : " + err.message);
        }else {
            console.log("I added a cardFamily : " + family);
            addCards(records, family, result.insertId);
        }
    }
    db.addCardFamilyWithoutLogo(records[0][family], cardGameId, onFamilyAdded);
}

/**
 * Process all the families of the record by calling processFamily to each one
 *
 * @param {Array.<string, string>} records : The records of families to process
 * @param {int} cardGameId : The id of the card game
 */
var processFamilies = function(records, cardGameId) {
    let nbrFamilies = (Object.keys(records[0]).length - 1) / 2;
    // divided by 2 since we don't want supplement informations to be counted as families

    for (let i = 1; i < nbrFamilies; i++){
        let family = "famille " + i;
        addFamily(records, family, cardGameId, addCards);
    }
};

/**
 * Add a new card game to the database and process it's families
 *
 * @param {Array.<string, string>} records : The records of elements to add
 * @param {callack} processFamilies : The function to process the families of the card game
 */
function addCardGame(records, processFamilies) {
    // TODO we may want to handle errors in a way that failed request revert DB to a previous state
    db.addCardGame(records[0]['nom jeu'], records[0]['langue'], function(err, result){
        if (err) {
            console.log("err : " + err.message);
        } else {
            console.log("I added a new CardGame");
            processFamilies(records, result.insertId);
        }
    });
}

/**
 * Remove old card game and add the new one in the database
 *
 * @param {Array.<string, string>} records : The records of elements to add
 * @param {function} processFamilies : The function to process the families of the card game
 */
function updateCardGame(records, processFamilies) {
    // TODO we may want to handle errors in a way that failed request revert DB to a previous state
    db.removeCardGame(records[0]['nom jeu'], records[0]['langue'], function(err){
        if(err){
            console.log(err);
            return;
        }else{
            addCardGame(records, processFamilies);
        }
    })

}

/**
 * Import a csv file representing a deck/cardGame to a mysql database
 *
 * @param {string} path - The path to the file to import
 * @param {boolean} newCardGame : indicate if adding card game already exists in the database
 */
exports.importFromCsv = function(path, newCardGame){
    fs.readFile(path, function(err, data) {
        var records = parse(data, {columns: true});
        console.log(records);
        if(records.length > 0){
            if(newCardGame) addCardGame(records, processFamilies);
            else updateCardGame(records, processFamilies);
        }
        fs.unlinkSync(path);
    });
};
