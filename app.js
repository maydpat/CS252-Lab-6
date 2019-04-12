const express = require('express');
const path = require('path');
const mysql = require('mysql');
const hbs = require('hbs');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const expressValidator = require('express-validator');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
var passport = require("passport");
var request = require("request");

const app = express();

// Start HTTP Server
const port = 80;

app.engine('.hbs', exphbs({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

const authentication = require('./routes/authentication');

// Static folder
app.use(express.static(path.join(__dirname, '/public')));
app.use(cookieParser());
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Express Session
app.use(session({
    secret: 'q3lk4gnk3ngkl3kgnq3klgn',
    saveUninitialized: false,
    resave: false
}));
app.use(flash());
app.use(expressValidator());
// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Use routes
app.use('/', authentication);

// Static folder
app.use(express.static(path.join(__dirname, '/public')));

app.listen(port, () =>{
  console.log(`Server started on port ${port}`);
});