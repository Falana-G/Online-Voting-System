const express = require('express');
const app = express();
const connection = require('./db/config');
const indexController = require('./controller/index.controller');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

let port = 18454;
const secret = '123abc!@#';

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function (req, res) {
    res.render('home')
})

app.get('/user-home', AuthenticationUser, function (req, res) {
    res.render('userhome');
})

app.get('/login', function (req, res) {
    res.render('userlogin');
})

app.get('/signup', function (req, res) {
    res.render('userSignup');
})

app.get('/adminlogin', function (req, res) {
    res.render('adminlogin');
})

app.get('/admin-home', AuthenticationAdmin, function (req, res) {
    res.render('adminhome');
})

app.get('/read-records', indexController.readRecords);

app.get('/get-voting-status', AuthenticationUser, indexController.getVotingStatus);

app.get('/admin-voting-status', AuthenticationAdmin, indexController.adminVotingStatus);

app.post('/start-voting', indexController.startVoting);

app.post('/end-voting', indexController.endVoting);

app.post('/create-user', indexController.createUser);

app.post('/loginCheck', indexController.loginCheck);

app.post('/adminCheck', indexController.adminCheck);

app.post('/add-record', indexController.addRecord);

app.put('/vote', AuthenticationUser, indexController.voting);


function AuthenticationUser(req, res, next){
    if(req.cookies.userToken){
        let token = req.cookies.userToken;
        try{
            let data = jwt.verify(token, secret);
            req.userData = data;
            next();
        }catch(e){
            res.redirect('/login');
        }
    }else{
        res.redirect('/login');
    }
}

function AuthenticationAdmin(req, res, next){
    if(req.cookies.adminToken){
        let token = req.cookies.adminToken;
        try{
            let data = jwt.verify(token, secret);
            req.userData = data;
            next();
        }catch(e){
            res.redirect('/adminlogin');
        }
    }else{
        res.redirect('/adminlogin');
    }
}

app.listen(port, (error)=>{
    if (error){
        console.log(error.message);
    }else{
        console.log("Server started on port: "+port);
    }
})




