const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer().single('uploadCSV');
const url = require('url');
const querystring = require('querystring');
const path = require('path');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: true});
const logger = require('../js/logger.js');
const db = require('../js/db');
const keys = require('../js/dbConstants');
const exportCSV = require('../js/exportCSV');
const importCSV = require('../js/importCSV');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');

router.get('/', function (req, res) {
    res.render('mainWebSitePage');
});

router.post('/checkConnection', urlencodedParser, function (req, res) {
    if(req.body.username == null){
        res.sendStatus(400);
    }else{
        db.isConnected(req.body.username, function (connected) {
            if (connected) {
                res.send("OK");
                logger.log("silly", req.body.username + " is already connected");
            } else {
                res.send("REJECT");
                logger.log("silly", req.body.username + " has been rejected from the server");
            }
        });
    }
});

/**
 * Retrieves the production's id of a player inside the games historic table
 * @param {String} pseudo : pseudo of the production's owner
 * @param {String} partyName : name of the game during which he has created the production
 * @param {String} partyDate : date at which the game has been played
 * @param requestRes : used to inform the client when an error occurred
 * @param {callback} callback : function used to return the result
 */
function getHistoricProductionID(pseudo, partyName, partyDate, requestRes, callback){
    db.getProductionIDFromPlayerHistoric(pseudo, partyName, partyDate, function(err, prodID){
        if(err){
            logger.debug(err);
            requestRes.send('ERROR');
        }else{
            if(prodID != null){
                callback(prodID);
            }else{
                requestRes.send('ERROR');
            }
        }
    });
}

/**
 * Removes a production with the given id
 * @param {Number} prodID : id of the production to remove
 * @param requestRes : used to inform the client about the operation's result
 */
function removeProduction(prodID, requestRes){
    db.removeProduction(prodID, function(err){
        if(err){
            logger.error(err);
            requestRes.send('ERROR');
        }else{
            requestRes.send('OK');
        }
    });
}

/**
 * Sends the production's data to the client
 * @param {Number} prodID : production's id to retrieve
 * @param {object} dataToSend : dictionnary in which we stored production's and
 *                              legend's data
 * @param requestRes : used to send the data
 */
function sendProduction(prodID, dataToSend, requestRes){
    db.getProduction(prodID, function(err, production, legend){
        if(err){
            logger.error(err);
            requestRes.send('ERROR');
        }else{
            if(production != null && legend != null){
                dataToSend['production'] = production;
                dataToSend['legend'] = legend;
                requestRes.send(dataToSend);
            }else{
                requestRes.send('ERROR');
            }
        }
    });
}

router.post('/deleteArchive', urlencodedParser, function(req, res){
    db.removeProductionsFromArchive(req.body.partyName, req.body.partyDate, req.body.username, function(err){
        if(err){
            res.send('ERROR');
        }else{
            res.send('OK');
        }
    });
});

router.post('/deleteArchivedProduction', urlencodedParser, function(req, res){
    db.getProductionIDFromArchive(req.body.username, req.body.insertDate, function(err, prodID){
        if(err){
            logger.error(err);
            res.send('ERROR');
        }else{
            removeProduction(prodID, res);
        }
    });
});

router.post('/getArchivedProductions', urlencodedParser, function(req, res){
    db.getProductionsFromArchive(req.body.username, req.body.partyName, req.body.partyDate, function(err, result){
        if(err){
            logger.error(err);
            res.send('ERROR');
        }else{
            let productions = [];
            for(let index = 0; index < result.length; index++){
                let data = {
                    'prodDate': result[index][keys.AT_KEY_DATE]
                };
                productions.push(data);
            }
            res.send(productions);
        }
    });
});

router.post('/getHistoric', urlencodedParser, function(req, res){
    db.getHistoricEntries(req.body.username, function(err, result){
        if(err){
            logger.error(err);
            res.send('ERROR');
        }else{
            let historic = []; // used to store historic entries
            for(let entry in result){
                let data = {
                    'name': result[entry][keys.PT_KEY_NAME],
                    'animator': result[entry][keys.PT_KEY_ANIMATOR],
                    'date': result[entry][keys.PT_KEY_DATE],
                    'question': result[entry][keys.HPT_KEY_QUESTION]
                };
                historic.push(data);
            }
            res.send(historic);
        }
    });
});

router.post('/getArchive', urlencodedParser, function(req, res){
    db.getArchiveEntries(req.body.username, function(err, result){
        if(err){
            logger.error(err);
            res.send('ERROR');
        }else{
            let archive = [];
            for(let entry in result){
                let data = {
                    'name': result[entry][keys.PT_KEY_NAME],
                    'animator': result[entry][keys.PT_KEY_ANIMATOR],
                    'date': result[entry][keys.PT_KEY_DATE],
                    'question': result[entry][keys.HPT_KEY_QUESTION]
                };
                archive.push(data);
            }
            res.send(archive);
        }
    });
});

router.post('/removeHistoric', urlencodedParser, function(req, res){
    getHistoricProductionID(req.body.username, req.body.server, req.body.date, res, function(prodID){
        removeProduction(prodID, res);
    });
});

router.post('/getProductionFromArchive', urlencodedParser, function(req, res){
    db.getProductionIDFromArchive(req.body.username, req.body.insertDate, function(err, prodID){
        if(err){
            logger.error(err);
            res.send('ERROR');
        }else{
            if(prodID != null){
                sendProduction(prodID, {}, res);
            }else{
                res.send('ERROR');
            }
        }
    });
});

router.post('/getPlayerProduction', urlencodedParser, function(req, res){
    getHistoricProductionID(req.body.username, req.body.partyName, req.body.partyDate, res, function(prodID){
        sendProduction(prodID, {}, res);
    });
});

router.post('/recordPlayerProduction', urlencodedParser, function(req, res){
    function getActualizedProductionsList(){
        db.getProductionsFromArchive(req.body.username, req.body.partyName, req.body.partyDate, function(err, result){
            if(err){
                logger.error(err);
                res.send('ERROR');
            }else{
                let productions = [];
                for(let index = 0; index < result.length; index++){
                    let data = {
                        'prodDate': result[index][keys.AT_KEY_DATE]
                    };
                    productions.push(data);
                }
                res.send(productions);
            }
        });
    }

    function addArchive(gameID, prodID){
        db.archivePlayerProduction(req.body.username, gameID, prodID, function(err){
            if(err){
                logger.error(err);
                res.send('ERROR');
            }else{
                if(req.body.returnActList === 'true'){
                    getActualizedProductionsList();
                }else{
                    res.send('OK');
                }
            }
        });
    }

    function addProduction(gameID){
        db.addNewProduction(req.body.production, req.body.legend, function(err, prodID){
            if(err){
                logger.error(err);
                res.send('ERROR');
            }else{
                addArchive(gameID, prodID);
            }
        });
    }

    db.getGameID(req.body.partyName, req.body.partyDate, function(err, gameID){
        if(err){
            logger.error(err);
            requestRes.send('ERROR');
        }else{
            if(gameID != null){
                addProduction(gameID);
            }else{
                res.send('ERROR');
            }
        }
    });
});

router.post('/overwriteProduction', urlencodedParser, function(req, res){
    function updateProduction(prodID){
        db.updateProduction(prodID, req.body.production, req.body.legend, function(err){
            if(err){
                logger.error(err);
                res.send('ERROR');
            }else{
                res.send('OK');
            }
        });
    }

    db.getProductionIDFromArchive(req.body.username, req.body.insertDate, function(err, prodID){
        if(err){
            logger.error(err);
            res.send('ERROR');
        }else{
            if(prodID != null){
                updateProduction(prodID);
            }else{
                res.send('ERROR');
            }
        }
    });
});

router.post('/getDetails', urlencodedParser, function(req, res){
    var details = {'production': '', 'legend': '', 'players': []};
    function processPlayersList(players){
        for(let index in players){
            details['players'].push(players[index][keys.HPT_KEY_PSEUDO]);
        }
        db.getQuestionAndProduction(req.body.username, req.body.partyName, req.body.partyDate, function(err, prodID, question){
            if(err){
                logger.error(err);
                res.send('ERROR');
            }else{
                if(prodID != null){
                    details['question'] = question;
                    sendProduction(prodID, details, res);
                }else{
                    res.send('ERROR');
                }
            }
        });
    }

    db.getPlayersInGame(req.body.partyName, req.body.partyDate, function(err, result){
        if(err){
            res.send('ERROR');
        }else{
            processPlayersList(result);
        }
    });
});

router.post('/downloadArchivedProduction', urlencodedParser, function(req, res){
    let details = {};
    function getArchivedProductionID(){
        db.getProductionIDFromArchive(req.body.username, req.body.insertDate, function(err, prodID){
            if(err){
                logger.error(err);
                res.send('ERROR');
            }else{
                if(prodID != null){
                    sendProduction(prodID, details, res);
                }else{
                    res.send('ERROR');
                }
            }
        });
    }

    db.getQuestionAndProduction(req.body.username, req.body.partyName, req.body.partyDate, function(err, prodID, question){
        if(err){
            logger.error(err);
            res.send('ERROR');
        }else{
            if(prodID != null){
                details['question'] = question;
                getArchivedProductionID();
            }else{
                res.send('ERROR');
            }
        }
    });
});

router.post('/getPlayerDetails', urlencodedParser, function(req, res){
    let details = {};
    db.getQuestionAndProduction(req.body.username, req.body.partyName, req.body.partyDate, function(err, prodID, question){
        if(err){
            logger.error(err);
            res.send('ERROR');
        }else{
            if(prodID != null){
                details['question'] = question;
                sendProduction(prodID, details, res);
            }else{
                res.send('ERROR');
            }
        }
    });
});

module.exports = router;
