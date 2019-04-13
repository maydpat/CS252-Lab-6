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
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.post(`/dashboard/enter-workout`, AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.checkBody('workoutDescription', 'Workout description field is required.').notEmpty();
  req.checkBody('hoursSpent', 'Hours spent field is required.').notEmpty();
  req.checkBody('caloriesBurned', 'Estimated caloric burn field is required.').notEmpty();
  let formErrors = req.validationErrors();
  if (formErrors) {
      req.flash('error', formErrors[0].msg);
      return res.redirect('/platform/profile');
  }
  let con = mysql.createConnection(dbInfo);
  con.query(`INSERT INTO workouts (id, description, calories, hours, user) VALUES (${mysql.escape(uuidv4())}, ${mysql.escape(req.body.workoutDescription)}, ${mysql.escape(req.body.caloriesBurned)}, ${mysql.escape(req.body.hoursSpent)}, ${mysql.escape(req.user.identifier)});`, (error, resultInserting, fields) => {
    if (error) {
      console.log(error.stack);
      con.end();
      return res.send();
    }
    con.query(`UPDATE users SET current_weekly_calories=current_weekly_calories+${mysql.escape(req.body.caloriesBurned)}, current_weekly_hours=current_weekly_hours+${mysql.escape(req.body.hoursSpent)} WHERE id=${mysql.escape(req.user.identifier)};`, (error, updateUserResult, fields) => {
      if (error) {
        con.end();
        console.log(error.stack);
        return res.send();
      }
      con.end();
      req.flash('success', 'Successfully entered workout.');
      return res.redirect('/platform/dashboard');
    });
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
        username: users[0].username,
        firstName: users[0].first_name,
        lastName: users[0].last_name,
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

router.post('/profile/edit-profile', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.checkBody('lastName', 'Last Name field is required.').notEmpty();
  req.checkBody('firstName', 'First Name field is required.').notEmpty();
  req.checkBody('username', 'Email address field is required.').notEmpty();
  let formErrors = req.validationErrors();
  if (formErrors) {
      req.flash('error', formErrors[0].msg);
      return res.redirect('/register');
  }
  let con = mysql.createConnection(dbInfo);
  con.query(`UPDATE users SET username=${mysql.escape(req.body.username)}, first_name=${mysql.escape(req.body.firstName)}, last_name=${mysql.escape(req.body.lastName)} WHERE id=${mysql.escape(req.user.identifier)};`, (error, resultUpdatingUser, fields) => {
    if (error) {
      con.end();
      console.log(error.stack);
      return res.send();
    }
    req.flash('success', 'Successfully updated profile.');
    con.end();
    return res.redirect('/platform/profile');
  });
});

router.post('/profile/change-password', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.checkBody('currentPassword', 'Current password field is required.').notEmpty();
  req.checkBody('newPassword', 'New password field is required.').notEmpty();
  req.checkBody('newPassword2', 'Confirm new password field is required.').notEmpty();
  req.checkBody('newPassword2', 'New password does not match confirmation password field.').equals(req.body.newPassword);
  let formErrors = req.validationErrors();
  if (formErrors) {
      req.flash('error', formErrors[0].msg);
      return res.redirect('/platform/profile');
  }
  if (req.body.newPassword.includes(' ') || req.body.newPassword2.includes(' ')) {
    req.flash('error', 'New password cannot contain spaces.');
    return res.redirect('/platform/profile');
  }
  if (req.body.newPassword.length < 4 || req.body.newPassword2.length < 4) {
    req.flash('error', 'New password must be longer than 3 characters.');
    return res.redirect('/platform/profile');
  }
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM users WHERE id=${mysql.escape(req.user.identifier)};`, (error, users, fields) => {
    if (error) {
      con.end();
      console.log(error.stack);
      return res.send();
    }
    if (users.length === 1) {
      let salt = bcrypt.genSaltSync(10);
      let hashedPassword = bcrypt.hashSync(req.body.newPassword, salt);
      con.query(`UPDATE users SET password=${mysql.escape(hashedPassword)} WHERE id=${mysql.escape(req.user.identifier)};`, (error, updatingUserResult, fields) => {
        if (error) {
          con.end();
          console.log(error.stack);
          return res.send();
        }
        con.end();
        req.flash('success', 'Successfully updated password.');
        return res.redirect('/platform/profile');
      });
    } else {
      con.end();
      req.flash('error', 'System error.');
      return res.redirect('/platform/profile');
    }
  });
});

router.post('/profile/change-goals', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.checkBody('weeklyCalorieGoal', 'Weekly calorie goal field is required.').notEmpty();
  req.checkBody('weeklyExerciseGoal', 'Weekly exercise goal field is required.').notEmpty();
  let formErrors = req.validationErrors();
  if (formErrors) {
      req.flash('error', formErrors[0].msg);
      return res.redirect('/register');
  }
  let con = mysql.createConnection(dbInfo);
  con.query(`UPDATE users SET weekly_calorie_goal=${mysql.escape(req.body.weeklyCalorieGoal)}, weekly_exercise_goal=${mysql.escape(req.body.weeklyExerciseGoal)} WHERE id=${mysql.escape(req.user.identifier)};`, (error, resultUpdatingUser, fields) => {
    if (error) {
      con.end();
      console.log(error.stack);
      return res.send();
    }
    req.flash('success', 'Successfully updated Workout App goals.');
    con.end();
    return res.redirect('/platform/profile');
  });
});

router.get('/my-workouts', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM workouts WHERE user=${mysql.escape(req.user.identifier)};`, (error, userWorkouts, fields) => {
    if (error) {
      console.log(error.stack);
      con.end();
      return res.send();
    }
    con.end();
    return res.render('platform/my-workouts.hbs', {
      error: req.flash('error'),
      success: req.flash('success'),
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      workouts: userWorkouts,
    });
  });
});

router.get('/workout-app-profiles', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  let con = mysql.createConnection(dbInfo);
  con.query(`SELECT * FROM users;`, (error, userWorkouts, fields) => {
    if (error) {
      console.log(error.stack);
      con.end();
      return res.send();
    }
    con.end();
    return res.render('platform/workout-app-profiles.hbs', {
      error: req.flash('error'),
      success: req.flash('success'),
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      workouts: userWorkouts,
    });
  });
});



module.exports = router;