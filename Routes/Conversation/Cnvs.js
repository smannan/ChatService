var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');

router.baseURL = '/Cnvs';

/* Get all conversations from the db 
 * Send a response with conversation
 * id, title, owner id, and last message
*/
router.get('/', function(req, res) {
   var owner = req.query.owner;
   var query = 'select id, title, ownerId, lastMessage from Conversation';
   var params = [];

   /* limited to Conversations with the specified 
    * owner if query param is given
   */
   if (owner) {
      query += ' where ownerId = ?';
      params = [owner];
   }

   req.cnn.chkQry(query, params,
   function(err, cnvs) {
      if (!err) {
         res.json(cnvs);
      }
      req.cnn.release();
   });
});

/* Get conversation with the specified
 * conversation id.
 * Send a response with conversation
 * id, title, owner id, and last message
*/
router.get('/:cnvId', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;

   async.waterfall([
   function(cb) {
      cnn.chkQry('select id, title, ownerId, lastMessage from ' +
       ' Conversation where id = ?', [req.params.cnvId], cb);
   },

   function(cnvs, fields, cb) {
      /* Not found if conversation does not exist. */
      if (vld.check(cnvs.length, Tags.notFound, null, cb)) {
         res.json(cnvs[0]);
         cb();
      }
   }],

   function() {
      cnn.release();
   });
});

/* Post a new conversation */
router.post('/', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;

   async.waterfall([
   function(cb) {
      cnn.chkQry('select * from Conversation where title = ?', 
       body.title, cb);
   },

   function(existingCnv, fields, cb) {
      /* Title limited to 80 chars 
       * Duplicate title error if the conversation
       * already exists.
      */
      if (vld.chain(body.title.length < 80, Tags.badValue, null)
       .check(!existingCnv.length, Tags.dupTitle, null, cb)) {
         body.ownerId = req.session.id;
         cnn.chkQry("insert into Conversation set ?", body, cb);
      }
   },

   function(insRes, fields, cb) {
      res.location(router.baseURL + '/' + insRes.insertId).end();
      cb();
   }],

   /* Finally, release the db connection */
   function() {
      cnn.release();
   });
});

/* Update an existing conversation */
router.put('/:cnvId', function(req, res) {
   var vld = req.validator;
   var body = req.body;
   var cnn = req.cnn;
   var cnvId = req.params.cnvId;

   async.waterfall([
   /* Get the conversation with specified id */
   function(cb) {
      cnn.chkQry('select * from Conversation where id = ?', 
       [cnvId], cb);
   },

   /* Make sure conversation exists and person 
    * updating the conversation is the correct AU.
    */
   function(cnvs, fields, cb) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
       vld.checkPrsOK(cnvs[0].ownerId, cb)) {

         cnn.chkQry('select * from Conversation where id <> ? && title = ?',
          [cnvId, body.title], cb);
      }
   },

   function(sameTtl, fields, cb) {
      if (vld.check(!sameTtl.length, Tags.dupTitle, cb))
         cnn.chkQry("update Conversation set title = ? where id = ?",
          [body.title, cnvId], cb);
   }],

   function(err) {
      if (!err) {
         res.status(200).end();
      }
      req.cnn.release();
   });
});

/* Delete an existing conversation */
router.delete('/:cnvId', function(req, res) {
   var vld = req.validator;
   var cnvId = req.params.cnvId;
   var cnn = req.cnn;
   var admin = req.session && req.session.isAdmin();

   console.log('DELETE');

   async.waterfall([
   function(cb) {
      console.log('GETTING CNVS');
      cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs, fields, cb) {
      console.log('PERSON');
      console.log(cnvs[0].ownerId);
      if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
       vld.checkPrsOK(cnvs[0].ownerId, cb)) { 
         console.log('DELETING CONVS');
         console.log(cnvId)
         cnn.chkQry('delete from Conversation where id = ?', [cnvId], cb);
      }
   }],
   function(err) {
      if (!err) {
         res.status(200).end();
      }
      cnn.release();
   });
});

router.get('/:cnvId/Msgs', function(req, res) {
   console.log(new Date());
   var vld = req.validator;
   var cnvId = req.params.cnvId;
   var cnn = req.cnn;
   var query = 'select whenMade, email, content, m.id as id from Conversation c' +
    ' join Message m on cnvId = c.id join Person p on prsId = p.id where c.id = ?' +
    ' and m.whenMade <= ? ' +
    ' order by whenMade asc';

   var params = [cnvId];

   if (req.query.dateTime) {
      params.push(req.query.dateTime);
   }

   else {
      params.push(new Date());
   }

   // And finally add a limit clause and parameter if indicated.
   if (req.query.num) {
      query += ' limit ?';
      params.push(parseInt(req.query.num));
   }

   async.waterfall([
   function(cb) {  // Check for existence of conversation
      cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs, fields, cb) { // Get indicated messages
      if (vld.check(cnvs.length, Tags.notFound, null, cb)) {
         cnn.chkQry(query, params, cb);
      }
   },
   function(msgs, fields, cb) { // Return retrieved messages
      res.status(200).json(msgs);
      cb();
   }],
   function(err){
      cnn.release();
   });
});

router.post('/:cnvId/Msgs', function(req, res){
   var vld = req.validator;
   var cnn = req.cnn;
   var cnvId = req.params.cnvId;
   var body = req.body;

   async.waterfall([
   function(cb) {
      console.log(cnvId);
      cnn.chkQry('select * from Conversation where id = ?', [cnvId], cb);
   },
   function(cnvs, fields, cb) {
      if (vld.check(cnvs.length, Tags.notFound, null, cb) &&
         vld.check(body.content.length < 500, Tags.badValue, ["content"], cb)) 
      {
            new_message = {cnvId: cnvId, prsId: req.session.id,
             whenMade: date = new Date(), content: req.body.content};

            cnn.chkQry("insert into Message set ?", [new_message], cb);
      }
   },
   function(insRes, fields, cb) {
      res.location(router.baseURL + '/' + insRes.insertId).end();
      cnn.chkQry("update Conversation set lastMessage = ? where id = ?",
       [new Date(), cnvId], cb);
   }],
   function(err) {
      cnn.release();
   });
});

module.exports = router;
