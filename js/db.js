const mysql = require('mysql');
const keys = require('./dbConstants');
const logger = require('./../js/logger.js');
const CONFIG = require('./../config.json');
const crypto = require('crypto');
const md5 = require('md5');

const PRODUCTION_DB = 'conpaV2'; // name of the production database
const TEST_DB = 'conpaUnitTests'; // name of the test database

exports.MODE_TEST = 'mode_test';
exports.MODE_PRODUCTION = 'mode_production';

var state = {
    pool: null, // connection instance to mysql database
    mode: null, // selected database
};

const TOKEN_EXPIRATION_DELAY = CONFIG.tokenDelay;
const TOKEN_SALT = CONFIG.tokenSalt;

/**
 * Creates a connection instance to the database and store it into state record
 *
 * @param {string} mode : allows user to choose between a production or test database
 * @param {function} done : nodejs function called when the work is done
 */
exports.connect = function(mode, done){
    try{
        state.pool = mysql.createPool({
            host: CONFIG.dbHost,
            user: CONFIG.dbUser,
            port: CONFIG.dbPort,
            password: CONFIG.dbPassword,
            database: mode === exports.MODE_PRODUCTION ? PRODUCTION_DB : TEST_DB
        });
        state.mode = mode;
        done(null);
    }catch(err){
        done(err);
    }
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
 * Creates the where clause to select cardgames with the given tags
 *
 * @param {String array} tags : tags used to filtrate the cardgames
 * @return {String} : where clause
 */
function getWhereClauseFromTags(tags){
    let whereClause = ' WHERE ';
    for(let index = 0; index < tags.length; index++){
        if(index == tags.length - 1){
            whereClause += 'id IN ( SELECT ' + keys.HTT_KEY_CARDGAME_ID +
                                  ' FROM ' + keys.HAS_TAGS_TABLE +
                                  ' WHERE ' + keys.HTT_KEY_TAG + ' = "' + tags[index] + '")';
        }else{
            whereClause += 'id IN ( SELECT ' + keys.HTT_KEY_CARDGAME_ID +
                                  ' FROM ' + keys.HAS_TAGS_TABLE +
                                  ' WHERE ' + keys.HTT_KEY_TAG + ' = "' + tags[index] + '") AND ';
        }
    }
    return whereClause;
}

/**
 * Retrieves all card game stored in database
 *
 * @param {callback} callback : function called to process on retrieved data
 */
exports.getCardGamesByTags = function(tags, callback){
    let whereClause = tags.length > 0 ? getWhereClauseFromTags(tags) : '';
    let sql = 'SELECT DISTINCT ' + keys.CGT_KEY_NAME + ' , ' + keys.CGT_KEY_LANGUAGE +
              ' , ' + keys.CGT_KEY_AUTHOR + ', ' + keys.CGT_KEY_DESCRIPTION +
              ' FROM ' + keys.CARD_GAME_TABLE +
              ' LEFT JOIN ' + keys.HAS_TAGS_TABLE +
              ' ON ' + keys.CGT_KEY_ID + ' = ' + keys.HTT_KEY_CARDGAME_ID +
              whereClause + ';';

    state.pool.query(sql, null, function(err, result){
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
    logger.debug(sql);
    logger.debug(values);
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
 * Adds a card into the database
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
 * Adds a family into the database (without logo)
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
 * Adds a family into the database (with logo)
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
 * Checks if a cardgame is already in the database
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
            logger.error(err);
            callback(err);
        }else{
            callback(null, result.length > 0);
        }
    });
};

/**
 * Removes a cardgame from the database
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
 * Removes cardgame's families
 *
 * @param {String} name : cardgame's name
 * @param {String} language : cardgame's language
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.removeCardGameFamilies = function(name, language, callback){
    let sql = 'DELETE cft' +
              ' FROM ' + keys.CARD_FAMILY_TABLE + ' AS ' + ' cft' +
              ' INNER JOIN ' + keys.CARD_GAME_TABLE + ' AS ' + 'cgt' +
              ' ON cft.' + keys.CFT_KEY_CARD_GAME + ' = cgt.' + keys.CGT_KEY_ID +
              ' WHERE cgt.' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    let values = [name, language];
    state.pool.query(sql, values, function(err){
        if(err) callback(err);
        else callback(null);
    });
}

/**
 * Adds a new cardgame in the database (the cardgame mustn't already exist)
 *
 * @param {string} name : cardgame's name
 * @param {string} language : cardgame's language
 * @param {callback} callback : function use to throw errors or return cardgame's id
 */
exports.addCardGame = function(name, language, author, callback){
    let sql = 'INSERT INTO ' + keys.CARD_GAME_TABLE +
              ' (' + keys.CGT_KEY_NAME + ', ' + keys.CGT_KEY_LANGUAGE + ', ' + keys.CGT_KEY_AUTHOR + ')' +
              ' VALUES (?, ?, ?);';
    let values = [name, language, author];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Retrieves all tags in the database
 *
 * @param {callback} callback : function used to return tags
 */
exports.getAllTags = function(callback){
    let sql = 'SELECT *' +
              ' FROM ' + keys.TAGS_TABLE + ';';
    state.pool.query(sql, null, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
}

/**
 * Checks if a tag exists
 *
 * @param {String} tag : tag that we search
 * @param {callback} callback : function used to return the result (a boolean)
 */
exports.existsTag = function(tag, callback){
    let sql = 'SELECT *' +
              ' FROM ' + keys.TAGS_TABLE +
              ' WHERE ' + keys.TT_KEY_TAG + ' = ?';
    let value = [tag];
    state.pool.query(sql, value, function(err, result){
        if(err){
            callback(err);
        }else{
            if(result.length == 0) callback(null, false);
            else callback(null, true);
        }
    });
}

/**
 * Adds a new tag in the database
 *
 * @param {String} tag : tag to add
 * @param {callback} callback : function used to return errors if errors occured
 */
exports.addANewTag = function(tag, callback){
    let sql = 'INSERT INTO ' + keys.TAGS_TABLE +
              '(' + keys.TT_KEY_TAG + ')' +
              ' VALUE(?);';
    let value = [tag];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
}

/**
 * Removes a tag from the database
 *
 * @param {String} tag : tag to be removed
 * @param {callback} callback : function used to return errors if errors occured
 */
exports.removeATag = function(tag, callback){
    let sql = 'DELETE FROM ' + keys.TAGS_TABLE +
              ' WHERE ' + keys.TT_KEY_TAG + ' = ?;';
    let value = [tag];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
}

/**
 * Adds a tag to a cardgame
 *
 * @param {Number} cardgameId : id of the cardgame for which we want to add a tag
 * @param {String} tag : tag to add
 * @param {callback} callback : function used to return errors (if an error occured)
 */
exports.addANewTagToCardgame = function(cardgameId, tag, callback){
    let sql = 'INSERT INTO ' + keys.HAS_TAGS_TABLE +
              '(' + keys.HTT_KEY_CARDGAME_ID + ', ' + keys.HTT_KEY_TAG + ')' +
              ' VALUE(?, ?);';
    let values = [cardgameId, tag];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
}

/**
 * Removes a tag to a cardgame
 *
 * @param {Number} cardgameId : id of the cardgame for which we want to remove a tag
 * @param {String} tag : tag to remove
 * @param {callback} callback : function used to return errors (if an error occured)
 */
exports.removeATagFromCardgame = function(cardgameId, tag, callback){
    let sql = 'DELETE FROM ' + keys.HAS_TAGS_TABLE +
              ' WHERE ' + keys.HTT_KEY_CARDGAME_ID + ' = ?' +
              ' AND ' + keys.HTT_KEY_TAG + ' = ?;';
    let values = [cardgameId, tag];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
}

/**
 * Retrives the tags of a cardgame
 *
 * @param {String} name : cardgame's name
 * @param {String} language : cardgame's language
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.getCardGameTags = function(name, language, callback){
    let sql = 'SELECT ' + keys.HTT_KEY_TAG +
              ' FROM ' + keys.HAS_TAGS_TABLE +
              ' INNER JOIN ' + keys.CARD_GAME_TABLE +
              ' ON ' + keys.CGT_KEY_ID + ' = ' + keys.HTT_KEY_CARDGAME_ID +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    let values = [name, language];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Retrives the cardgame's description
 *
 * @param {String} name : cardgame's name
 * @param {String} language : cardgame's language
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.getCardGameDescription = function(name, language, callback){
    let sql = 'SELECT ' + keys.CGT_KEY_DESCRIPTION +
              ' FROM ' + keys.CARD_GAME_TABLE +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    let values = [name, language];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            if(result.length == 1){
                callback(null, result[0][keys.CGT_KEY_DESCRIPTION]);
            }else{
                callback('error', null);
            }
        }
    });
}

/**
 * Updates the cardgame's description
 *
 * @param {String} name : cardgame's name
 * @param {String} language : cardgame's language
 * @param {String} description : new version of the cardgame's description
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.updateCardgameDescription = function(name, language, description, callback){
    let sql = 'UPDATE ' + keys.CARD_GAME_TABLE +
              ' SET ' + keys.CGT_KEY_DESCRIPTION + ' = ?' +
              ' WHERE ' + keys.CGT_KEY_NAME + ' = ?' +
              ' AND ' + keys.CGT_KEY_LANGUAGE + ' = ?;';
    let values = [description, name, language];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null);
    });
}

/**
 * Adds a new player in the database
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
 * Removes a player from the database
 *
 * @param {String} pseudo : player's pseudo
 * @param {callback} callback : function used to return errors if errors occured
 */
exports.removeUser = function(pseudo, callback){
    let sql = 'DELETE FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    let value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        callback(err);
    });
}

/**
 * Checks if a user exists in the database
 *
 * @param {string} user : pseudo of the user that we search in the database
 * @param {callback} callback : function called to send the answer of the research
 */
exports.userExists = function(user, callback){
    let sql = 'SELECT *' +
              ' FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    logger.debug(sql);
    let value = [user];
    state.pool.query(sql, value, function(err, result){
        logger.debug(result);
        if(err) callback(false);
        else callback(result.length > 0);
    });
};

/**
 * Checks if a user is currently connected
 *
 * @param {string} user : pseudo of the user for which we want to know if he's connected or not
 * @param {callback} callback : function called to send the answer of the research
 */
exports.isConnected = function(user, callback){
    let sql = 'SELECT ' + keys.UT_CONNECT +
              ' FROM ' + keys.USER_TABLE +
              ' WHERE ' + keys.UT_KEY_PSEUDO + ' = ?;';
    logger.debug(sql);
    let value = [user];
    state.pool.query(sql, value, function(err, result){
        logger.debug(user + " is connected ? : " + JSON.stringify(result));
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
    logger.debug(sql);
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
    logger.debug(sql);
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
        if(err){
            callback(err);
        } else if (result && result[0]) {
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
            logger.error(err);
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
 * Records a new game in the historic
 *
 * @param {string} gameName : game's name
 * @param {string} animator : name of the party's animator
 * (contains the string "no animator" if there has not had an animator in this party)
 * @param {callback} callback : function used to return the id of the party
 */
exports.recordNewGame = function(gameName, animator, callback){
    let sql = 'INSERT INTO ' + keys.PARTY_TABLE +
              ' (' + keys.PT_KEY_NAME + ', ' + keys.PT_KEY_ANIMATOR + ', ' + keys.PT_KEY_DATE + ')' +
              ' VALUES (?, ?, NOW());';
    let values = [gameName, animator];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result.insertId);
    });
};

/**
 * Removes a game's historic
 *
 * @param {String} gameName : game's name in the historic
 * @param {String} gameDate : date at which game has been played
 * @param {callback} callback : function used to return errors if errors occured
 */
exports.removeGameRecord = function(gameName, gameDate, callback){
    let sql = 'DELETE FROM ' + keys.PARTY_TABLE +
              ' WHERE  ' + keys.PT_KEY_NAME + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?;';
    let values = [gameName, gameDate];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            callback(null);
        }
    });
};

/**
 * Add a new player in a recording party
 *
 * @param {string} pseudo : pseudo of the player to add
 * @param {integer} gameID : game's id in which we want to add the player
 * @param {string} question : player's question during this party
 * @param {callback} callback : function used to return errors
 */
exports.linkPlayerAndGame = function(pseudo, gameID, question, callback){
    let sql = 'INSERT INTO ' + keys.HAS_PLAYED_IN_TABLE +
              ' (' + keys.HPT_KEY_PSEUDO + ', ' + keys.HPT_KEY_PARTY + ', ' + keys.HPT_KEY_QUESTION + ')' +
              ' VALUES (?, ?, ?);';
    let values = [pseudo, gameID, question];
    state.pool.query(sql, values, function(err){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Retrives player's games' historic
 * We don't retrieve games' historic for which production's id is null because
 * it's means that the player has removed these.
 * The we don't removed the rows to keep some information for players who have
 * played in the same game
 *
 * @param {String} pseudo : player's pseudo
 * @param {callback} callback : function used to return the result or errors if
 *                              errors occured
 */
exports.getHistoricEntries = function(pseudo, callback){
    let sql = 'SELECT ' + keys.PT_KEY_NAME +
              ', ' + keys.PT_KEY_ANIMATOR +
              ', DATE_FORMAT(' + keys.PT_KEY_DATE + ', "%Y-%m-%d %k:%i:%s") AS ' + keys.PT_KEY_DATE +
              ', ' + keys.HPT_KEY_QUESTION +
              ', ' + keys.PT_KEY_ID +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.HPT_KEY_PSEUDO + ' = ?' +
              ' AND ' + keys.HPT_KEY_PRODUCTION + ' IS NOT NULL;';
    let value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * The same function as getHistoricEntries except that all games' historic are
 * retrieved even if the production's id is null
 *
 * @param {String} pseudo : player's pseudo
 * @param {callback} callback : function used to return the result or errors if
 *                              errors occured
 */
exports.getGamesRecord = function(pseudo, callback){
    let sql = 'SELECT ' + keys.PT_KEY_NAME +
              ', ' + keys.PT_KEY_ANIMATOR +
              ', DATE_FORMAT(' + keys.PT_KEY_DATE + ', "%Y-%m-%d %k:%i:%s") AS ' + keys.PT_KEY_DATE +
              ', ' + keys.HPT_KEY_QUESTION +
              ', ' + keys.PT_KEY_ID +
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

/**
 * Retrives the list of the players who have played in a game
 *
 * @param {String} gameName : game's name
 * @param {String} gameDate : date at which game has been played
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.getPlayersInGame = function(gameName, gameDate, callback){
    let sql = 'SELECT ' + keys.HPT_KEY_PSEUDO +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.HPT_KEY_PARTY + ' = ' + keys.PT_KEY_ID +
              ' WHERE ' + keys.PT_KEY_NAME + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?;';
    let values = [gameName, gameDate];
    state.pool.query(sql, values, function(err, result){
        if(err) callback(err);
        else callback(null, result);
    });
};

/**
 * Adds a new production in the database
 *
 * @param {String} production : production's data
 * @param {String} legend : data of the production's legend
 * @param {callback} callback : function used to return the production's id or errors
 *                              (if an error occured)
 */
exports.addNewProduction = function(production, legend, callback){
    let sql = 'INSERT INTO ' + keys.PRODUCTION_TABLE +
              ' (' + keys.PRODT_KEY_PRODUCTION + ', ' + keys.PRODT_KEY_LEGEND + ')' +
              ' VALUE(?, ?);';
    let values = [production, legend];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            logger.debug(result);
            callback(null, result.insertId);
        }
    });
};

/**
 * Removes a player's production
 *
 * @param {string} prodID : the id of production to remove
 * @param {callback} callback :  function used to return errors
 */
exports.removeProduction = function(prodID, callback){
    let sql = 'DELETE FROM ' + keys.PRODUCTION_TABLE +
              ' WHERE ' + keys.PRODT_KEY_ID + ' = ?;';
    let value = [prodID];
    state.pool.query(sql, value, function(err, result){
        if(err){
            callback(err);
        }else{
            logger.debug(result);
            callback(null);
        }
    });
};

/**
 * Updates a production
 *
 * @param {String} prodID : id of the production to update
 * @param {String} production : production's data
 * @param {String} legend : data of the production's legend
 * @param {callback} callback : function used to return errors (if an error occured)
 */
exports.updateProduction = function(prodID, production, legend, callback){
    let sql = 'UPDATE ' + keys.PRODUCTION_TABLE +
              ' SET ' + keys.PRODT_KEY_PRODUCTION + ' = ?' +
              ', ' + keys.PRODT_KEY_LEGEND + ' = ?' +
              ' WHERE ' + keys.PRODT_KEY_ID + ' = ?;';
    let values = [production, legend, prodID];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            callback(null);
        }
    });
}

/**
 * Retrieves production's data (include legend)
 *
 * @param {Number} prodID : production's id
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.getProduction = function(prodID, callback){
    let sql = 'SELECT ' + keys.PRODT_KEY_PRODUCTION +
              ', ' + keys.PRODT_KEY_LEGEND +
              ' FROM ' + keys.PRODUCTION_TABLE +
              ' WHERE ' + keys.PRODT_KEY_ID + ' = ?;';
    let value = [prodID];
    state.pool.query(sql, value, function(err, result){
        if(err){
            callback(err);
        }else{
            if(result.length > 0){
                callback(null, result[0][keys.PRODT_KEY_PRODUCTION], result[0][keys.PRODT_KEY_LEGEND]);
            }else{
                callback(null, null, null);
            }
        }
    });
};

/**
 * Record a player's production in the historic of the party
 *
 * @param {string} pseudo : player's pseudo for which we want recorded the production
 * @param {number} gameID : game's id in which player has played
 * @param {blob} production : name of the player's production file on the server
 * @param {callback} callback : function used to return errors
 */
exports.recordPlayerProductionWithGameId = function(pseudo, gameID, prodID, callback){
    let sql = 'UPDATE ' + keys.HAS_PLAYED_IN_TABLE +
              ' SET ' + keys.HPT_KEY_PRODUCTION + ' = ?' +
              ' WHERE ' + keys.HPT_KEY_PARTY + ' = ?' +
              ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    let values = [prodID, gameID, pseudo];
    state.pool.query(sql, values, function(err){
        if(err) callback(err);
        else callback(null);
    });
};

/**
 * Retrieves the id of a player's production in the historic table
 *
 * @param {String} pseudo : player's pseudo
 * @param {String} gameName : game's name during which player has created the production
 * @param {String} gameDate : date at which game has been played
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.getProductionIDFromPlayerHistoric = function(pseudo, gameName, gameDate, callback){
    let sql = 'SELECT ' + keys.HPT_KEY_PRODUCTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.PT_KEY_ID + ' = ' + keys.HPT_KEY_PARTY +
              ' WHERE ' + keys.PT_KEY_NAME + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?' +
              ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    let values = [gameName, gameDate, pseudo];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            logger.debug(result);
            callback(null, result.length > 0 ? result[0][keys.HPT_KEY_PRODUCTION] : null);
        }
    });
};

/**
 * Retrieves the id of a player's production in the historic table
 *
 * @param {String} pseudo : player's pseudo
 * @param {Number} gameID : game's id during which player has created the production
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.getProductionIDFromPlayerHistoricWithGameId = function(pseudo, gameID, callback){
    let sql = 'SELECT ' + keys.HPT_KEY_PRODUCTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.PT_KEY_ID + ' = ' + keys.HPT_KEY_PARTY +
              ' WHERE ' + keys.PT_KEY_ID + ' = ?' +
              ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    let values = [gameID, pseudo];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            logger.debug(result);
            callback(null, result.length > 0 ? result[0][keys.HPT_KEY_PRODUCTION] : null);
        }
    });
};

/**
 * Retrives the question and the production's id of a player in a game's historic
 *
 * @param {String} pseudo : player's pseudo for which we want to retrieve the
 *                          question and the production's id
 * @param {String} gameName : game's name in the historic
 * @param {String} gameDate : date at which the game has been played
 * @param {callback} callback : function used to return the question and the
 *                              production's id or errors if errors occured;
 */
exports.getQuestionAndProduction = function(pseudo, gameName, gameDate, callback){
    let sql = 'SELECT ' + keys.HPT_KEY_PRODUCTION +
              ', ' + keys.HPT_KEY_QUESTION +
              ' FROM ' + keys.HAS_PLAYED_IN_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.PT_KEY_ID + ' = ' + keys.HPT_KEY_PARTY +
              ' WHERE ' + keys.PT_KEY_NAME + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?' +
              ' AND ' + keys.HPT_KEY_PSEUDO + ' = ?;';
    let values = [gameName, gameDate, pseudo];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            logger.debug(result);
            callback(null, result[0][keys.HPT_KEY_PRODUCTION], result[0][keys.HPT_KEY_QUESTION]);
        }
    });
};

/**
 * Adds a new production in the archives table
 *
 * @param {String} pseudo : production's owner
 * @param {Number} gameID : id of the game during which the original production
 *                           has been created
 * @param {Number} prodID : id of production to archive
 * @param {callback} callback : function used to return errors
 */
exports.archivePlayerProduction = function(pseudo, gameID, prodID, callback){
    let sql = 'INSERT INTO ' + keys.ARCHIVE_TABLE +
              ' (' + keys.AT_KEY_PARTY + ', ' + keys.AT_KEY_PRODUCTION +
              ', ' + keys.AT_KEY_DATE + ', ' + keys.AT_KEY_PSEUDO + ')' +
              ' VALUE(?, ?, NOW(), ?);';
    let values = [gameID, prodID, pseudo];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            logger.debug(result);
            callback(null);
        }
    });
};

/**
 * Retrieves games' archive
 *
 * @param {String} pseudo : player's pseudo for who we want to retrieve the games' archive
 * @param {callback} callback : function used to return the result or errors (if errors occured)
 */
exports.getArchiveEntries = function(pseudo, callback){
    let pt_prefix = keys.PARTY_TABLE + '.';
    let hpt_prefix = keys.HAS_PLAYED_IN_TABLE + '.';
    let at_prefix = keys.ARCHIVE_TABLE + '.';
    let sql = 'SELECT DISTINCT ' + hpt_prefix + keys.HPT_KEY_QUESTION +
              ', ' + pt_prefix + keys.PT_KEY_NAME +
              ', ' + pt_prefix + keys.PT_KEY_ANIMATOR +
              ', ' + pt_prefix + keys.PT_KEY_ID +
              ', ' + at_prefix + keys.AT_KEY_PSEUDO +
              ', DATE_FORMAT(' + pt_prefix + keys.PT_KEY_DATE + ', "%Y-%m-%d %k:%i:%s") AS ' + keys.PT_KEY_DATE +
              ' FROM ' + keys.ARCHIVE_TABLE +
              ' INNER JOIN ' + keys.HAS_PLAYED_IN_TABLE +
              ' ON ' + at_prefix + keys.AT_KEY_PARTY + ' = ' + hpt_prefix + keys.HPT_KEY_PARTY +
              ' AND ' + at_prefix + keys.AT_KEY_PSEUDO + ' = ' + hpt_prefix + keys.HPT_KEY_PSEUDO +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + hpt_prefix + keys.HPT_KEY_PARTY + ' = ' + pt_prefix + keys.PT_KEY_ID +
              ' WHERE ' + at_prefix + keys.AT_KEY_PSEUDO + ' = ?;';
    let value = [pseudo];
    state.pool.query(sql, value, function(err, result){
        if(err){
            callback(err);
        }else{
            callback(null, result);
        }
    });
};

/**
 * Retrieves productions from the archives table (a production is identified by
 * it insertion date)
 *
 * @param {String} pseudo : player's pseudo
 * @param {String} gameName : name of the game for which we want to retrieve
 *                             the archived productions
 * @param {String} gameDate : date at which game has been played
 * @param {callback} callback : function used to return the result or errors (if an error occured)
 */
exports.getProductionsFromArchive = function(pseudo, gameName, gameDate, callback){
    let sql = 'SELECT DATE_FORMAT(' + keys.AT_KEY_DATE + ', "%Y-%m-%d %k:%i:%s") AS ' + keys.AT_KEY_DATE +
              ' FROM ' + keys.ARCHIVE_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + keys.PT_KEY_ID + ' = ' + keys.AT_KEY_PARTY +
              ' WHERE ' + keys.PT_KEY_NAME + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?' +
              ' AND ' + keys.AT_KEY_PSEUDO + ' = ?;';
    let values = [gameName, gameDate, pseudo];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            logger.debug(result);
            callback(null, result);
        }
    });
};

/**
 * Retrives the id of a production thanks to his insertion's date
 * In an archive, productions are identified by their insertions dates
 *
 * @param {String} pseudo : production's owner
 * @param {String} insertDate : production's insertion date
 * @param {callback} callback : function used to return the production's id or errors (if errors occured)
 */
exports.getProductionIDFromArchive = function(pseudo, insertDate, callback){
    let sql = 'SELECT ' + keys.AT_KEY_PRODUCTION +
              ' FROM ' + keys.ARCHIVE_TABLE +
              ' WHERE ' + keys.AT_KEY_PSEUDO + ' = ?' +
              ' AND DATE_FORMAT(' + keys.AT_KEY_DATE + ', "%Y-%m-%d %k:%i:%s") = ?;';
    let values = [pseudo, insertDate];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            callback(null, result.length > 0 ? result[0][keys.AT_KEY_PRODUCTION] : null);
        }
    });
}

/**
 * Removes all productions in a game's archive
 *
 * @param {String} gameName : game's name for which we want to remove the archive
 * @param {String} gameDate : date at which the game has been played
 * @param {String} pseudo : archive's owner
 * @param {callback} callback : function used to return errors (if errors occured)
 */
exports.removeProductionsFromArchive = function(gameName, gameDate, pseudo, callback){
    let pt_prefix = keys.PARTY_TABLE + '.';
    let prodt_prefix = keys.PRODUCTION_TABLE + '.';
    let sql = 'DELETE FROM ' + keys.PRODUCTION_TABLE +
              ' WHERE ' + prodt_prefix + keys.PRODT_KEY_ID + ' IN' +
              ' (SELECT ' + keys.AT_KEY_PRODUCTION +
              ' FROM ' + keys.ARCHIVE_TABLE +
              ' INNER JOIN ' + keys.PARTY_TABLE +
              ' ON ' + pt_prefix + keys.PT_KEY_ID + ' = ' + keys.AT_KEY_PARTY +
              ' WHERE ' + keys.PT_KEY_NAME + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?' +
              ' AND ' + keys.AT_KEY_PSEUDO + ' = ?);';
    let values = [gameName, gameDate, pseudo];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            callback(null);
        }
    });
}

/**
 * @param {String} gameName : game server's name
 * @param {String} gameDate : date at which game has been played ("%Y-%m-%d %k:%i:%s")
 * @return {Number} : game server's id
 */
exports.getGameID = function(gameName, gameDate, callback){
    let sql = 'SELECT ' + keys.PT_KEY_ID +
              ' FROM ' + keys.PARTY_TABLE +
              ' WHERE ' + keys.PT_KEY_NAME + ' = ?' +
              ' AND ' + keys.PT_KEY_DATE + ' = ?;';
    let values = [gameName, gameDate];
    state.pool.query(sql, values, function(err, result){
        if(err){
            callback(err);
        }else{
            callback(null, result.length > 0 ? result[0][keys.PT_KEY_ID] : null);
        }
    });
}

/**
 * Convert a js Date to a mysql DATETIME
 *
 * @param {Date} date : the date we want to convert
 * @return {string}
 */
function toMysqlDatetime(date){
    return date.toISOString().substring(0, 19).replace('T', ' '); // convert js Date to mysql DATETIME
}
exports.toMysqlDatetime =toMysqlDatetime;
