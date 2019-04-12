const express = require('express');
const session = require('express-session');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt= require('bcryptjs');
const uuidv4 = require('uuid/v4');
const passport = require("passport");
const flash = require('connect-flash');
var request = require("request");
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const { check } = require('express-validator/check')
let dbInfo = {
  host: "localhost",
  user: "root",
  password: "Okaydone1234!",
  database : 'workout'
};

// Comment
const LocalStrategy = require('passport-local').Strategy;
const AuthenticationFunctions = require('../helper/Authentication');

router.get('/', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  return res.redirect('/platform/dashboard');
});

router.get('/login', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  return res.render('platform/login.hbs', {
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/login', AuthenticationFunctions.ensureNotAuthenticated, passport.authenticate('local', { successRedirect: '/platform/dashboard', failureRedirect: '/login', failureFlash: true }), (req, res) => {
  res.redirect('/platform/dashboard');
});

router.get('/logout', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.logout();
  req.session.destroy();
  return res.redirect('/login');
});

router.get('/register', AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  return res.render('platform/register.hbs', {
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post(`/register`, AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
  req.checkBody('firstName', 'First Name field is required.').notEmpty();
  req.checkBody('lastName', 'Last Name field is required.').notEmpty();
  req.checkBody('username', 'Email field is required.').notEmpty();
  req.checkBody('password', 'Password field is required.').notEmpty();
  req.checkBody('password2', 'Confirm password field is required.').notEmpty();
  req.checkBody('password2', 'Password does not match confirmation password field.').equals(req.body.password);
  if (req.body.password.includes(' ') || req.body.password2.includes(' ')) {
    req.flash('error', 'Password cannot contain spaces.');
    return res.redirect('/register');
  }
  if (req.body.password.length < 4 || req.body.password2.length < 4) {
    req.flash('error', 'Password must be longer than 3 characters.');
    return res.redirect('/register');
  }
  let formErrors = req.validationErrors();
  if (formErrors) {
      req.flash('error', formErrors[0].msg);
      return res.redirect('/register');
  }
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM users WHERE username=${mysql.escape(req.body.username)};`, (error, users, fields) => {
    if (error) {
      console.log(error.stack);
      con.end();
      req.flash('error', 'System Error.');
      return res.redirect('/register');
    }
    if (users.length === 0) {
      let salt = bcrypt.genSaltSync(10);
      let hashedPassword = bcrypt.hashSync(req.body.password, salt);
      con.query(`INSERT INTO users (id, username, password, first_name, last_name) VALUES (${mysql.escape(uuidv4())}, ${mysql.escape(req.body.username)}, ${mysql.escape(hashedPassword)}, ${mysql.escape(req.body.firstName)}, ${mysql.escape(req.body.lastName)});`, (error, resultAddingUser, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          req.flash('error', 'System Error.');
          return res.redirect('/register');
        }
        if (resultAddingUser) {
          console.log(`${req.body.username} successfully registered.`);
          con.end();
          req.flash('success', 'Successfully registered. You may now login.');
          return res.redirect('/login');
        } else {
          con.end();
          req.flash('error', 'Error registering. Please try again.');
          return res.redirect('/register');
        }
      });
    } else {
      con.end();
      req.flash('error', 'This email address is already registered.');
      return res.redirect('/register');
    }
  });
});

passport.use(new LocalStrategy({passReqToCallback: true,},
	function (req, username, password, done) {
      let con = mysql.createConnection(dbInfo);
      con.query(`SELECT * FROM users WHERE username=${mysql.escape(username)};`, (error, results, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return;
        }
        if (results.length === 0) {
          con.end();
          return done(null, false, req.flash('error', 'Username or Password is incorrect.'));
        } else {
          if (bcrypt.compareSync(password, results[0].password)) {
            console.log(`${username} successfully logged in.`);
            let userObject = {
              identifier: results[0].id,
              username: results[0].username,
              firstName: results[0].first_name,
              lastName: results[0].last_name,
            };
            con.end();
            return done(null, userObject);
          } else {
            cone.end();
            return done(null, false, req.flash('error', 'Username or Password is incorrect.'));
          }
        }
      });
}));

passport.serializeUser(function (uuid, done) {
	done(null, uuid);
});

passport.deserializeUser(function (uuid, done) {
  done(null, uuid);
});

module.exports = router;
