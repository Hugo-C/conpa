var mysql = require('mysql');
var keys = require('./dbConstants');

var PRODUCTION_DB = 'sql11219355'; // name of the production database
var TEST_DB = 'sql11219355'; // name of the test database

exports.MODE_TEST = 'mode_test';
exports.MODE_PRODUCTION = 'mode_production';

var state = {
    pool: null, // connection instance to mysql database
    mode: null, // selected database
}

/**
 * Creates a connection instance to the database and store it into state record
 *
 * @param {string} mode : allows user to choose between a production or test database
 * @param {function} done : nodejs function call when work is done
 */
exports.connect = function(mode, done){
    state.pool = mysql.createPool({
        host: "sql11.freemysqlhosting.net",
        user: "sql11219355",
        password: "E13uaGwb3r",
        database: mode === exports.MODE_PRODUCTION ? PRODUCTION_DB : TEST_DB
    });
    state.mode = mode;
    done();
}

/**
 * Gives access to the connection instance create by connect function
 *
 * @return {mysql connection} : connection instance to mysql database
 */
exports.get = function(){
    return state.pool;
}

/**
 * Function called when data has been retrieved from database.
 * This function is in charge of data processing.
 *
 * @callback callback
 * @param {error} err : error returned by the query if this one has failed
 * @param {object array} : result returned by the query if this one has working
 */

/**
 * Retrieves family cards
 *
 * @param {unsigned integer} familyId : id of the family for which we want to retrieve cards
 * @param {callack} callback : function called to process retrieved data
 */
exports.getFamilyCards = function(familyId, callback){
    var sql = 'SELECT ' + keys.CT_KEY_CONTENT + ', ' + keys.CT_KEY_INFORMATION +
              ' FROM ' + keys.CARD_TABLE +
              ' WHERE ' + keys.CT_KEY_CARD_FAMILY + ' = ?' +
              ' ORDER BY ' + keys.CT_KEY_CONTENT + ';';
    var value = [familyId];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

/**
 * Retrieves card game families and associated logos from a card game id
 *
 * @param {unsigned integer} cardGameId : id of the card game for which we want to retrieve families and associated logos
 * @param {callack} callback : function called to process retrieved data
 */
exports.getFamiliesAndLogos = function(cardGameId, callback){
    var sql = 'SELECT ' + keys.CARD_FAMILY_TABLE + '.' + keys.CFT_KEY_ID +
              ', ' + keys.CFT_KEY_NAME +
              ', ' + keys.FLT_KEY_LOGO +
              ' FROM ' + keys.CARD_FAMILY_TABLE +
              ' LEFT JOIN ' + keys.FAMILY_LOGO_TABLE +
              ' ON ' + keys.CFT_KEY_LOGO + ' = ' + keys.FAMILY_LOGO_TABLE + '.' + keys.FLT_KEY_ID +
              ' WHERE ' + keys.CFT_KEY_CARD_GAME + ' = ?;';
    var value = [cardGameId];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

/**
 * Retrieves card game informations (id, name and language)
 *
 * @param {string} cardGame : name of card game we want to retrieved
 * @param {string} language : language of card game we want to retrieved
 * @param {callack} callack : function called to process retrieved data
 */
exports.getCardGame = function(cardGame, language, callback){
    var sql = 'SELECT * FROM ' + keys.CARD_GAME_TABLE +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    var values = [cardGame, language];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

/**
 * Retrieves all card game stored in database
 *
 * @param {callack} callack : function called to process retrieved data
 */
exports.getCardGames = function(callback){
    var sql = 'SELECT * FROM ' + keys.CARD_GAME_TABLE + ';';
    state.pool.query(sql, null, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}
