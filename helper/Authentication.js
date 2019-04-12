const request = require('request');
const _ = require('lodash');
const handlebars = require('handlebars');


module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
  },

  ensureNotAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) { return res.redirect('/platform/dashboard'); }
    next();
  },
}