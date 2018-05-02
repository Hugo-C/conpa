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
// We need this to build our post string
const querystring = require('querystring');
const http = require('http');

const EMAIL_RESET_PASSWORD = path.join('views/email/resetPassword.jade');


router.get('/resetPassword/:token', function(req, res, next) {
    let token = req.params.token;
    console.log('retrieving page for token : ' + token);
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
    console.log(req.body.password);
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

router.post('/resetPassword', urlencodedParser, function(req, res, next) {
    let email = req.body.email;
    console.log("EMAIL : " + email);
    if(email){
        db.getUser(email, function(err, username){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                console.log("RES :");
                console.log(username);
                console.log("req.route");
                let fullUrl = req.protocol + "://" + req.get("host") + req.baseUrl + req.route.path;
                console.log(fullUrl);
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

function sendResetPassword(url, email, username, token){
    console.log("token : " + token);
    if(token === null)
        return;  // the creation of the token failed, we abort the process
    nodemailer.createTestAccount((err, account) => {
        let html,
            text;
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'testconpa@gmail.com',
                pass: 'testTest'
            }
        });

        // Compile a function
        let fn = jade.compileFile(EMAIL_RESET_PASSWORD, null);

        // Render the function
        let htmlUrl = url + "/" + token;
        console.log(htmlUrl);
        html = fn({name: username, urlReset: htmlUrl});

        console.log(html);

        text = htmlToText.fromString(html, {
            wordwrap: 130
        });

        // setup email data with unicode symbols
        const mailOptions = {
            from: '"conpa 👋" <conpa@example.com>', // sender address
            to: email, // list of receivers
            subject: 'Reset your password 📝', // Subject line
            text: text,
            html: html,
        };

        console.log(text);  // FIXME DEBUG

        // send email with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
        });
    });
}

router.post('/setPassword', urlencodedParser, function(req, res, next) {
    var password = md5(req.body.password + "conpa35411");
    var token = req.body.token;
    var recaptcha = req.body.recaptcha;
    let remoteIp = req.connection.remoteAddress;
    console.log("recaptcha :");
    console.log(recaptcha);

    let handlePasswordChanged = function(err, name){
        if(err){
            res.writeHead(500);
            res.send();
        } else {
            console.log("password changed successfully");
            res.writeHead(200);
            res.send();
        }
    };
    let mySetPassword = function(err, name) {
        if(err){
            res.writeHead(403);
            res.send();
        } else {
            console.log(password);
            db.setPassword(name, password, handlePasswordChanged)
        }
    };

    db.isValidToken(token, mySetPassword);
    //checkCaptcha(recaptcha, remoteIp);  TODO
});

/** CAPTCHA **/

function checkCaptcha(response, remoteIp) {
    let secretKey = '6LcNnFYUAAAAAASFWKc85oX9rFcaLlrGOI3Fj1Yx';
    // Build the post string from an object
    var post_data = querystring.stringify({
        'secret ': secretKey,
        'response': response,
        'remoteip': remoteIp,
    });

    // An object of options to indicate where to post to
    var post_options = {
        host: 'google.com',
        port: '443',
        path: '/recaptcha/api/siteverify',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
            console.log(JSON.parse(chunk));
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
    console.log("j'ai fais ma demande");
}

module.exports = router;
