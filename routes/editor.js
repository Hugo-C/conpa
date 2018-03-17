var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer().single('uploadCSV');
var url = require('url');
var querystring = require('querystring');
var path = require('path');
var importCSV = require('../js/importCSV');
var exportCSV = require('../js/exportCSV');
var db = require('../js/db');
var keys = require('../js/dbConstants');
var parse = require('csv-parse/lib/sync');
var fs = require('fs');

// give card game editor web page
router.get('/', function(req, res){
  
    db.getCardGames(function(err, result){
        if(err){
            console.log(err);
            res.writeHead(500);
            res.send();
        }else{
            var params = querystring.parse(url.parse(req.url).query);
            var cardGamesArray = new Array(); // used to Retrieves all card games name
            for(index = 0; index < result.length; index++){
                cardGamesArray.push(result[index][keys.CGT_KEY_NAME] + " (" +
                                    result[index][keys.CGT_KEY_LANGUAGE] + ")");
            }
            if('selector' in params && params['selector'] == 'yes'){
                res.render("editorMainView", {cardGames: cardGamesArray, selector: params['selector']});
            }else{
                res.render("editorMainView", {cardGames: cardGamesArray, selector: 'no'});
            }
        }
    });
});

router.post('/updateCardGame', function(req, res){
    var params = querystring.parse(url.parse(req.url).query);
    if('cardGame' in params && 'update' in params){
        var cardGamePath = "./upload/" + params['cardGame'];
        console.log(cardGamePath);
        if(params['update'] == 'yes'){
            console.log("overwrite data");
            importCSV.importFromCsv(cardGamePath, false);
        }else{
            console.log("no update !");
            fs.unlinkSync(cardGamePath);
        }
        //db.importCardGame(req.body);
        res.writeHead(200);
    }else{
        res.writeHead(500);
    }
    res.send();
})

/**
 * Check if a card game (with csv format) already exists in the database
 *
 * @param {string} csvPath : path to the csv on the server
 * @param {callack} cardGameExistsCallback : used to return the answer (takes a boolean param and file content)
 */
function checkIfCardGameExists(csvPath, cardGameExistsCallback){
    fs.readFile(csvPath, function(err, data) {
        var records = parse(data, {columns: true}); // data of the file
        console.log(records);
        if(records.length > 0) // file is not empty
            db.cardGameExists(records[0]['nom jeu'], records[0]['langue'], function(exists){
                cardGameExistsCallback(exists, records);
            });
    });
}

/**
 * This callack is used to return csv file content and a boolean who indicate if
 * the card game exists in the database
 *
 * @callback cardGameExistsCallback
 * @param {boolean} cardGameExists : indicate if a version of the card game already exists in the database
 * @param {object} csvContent : csv file content
 */

/**
 * Generate random name for uploaded csv file
 * Used to face file conflict between users
 *
 * @return {string} : random file name with csv extension
 */
function generateRandomCsvFileName(){
    return Math.random().toString(36).substr(2, 16) + '.csv';
}

router.post('/uploadCSV', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.send();
            return // An error occurred when uploading
        }else{
            // Save file on the server
            var file = req.file; // file content and metadata
            var fileName = generateRandomCsvFileName();
            var dest = "./upload/" + fileName; // path to the file (uploaded files are saved on the upload folder)
            fs.writeFile(dest, file.buffer, function(err){
                if(err){
                    console.log(err);
                    res.writeHead(500);
                    res.send();
                    return // An error occurred when uploading
                }
            });
            checkIfCardGameExists(dest, function(exists, cardGame){
                if(exists){
                    res.writeHead(256);
                    res.write(fileName);
                }else{
                    importCSV.importFromCsv(dest, true);
                    res.writeHead(200);
                }
                res.send();
            });
        }
    });
});

router.get('/exportCSV', function(req, res){
    var params = querystring.parse(url.parse(req.url).query);
    if('cardGame' in params && 'language' in params){
        exportCSV.exportToCSV(params['cardGame'], params['language'], function(){
            var file = path.resolve(__dirname + "/../public/myCardGame.csv");
            res.download(file);
        });
    }
});

module.exports = router;
