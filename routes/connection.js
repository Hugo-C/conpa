var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var db = require('../js/db');
var keys = require('../js/dbConstants');
var md5 = require('md5');

router.get('/', function(req, res){
    res.render("connectionView");
});

router.post('/register', urlencodedParser, function(req, res){
    console.log("new register");
    var username = req.body.username;
    var email = req.body.email;
    var password = md5(req.body.password + "conpa35411");
    db.registerUser(username, email, password, function(err, result){
        if(err){
            if(err.sqlMessage.match('PRIMARY')){
                res.send('DUP_PSEUDO');
            }else if(err.sqlMessage.match('uniq_email')){
                res.send('DUP_EMAIL');
            }else{
                res.send('ERROR');
            }
        }else{
            res.send("OK");
        }
    });
});

router.post('/login', urlencodedParser, function(req, res, next){
    var username = req.body.username;
    var password = md5(req.body.password + "conpa35411");

    function connectUser(){
        db.connectUser(username, function(err){
            if(err) console.log(err);
            else res.send('OK');
        });
    }

    function checkPassword(){
        db.getPassword(username, function(err, mdp){
            if(err){
                console.log(err);
                res.send('MISMATCH');
            }else{
                if(password.match(mdp)){
                    connectUser();
                }else{
                    res.send('MISMATCH');
                }
            }
        });
    }

    function checkIfAlreadyConnect(){
        db.isConnected(username, function(connected){
            if(connected){
                res.send('ALREADY_CONNECT');
            }else{
                checkPassword();
            }
        });
    }

    db.userExists(username, function(exists){
        if(exists){
            checkIfAlreadyConnect();
        }else{
            res.send('NO_ACCOUNT');
        }
    });
});

router.post('/logout', urlencodedParser, function(req, res, next){
    var username = req.body.username;
    db.disconnectUser(username, function(err){
        if(err){
            console.log(err);
            res.writeHead(500);
            res.send();
        }else{
            res.writeHead(200);
            res.send();
        }
    });
});

module.exports = router;
