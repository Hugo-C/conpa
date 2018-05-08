const mysql = require('mysql');
const keys = require('./dbConstants');
const crypto = require('crypto');
const md5 = require('md5');

const PRODUCTION_DB = 'conpaV2'; // name of the production database
const TEST_DB = 'conpaV2'; // name of the test database

exports.MODE_TEST = 'mode_test';
exports.MODE_PRODUCTION = 'mode_production';

var state = {
    pool: null, // connection instance to mysql database
    mode: null, // selected database
};

const TOKEN_EXPIRATION_DELAY = 1;
const TOKEN_SALT = "conpa174567";

/**
 * Creates a connection instance to the database and store it into state record
 *
 * @param {string} mode : allows user to choose between a production or test database
 * @param {function} done : nodejs function called when the work is done
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
 * Gives access to the connection instance created by the connect function
 *
 * @return {mysql connection} : connection instance to mysql database
 */
exports.get = function(){
    return state.pool;
};

exports.startTransaction = function(){
    let sql = "SET autocommit=0;";
    state.pool.query(sql);
};

exports.rollback = function(){
    let sql = "ROLLBACK;";
    state.pool.query(sql);
};

exports.commit = function(){
    let sql = "COMMIT; SET autocommit=1;";
    state.pool.query(sql);
};

/**
 * Retrieves family cards
 *
 * @param {unsigned integer} familyId : id of the family for which we want to retrieve cards
 * @param {callback} callback : function called to process on retrieved data
 */
exports.getFamilyCards = function(familyId, callback){
    let sql = 'SELECT ' + keys.CT_KEY_CONTENT + ', ' + keys.CT_KEY_INFORMATION +
              ' FROM ' + keys.CARD_TABLE +
              ' WHERE ' + keys.CT_KEY_CARD_FAMILY + ' = ?' +
              ' ORDER BY ' + keys.CT_KEY_CONTENT + ';';
    let value = [familyId];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Retrieves card game families and associated logos from a card game id
 *
 * @param {unsigned integer} cardGameId : id of the card game for which we want to retrieve families and associated logos
 * @param {callback} callback : function called to on process retrieved data
 */
exports.getFamilies = function(cardGameId, callback){
    let sql = 'SELECT ' + keys.CARD_FAMILY_TABLE + '.' + keys.CFT_KEY_ID +
              ', ' + keys.CFT_KEY_NAME +
              ', ' + keys.CFT_KEY_LOGO +
              ' FROM ' + keys.CARD_FAMILY_TABLE +
              ' WHERE ' + keys.CFT_KEY_CARD_GAME + ' = ?;';
    let value = [cardGameId];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Retrieves card game informations (id, name and language)
 *
 * @param {string} cardGame : name of the card game we want to retrieve
 * @param {string} language : language of the card game we want to retrieve
 * @param {callback} callback : function called to process on retrieved data
 */
exports.getCardGame = function(cardGame, language, callback){
    let sql = 'SELECT * FROM ' + keys.CARD_GAME_TABLE +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    let values = [cardGame, language];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Retrieves all card game stored in database
 *
 * @param {callback} callback : function called to process on retrieved data
 */
exports.getCardGames = function(callback){
    let sql = 'SELECT * FROM ' + keys.CARD_GAME_TABLE + ';';
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
    let sql = 'INSERT INTO ' + keys.CARD_TABLE +
              ' (' + keys.CT_KEY_CONTENT + ', ' + keys.CT_KEY_INFORMATION + ', ' + keys.CT_KEY_CARD_FAMILY + ')' +
              ' VALUES (?, ?, ?);';
    let values = [content, description == '' ? 'NULL' : description, familyId];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Add a family into the database (without logo)
 *
 * @param {string} name : family's name
 * @param {integer} cardGameId : id of the family's card game
 * @param {callback} callback : function called to inform of the success of the operation
 */
exports.addCardFamilyWithoutLogo = function(name, cardGameId, callback){
    let sql = 'INSERT INTO ' + keys.CARD_FAMILY_TABLE +
              ' (' + keys.CFT_KEY_NAME + ', ' + keys.CFT_KEY_CARD_GAME + ')' +
              ' VALUES (?, ?);';
    let values = [name, cardGameId];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Add a family into the database (with logo)
 *
 * @param {string} name : family's name
 * @param {string} logo : name of the logo image
 * @param {integer} cardGameId : id of the family's card game
 * @param {callback} callback : function called to inform of the success of the operation
 */
exports.addCardFamilyWithLogo = function(name, logo, cardGameId, callback){
    let sql = 'INSERT INTO ' + keys.CARD_FAMILY_TABLE +
              ' (' + keys.CFT_KEY_NAME + ', ' + keys.CFT_KEY_LOGO + ', ' + keys.CFT_KEY_CARD_GAME + ')' +
              ' VALUES (?, ?, ?);';
    let values = [name, logo, cardGameId];
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
 * @param {callback} callback : function called with a boolean to send the reply
 */
exports.cardGameExists = function(name, language, callback){
    let sql = 'SELECT * FROM ' + keys.CARD_GAME_TABLE +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    let values = [name, language];
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
    let sql = 'DELETE FROM ' + keys.CARD_GAME_TABLE +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    let values = [name, language];
    state.pool.query(sql, values, function(err){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Add a new cardgame in the database (the cardgame mustn't already exist)
 *
 * @param {string} name : cardgame's name
 * @param {string} language : cardgame's language
 * @param {callback} callback : function use to throw errors and return cardgame id
 */
exports.addCardGame = function(name, language, callback){
    let sql = 'INSERT INTO ' + keys.CARD_GAME_TABLE +
              ' (' + keys.CGT_KEY_NAME + ', ' + keys.CGT_KEY_LANGUAGE + ')' +
              ' VALUES (? , ?);';
    let values = [name, language];
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
    let sql = 'INSERT INTO ' + keys.USER_TABLE +
              ' (' + keys.UT_KEY_PSEUDO + ', ' + keys.UT_KEY_PASSWORD + ', ' + keys.UT_KEY_EMAIL + ')' +
              ' VALUES (?, ?, ?);';
    let values = [pseudo, password, email];
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
    let sql = 'SELECT *' +
              ' FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    console.log(sql);
    let value = [user];
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
    let sql = 'SELECT ' + keys.UT_CONNECT +
              ' FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    console.log(sql);
    let value = [user];
    state.pool.query(sql, value, function(err, result){
        console.log(result);
        if(err) callback(false);
        else callback(result[0][keys.UT_CONNECT] === '1');
    });
};

/**
 * Retrieves the password of the given user
 *
 * @param {string} pseudo : pseudo of the player for which we want to retrieve the password
 * @param {callback} callback : function called to return the password
 */
exports.getPassword = function(pseudo, callback){
    let sql = 'SELECT ' + keys.UT_KEY_PASSWORD +
              ' FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    console.log(sql);
    let value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err){
            callback(err);
        } else if(result && result[0]) {
            callback(null, result[0][keys.UT_KEY_PASSWORD]);
        } else {
            callback(null, null);
        }
    });
};


/**
 * Set the password of the given user
 *
 * @param {string} pseudo : pseudo of the player for which we want to retrieve the password
 * @param {string} password : the new password, using md5 encryption
 * @param {callback} callback : function called if the password is correctly set
 */
exports.setPassword = function(pseudo, password, callback){
    let sql = 'UPDATE ' + keys.USER_TABLE +
        ' SET ' + keys.UT_KEY_PASSWORD + ' = ?' +
        ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    console.log(sql);
    let value = [password, pseudo];
    state.pool.query(sql, value, function(err){
        if(err) callback(err);
        else callback(null, pseudo);
    });
};

/**
 * Retrieves the user's name from his email address
 *
 * @param {string} email : email address of the player for which we want to retrieve the username
 * @param {callback} callback : function called to return the email
 */
exports.getUser = function(email, callback){
    let sql = 'SELECT ' + keys.UT_KEY_PSEUDO +
        ' FROM ' + keys.USER_TABLE +
        ' WHERE ' + keys.UT_KEY_EMAIL + ' = ?;';
    let value = [email];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else if (result && result[0]) {
            callback(null, result[0][keys.UT_KEY_PSEUDO]);
        } else {
            callback(null, null);  // no result
        }
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
        else if (result && result[0]) {
            callback(null, result[0][keys.UT_KEY_EMAIL]);
        } else {
            callback(null, null);  // no result
        }
    });
};

/**
 * Set a token for the given user, allowing him to change his password
 *
 * @param {string} pseudo : pseudo of the player for which we want to set a new token
 * @param {string} token : the token to set
 * @param {callback} callback : function called to return the pseudo and the hashed token
 */
let setToken = function(pseudo, token, callback){
    // create a new date coresponding to the current day and add the expiration delay
    let expirationDate = new Date();
    if(token !== null)
        expirationDate.setDate(expirationDate.getDate() + TOKEN_EXPIRATION_DELAY);
    expirationDate = toMysqlDatetime(expirationDate);

    let sql = 'UPDATE ' + keys.USER_TABLE +
        ' SET ' + keys.UT_KEY_TOKEN + ' = ?, ' + keys.UT_KEY_TOKEN_EXPIRATION + ' = ?' +
        ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    let value = [md5(token + TOKEN_SALT), expirationDate, pseudo];
    state.pool.query(sql, value, function(err){
        if(err){
            console.log(err);
            callback(pseudo, null);
        } else {
            callback(pseudo, token);
        }
    });
};

/**
 * Generate a new token for the given user, allowing him to change his password
 * then set this token in the database
 *
 * @param {string} pseudo : pseudo of the player for which we want to set a new token
 * @param {callback} callback : function called when the token has been set
 */
exports.generateToken = function(pseudo, callback) {
    let token;
    crypto.randomBytes(32, function (ex, buf) {
        token = buf.toString('hex');
        setToken(pseudo, token, callback);
    });
};

/**
 * Clear the token of the given player
 *
 * @param {string} pseudo : pseudo of the player for which we want to clear the token
 * @param {callback} callback : function called when the token has been set
 */
exports.clearToken = function(pseudo, callback) {
    let sql = 'UPDATE ' + keys.USER_TABLE +
        ' SET ' + keys.UT_KEY_TOKEN + ' = NULL, ' + keys.UT_KEY_TOKEN_EXPIRATION + ' = NULL' +
        ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    let value = [pseudo];
    state.pool.query(sql, value, function(err) {
        if(err) callback(err);
        else callback(null, pseudo);
    });
};
/**
 * Check if the token is valid
 *
 * @param {string} token : the token to check
 * @param {callback} callback : function called to return the pseudo and the hashed token
 */
exports.isValidToken = function(token, callback){
    token = md5(token + TOKEN_SALT);
    let sql = 'SELECT ' + keys.UT_KEY_PSEUDO + ', ' + keys.UT_KEY_TOKEN_EXPIRATION +
        ' FROM ' + keys.USER_TABLE +
        ' WHERE ' + keys.UT_KEY_TOKEN + ' = ?;';
    let value = [token];
    state.pool.query(sql, value, function(err, result){
        if(err)callback(err);
        else {
            if(result.length === 0){
                err = new Error("this token is attached to no user");
                callback(err);  // no user have the current token
            } else {
                let expirationDate = new Date(result[0][keys.UT_KEY_TOKEN_EXPIRATION]);
                if(expirationDate.getTime() <= Date.now()){
                    err = new Error("this token has expired, try to submit your email again");
                    callback(err);
                } else {
                    callback(null, result[0][keys.UT_KEY_PSEUDO], expirationDate);
                }
            }
        }
    });
};

/**
 * Function used to connect a player (we switch his status flag to 1)
 *
 * @param {string} pseudo : pseudo of the player that we want to be connected
 * @param {callback} callback : function used to return errors
 */
exports.connectUser = function(pseudo, callback){
    let sql = 'UPDATE ' + keys.USER_TABLE +
              ' SET ' + keys.UT_CONNECT + ' = 1' +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    let value = [pseudo];
    state.pool.query(sql, value, function(err){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Function used to disconnect a player (we switch his status flag to 0)
 *
 * @param {string} pseudo : pseudo of the player we want to disconnect
 * @param {callback} callback : function used to return errors
 */
exports.disconnectUser = function(pseudo, callback){
    let sql = 'UPDATE ' + keys.USER_TABLE +
              ' SET ' + keys.UT_CONNECT + ' = 0' +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    let value = [pseudo];
    state.pool.query(sql, value, function(err){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Record a new party in the historic of parties
 *
 * @param {string} server : server's party name
 * @param {string} animator : name of the party's animator
 * (contains the string "no animator" if there has not had an animator in this party)
 * @param {Date} date : date at which the party has been played
 * @param {callback} callback : function used to return the id of the party
 */
exports.recordNewParty = function(server, animator, date, callback){
    let sql = 'INSERT INTO ' + keys.PARTY_TABLE +
              ' (' + keys.PT_KEY_SERVER + ', ' + keys.PT_KEY_ANIMATOR + ', ' + keys.PT_KEY_DATE + ')' +
              ' VALUES (?, ?, ?);';
    let values = [server, animator, date];
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
    let sql = 'INSERT INTO ' + keys.HAS_PLAYED_IN_TABLE +
              ' (' + keys.HPT_KEY_PSEUDO + ', ' + keys.HPT_KEY_PARTY + ', ' + keys.HPT_KEY_QUESTION + ')' +
              ' VALUES (?, ?, ?);';
    let values = [pseudo, party, question];
    state.pool.query(sql, values, function(err){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Remove an entry in the table 'hasPlayedIn'
 *
 * @param {string} pseudo : pseudo of the player who wants to remove an entry of his historic
 * @param {string} party : name of the party for which concerned by the process
 * @param {date} date : date at which the party was played
 * @param {callback} callback :  function used to return errors
 */
exports.removePlayerPartyHistoric = function(pseudo, party, date, callback){
    let sql = 'SELECT ' + keys.PT_KEY_ID +
              ' FROM ' + keys.PARTY_TABLE +
              ' WHERE ' + keys.PT_KEY_SERVER + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?;';
    let values = [party, date];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else{
            if(result.length === 0) callback(err);
            else{
                let sql = 'DELETE FROM ' + keys.HAS_PLAYED_IN_TABLE +
                      ' WHERE ' + keys.HPT_KEY_PARTY + ' = ?' +
                      ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
                let values = [result[0][keys.PT_KEY_ID], pseudo];
                state.pool.query(sql, values, function(err){
                    if(err) callback(err);
                    else callback(null);
                });
            }
        }
    });
};



/**
 * Record a player's production in the historic of the party
 *
 * @param {string} pseudo : player's pseudo for which we want recorded the production
 * @param {number} party : party's id in which player has played
 * @param {blob} production : name of the player's production file on the server
 * @param {callback} callback : function used to return errors
 */
exports.recordPlayerProductionWithPartyId = function(pseudo, party, production, callback){
    let sql = 'UPDATE ' + keys.HAS_PLAYED_IN_TABLE +
              ' SET ' + keys.HPT_KEY_PRODUCTION + ' = ?' +
              ' WHERE ' + keys.HPT_KEY_PSEUDO + ' = ?' +
              ' AND ' + keys.HPT_KEY_PARTY + ' = ?;';
    let values = [production, pseudo, party];
    state.pool.query(sql, values, function(err){
        if(err) callback(err);
        else callback(null);
    });
};

exports.recordPlayerProduction = function(pseudo, serverName, date, production, callback){
    let sql = 'UPDATE ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' SET ' + keys.HPT_KEY_PRODUCTION + ' = ?' +
              ' WHERE ' + keys.HPT_KEY_PSEUDO + ' = ?' +
              ' AND ' + keys.PT_KEY_SERVER + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?;';
    let values = [production, pseudo, serverName, date];
    state.pool.query(sql, values, function(err){
        console.log(err);
        if(err) callback(err);
        else callback(null);
    });
};

exports.getHistoricEntries = function(pseudo, callback){
    let sql = 'SELECT ' + keys.PT_KEY_SERVER +
              ', ' + keys.PT_KEY_ANIMATOR +
              ', DATE_FORMAT(' + keys.PT_KEY_DATE + ', "%Y-%m-%d %k:%i:%s") AS ' + keys.PT_KEY_DATE +
              ', ' + keys.HPT_KEY_QUESTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    let value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

exports.getPlayersInParty = function(party, date, callback){
    let sql = 'SELECT ' + keys.HPT_KEY_PSEUDO +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.PT_KEY_SERVER + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?;';
    let values = [party, date];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

exports.getProduction = function(pseudo, party, date, callback){
    let sql = 'SELECT ' + keys.HPT_KEY_PRODUCTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.PT_KEY_SERVER + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?' +
              ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    let values = [party, date, pseudo];
    state.pool.query(sql, values, function(err, result){
        console.log(result);
        if(err) callback(err);
        else callback(null, result[0][keys.HPT_KEY_PRODUCTION]);
    });
};

exports.getPlayerPartyDetails = function(pseudo, party, date, callback){
    let sql = 'SELECT ' + keys.HPT_KEY_PRODUCTION +
              ', ' + keys.HPT_KEY_QUESTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.PT_KEY_SERVER + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?' +
              ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    let values = [party, date, pseudo];
    state.pool.query(sql, values, function(err, result){
        console.log(result);
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Convert a js Date to a mysql DATETIME
 * @param {Date} date : the date we want to convert
 * @returns {string}
 */
function toMysqlDatetime(date){
    return date.toISOString().substring(0, 19).replace('T', ' '); // convert js Date to mysql DATETIME
}
exports.toMysqlDatetime =toMysqlDatetime;
