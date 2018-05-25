const Jimp = require("jimp");
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: true});
const db = require('../js/db');

/**
 * Return the email of a given user
 */
router.post('/email', urlencodedParser, function(req, res) {
    console.log("PSEUDO : " + req.body.username);
    db.getEmail(req.body.username, function(err, pp){
        if(err){
            console.log(err);
            res.sendStatus(500);
        }else{
            let myRes = {pp: pp};
            res.send(myRes);
        }
    });
});

/**
 * Create an image from two png images
 */
router.get('/conpa', function (req, res) {
    let logo = new Jimp('public/img/die/test.png', function (err, img) {
        err ? console.log('logo err' + err) : console.log('logo created and ready for use');
    });

    Jimp.read("public/img/die/fond.png", function (err, lenna) {
        if (err) throw err;
        lenna.composite(logo, 0, 0);
        lenna.write("public/img/die/image fusion.jpg");
    });
    res.send('Merge image of die');
});

/* GET users listing. */
router.get('/', function(req, res) {
    res.send('respond with a resource');
});

module.exports = router;
