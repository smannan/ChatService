var Express = require('express');
var CnnPool = require('../CnnPool.js');
var Tags = require('../Validator.js').Tags;
var ssnUtil = require('../Session.js');
var router = Express.Router({caseSensitive: true});

router.baseURL = '/Ssns';

/* Get all sessions.
 * Send a response with a list of
 * sessions containing session cookie,
 * Person Id, and login time.
*/
router.get('/', function(req, res) {
   var body = [], ssn;

   if (req.validator.checkAdmin()) {
      for (var cookie in ssnUtil.sessions) {
         ssn = ssnUtil.sessions[cookie];
         body.push({cookie: cookie, prsId: ssn.id, loginTime: 
          ssn.loginTime});
      }
      res.status(200).json(body);
   }
   req.cnn.release();
});

/* Post a new session, or login a person. */
router.post('/', function(req, res) {
   var cookie;
   var cnn = req.cnn;

   cnn.query('select * from Person where email = ?', [req.body.email],
   function(err, result) {

      /* If the person doesn't exist or their password is wrong
       * send a bad login error. Otherwise create a new session
       * cookie and set the current session to the new one.
      */
      if (req.validator.check(result.length && result[0].password ===
       req.body.password, Tags.badLogin)) { 
         cookie = ssnUtil.makeSession(result[0], res);
         res.location(router.baseURL + '/' + cookie).status(200).end();
      }
      cnn.release();
   });
});

/* Log someone out, or delete a session. */
router.delete('/:cookie', function(req, res, next) {
   var admin = req.session && req.session.isAdmin();
   var sess = ssnUtil.sessions;
   
   /* AU must be person in question or admin 
    * if AU is correct, delete the session.
    */
   console.log('DELETING A SESSION');
   console.log('PARAMS COOKIE');
   console.log(req.params.cookie);
   console.log('SESSION TO DELETE');
   console.log(req.cookies[ssnUtil.cookieName]);
   console.log(ssnUtil.sessions[req.params.cookie]);
   console.log(req.session);
   
   //if (admin || req.validator.check(req.params.cookie === 
   // req.cookies[ssnUtil.cookieName], Tags.noPermission, null)) {
   if (admin || req.validator.check(req.session.id === 
    ssnUtil.sessions[req.params.cookie].id, Tags.noPermission, null)) {
      ssnUtil.deleteSession(req.params.cookie);
      res.status(200).end();
   }

   req.cnn.release();
});

/* Retrieve a session with specified cookie 
 * Send a respons with the person's id, their
 * login time, and the specified cookie.
*/
router.get('/:cookie', function(req, res, next) {
   var cookie = req.params.cookie;
   var vld = req.validator;

   /* If AU is admin or person in question, delete
    * session.
    */
   if (vld.checkPrsOK(ssnUtil.sessions[cookie].id)) {
      res.json({prsId: req.session.id, loginTime: 
       req.session.loginTime, cookie: req.params.cookie });
   }

   req.cnn.release();
});

module.exports = router;
