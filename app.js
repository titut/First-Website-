var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const socketio = require('socket.io');

const validator = require('express-validator');
const session = require('express-session');
const flash = require('express-flash-notification');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');

const pathConfig = require('./path');
const database = require('./app/configs/database');

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;


// Define Path
global.__base           = __dirname + '/';
global.__path_app       = __base + pathConfig.folder_app + '/';
global.__path_configs   = __path_app + pathConfig.folder_configs + '/';
global.__path_helpers   = __path_app + pathConfig.folder_helpers + '/';
global.__path_routers   = __path_app + pathConfig.folder_routers + '/';
global.__path_schemas   = __path_app + pathConfig.folder_schemas + '/';
global.__path_validates = __path_app + pathConfig.folder_validates + '/';
global.__path_views     = __path_app + pathConfig.folder_views + '/';
global.__path_views_admin = __path_app + pathConfig.folder_views + "/" + pathConfig.folder_admin + "/";
global.__path_models    = __path_app + pathConfig.folder_models + '/';


const systemConfig = require(__path_configs + 'system');
const databaseConfig = require(__path_configs + 'database');
const User	= require(__path_schemas + 'users');

mongoose.connect(`mongodb+srv://${database.username}:${database.password}@billcluster-wakvv.gcp.mongodb.net/${database.database}?retryWrites=true&w=majority`);


var app = express();

const server = require('http').createServer(app);
const io = socketio(server);

require('./io')(io);

app.use(cookieParser());
app.use(session({
  secret: 'abcnhds',
  resave: false,
  saveUninitialized: true}
));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash(app, {
   viewName: __path_views + 'admin/elements/notify',
 }));
 
app.use(validator({
  customValidators: {
    isNotEqual: (value1, value2) => {
      return value1!==value2;
    }
  }
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ name: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, {message: 'Incorrect username.'});
      }
      if (user.password != password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', __path_views_admin + 'backend');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Local variable
app.locals.systemConfig = systemConfig;

// Setup router
app.use(`/${systemConfig.prefixAdmin}`, require(__path_routers + 'backend/index'));
app.use('/', require(__path_routers + 'frontend/index'));
app.use('/chat', require(__path_routers + 'chat/index'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : "Page Not Found";

  // render the error page
  //res.status(err.status || 500);
  res.render(__path_views +  'admin/pages/error', {pageTitle   : 'Page Not Found ', top_post: false});
});

module.exports = {app, server};

