const fs = require("fs");
const parse = require('csv-parse/lib/sync');
const db = require('../js/db');
const keys = require('../js/dbConstants');
const logger = require('../js/logger');

/**
 * Import the cards of the family to the database
 *
 * @param {Array.<string, string>} records : The records of families to process
 * @param {string} family : The family's name, used as key in the record
 * @param {int} familyId : The id of the family
 */
function addCards(records, family, familyId) {
    records = records.slice(2);  // first 4 elements aren't about cards
    let j = 0;
    while(j < records.length && records[j][family] !== ""){
        // we process each cards
        // TODO add the cards by batch
        db.addCard(records[j][family], records[j]["info sup " + family], familyId, function(err){
            if(err){
                logger.error("err : " + err.message);
            }else{
                logger.debug("I added a card");
            }
        });
        j++;
    }
}

/**
 * Import the family's name to the database then add its cards
 *
 * @param {Array.<string, string>} records : The records of families to process
 * @param {string} family : The family's name, used as key in the record
 * @param {int} cardGameId : The id of the card game
 * @param {callback} addCards : The function that will add the family's cards
 */
function addFamily(records, family, cardGameId, addCards) {

    function onFamilyAdded(err, result){
        if (err) {
            logger.error("err family : " + err.message);
        }else {
            logger.debug("I added a cardFamily : " + family);
            addCards(records, family, result.insertId);
        }
    }
    db.addCardFamilyWithoutLogo(records[0][family], cardGameId, onFamilyAdded);
}

/**
 * Process all the families of the record by calling processFamily on each one
 *
 * @param {Array.<string, string>} records : The records of families to process
 * @param {int} cardGameId : The id of the card game
 */
const processFamilies = function(records, cardGameId) {
    let nbrFamilies = (Object.keys(records[0]).length) / 2;
    // divided by 2 since we don't want supplement informations to be counted as families

    for (let i = 1; i <= nbrFamilies; i++){
        let family = "famille " + i;
        addFamily(records, family, cardGameId, addCards);
    }
};

/**
 * Add a new card game to the database and process it's families
 *
 * @param {Array.<string, string>} records : The records of elements to add
 * @param {callback} processFamilies : The function to process the families of the card game
 */
function addCardGame(name, language, author, records, processFamilies) {
    // TODO we may want to handle errors in a way that failed request revert DB to a previous state
    db.addCardGame(name, language, author, function(err, result){
        if (err) {
            logger.error("err : " + err.message);
        } else {
            logger.debug("I added a new CardGame");
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
function updateCardGame(name, language, author, records, processFamilies) {
    // TODO we may want to handle errors in a way that failed request revert DB to a previous state
    logger.debug("silly", name);
    logger.debug("silly", language);
    db.removeCardGameFamilies(name, language, function(err){
        if(err){
            logger.error(err);
        }else{
            //addCardGame(name, language, author, records, processFamilies);
            db.getCardGame(name, language, function(err, result){
                if(err){
                    logger.error(err);
                }else{
                    logger.debug(result);
                    processFamilies(records, result[0][keys.CGT_KEY_ID]);
                }
            });
        }
    });
}

/**
 * Import a csv file representing a deck/cardGame to a mysql database
 *
 * @param {string} path - The path to the file to import
 * @param {boolean} newCardGame : indicate if adding card game already exists in the database
 */
exports.importFromCsv = function(name, language, author, path, newCardGame){
    fs.readFile(path, function(err, data) {
        try{
            let records = parse(data, {columns: true});
            if(records.length > 0){
                if(newCardGame) addCardGame(name, language, author, records, processFamilies);
                else updateCardGame(name, language, author, records, processFamilies);
            }
        }catch(error){
            logger.error(err);
        }
        fs.unlinkSync(path);
    });
};
