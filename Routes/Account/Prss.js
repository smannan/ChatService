var Express = require('express'); 
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');
var mysql = require('mysql');

router.baseURL = '/Prss';

/*
 * Retrieves a person from the database
 * sends a response with either the 
 * Person's id and email if the request
 * query has an email or the Person's
 * email, first name, last name, role, id
 * terms accepted, and when registered
*/
router.get('/', function(req, res) 
{
   var email = (req.session.isAdmin() && req.query.email) ||
   (!req.session.isAdmin() && req.query.email);

   var cnn = req.cnn;
   vld = req.validator;
   
   var admin = req.session && req.session.isAdmin();
   
   /* 
   * if the request query has an email just
   * return id and email.
   */
   if (email) {
      var sql = 'select id, email from Person where ' +
       ' substring(email, 1, ' + req.query.email.length +
       ' ) = ?';

      cnn.query(sql, [req.query.email],
      
      function(err, result) {
         if (err) {
            res.status(500).json("Failed query");
         }

         else {
            /* 
            * trying to request an email of someone other
            * then AU will result in an empty list.
            */
            var students = [];
            for (idx = 0; result.length && idx < result.length; idx++) {
               if (admin || (result[idx].id === req.session.id)) {
                  students.push(result[idx]);
               }
            }
             
            res.status(200).json(students);
         }
      });

      cnn.release();
   }

   else {
      var sql = 'select email, id from Person';
      params = null;

      /* if AU is not admin only return
      * information for the AU.
      */
      if (!req.session.isAdmin()) {
         sql += ' where id = ?';
         params = [req.session.id];
      }

      cnn.query(sql, params,
      function(err, result) {
         if (err) {
            res.status(500).json("Failed query");
         }
         else {
            res.status(200).json(result);
         }
      });
      cnn.release();
   }
});

/* 
 * Registers a new Person
 * Adds the new person's information
 * the the database.
*/
router.post('/', function(req, res) {
   var vld = req.validator;  // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn = req.cnn;
   
   if (admin && !body.password) {
      /* Blocking password */
      body.password = "*";   
   }                
   body.whenRegistered = (new Date()).toISOString().slice(0, 19)
    .replace('T', ' ');
   
   async.waterfall([
   function(cb) { 
      /* Make sure registration has all required information */
      if (vld.hasFields(body, ["email", "lastName", "password", 
       "role"], cb) &&
       
       /* non-empty password required unless AU is admin */
       vld.chain(admin || (!admin && body.password), Tags.missingField, 
        ["password"])
       
       /* Error forbiddenRole if role is not student unless AU is admin. */
       .chain(body.role === 0 || admin, Tags.noPermission, null)
       
       /* Error if terms were not accepted and AU is not admin. */
       .chain(body.termsAccepted || admin, Tags.noTerms, null)
       
       /* Error bad value if role is not 0 or 1 */
       .check(body.role === 0 || body.role === 1, Tags.badValue, 
        ["role"], cb)) {
         cnn.chkQry('select * from Person where email = ?', body.email, cb);
      }
   },

   /* If no duplicates, insert new Person */
   function(existingPrss, fields, cb) {  

      /* Error duplicate email if the person exists */
      if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
         if (body.termsAccepted) { 
            body.termsAccepted = (new Date()).toISOString().slice(0, 19)
             .replace('T', ' ');
         }
         else {
            body.termsAccepted = null;
         }
         
         console.log('INSERTING A PERSON');
         console.log(body);
         cnn.chkQry('insert into Person set ?', body, cb);
      }
   },

   /* Return location of inserted Person */
   function(result, fields, cb) { 
      res.location(router.baseURL + '/' + result.insertId).end();
      cb();
   }],

   /* Finally, release database connection. */
   function() {
      cnn.release();
   });
});

/* Get the person with the specified 
 * id, in the request parameter.
 */
router.get('/:id', function(req, res) {
   var vld = req.validator;

   /* AU must be person {prsId} or admin. */
   if (vld.checkPrsOK(req.params.id)) {
      req.cnn.query('select * from Person where id = ?', [req.params.id],
      function(err, prsArr) {
         /* Error is person does not exist */
         if (vld.check(prsArr.length, Tags.notFound, null)) {
            /* Password is not returned */
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

/* Modify a person's information */
router.put('/:id', function(req, res) {
   var vld = req.validator;  // Shorthands
   var body = req.body;
   var admin = req.session && req.session.isAdmin();
   var cnn = req.cnn;
   var allowedFields = ["firstName", "lastName", "password", "role",
    "oldPassword"];

   async.waterfall([
   function(cb) {
      /* All changes require the AU be the Person in 
       * question, or an admin. 
       */
      if (vld.checkPrsOK(req.params.id, cb) &&
       
       /* Fields that are not allowed result in a bad value error */
       vld.hasOnlyFields(body, allowedFields, cb) &&
       
       /* Unless AU is admin, an additional field oldPassword 
       * is required for changing password.
       */
       vld.check(!body.hasOwnProperty('password') || body.password,
        Tags.badValue, ['password'], cb) &&
       
       vld.check((admin || !body.hasOwnProperty('password')) || 
        (body.hasOwnProperty('password') && 
        body.hasOwnProperty('oldPassword') &&
        body.oldPassword),
        Tags.noOldPwd, null, cb) &&

       /* Role changes result in BAD_REQUEST with 
        * badValue tag for nonadmins. 
        */
       vld.check(admin || (!admin && !body.role), Tags.badValue, 
       ["role"], cb)) {
         cnn.chkQry('select * from Person where id = ?', req.params.id, cb);
      }
   },

   function(existingPrss, fields, cb) {
      /* Not found error if the person does not exist */
      if (vld.check(existingPrss.length, Tags.notFound, null, cb) &&
       
       /* If AU is not admin, body password must match old password
       * if the password is being updated
       */
       vld.check((admin || !body.hasOwnProperty('password')) || 
        (body.oldPassword == existingPrss[0].password),
        Tags.oldPwdMismatch, null, cb)) {

         /* Update person's information. */
         delete body.oldPassword;
         cnn.chkQry("update Person set ? where ?", [body, {id : 
          req.params.id}], cb);
      }
   },

   function(result, fields, cb) {
      res.status(200).end();
      cb();
   }],

   /* Finally, release the db connection. */
   function() {
      cnn.release();
   });
});

/* Delete a person from the db */
router.delete('/:id', function(req, res) {
   var vld = req.validator;

   async.waterfall([
   function(cb) {
      req.cnn.chkQry('select * from Person where id = ?', req.params.id, cb);
   },
   
   function(existingPrss, fields, cb) {   
      /* Admin AU is required */
      if (vld.checkAdmin() && vld.check(existingPrss.length, 
       Tags.notFound, null, cb)) {
         req.cnn.chkQry('DELETE from Person where id = ?', 
          [req.params.id], cb);
      }
   },

   function(result, fields, cb) {
      res.status(200).end();
      cb();
   }],
   
   /* Finally, release the db connection. */
   function(cb) {
      req.cnn.release();
   });
});

module.exports = router;
