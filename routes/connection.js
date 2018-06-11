const express = require('express');
const router = express.Router();
const path = require('path');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const logger = require('../js/logger.js');
const db = require('../js/db');
const CONFIG = require('../config.json');
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
            logger.debug("unvalid token submitted");
        } else {
            res.render('connection/tokenValidResponse', {name: name, tokenExpiration: tokenExpiration});
            logger.debug("valid token submitted");
        }
    });
});

router.get('/', function(req, res){
    res.render("connectionView");
});

router.post('/register', urlencodedParser, function(req, res){
    logger.info("new register");
    let username = req.body.username;
    let email = req.body.email;
    let password = md5(req.body.password + CONFIG.connectionSalt);
    db.registerUser(username, email, password, function(err){
        if(err){
            if(err.sqlMessage.match('PRIMARY')){
                res.send('DUP_PSEUDO');
                logger.debug("new register failed : duplicated pseudo : " + username);
            }else if(err.sqlMessage.match('uniq_email')){
                res.send('DUP_EMAIL');
                logger.debug("new register failed : duplicated email : " + email);
            }else{
                res.send('ERROR');
                logger.debug("new register failed : " + username);
            }
        }else{
            res.send("OK");
        }
    });
});

router.post('/login', urlencodedParser, function(req, res, next){
    var username = req.body.username;
    var password = md5(req.body.password + CONFIG.connectionSalt);

    function connectUser(){
        db.connectUser(username, function(err){
            if(err) logger.error(err);
            else res.send('OK');
        });
    }

    function checkPassword(){
        db.getPassword(username, function(err, mdp){
            if(err){
                logger.error(err);
                res.send('MISMATCH');
                logger.debug("login failed : " + err);
            }else{
                if(password.match(mdp)){
                    connectUser();
                    logger.info("login successful : " + username);
                }else{
                    res.send('MISMATCH');
                    logger.debug("login failed : pseudo and password mismatched : " + username);
                }
            }
        });
    }

    db.userExists(username, function(exists){
        if(exists){
            checkPassword();
        }else{
            res.send('NO_ACCOUNT');
            logger.debug("user not in db : " + username);
        }
    });
});

router.post('/logout', urlencodedParser, function(req, res){
    let username = req.body.username;
    db.disconnectUser(username, function(err){
        if(err){
            logger.error(err);
            res.writeHead(500);
            res.send();
        }else{
            res.writeHead(200);
            res.send();
            logger.info(username + " logout");
        }
    });
});

router.post('/resetPassword', urlencodedParser, function(req, res) {
    let email = req.body.email;
    if(email){
        db.getUser(email, function(err, username){
            if(err){
                logger.error(err);
                res.sendStatus(500);
            }else{
                let fullUrl = req.protocol + "://" + req.get("host") + req.baseUrl + req.route.path;
                if(username !== [] && username !== null){
                    let mySendResetPassword = sendResetPassword.bind(null, fullUrl, email);
                    db.generateToken(username, mySendResetPassword);
                    res.sendStatus(304);
                    logger.debug("token generated");
                } else{
                    res.sendStatus(500);
                    logger.warn("failed to generate the token");
                }
            }
        });
    } else {
        res.sendStatus(500);
        logger.warn("failed to generate the token : invalid email");
    }
});

router.post('/setPassword', urlencodedParser, function(req, res) {
    const password = md5(req.body.password + CONFIG.connectionSalt);
    const token = req.body.token;

    let handlePasswordChanged = function(err, name){
        if(err){
            logger.error(err);
            res.writeHead(500);
            res.send();
        } else {
            logger.info("password changed successfully");
            res.writeHead(200);
            res.send();
            db.clearToken(name, function(){
                logger.debug("token cleared");
            });  // we are done once tokens are cleared
        }
    };
    let mySetPassword = function(err, name) {
        if(err){
            logger.error(err);
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
    service: CONFIG.emailService,
    auth: {
        user: CONFIG.emailUser,
        pass: CONFIG.emailPassword
    }
});


function sendResetPassword(url, email, username, token){
    logger.debug("token : " + token);
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
    logger.log("silly", html);
    let text = htmlToText.fromString(html, {
        wordwrap: 130
    });

    // setup email data with unicode symbols
    const mailOptions = {
        from: CONFIG.emailAddress, // sender address
        to: emailAdresse, // list of receivers
        subject: subject, // Subject line
        text: text,
        html: html,
    };
    // send email with defined transport object
    transporter.sendMail(mailOptions, function(err) {
        if (err) {
            logger.error(err);
        }
        logger.info("Message sent");
    });
}

module.exports = router;
