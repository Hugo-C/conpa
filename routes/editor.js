const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer().single('uploadCSV');
const url = require('url');
const querystring = require('querystring');
const path = require('path');
const importCSV = require('../js/importCSV');
const exportCSV = require('../js/exportCSV');
const db = require('../js/db');
const keys = require('../js/dbConstants');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: true});
const parse = require('csv-parse/lib/sync');
const fs = require('fs');

// give card game editor web page
router.get('/', function(req, res){
    db.getCardGames(function(err, result){
        if(err){
            console.log(err);
            res.writeHead(500);
            res.send();
        }else{
            let params = querystring.parse(url.parse(req.url).query);
            let cardGamesArray = []; // used to Retrieves all card games name
            for(let index = 0; index < result.length; index++){
                cardGamesArray.push(result[index][keys.CGT_KEY_NAME] + " (" +
                                    result[index][keys.CGT_KEY_LANGUAGE] + ")");
            }
            if('selector' in params && params['selector'] === 'yes'){
                res.render("editorMainView", {cardGames: cardGamesArray, selector: params['selector']});
            }else{
                res.render("editorMainView", {cardGames: cardGamesArray, selector: 'no'});
            }
        }
    });
});

router.post('/updateCardGame', urlencodedParser, function(req, res){
    let update = req.body.update;
    let cardGamePath = "./upload/" + req.body.csv;
    if(update === 'yes'){
        console.log("overwrite data");
        importCSV.importFromCsv(cardGamePath, false);
    }else{
        console.log("no update !");
        fs.unlinkSync(cardGamePath);
    }
    res.writeHead(200);
    res.send();
});

/**
 * Check if a card game (with csv format) already exists in the database
 *
 * @param {string} csvPath : path to the csv on the server
 * @param {callback} cardGameExistsCallback : used to return the answer (takes a boolean param and file content)
 */
function checkIfCardGameExists(csvPath, cardGameExistsCallback){
    fs.readFile(csvPath, function(err, data) {
        let records = parse(data, {columns: true}); // data of the file
        //console.log(records);
        if(records.length > 0) // file is not empty
            db.cardGameExists(records[0]['nom jeu'], records[0]['langue'], function(exists){
                cardGameExistsCallback(exists, records);
            });
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

router.post('/uploadCSV', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.send();
            return; // An error occurred when uploading
        }else{
            // Save file on the server
            let file = req.file; // file content and metadata
            var fileName = generateRandomCsvFileName();
            var dest = "./upload/" + fileName; // path to the file (uploaded files are saved on the upload folder)
            fs.writeFile(dest, file.buffer, function(err){
                if(err){
                    console.log(err);
                    res.writeHead(500); // An error occurred when uploading
                    res.send();
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
    let params = querystring.parse(url.parse(req.url).query);
    if('cardGame' in params && 'language' in params){
        exportCSV.exportToCSV(params['cardGame'], params['language'], function(){
            let file = path.resolve(__dirname + "/../public/myCardGame.csv");
            res.download(file);
        });
    }
});

module.exports = router;
