const express = require('express');
const _ = require('lodash');
const session = require('express-session');
const expressValidator = require('express-validator');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt= require('bcryptjs');
const path = require('path');
const flash = require('connect-flash');
const exphbs = require('express-handlebars');
const uuidv4 = require('uuid/v4');
var passport = require("passport");
var request = require("request");
const mysql = require('mysql');
const moment = require('moment');
let dbInfo = {
  host: "localhost",
  user: "root",
  password: "Okaydone1234!",
  database : 'workout'
};
const LocalStrategy = require('passport-local').Strategy;
const AuthenticationFunctions = require('../helper/Authentication');

router.get('/', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  return res.redirect('/platform/dashboard');
});

router.get('/dashboard', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  return res.render('platform/dashboard.hbs', {
    user: req.user,
  });
});

router.get('/profile', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM users WHERE id=${mysql.escape(req.user.identifier)};`, (error, users, fields) => {
    if (error) {
      con.end();
      console.log(error.stack);
      return res.send();
    }
    if (users.length === 1) {
      return res.render('platform/profile.hbs', {
        user: req.user,
        weeklyCalorieGoal: users[0].weekly_calorie_goal,
        weeklyExerciseGoal: users[0].weekly_exercise_goal,
        error: req.flash('error'),
        success: req.flash('success'),
      });
    } else {
      con.end();
      return res.send();
    }
  });
});



module.exports = router;