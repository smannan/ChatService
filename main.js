var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

var bodyParser = require('body-parser');
var Session = require('./Routes/Session.js');
var Validator = require('./Routes/Validator.js');
var CnnPool = require('./Routes/CnnPool.js');

var async = require('async');

// express is a node js library which allows you to 
// set up middleware and route HTTP requests
var app = express();

// app.use(function(req, res, next) {console.log("Hello"); next();});
// Static paths to be served like index.html and all client side js
app.use(express.static(path.join(__dirname, 'public')));

// Parse all request bodies using JSON
app.use(bodyParser.json());

// Attach cookies to req as req.cookies.<cookieName>
app.use(cookieParser());

// Set up Session on req if available
app.use(Session.router);

// Check general login.  If OK, add Validator to 
// |req| and continue processing,
// otherwise respond immediately with 401 and noLogin error tag.
app.use(function(req, res, next) {
   if (req.session || (req.method === 'POST' &&
    (req.path === '/Prss' || req.path === '/Ssns'))) {
      req.validator = new Validator(req, res);
      next();
   } else
      res.status(401).end();
});

// Add DB connection, with smart chkQry method, to |req|
app.use(CnnPool.router);

// Load all subroutes
app.use('/Prss', require('./Routes/Account/Prss.js'));
app.use('/Ssns', require('./Routes/Account/Ssns.js'));
app.use('/Cnvs', require('./Routes/Conversation/Cnvs.js'));
app.use('/Msgs', require('./Routes/Conversation/Msgs.js'));

// Special debugging route for /DB DELETE.  
// Clears all table contents,
// resets all auto_increment keys to start at 1, 
// and reinserts one admin user.
app.delete('/DB', function(req, res) {
   var vld = req.validator;
   var cnn = req.cnn;

   async.series([
      /* Requires admin AU */
      function(callback) {
         if (vld.checkAdmin(callback)) {
            callback()
         }
      },

      /* Delete all persons, conversations, and messages */
      function(callback) {
         cnn.query('delete from Person', callback); 
      },
      function(callback) {
         cnn.query('delete from Conversation', callback); 
      },
      function(callback) {
         cnn.query('delete from Message', callback);
      },

      /* Reset auto increments to 1 */
      function(callback) {
         cnn.query('alter table Person auto_increment = 1', callback);
      },
      function(callback) {
         cnn.query('alter table Conversation auto_increment = 1', callback);
      },
      function(callback) {
         cnn.query('alter table Message auto_increment = 1', callback);
      },

      /* Insert Joe admin in persons table */
      function(callback) {
         cnn.query('INSERT INTO Person (firstName, lastName, email,' +
          ' password, whenRegistered, role) VALUES ' +
          '("Joe", "Admin", "adm@11.com","password", NOW(), 1);',
          callback);
      },

      /* Delete all sessions */
      function(callback) {
         for (var session in Session.sessions) {
            delete Session.sessions[session];
         }
         res.send(200).end();
         callback();
      }
   ],

   /* Finally, release db connection */
   function(err, status) {
      cnn.release();
      console.log(err);
   });
});

// Handler of last resort.  Print a stacktrace to console 
// and send a 500 response.
app.use(function(req, res, next) {
   res.status(404).end();
   req.cnn.release();
});

app.listen(parseInt(process.argv[3]), function () {
   console.log('App Listening on port');
});
