const _ = require('lodash');
const handlebars = require('handlebars');
const express = require('express');
const session = require('express-session');
const expressValidator = require('express-validator');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
var passport = require("passport");
var request = require("request");
const mysql = require('mysql');
let dbInfo = {
  host: "localhost",
  user: "root",
  password: "Okaydone1234!",
  database : 'workout'
};

function formatDate(date){

      var dd = date.getDate();
      var mm = date.getMonth()+1;
      var yyyy = date.getFullYear();
      if(dd<10) {dd='0'+dd}
      if(mm<10) {mm='0'+mm}
      date = yyyy+'-'+mm+'-'+dd;
      return date
   }

function getData(dates, userID, graph) {
  return new Promise(function(resolve, reject) {
    let con = mysql.createConnection(dbInfo);
    con.query(`SELECT * FROM workouts WHERE date>=${mysql.escape(dates[0])} AND user=${mysql.escape(userID)};`, (error, workouts, fields) => {
      if (error) {
        console.log(error.stack);
        con.end();
        reject(error);
      }
      for (let i = 0; i < workouts.length; i++) {
        let workoutDate = new Date(workouts[i].date);
        for (let j = graph.length - 1; j >= 0; j--) {
          let datesObj = new Date(graph[j].y);
          if (workoutDate >= datesObj) {
            graph[j].a = Number(graph[j].a) + Number(workouts[i].calories);
            graph[j].b = Number(graph[j].b) + Number(workouts[i].hours);
            break;
          }
        }
      }
      resolve(graph);
    })
  })
}
async function buildGraph(dates, userID) {
  let graph = [];
  for (let i = 0; i < dates.length; i++) {
    graph.push({
      y: dates[i],
      a: 0, // calories
      b: 0 // hours
    });
  }
  let response = await getData(dates, userID, graph);
  return response;
}



module.exports = {
  buildGraph,


}

