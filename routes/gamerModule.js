var express = require('express');
var router = express.Router();
var querystring = require('querystring');
var url = require('url');
var db = require('../js/db');


router.get('/cards', function(req, res, next) {
    console.log("on m'a demandé des cartes");
    let response = {};
    let nbFamilyTreated = 0;
    let nbFamilyToTreat;
    let params = querystring.parse(url.parse(req.url).query);

    let processCardGame = function(err, data){
        db.getFamilies(data[0]["id"], processFamilies);
    };

    let processFamilies = function (err, data) {
        nbFamilyToTreat = data.length;
        for(let family of data){
            response[family["id"]] = [];
            console.log("je bosse");
            console.log(data);
            console.log(family);
            console.log(family["id"]);
            db.getFamilyCards(family["id"], stackCard.bind(this, family["id"]));
        }
    };

    let stackCard = function(family, err, data){
        for(let i = 0; i < data.length; i++){
            console.log(response);
            response[family].push(data[i]["content"]);
        }
        nbFamilyTreated ++;
        if(nbFamilyTreated === nbFamilyToTreat){
            console.log("MY RES : ");
            console.log(response);
            res.send(response);
        }
    };

    db.getCardGame(params["cardGame"], params["language"], processCardGame);
});

router.get('/', function(req, res, next) {
    res.render('gamerModuleMainView');
});

module.exports = router;
