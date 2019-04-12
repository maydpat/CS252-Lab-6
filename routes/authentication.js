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
let dbInfo = {
  host: "localhost",
  user: "root",
  password: "Okaydone1234!",
  database : 'workout'
};


module.exports = router;