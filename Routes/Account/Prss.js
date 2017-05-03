var Express = require('express'); 
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');
var mysql = require('mysql');

router.baseURL = '/Prss';

/*
*/
router.get('/', function(req, res) {
   var email = (req.session.isAdmin() && req.query.email) ||
    (!req.session.isAdmin() && req.session.email === req.query.email);
   var cnnConfig = {
      host     : 'localhost',
      user     : 'smannan',
      password : 'S2n0j1m6',
      database : 'smannan'
   };

   req.cnn.release();  // Since we're not using that

   var cnn = mysql.createConnection(cnnConfig);
   vld = req.validator;

   if (email) {
      cnn.query('select id, email from Person where email = ?', [req.params.email],
      function(err, result) {
         if (err) {
            cnn.destroy();
            res.status(500).json("Failed query");
         }
         else {
            cnn.destroy();
            res.status(200).json(result);
         }
      });
   }
   else 
      var sql = 'select id, email from Person';
      params = null;

      if (!req.session.isAdmin()) {
         sql += ' where id = ?';
         params = [req.session.id];
      }

      cnn.query(sql, params,
      function(err, result) {
         if (err) {
            cnn.destroy();
            res.status(500).json("Failed query");
         }
         else {
            cnn.destroy();
            res.status(200).json(result);
         }
      });
});

/*
// Non-waterfall, non-validator, non-db automation version
router.post('/', function(req, res) {
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var errorList = [];
   var qry;
   var noPerm;
   var cnnConfig = {
      host     : 'localhost',
      user     : 'smannan',
      password : 'S2n0j1m6',
      database : 'smannan'
   };

   req.cnn.release();  // Since we're not using that

   if (admin && !body.password)
      body.password = "*";                       // Blocking password
   body.whenRegistered = new Date();

   // Check for fields
   if (!body.hasOwnProperty('email'))
      errorList.push({tag: "missingField", params: "email"});
   if (!body.hasOwnProperty('lastName'))
      errorList.push({tag: "missingField", params: "lastName"});
   if (!body.hasOwnProperty('password'))
      errorList.push({tag: "missingField", params: "email"});
   if (!body.hasOwnProperty('role'))
      errorList.push({tag: "missingField", params: "role"});

   // Do these checks only if all fields are there
   if (!errorList.length) {
      noPerm = body.role === 1 && !admin;
      if (!body.termsAccepted)
         errorList.push({tag: "noTerms"});
      if (body.role < 0)
         errorList.push({tag: "badVal", param: "role"});
   }

   // Post errors, or proceed with data fetches
   if (noPerm)
      res.status(403).end();
   else if (errorList.length)
      res.status(400).json(errorList);
   else {
      var cnn = mysql.createConnection(cnnConfig);

      // Find duplicate Email if any.
      cnn.query(qry = 'select * from Person where email = ?', body.email,
      function(err, dupEmail) {
         if (err) {
            cnn.destroy();
            res.status(500).json("Failed query " + qry);
         }
         else if (dupEmail.length) {
            cnn.destroy();
            res.status(400).json({tag: "dupEmail"});
         }
         else { // No duplicate, so make a new Person
            body.termsAccepted = body.termsAccepted && new Date();
            cnn.query(qry = 'insert into Person set ?', body,
            function(err, insRes) {
               cnn.destroy();
               if (err)
                  res.status(500).json("Failed query " + qry);
               else
                  res.location(router.baseURL + '/' + insRes.insertId).end();
            });
          }
      });
   }
});
*/

/* Much nicer versions
router.get('/', function(req, res) {
   var email = req.session.isAdmin() && req.query.email ||
    !req.session.isAdmin() && req.session.email;

   var handler = function(err, prsArr) {
      res.json(prsArr);
      req.cnn.release();
   };

   if (email)
      req.cnn.chkQry('select id, email from Person where email = ?', [email],
       handler);
   else
      req.cnn.chkQry('select id, email from Person', handler);
});
*/ 

router.post('/', function(req, res) {
   var vld = req.validator;  // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn = req.cnn;

   if (admin && !body.password)
      body.password = "*";                       // Blocking password
   body.whenRegistered = new Date();

   async.waterfall([
   function(cb) { // Check properties and search for Email duplicates
      if (vld.hasFields(body, ["email", "lastName", "password", "role"], cb) &&
       vld.chain(admin || (!admin && body.password), Tags.missingField, ["password"])
       .chain(body.role === 0 || admin, Tags.noPermission)
       .chain(body.termsAccepted || admin, Tags.noTerms)
       .check(body.role === 0 || body.role === 1, Tags.badValue, ["role"], cb)) {
         cnn.chkQry('select * from Person where email = ?', body.email, cb);
      }
   },
   function(existingPrss, fields, cb) {  // If no duplicates, insert new Person
      if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
         body.termsAccepted = ((admin && !body.termsAccepted )&& new Date()) || (body.termsAccepted && new Date());
         cnn.chkQry('insert into Person set ?', body, cb);
      }
   },
   function(result, fields, cb) { // Return location of inserted Person
      res.location(router.baseURL + '/' + result.insertId).end();
      cb();
   }],
   function() {
      cnn.release();
   });
});

router.get('/:id', function(req, res) {
   var vld = req.validator;

   if (vld.checkPrsOK(req.params.id)) {
      req.cnn.query('select * from Person where id = ?', [req.params.id],
      function(err, prsArr) {
         if (vld.check(prsArr.length, Tags.notFound)) {
            delete prsArr[0].password;
            res.json(prsArr);
         }
         req.cnn.release();
      });
   }
   else {
      req.cnn.release();
      res.status(401).end();
   }
});

router.put('/:id', function(req, res) {
   var vld = req.validator;  // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn = req.cnn;

   async.waterfall([
   function(cb) { // Check properties and search for Email duplicates
      if (vld.checkPrsOK(req.params.id, cb) &&

         vld.hasOnlyFields(body, ["firstName", "lastName", "password", "role", "oldPassword"], cb) &&

         vld.check(admin || (!body.password || (body.password && body.oldPassword)), 
            Tags.badValue, ["noOldPwd"], cb) &&

         vld.check(admin || (!admin && !body.role), Tags.badValue, ["role"], cb)) {

         cnn.chkQry('select * from Person where id = ?', req.params.id, cb);
      }
   },
   function(existingPrss, fields, cb) {
      if (vld.check(existingPrss.length, Tags.notFound, null, cb) &&

         vld.check(admin || (!body.password || (!admin && body.password && body.oldPassword 
            && body.oldPassword == existingPrss[0].password)),
            Tags.badValue, ["oldPwdMismatch"], cb)) {
            
            delete body.oldPassword;
            cnn.chkQry("update Person set ? where ?", [body, {id : req.params.id}], cb);
      }
   },
   function(result, fields, cb) {
      res.status(200).end();
      cb();
   }],
   function() {
      cnn.release();
   });
});

router.delete('/:id', function(req, res) {
   var vld = req.validator;

   if (vld.checkAdmin())
      req.cnn.query('DELETE from Person where id = ?', [req.params.id],
      function (err, result) {
         if (!err || vld.check(result.affectedRows, Tags.notFound))
            res.status(200).end();
         req.cnn.release();
      });
   else {
      req.cnn.release();
   }
});

module.exports = router;
