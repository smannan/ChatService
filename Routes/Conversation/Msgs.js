var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');

router.baseURL = '/Msgs';

/* Get message with specified msgId
 * Send response with when the message was
 * made and the email of the Person who
 * posted the message.
*/
router.get('/:msgId', function(req, res) {
   var vld = req.validator;
   var msgId = req.params.msgId;
   var cnn = req.cnn;
   var query = 'select whenMade, p.email, content from Message m' +
    ' join Conversation c on cnvId = c.id join Person p on ' +
    ' prsId = p.id where m.id = ?';
   var params = [msgId];

   async.waterfall([
      /* Check for existence of conversation */
      function(cb) {  
         cnn.chkQry('select * from Message where id = ?', [msgId], cb);
      },

      /* Get messages if the message exists */
      function(cnvs, fields, cb) { 
         if (vld.check(cnvs.length, Tags.notFound, null, cb)) {
            cnn.chkQry(query, params, cb);
         }
      },

      /* Return retrieved messages */
      function(msgs, fields, cb) { 
         res.json(msgs[0]);
         cb();
      }],

      /* Finally, release db connection */
      function(err){
         cnn.release();
   });
});

module.exports = router;
