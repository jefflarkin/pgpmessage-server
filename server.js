// *******************************************************
// NodeJS reference implementation of PGP Message.
// Author: Jeff Larkin (http://contact.jefflarkin.com)
// License: MIT License
// Version: 0.0.1
var express = require('express');
var url = require('url');
// Setup CouchDB message store
if (process.env.CLOUDANT_URL || process.env.COUCHDB_URL)
{
  var couch_url = process.env.CLOUDANT_URL || process.env.COUCHDB_URL;
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
// NodeTime Heroku Add-on
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
// Message Receive Endpoint
// Expects: POST to message with OpenPGP ASCII Armoured text
// Returns: Message received for verification by client
// Suggestion: Read the message headers and compare recipient against key whitelist
app.post("/messages", function(req,res)
{
    var obj = {
        // Useful for sorting, but not required
        received_at: Date.now(),
        message: req.body['message']
    }
    if (messages)
    {
      messages.save(obj,function(err, resp)
      {
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
});
// List available messages or redirect back to index
app.get("/messages", function(req,res)
{
    // Provide list of available messages
    if ( req.is('json') )
    {
        res.set('Content-Type', 'application/json');
        messages.view("messages/all", function(err,resp)
        {
            // TODO Should handle errors better
            if (err) res.end("[]");
            else res.end(JSON.stringify(resp));
        });
    } else // Default to HTML
    {
        res.redirect("/");
    }
});
// Return a particular message or redirect back to index
app.get("/messages/:id", function(req,res)
{
    // Return requested message
    // Format: { id: ####, message: armor-text[, read: boolean] }
    if ( req.is('json') )
    {
        res.set('Content-Type', 'application/json');
        messages.get(req.params.id,function(err,resp)
        {
            // TODO Handle errors better
            if (err) res.end("{}");
            else res.end(JSON.stringify(resp)); });
    } else // Default to HTML
    {
        res.redirect("/");
    }
});
// Update a particular message
app.put("/messages/:id", function(req,res)
{
    // Return requested message
    // Format: { id: ####, message: armor-text[, read: boolean] }
    if ( req.is('json') )
    {
        res.set('Content-Type', 'application/json');
        messages.get(req.params.id,function(err,resp)
        {
            res.set('Content-Type', 'application/json');
            if(!err)
            {
                messages.save(req.params.id,resp.rev,function(err2,resp2)
                {
                    res.end(JSON.stringify(resp2));
                });
            } else { res.end('error'); }
        });
    } else // Default to HTML
    {
        res.redirect("/");
    }
});
// Delete a particular message
app.delete("/messages/:id", function(req,res)
{
    // Return requested message
    // Format: { id: ####, message: armor-text[, read: boolean] }
    if ( req.is('json') )
    {
        messages.get(req.params.id,function(err,resp)
        {
            res.set('Content-Type', 'application/json');
            if(!err)
            {
                messages.remove(req.params.id,resp.rev,function(err2,resp2)
                {
                    res.end('{"ok:"+resp2.ok+"}"');
                });
            } else { res.end('error'); }
        });
    } else // Default to HTML
    {
        res.redirect("/");
    }
});
// *******************************************************
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000;
app.listen(port);
