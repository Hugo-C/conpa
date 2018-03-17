var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var db = require('../js/db');
var keys = require('../js/dbConstants');

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

module.exports = router;
