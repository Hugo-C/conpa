const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer().single('uploadProduction');
const querystring = require('querystring');
const url = require('url');
const db = require('../js/db');
const keys = require('../js/dbConstants');
const fs = require('fs');


/**
 * Return a Json of cards of the specified cardGame
 */
router.get('/cards', function(req, res) {
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
        let id = keys.CFT_KEY_ID;
        for(let family of data){
            response[family[id]] = {"cards": [], "name": family[keys.CFT_KEY_NAME], "logo": family[keys.CFT_KEY_LOGO]};
            db.getFamilyCards(family[id], stackCard.bind(this, family[id]));
        }
    };

    let stackCard = function(family, err, data){
        for(let i = 0; i < data.length; i++){
            response[family]["cards"].push(data[i]["content"]);
        }
        nbFamilyTreated ++;
        if(nbFamilyTreated === nbFamilyToTreat){
            // we want the response's key to be families names and not id
            let familyId = Object.keys(response);
            for(let i = 0; i < familyId.length; i++){
                let name = response[familyId[i]]["name"];
                response[name] = response[familyId[i]];
                delete response[familyId[i]];
            }
            res.send(response);
        }
    };
    if(params["cardGame"] === undefined || params["language"] === undefined){
        res.status(500).send({ error: "invalid parameters, please specify the cardGame value and language value" });
    } else {
        db.getCardGame(params["cardGame"], params["language"], processCardGame);
    }
});

router.get('/', function(req, res) {
    res.render('gamerModuleMainView');
});

router.post('/uploadProduction', function(req, res){
    upload(req, res, function(err){
        if(err){
            console.log(err);
            res.send('ERROR');
        }else{
            let file = req.file;
            let dest = "./upload/" + file.originalname;
            fs.writeFile(dest, file.buffer, function(err){
                if(err){
                    console.log(err);
                    res.send('ERROR');
                }else{
                    res.send('OK');
                }
            });
        }
    });
});

module.exports = router;
