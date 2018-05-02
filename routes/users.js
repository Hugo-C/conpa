var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var db = require('../js/db');

router.post('/email', urlencodedParser, function(req, res, next) {
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
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
