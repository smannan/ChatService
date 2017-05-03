var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');

router.baseURL = '/Msgs';

router.get('/:msgId', function(req, res) {
   console.log('GETTING MSGS');

   var vld = req.validator;
   var msgId = req.params.msgId;
   var cnn = req.cnn;
   var query = 'select whenMade, p.email, content from Message m' +
    ' join Conversation c on cnvId = c.id join Person p on prsId = p.id where m.id = ?';
   var params = [msgId];

   async.waterfall([
      function(cb) {  // Check for existence of conversation
         cnn.chkQry('select * from Message where id = ?', [msgId], cb);
      },
      function(cnvs, fields, cb) { // Get indicated messages
         console.log('GOT MSGS');
         console.log(cnvs);
         if (vld.check(cnvs.length, Tags.notFound, null, cb)) // status 401 if message doesn't exist
            cnn.chkQry(query, params, cb);
      },
      function(msgs, fields, cb) { // Return retrieved messages
         res.json(msgs[0]);
      }],
      function(err){
         cnn.release();
      });
});

module.exports = router;
