const passport = require('passport')
var localStrategy = require('passport-local').Strategy;
var User = require('../models/sequelize').User;
var AuthRequest = require('../models/sequelize').AuthRequest;
var moment = require('moment');

