// *******************************************************
// expressjs template
//
// assumes: npm install express
// defaults to jade engine, install others as needed
//
// assumes these subfolders:
//   public/
//   public/javascripts/
//   public/stylesheets/
//   views/
//
var express = require('express');
var url = require('url');
if (process.env.CLOUDANT_URL)
{
  var couch_url = process.env.CLOUDANT_URL;
  var couch_auth = couch_url.match(/\/\/(.+?)\@/)[1];
  couch_url = url.parse(couch_url.replace(couch_auth+'@',''));

  var cradle = require('cradle');
  var dbconn = new(cradle.Connection)(couch_url, 443, 
    {
      cache:false, 
      raw:false, 
      auth: {
        username: couch_auth.split(':')[0],
        password: couch_auth.split(':')[1]
      },
      secure: true
    }
  );
  var messages = dbconn.database('messages');
}
if(process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'PGP Message'
  });
}
var app = express();
var viewEngine = 'jade'; // modify for your view engine
// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', viewEngine);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
  app.use(express.errorHandler());
});
app.post("/messages", function(req,res)
{
    //console.log(req.body['data']);
    var obj = {
        received_at: Date.now(),
        message: req.body['data']
    }
    console.log(JSON.stringify(obj));
    if (messages)
    {
      messages.save(obj,function(err, resp)
      {
        console.log(resp);
        if (err)
        {
            //res.code();
            res.end("An error has occurred.")
            return;
        }
        res.end(obj.message);
      });
    } else
    {
      res.end(obj.message);
    }
})
// *******************************************************
app.listen(process.env.PORT);