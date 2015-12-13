var express = require('express');
var router = express.Router();
var appdata = require('../data.json');


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Home' });
});

// route to the login page
router.get('/', function(req, res){
  res.render('home', {user: req.user});
});

//display signin page
router.get('/', function(req, res){
  res.render('home', {user: req.user});
});

//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
router.post('/local-reg', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);


//sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
router.post('/login', passport.authenticate('local-signin', { 
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);


//logs user out of site, deleting them from the session, and returns to homepage
router.get('/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGIN OUT " + req.user.username)
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});


/*GET to the email */
router.get('/email', function(req, res) {
  res.render('Email', { title: 'Email' });
});


module.exports = router;
