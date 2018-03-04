var mysql = require('mysql');
var keys = require('./dbConstants');

var PRODUCTION_DB = 'conpaCardGameDatabase'; // name of the production database
var TEST_DB = 'conpaCardGameDatabase'; // name of the test database

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
        host: '',
        port: '',
        user: '',
        password: '',
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

exports.startTransaction = function(){
    var sql = "SET autocommit=0;";
    state.pool.query(sql);
}

exports.rollback = function(){
    var sql = "ROLLBACK;";
    state.pool.query(sql);
}

exports.commit = function(){
    var sql = "COMMIT; SET autocommit=1;";
    state.pool.query(sql);
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
 * @param {callack} callback : function called to process retrieved data
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
 * @param {callack} callback : function called to process retrieved data
 */
exports.getCardGames = function(callback){
    var sql = 'SELECT * FROM ' + keys.CARD_GAME_TABLE + ';';
    state.pool.query(sql, null, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

/**
 * Add a card into the database
 *
 * @param {string} content : content of the card
 * @param {string} description : additional information
 * @param {integer} familyId : id of the card family
 * @param {callack} callback : function called to inform of the success of the operation
 */
exports.addCard = function(content, description, familyId, callback){
    var sql = 'INSERT INTO ' + keys.CARD_TABLE +
              ' (' + keys.CT_KEY_CONTENT + ', ' + keys.CT_KEY_INFORMATION + ', ' + keys.CT_KEY_CARD_FAMILY + ')' +
              ' VALUES (?, ?, ?);';
    var values = [content, description == '' ? 'NULL' : description, familyId];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

/**
 * Add a family into the database
 *
 * @param {string} name : family's name
 * @param {integer} cardGameId : id of the family's card game
 * @param {callack} callback : function called to inform of the success of the operation
 */
exports.addCardFamilyWithoutLogo = function(name, cardGameId, callback){
    var sql = 'INSERT INTO ' + keys.CARD_FAMILY_TABLE +
              ' (' + keys.CFT_KEY_NAME + ', ' + keys.CFT_KEY_CARD_GAME + ')' +
              ' VALUES (?, ?);';
    var values = [name, cardGameId];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

/**
 * Add a family into the database
 *
 * @param {string} name : family's name
 * @param {integer} logoId : id of the associated logo
 * @param {integer} cardGameId : id of the family's card game
 * @param {callack} callback : function called to inform of the success of the operation
 */
exports.addCardFamilyWithLogo = function(name, logoId, cardGameId, callback){
    var sql = 'INSERT INTO ' + keys.CARD_FAMILY_TABLE +
              ' (' + keys.CFT_KEY_NAME + ', ' + keys.CFT_KEY_LOGO + ', ' + keys.CFT_KEY_CARD_GAME + ')' +
              ' VALUES (?, ?, ?);';
    var values = [name, logoId, cardGameId];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

/**
 * Add a card game into the database
 *
 * @param {string} logo : base64 image
 * @param {callack} callback : function called to inform of the success of the operation
 */
exports.addLogo = function(logo, callback){
    var sql = 'INSERT INTO ' + keys.FAMILY_LOGO_TABLE +
              ' (' + keys.FLT_KEY_LOGO + ')' +
              ' VALUES (?);';
    console.log(sql);
    var value = [logo];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

exports.cardGameExists = function(name, language, callback){
    var sql = 'SELECT * FROM ' + keys.CARD_GAME_TABLE +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    var values = [name, language];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(false);
        }else{
            if(result.length > 0){
                callback(true);
            }else{
                callback(false);
            }
        }
    });
}

exports.removeCardGame = function(name, language, callback){
    var sql = 'DELETE FROM ' + keys.CARD_GAME_TABLE +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    var values = [name, language];
    state.pool.query(sql, values, function(err){
        if(err) callback(err);
        else callback(null);
    });
}

exports.addCardGame = function(name, language, callback){
    var sql = 'INSERT INTO ' + keys.CARD_GAME_TABLE +
              ' (' + keys.CGT_KEY_NAME + ', ' + keys.CGT_KEY_LANGUAGE + ')' +
              ' VALUES (? , ?);';
    var values = [name, language];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}
