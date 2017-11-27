var express = require('express');
require('dotenv').config();

//database
var mongodb = require("mongodb");
var app = express();
app.disable('x-powered-by');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(require('body-parser').urlencoded({extended: true}));

var formidable = require('formidable');

var SpotifyWebApi = require('spotify-web-api-node');

//ajv is used to validate the json
var Ajv = require('ajv');

var songSchema = {
      "type": "object",
      "required": ["Type","songId", "name"],
      "properties": {
        "Type": {
          "type":"string", "enum": ["Song"]
        },
        "songId": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "artist": {
          "type": "string"
        },
        "album": {
          "type": "string"
        },
        "year": {
          "type": "integer"
        },
        "score": {
          "type": "integer"
        }
      },
      "additionalProperties" : false
    };

var userSchema = {
  "type":"object",
  "required": ["Type", "userId", "name"],
  "properties": {
    "Type": {
      "type":"string", "enum": ["User"]
          },
  "userId": {
    "type":"string"
          },
   "name": {
      "type":"string"
          },
  "party": {
      "type": "string"
  },
  "anthem": {
            "type": "string"
          }
        },
          "additionalProperties" : false
};

var eventSchema = {
  "type":"object",
  "required": ["Type", "eventId", "user"],
  "properties": {
    "Type": {
      "type": "string", "enum": ["Event"]
    },
    "eventId": {
      "type":"string"
    },
    "user": {
      "type":"string"
    },
    "description": {
      "type":"string"
    },
    "value": {
      "type":"integer"
    },
    "time": {
      "type": "string"
    }
  },
  "additionalProperties" : false
};

var partySchema = {
  "type": "object",
  "required": ["Type", "partyId", "host", "playlist"],
  "properties": {
    "Type": {
      "type": "string", "enum": ["Party"]
    },
    "partyId": {
      "type":"string"
    },
    "description": {
      "type": "string"
    },
    "host" : {
      "type": "string"
    },
    "playlist" : {
      "type": "string"
    },
    "guests":{
      "type": "array", "items": {"type": "string"}
    },
    "events": {
      "type": "array", "items": {"type": "string"}
    },
    "password": {
      "type": "string"
    }
    },
        "additionalProperties": false

};



var ajv = new Ajv();
var songValidate = ajv.compile(songSchema);
var userValidate = ajv.compile(userSchema);
var eventValidate = ajv.compile(eventSchema);
var partyValidate = ajv.compile(partySchema);

var spotifyApi = new SpotifyWebApi({
  clientId : process.env.CLIENT_ID,
  clientSecret : process.env.CLIENT_SECRET,
});

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res){
  res.render('home');
});

app.get('/insert', function(req, res) {
	res.render('insert');
});


app.get('/list', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/test';
  MongoClient.connect(url, function(err, db) {
    if (err){
      console.log('Unable to connect to db', err);
    } else {
      console.log('Connection established');
      var SongString = "";
      var EventString = "";
      var PartyString = "";
      var UserString = "";
      var TestString = "";
      var TotalString = "";
      var cl = db.collection('test');

      cl.find().each( function(err, doc) {
        if (err) console.log("unable to find");
        else if (doc)
        {
          var unknown = false;
          if (doc.Type === "Song")
            SongString += JSON.stringify(doc);
          else if (doc.Type === "Event")
            EventString += JSON.stringify(doc);
          else if (doc.Type === "Party")
            PartyString += JSON.stringify(doc);
          else if (doc.Type === "User")
            UserString += JSON.stringify(doc);
          else if (doc.Type === "Test")
            TestString += JSON.stringify(doc);
          else
          {
            console.log("unknown Type: " + doc.Type);
            unknown = true;
          }
          if (!unknown)
          {
            TotalString += JSON.stringify(doc);
          }

          }
          else
          {
            res.render('collectionlist', 
              {"TotalString": TotalString, "SongString": SongString, 
              "EventString": EventString, "PartyString": PartyString,
              "UserString": UserString, "TestString": TestString,
              "TotalString": TotalString}
              );
          }

      });

    }
        db.close();
 });
});
app.get('/clear', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/test';
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log('Unable to connect to db', err);
    } else {
      console.log('Connection established');
      var cl = db.collection('test');
      cl.remove({});
      res.render('clear');
    }
    db.close();
  });
});


app.use(function(req, res, next){
	console.log("Looking for URL : " + req.url);
  next();
});

app.post('/data', function(req, res){
	var collection = req.body.collection;

	var field1 = req.body.field1;
	var field2 = req.body.field2;
	var field3 = req.body.field3;
	var field4 = req.body.field4;
	var field5 = req.body.field5;
	var value1 = req.body.value1;
	var value2 = req.body.value2;
	var value3 = req.body.value3;
	var value4 = req.body.value4;
	var value5 = req.body.value5;
  var field6 = req.body.field6;
  var value6 = req.body.value6;


  var toAdd = {};
    toAdd["Type"] = collection;
    if (field1 != "" && value1 != "")
      toAdd[field1] = value1;
    if (field2 != "" && value2 != "")
      toAdd[field2] = value2;
    if (field3 != "" && value3 != "")
      toAdd[field3] = value3;
    if (field4 != "" && value4 != "")
      toAdd[field4] = value4;
    if (field5 != "" && value5 != "")
      toAdd[field5] = value5;
    if (field6 != "" && value6 != "")
      toAdd[field6] = value6;
    
  var finalAdd = JSON.parse(JSON.stringify(toAdd));

  //validate
  var valid;
  if (collection === "Song")
    valid = songValidate(finalAdd);
  else if (collection === "User")
    valid = userValidate(finalAdd);
  else if (collection === "Party")
    valid = partyValidate(finalAdd);
  else if (collection === "Event")
    valid = eventValidate(finalAdd);
  else if (collection === "Test")
    valid = true;
  else
    valid = null;
  if (valid)
  {
    //open db
    var MongoClient = mongodb.MongoClient;
    var url = 'mongodb://localhost:27017/test';
    MongoClient.connect(url, function(err, db) {
      if (err) {
        console.log("Unable to connect to db", err);
      } else {
        console.log("Connection established");
        var cl = db.collection("test");

    //add data to collection
      cl.insert(finalAdd);
      }
      db.close();
    });
  }
  else
  {
    console.log("Error. Invalid schema.");
    console.log(finalAdd);
  }
    
  	//open database

	//open collection

	//add data to collection

	//close database

	//go back home


	res.render('home');
});

app.post('/process', function(req, res){
  // Retrieve an access token
  spotifyApi.clientCredentialsGrant()
  .then(function(data) {
    // Set the access token on the API object so that it's used in all future requests
    spotifyApi.setAccessToken(data.body['access_token']);

    // Get 5 songs by the artist chosen
    return spotifyApi.searchTracks('artist:'+ req.body.artist, {limit: 5})
  }).then(function(data) {
    res.render('search-results', {artist: req.body.artist, tracks: data.body.tracks.items});

    var len = data.body.tracks.items.length;
    if (len >= 5)
    {
      var artistString = req.body.artist;

      var schema1 = {"Type": "Song", "songId": data.body.tracks.items[0].id, "name": data.body.tracks.items[0].name,
                      "artist": req.body.artist, "album": data.body.tracks.items[0].album.name};

      var schema2 = {"Type": "Song", "songId": data.body.tracks.items[1].id, "name": data.body.tracks.items[1].name,
                      "artist": req.body.artist, "album": data.body.tracks.items[1].album.name};

      var schema3 = {"Type": "Song", "songId": data.body.tracks.items[2].id, "name": data.body.tracks.items[2].name,
                "artist": req.body.artist, "album": data.body.tracks.items[2].album.name};

      var schema4 = {"Type": "Song", "songId": data.body.tracks.items[3].id, "name": data.body.tracks.items[3].name,
                "artist": req.body.artist, "album": data.body.tracks.items[3].album.name};

      var schema5 = {"Type": "Song", "songId": data.body.tracks.items[4].id, "name": data.body.tracks.items[4].name,
                "artist": req.body.artist, "album": data.body.tracks.items[4].album.name};

      var schemas = [schema1, schema2, schema3, schema4, schema5];
      var MongoClient = mongodb.MongoClient;
      var url = 'mongodb://localhost:27017/test';
      MongoClient.connect(url, function(err, db) {
        if (err){
          console.log("Unable to connect to db", err);
        } else {
          console.log("Connection established");
          var cl = db.collection("test");
        
          for (i=0; i< 5; i++)
          {
            var valid = songValidate(schemas[i]);
            if (!valid) console.log(songValidate.errors);
            else
            {
              console.log("validated!");
              cl.insert([schemas[i]]);

            }
        }

        }
       db.close();

      });
    }
    else
    {
      console.log("not enough tracks...");
    }


  }).catch(function(err) {
    console.log('Unfortunately, something has gone wrong.', err.message);
  });
});

app.use(function(req, res){
  res.type('text/html');
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + ' press Ctrl-C to terminate');
});
