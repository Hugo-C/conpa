var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer().single('uploadCSV');
var url = require('url');
var querystring = require('querystring');
var path = require('path');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var db = require('../js/db');
var keys = require('../js/dbConstants');
var exportCSV = require('../js/exportCSV');
var importCSV = require('../js/importCSV');
var parse = require('csv-parse/lib/sync');
var fs = require('fs');

router.get('/', function(req, res, next) {
  res.render('mainWebSitePage');
});

router.post('/checkConnection', urlencodedParser, function(req, res){
  db.isConnected(req.body.username, function(connected){
    if(connected){
      res.send("OK");
    }else{
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
            var historic = []; // used to store historic entries
            for(var entry in result){
                var data = {'name': result[entry][keys.PT_KEY_SERVER],
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
    })
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

        for(var index in players){
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

    db.getCardGames(function(err, result){
        if(err){
            console.log(err);
            res.send('ERROR');
        }else{
            var cardGames = []; //used to send all card games
            for(var entry in result){
                var data = {'name': result[entry][keys.CGT_KEY_NAME],
                            'language': result[entry][keys.CGT_KEY_LANGUAGE]};
                cardGames.push(data);
            }
            res.send(cardGames);
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

router.post('/updateCardGame', urlencodedParser, function(req, res){
    var update = req.body.update;
    var cardGamePath = "./upload/" + req.body.csv;
    if(update == 'yes'){
        console.log("overwrite data");
        importCSV.importFromCsv(cardGamePath, false);
        res.send('OK');
    }else{
        console.log("no update !");
        fs.unlinkSync(cardGamePath);
        res.send('NO UPDATE');
    }
});

/**
 * Check if a card game (with csv format) already exists in the database
 *
 * @param {string} csvPath : path to the csv on the server
 * @param {callack} cardGameExistsCallback : used to return the answer (takes a boolean param and file content)
 */
function checkIfCardGameExists(csvPath, cardGameExistsCallback){
    console.log('checking if card game exists');
    fs.readFile(csvPath, function(err, data) {

        try{
            var records = parse(data, {columns: true}); // data of the file
            //console.log(records);
            if(records.length > 0){ // file is not empty
                db.cardGameExists(records[0]['nom jeu'], records[0]['langue'], function(exists){
                    cardGameExistsCallback(null, exists, records);
                });
            }
        }catch(error){
            cardGameExistsCallback(error);
        }
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
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            res.send('ERROR');
        }else{
            // Save file on the server
            var file = req.file; // file content and metadata
            var fileName = generateRandomCsvFileName();
            var dest = "./upload/" + fileName; // path to the file (uploaded files are saved on the upload folder)
            fs.writeFile(dest, file.buffer, function(err){
                if(err){
                    console.log(err);
                    res.send('ERROR');
                }
            });
            checkIfCardGameExists(dest, function(err, exists, cardGame){
                if(err){
                    res.send('ERROR');
                }else{
                    console.log('card game exists ? : ' + exists);
                    if(exists){
                        res.send(fileName);
                    }else{
                        importCSV.importFromCsv(dest, true);
                        res.send('OK');
                    }
                }
            });
        }
    });
});

module.exports = router;

// Test to change the language
var config = {
    "lang": "en",
    "langFile": "./../../locale.json"
};
/* FIXME
//init internationalization / localization class
var i18n_module = require('i18n-nodejs');
var i18n = new i18n_module(config.lang, config.langFile);
console.log(i18n.__('Salut'));
*/
