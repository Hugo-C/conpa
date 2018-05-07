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

/* GET users listing. */
router.get('/', function(req, res) {
    res.send('respond with a resource');
});

module.exports = router;
