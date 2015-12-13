var express = require('express');
var exphbs = require('express-handlebars');
var logger = require('morgan');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var   passport = require('passport');
var   LocalStrategy = require('passport-local');

var methodOverride = require('method-override');
var session = require('express-session');
var config = require('./config.js'); //config file contains all tokens and other private info
var funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work

var  TwitterStrategy = require('passport-twitter');
var  GoogleStrategy = require('passport-google');
var   FacebookStrategy = require('passport-facebook');
var Twitter = require('twitter');

//var routes = require('./routes/index');
//var users = require('./routes/users');





var app = express();
var twitterResults;
var oldBody;

function queryTwitter(req, callback){
  callback = (typeof callback === 'function')? callback : function(){};

  if(oldBody !== req){
    oldBody = req;

    client.get('search/tweets', {q: req.body.match, until : req.body.endDate, result_type : req.body.resultType, geocode : req.body.country, lang: req.body.lang, count: 100},  function(error, tweets, response){
  
      if(error){
        console.log('There was an error.', error);
      }

      twitterResults = {search: tweets.search_metadata, results: tweets.statuses};
      callback();
    });

  } else {
    return twitterResults;
    callback();
  }
}//end of queryTwitter

//===============PASSPORT=================
// Use the LocalStrategy within Passport to login/”signin” users.
passport.use('local-signin', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localAuth(username, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        req.session.success = 'You are successfully logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));

// Use the LocalStrategy within Passport to register/"signup" users.
passport.use('local-signup', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localReg(username, password)
    .then(function (user) {
      if (user) {
        console.log("REGISTERED: " + user.username);
        req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT REGISTER");
        req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));

// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("deserializing " + obj);
  done(null, obj);
});

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.error = 'Please sign in!';
  res.redirect('/signin');
}
/*---------------------------End of passport--------------------------*/


/*----------------------------Sets up express-------------------------*/

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('X-HTTP-Method-Override'));

app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());

// Session-persisted message middleware
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

// Configure express to use handlebars templates
var hbs = exphbs.create({
    defaultLayout: 'main', //we will be creating this layout shortly
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');



// We hould move this for privacy at some point
var client = new Twitter({
  consumer_key: 'YjICBJeNlnxAf3tFw7awLaCzS',
  consumer_secret: '8IfPzkr4opePnhCLLloKMP6X44IeNav0fLDrmtBrPbaHoxd1nO',
  access_token_key: '4146680697-oOEPVezvvZ82vB7iP9HSbkoTG9ze9gH69XLrSCP',
  access_token_secret: 'HZjsaabmVjeSkSX6vvVFdT3GWZek8xJ9RKfwaR57RDyEG'
});






/*--------------------------------Routes-------------------------------------*/


// route to the login page
app.get('/', function(req, res){
  res.render('home', {user: req.user});
});

//displays our signup page
app.get('/signin', function(req, res){
  res.render('signin');
});

//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);


//sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/login', passport.authenticate('local-signin', { 
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);


//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGING OUT " + req.user.username)
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

app.post('home', function(req, res){
  //NODEMAILER
    // create reusable transporter object using SMTP transport
    var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cainajoao@gmail.com',
        pass: 'Sol2joey'
    }
    }, {
    // default values for sendMail method
    from: 'cainajoao@gmail.com',
    headers: {
        'My-Awesome-Header': '123'
    }
    });
    transporter.sendMail({
    to: 'ztburris@gmail.com',
    subject: 'hello',
    text: ''
    });
    //end of NODEMAILER
  queryTwitter(req, function(){
     res.status(200).render('home', twitterResults);   
   });
});





















/*--------------------------------End of Routes-------------------------------------*/

/*
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
*/

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));



//app.locals.appdata = require('./data.json');
//app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler


app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});





//===============PORT=================
var port = process.env.PORT || 3000; //select your port or let it pull from your .env file
app.listen(port);
console.log("listening on " + port + "!");


module.exports = app;
