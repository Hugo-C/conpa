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

router.post('/uploadCSV', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            res.writeHead(500);
            res.send();
            return // An error occurred when uploading
        }else{
            var file = req.file;
            var fileName = file.originalname;
            var dest = "./upload/" + fileName;
            fs.writeFile(dest, file.buffer, function(err){
                if(err){
                    console.log(err);
                    res.writeHead(500);
                    res.send();
                    return // An error occurred when uploading
                }
            });
            importCSV.importFromCsv(dest);
            res.writeHead(200);
            res.send();
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
