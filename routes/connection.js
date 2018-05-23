const express = require('express');
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const db = require('../js/db');
const md5 = require('md5');
const jade = require('jade');
const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

const EMAIL_RESET_PASSWORD = path.join('views/email/resetPassword.jade');


router.get('/resetPassword/:token', function(req, res) {
    let token = req.params.token;
    db.isValidToken(token, function(err, name, tokenExpiration) {
        if(err){
            res.render('connection/tokenUnvalidResponse', {err: err});
        } else {
            res.render('connection/tokenValidResponse', {name: name, tokenExpiration: tokenExpiration});
        }
    });
});

router.get('/', function(req, res){
    res.render("connectionView");
});

router.post('/register', urlencodedParser, function(req, res){
    console.log("new register");
    let username = req.body.username;
    let email = req.body.email;
    let password = md5(req.body.password + "conpa35411");
    db.registerUser(username, email, password, function(err){
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

    db.userExists(username, function(exists){
        if(exists){
            checkPassword();
        }else{
            res.send('NO_ACCOUNT');
        }
    });
});

router.post('/logout', urlencodedParser, function(req, res){
    let username = req.body.username;
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

router.post('/resetPassword', urlencodedParser, function(req, res) {
    let email = req.body.email;
    if(email){
        db.getUser(email, function(err, username){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                let fullUrl = req.protocol + "://" + req.get("host") + req.baseUrl + req.route.path;
                if(username !== [] && username !== null){
                    let mySendResetPassword = sendResetPassword.bind(null, fullUrl, email);
                    db.generateToken(username, mySendResetPassword);
                    res.sendStatus(304);
                } else{
                    res.sendStatus(500);
                }
            }
        });
    } else {
        res.sendStatus(500);
    }
});

router.post('/setPassword', urlencodedParser, function(req, res) {
    const password = md5(req.body.password + "conpa35411");
    const token = req.body.token;

    let handlePasswordChanged = function(err, name){
        if(err){
            res.writeHead(500);
            res.send();
        } else {
            console.log("password changed successfully");
            res.writeHead(200);
            res.send();
            db.clearToken(name, function(){});  // we are done once tokens are cleared
        }
    };
    let mySetPassword = function(err, name) {
        if(err){
            res.writeHead(403);
            res.send();
        } else {
            db.setPassword(name, password, handlePasswordChanged);
        }
    };

    db.isValidToken(token, mySetPassword);
});


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'testconpa2@gmail.com',
        pass: 'testTest'
    }
});


function sendResetPassword(url, email, username, token){
    console.log("token : " + token);
    if(token === null)
        return;  // the creation of the token failed, we abort the process
    let htmlUrl = url + "/" + token;
    let jadeParams = {name: username, urlReset: htmlUrl};
    sendmail(email, 'Reset your password 📝', EMAIL_RESET_PASSWORD, jadeParams);
}

function sendmail(emailAdresse, subject, htmlFile, jadeParameters) {
    // Compile the jade file
    let fn = jade.compileFile(htmlFile, null);
    let html = fn(jadeParameters);
    console.log(html);
    let text = htmlToText.fromString(html, {
        wordwrap: 130
    });

    // setup email data with unicode symbols
    const mailOptions = {
        from: '"conpa 👋" <conpa@example.com>', // sender address
        to: emailAdresse, // list of receivers
        subject: subject, // Subject line
        text: text,
        html: html,
    };
    // send email with defined transport object
    transporter.sendMail(mailOptions, function(error) {
        if (error) {
            return console.log(error);
        }
        console.log("Message sent");
    });
}

module.exports = router;
