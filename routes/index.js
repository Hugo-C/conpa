const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer().single('uploadCSV');
const url = require('url');
const querystring = require('querystring');
const path = require('path');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: true});
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
    db.isConnected(req.body.username, function (connected) {
        if (connected) {
            res.send("OK");
        } else {
            res.send("REJECT");
        }
    });
});

router.post('/getHistoric', urlencodedParser, function(req, res){
    db.getHistoricEntries(req.body.username, function(err, result){
        if(err){
            console.log(err);
            res.send('ERROR');
        }else{
            let historic = []; // used to store historic entries
            for(let entry in result){
                let data = {'name': result[entry][keys.PT_KEY_SERVER],
                            'animator': result[entry][keys.PT_KEY_ANIMATOR],
                            'date': result[entry][keys.PT_KEY_DATE],
                            'question': result[entry][keys.HPT_KEY_QUESTION]};
                historic.push(data);
            }
            res.send(historic);
        }
    });
});

router.post('/removeHistoric', urlencodedParser, function(req, res){
    db.removePlayerPartyHistoric(req.body.username, req.body.server, req.body.date, function(err){
        if(err){
            console.log(err);
            res.send('ERROR');
        }else{
            res.send('OK');
        }
    });
});

router.post('/getPlayerProduction', urlencodedParser, function(req, res){
    var details = {'production': ''};
    db.getProduction(req.body.username, req.body.partyName, req.body.partyDate, function(err, result){
        if(err){
            res.send('ERROR');
        }else{
            console.log(result != null);
            if(result != null) details['production'] = result;
            res.send(details);
        }
    });
});

router.post('/recordPlayerProduction', urlencodedParser, function(req, res){
    console.log(req.body.production);
    db.recordPlayerProduction(req.body.username, req.body.partyName, req.body.partyDate, req.body.production, function(err){
        if(err){
            res.send('ERROR');
        }else{
            res.send('OK');
        }
    });
});

router.post('/getDetails', urlencodedParser, function(req, res){
    var details = {'production': '', 'players': []};

    function processPlayersList(players){

        for(let index in players){
            details['players'].push(players[index][keys.HPT_KEY_PSEUDO]);
        }

        db.getProduction(req.body.username, req.body.partyName, req.body.partyDate, function(err, result){
            if(err){
                res.send('ERROR');
            }else{
                console.log(result != null);
                if(result != null) details['production'] = result;
                res.send(details);
            }
        });
    }

    db.getPlayersInParty(req.body.partyName, req.body.partyDate, function(err, result){
        if(err){
            res.send('ERROR');
        }else{
            processPlayersList(result);
        }
    });
});

router.post('/getPlayerDetails', urlencodedParser, function(req, res){
    var details = {};
    db.getPlayerPartyDetails(req.body.username, req.body.partyName, req.body.partyDate, function(err, result){
        if(err){
            res.send('ERROR');
        }else{
            details['question'] = result[0][keys.HPT_KEY_QUESTION];
            details['production'] = result[0][keys.HPT_KEY_PRODUCTION];
            res.send(details);
        }
    });
});

router.post('/getCardGames', urlencodedParser, function(req, res){
    console.log(req.body.tags);
    db.getCardGamesByTags(JSON.parse(req.body.tags), function(err, result){
        if(err){
            console.log(err);
            res.send('ERROR');
        }else{
            let cardGames = []; //used to send all card games
            for(let entry in result){
                let data = {'name': result[entry][keys.CGT_KEY_NAME],
                            'language': result[entry][keys.CGT_KEY_LANGUAGE],
                            'author': result[entry][keys.CGT_KEY_AUTHOR]};
                cardGames.push(data);
            }
            res.send(cardGames);
        }
    });
});

router.post('/getAllTags', urlencodedParser, function(req, res){
    db.getAllTags(function(err, tags){
        if(err){
            res.send({'msg': 'ERROR'});
        }else{
            data = {'msg': 'OK', 'tags': []};
            for(let index = 0; index < tags.length; index++){
                data['tags'].push(tags[index][keys.HTT_KEY_TAG]);
            }
            res.send(data);
        }
    });
});

router.get('/exportCardGame', function(req, res){
    var params = querystring.parse(url.parse(req.url).query);
    if('name' in params && 'language' in params){
        exportCSV.exportToCSV(params['name'], params['language'], function(fileName){
            var file = path.resolve(__dirname + "/../public/" + fileName);
            res.download(file);
            res.on('finish', function(){
                fs.unlink(file);
            });
        });
    }else{
        res.send('ERROR');
    }
});

function getCardGameInformation(name, language, callback){
    let data = {'name': name, 'language': language, 'description': null, 'tags': [], 'allTags': []};

    function retrieveCardgameDescription(){
        db.getCardGameDescription(name, language, function(err, description){
            if(err){
                console.log(err);
                callback(err);
            }else{
                data['description'] = description[0][keys.CGT_KEY_DESCRIPTION];
                callback(null, data);
            }
        });
    }

    function retrieveCardgameTags(){
        db.getCardGameTags(name, language, function(err, tags){
            if(err){
                console.log(err);
                callback(err);
            }else{
                for(let index = 0; index < tags.length; index++){
                    data['tags'].push(tags[index][keys.HTT_KEY_TAG]);
                }
                retrieveCardgameDescription();
            }
        });
    }

    db.getAllTags(function(err, allTags){
        if(err){
            console.log(err);
            callback(err);
        }else{
            for(let index = 0; index < allTags.length; index++){
                data['allTags'].push(allTags[index][keys.HTT_KEY_TAG]);
            }
            retrieveCardgameTags();
        }
    });
}

router.post('/getCardGameInfo', urlencodedParser, function(req, res){

    getCardGameInformation(req.body.name, req.body.language, function(err, data){
        if(err){
            console.log(err);
            res.send({'msg': 'ERROR'});
        }else{
            data['msg'] = 'OK';
            res.send(data);
        }
    });

});

router.post('/updateCardgameDescription', urlencodedParser, function(req, res){

    db.updateCardgameDescription(req.body.name, req.body.language, req.body.description, function(err){
        if(err){
            console.log(err);
            res.send('ERROR');
        }else{
            res.send('OK');
        }
    });

});

router.post('/removeATag', urlencodedParser, function(req, res){

    function sendActualizedTagsList(){
        data = {'msg': 'OK', 'tags': []};
        db.getCardGameTags(req.body.name, req.body.language, function(err, tags){
            if(err){
                console.log(err);
                res.send({'msg': 'GET CARDGAME TAGS ERROR'});
            }else{
                for(let index = 0; index < tags.length; index++){
                    data['tags'].push(tags[index][keys.HTT_KEY_TAG]);
                }
                res.send(data);
            }
        });
    }

    function removeTagFromCardgameWithId(cardgameId){
        db.removeATagFromCardgame(cardgameId, req.body.tag, function(err){
            if(err){
                console.log(err);
                res.send({'msg': 'REMOVING TAG ERROR'});
            }else{
                sendActualizedTagsList();
            }
        });
    }

    db.getCardGame(req.body.name, req.body.language, function(err, result){
        if(err){
            console.log(err);
            res.send({'msg': 'GET CARDGAME ID ERROR'});
        }else{
            removeTagFromCardgameWithId(result[0][keys.CGT_KEY_ID]);
        }
    });

});

router.post('/addATag', urlencodedParser, function(req, res){

    function sendActualizedTagsList(){
        console.log('sending actualized tags list');
        data = {'msg': 'OK', 'tags': []};
        db.getCardGameTags(req.body.name, req.body.language, function(err, tags){
            if(err){
                console.log(err);
                res.send({'msg': 'GET CARDGAME TAGS ERROR'});
            }else{
                for(let index = 0; index < tags.length; index++){
                    data['tags'].push(tags[index][keys.HTT_KEY_TAG]);
                }
                res.send(data);
            }
        });
    }

    function addTagToCardgameWithId(cardgameId){
        console.log('adding tags to the cardgame');
        db.addANewTagToCardgame(cardgameId, req.body.tag, function(err){
            if(err){
                console.log(err);
                res.send({'msg': 'ADDING NEW TAG TO CARDGAME ERROR'});
            }else{
                sendActualizedTagsList();
            }
        });
    }

    function searchCardgameId(){
        console.log('retrieving cardgame id');
        db.getCardGame(req.body.name, req.body.language, function(err, result){
            if(err){
                console.log(err);
                res.send({'msg': 'GET CARDGAME ID ERROR'});
            }else{
                addTagToCardgameWithId(result[0][keys.CGT_KEY_ID]);
            }
        })
    }

    function addANewTag(){
        console.log('adding a new tag to the tags table');
        db.addANewTag(req.body.tag, function(err){
            if(err){
                console.log(err);
                res.send({'msg': 'ADDING NEW TAG ERROR'});
            }else{
                searchCardgameId();
            }
        })
    }

    db.existsTag(req.body.tag, function(err, exists){
        console.log('checking if the tag already exists');
        if(err){
            console.log(err);
            res.send({'msg': 'CHECK IF TAG EXISTS ERROR'});
        }else{
            if(exists){
                searchCardgameId();
            }else{
                addANewTag();
            }
        }
    });

});

router.post('/updateCardGame', urlencodedParser, function(req, res){
    let update = req.body.update;
    let cardGamePath = "./upload/" + req.body.csv;
    if(update === 'yes'){
        console.log("overwrite data");
        importCSV.importFromCsv(req.body.name, req.body.language, req.body.author, cardGamePath, false);
        getCardGameInformation(req.body.name, req.body.language, function(err, data){
            if(err){
                res.send({'send': 'ERROR'});
            }else{
                data['send'] = 'OK';
                res.send(data);
            }
        });
    }else{
        console.log("no update !");
        fs.unlinkSync(cardGamePath);
        res.send({'send': 'NO UPDATE'});
    }
});

/**
 * Check if a card game (with csv format) already exists in the database
 *
 * @param {string} csvPath : path to the csv on the server
 * @param {callback} cardGameExistsCallback : used to return the answer (takes a boolean param and file content)
 */
function checkIfCardGameExists(name, language, cardGameExistsCallback){
    console.log('checking if card game exists');
    db.cardGameExists(name, language, function(exists){
        cardGameExistsCallback(null, exists);
    });
}

/**
 * Generate random name for uploaded csv file
 * Used to face file conflict between users
 *
 * @return {string} : random file name with csv extension
 */
function generateRandomCsvFileName(){
    return Math.random().toString(36).substr(2, 16) + '.csv';
}

router.post('/importCardGame', function (req, res) {
    let params = querystring.parse(url.parse(req.url).query);

    function processFile(fileName){
        importCSV.importFromCsv(params['name'], params['language'], params['author'], "./upload/" + fileName, true);
        getCardGameInformation(req.body.name, req.body.language, function(err, data){
            if(err){
                res.send({'msg': 'ERROR'});
            }else{
                data['msg'] = 'OK';
                res.send(data);
            }
        });
    }

    function checkIfCardGameExists(name, language, fileName){
        console.log('checking if card game exists');
        db.getCardGame(name, language, function(err, result){
              if(err){
                  console.log(err);
                  res.send({'msg': 'ERROR'});
              }else if(result.length == 1 && result[0][keys.CGT_KEY_AUTHOR] == params['author']){
                  res.send({'msg': 'UPDATE?', 'file': fileName});
              }else if(result.length == 0){
                  processFile(fileName);
              }else{
                  res.send({'msg': 'UNAUTHORIZED'});
              }
        });
    }

    function storeCsvFileOnServer(){
        // Save file on the server
        let file = req.file; // file content and metadata
        let fileName = generateRandomCsvFileName();

        fs.writeFile("./upload/" + fileName, file.buffer, function(err){
            if(err){
                console.log(err);
                res.send({'msg': 'ERROR'});
            }else{
                checkIfCardGameExists(params['name'], params['language'], fileName);
            }
        });
    }

    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            res.send({'msg': 'ERROR'});
        }else{
            storeCsvFileOnServer();
        }
    });
});

module.exports = router;
