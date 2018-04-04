var mysql = require('mysql');
var keys = require('./dbConstants');

var PRODUCTION_DB = 'conpaV2'; // name of the production database
var TEST_DB = 'conpaV2'; // name of the test database

exports.MODE_TEST = 'mode_test';
exports.MODE_PRODUCTION = 'mode_production';

var state = {
    pool: null, // connection instance to mysql database
    mode: null, // selected database
};

/**
 * Creates a connection instance to the database and store it into state record
 *
 * @param {string} mode : allows user to choose between a production or test database
 * @param {function} done : nodejs function call when work is done
 */
exports.connect = function(mode, done){
    state.pool = mysql.createPool({
        host: '78.240.16.90',
        user: 'julien',
        port: '50000',
        password: 'StimpflingMysql73100',
        database: mode === exports.MODE_PRODUCTION ? PRODUCTION_DB : TEST_DB
    });
    state.mode = mode;
    done();
};

/**
 * Gives access to the connection instance create by connect function
 *
 * @return {mysql connection} : connection instance to mysql database
 */
exports.get = function(){
    return state.pool;
};

exports.startTransaction = function(){
    var sql = "SET autocommit=0;";
    state.pool.query(sql);
};

exports.rollback = function(){
    var sql = "ROLLBACK;";
    state.pool.query(sql);
};

exports.commit = function(){
    var sql = "COMMIT; SET autocommit=1;";
    state.pool.query(sql);
};

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
 * @param {callback} callback : function called to process retrieved data
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
};

/**
 * Retrieves card game families and associated logos from a card game id
 *
 * @param {unsigned integer} cardGameId : id of the card game for which we want to retrieve families and associated logos
 * @param {callback} callback : function called to process retrieved data
 */
exports.getFamilies = function(cardGameId, callback){
    var sql = 'SELECT ' + keys.CARD_FAMILY_TABLE + '.' + keys.CFT_KEY_ID +
              ', ' + keys.CFT_KEY_NAME +
              ', ' + keys.CFT_KEY_LOGO +
              ' FROM ' + keys.CARD_FAMILY_TABLE +
              ' WHERE ' + keys.CFT_KEY_CARD_GAME + ' = ?;';
    var value = [cardGameId];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Retrieves card game informations (id, name and language)
 *
 * @param {string} cardGame : name of card game we want to retrieved
 * @param {string} language : language of card game we want to retrieved
 * @param {callback} callback : function called to process retrieved data
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
};

/**
 * Retrieves all card game stored in database
 *
 * @param {callback} callback : function called to process retrieved data
 */
exports.getCardGames = function(callback){
    var sql = 'SELECT * FROM ' + keys.CARD_GAME_TABLE + ';';
    state.pool.query(sql, null, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Add a card into the database
 *
 * @param {string} content : content of the card
 * @param {string} description : additional information
 * @param {integer} familyId : id of the card family
 * @param {callback} callback : function called to inform of the success of the operation
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
};

/**
 * Add a family into the database
 *
 * @param {string} name : family's name
 * @param {integer} cardGameId : id of the family's card game
 * @param {callback} callback : function called to inform of the success of the operation
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
};

/**
 * Add a family into the database
 *
 * @param {string} name : family's name
 * @param {string} logo : name of the logo image
 * @param {integer} cardGameId : id of the family's card game
 * @param {callback} callback : function called to inform of the success of the operation
 */
exports.addCardFamilyWithLogo = function(name, logo, cardGameId, callback){
    var sql = 'INSERT INTO ' + keys.CARD_FAMILY_TABLE +
              ' (' + keys.CFT_KEY_NAME + ', ' + keys.CFT_KEY_LOGO + ', ' + keys.CFT_KEY_CARD_GAME + ')' +
              ' VALUES (?, ?, ?);';
    var values = [name, logo, cardGameId];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Check if a cardgame is already in the database
 *
 * @param {string} name : cardgame's name
 * @param {string} language : cardgame's language
 * @param {callback} callback : function called with a boolean to send the response
 */
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
};

/**
 * Remove a cardgame from the database
 *
 * @param {string} name : cardgame's name
 * @param {string} language : cardgame's language
 * @param {callback} callback : function use to throw errors
 */
exports.removeCardGame = function(name, language, callback){
    var sql = 'DELETE FROM ' + keys.CARD_GAME_TABLE +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    var values = [name, language];
    state.pool.query(sql, values, function(err){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Add a new cardgame in the database (cardgame must not already exist)
 *
 * @param {string} name : cardgame's name
 * @param {string} language : cardgame's language
 * @param {callback} callback : function use to throw errors and return cardgame id
 */
exports.addCardGame = function(name, language, callback){
    var sql = 'INSERT INTO ' + keys.CARD_GAME_TABLE +
              ' (' + keys.CGT_KEY_NAME + ', ' + keys.CGT_KEY_LANGUAGE + ')' +
              ' VALUES (? , ?);';
    var values = [name, language];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Add a new player in the database
 *
 * @param {string} pseudo : pseudo of the new player to add
 * @param {string} email : email of the new player to add
 * @param {string} password : password of the new player to add
 * @param {callback} callback : function called when the player has been added
 */
exports.registerUser = function(pseudo, email, password, callback){
    var sql = 'INSERT INTO ' + keys.USER_TABLE +
              ' (' + keys.UT_KEY_PSEUDO + ', ' + keys.UT_KEY_PASSWORD + ', ' + keys.UT_KEY_EMAIL + ')' +
              ' VALUES (?, ?, ?);';
    var values = [pseudo, password, email];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Check if a user exists in the database
 *
 * @param {string} user : pseudo of the user that we search in the database
 * @param {callback} callback : function called to send the answer of the research
 */
exports.userExists = function(user, callback){
    var sql = 'SELECT *' +
              ' FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    console.log(sql);
    var value = [user];
    state.pool.query(sql, value, function(err, result){
        console.log(result);
        if(err) callback(false);
        else callback(result.length > 0);
    });
};

/**
 * Check if a user is currently connected
 *
 * @param {string} user : pseudo of the user for which we want to know if he's connected or not
 * @param {callback} callback : function called to send the answer of the research
 */
exports.isConnected = function(user, callback){
    var sql = 'SELECT ' + keys.UT_CONNECT +
              ' FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    console.log(sql);
    var value = [user];
    state.pool.query(sql, value, function(err, result){
        console.log(result);
        if(err) callback(false);
        else callback(result[0][keys.UT_CONNECT] == '1');
    });
};

/**
 * Retrieves the password of the given user
 *
 * @param {string} pseudo : pseudo of the player for which we want to retrieve the password
 * @param {callback} callback : function called to return the password
 */
exports.getPassword = function(pseudo, callback){
    var sql = 'SELECT ' + keys.UT_KEY_PASSWORD +
              ' FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    console.log(sql);
    var value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result[0][keys.UT_KEY_PASSWORD]);
    });
};

/**
 * Retrieves the email address of the given user
 *
 * @param {string} pseudo : pseudo of the player for which we want to retrieve the email
 * @param {callback} callback : function called to return the email
 */
exports.getEmail = function(pseudo, callback){
    let sql = 'SELECT ' + keys.UT_KEY_EMAIL +
        ' FROM ' + keys.USER_TABLE +
        ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    let value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result[0][keys.UT_KEY_EMAIL]);
    });
};

/**
 * Function used to connect a player (we move his status flag to 1)
 *
 * @param {string} pseudo : pseudo of the player that we want to be connected
 * @param {callback} callback : function used to return errors
 */
exports.connectUser = function(pseudo, callback){
    var sql = 'UPDATE ' + keys.USER_TABLE +
              ' SET ' + keys.UT_CONNECT + ' = 1' +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    var value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Function used to disconnect a player (we move his status flag to 0)
 *
 * @param {string} pseudo : pseudo of the player that we want to disconnect
 * @param {callback} callback : function used to return errors
 */
exports.disconnectUser = function(pseudo, callback){
    var sql = 'UPDATE ' + keys.USER_TABLE +
              ' SET ' + keys.UT_CONNECT + ' = 0' +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    var value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Record a new party in the historic of parties
 *
 * @param {string} server : server's name of the party
 * @param {string} animator : name of the party's animator
 * (contains the string "no animator" if there has not had an animator in this party)
 * @param {Date} date : date at which the party has been played
 * @param {callback} callback : function used to return the id of the party
 */
exports.recordNewParty = function(server, animator, date, callback){
    var sql = 'INSERT INTO ' + keys.PARTY_TABLE +
              ' (' + keys.PT_KEY_SERVER + ', ' + keys.PT_KEY_ANIMATOR + ', ' + keys.PT_KEY_DATE + ')' +
              ' VALUES (?, ?, ?);';
    var values = [server, animator, date];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result.insertId);
    });
};

/**
 * Add a new player in a recording party
 *
 * @param {string} pseudo : pseudo of the player to add
 * @param {integer} party : party'id in which we want to add the player
 * @param {string} question : player's question during this party
 * @param {callback} callback : function used to return errors
 */
exports.linkPlayerAndParty = function(pseudo, party, question, callback){
    var sql = 'INSERT INTO ' + keys.HAS_PLAYED_IN_TABLE +
              ' (' + keys.HPT_KEY_PSEUDO + ', ' + keys.HPT_KEY_PARTY + ', ' + keys.HPT_KEY_QUESTION + ')' +
              ' VALUES (?, ?, ?);';
    var values = [pseudo, party, question];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Record a player's production in the historic of the party
 *
 * @param {string} pseudo : player's pseudo for which we want recorded the production
 * @param {integer} party : party's id in which player has played
 * @param {blob} production : name of the player's production file on the server
 * @param {callback} callback : function used to return errors
 */
exports.recordPlayerProduction = function(pseudo, party, production, callback){
    var sql = 'UPDATE ' + keys.HAS_PLAYED_IN_TABLE +
              ' SET ' + keys.HPT_KEY_PRODUCTION + ' = ?' +
              ' WHERE ' + keys.HPT_KEY_PSEUDO + ' = ?' +
              ' AND ' + keys.HPT_KEY_PARTY + ' = ?;';
    var values = [production, pseudo, party];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
};

exports.getHistoricEntries = function(pseudo, callback){
    var sql = 'SELECT ' + keys.PT_KEY_SERVER +
              ', ' + keys.PT_KEY_ANIMATOR +
              ', DATE_FORMAT(' + keys.PT_KEY_DATE + ', "%Y-%m-%d %k:%i:%s") AS ' + keys.PT_KEY_DATE +
              ', ' + keys.HPT_KEY_QUESTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    var value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

exports.getPlayersInParty = function(party, date, callback){
    var sql = 'SELECT ' + keys.HPT_KEY_PSEUDO +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.PT_KEY_SERVER + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?;';
    var values = [party, date];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

exports.getProduction = function(pseudo, party, date, callback){
    var sql = 'SELECT ' + keys.HPT_KEY_PRODUCTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.PT_KEY_SERVER + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?' +
              ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    var values = [party, date, pseudo];
    state.pool.query(sql, values, function(err, result){
        console.log(result);
        if(err) callback(err);
        else callback(null, result[0][keys.HPT_KEY_PRODUCTION]);
    });
};

exports.getPlayerPartyDetails = function(pseudo, party, date, callback){
    var sql = 'SELECT ' + keys.HPT_KEY_PRODUCTION +
              ', ' + keys.HPT_KEY_QUESTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.PT_KEY_SERVER + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?' +
              ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
              var values = [party, date, pseudo];
    state.pool.query(sql, values, function(err, result){
        console.log(result);
        if(err) callback(err);
        else callback(null, result);
    });
};
