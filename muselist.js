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
var ajv = new Ajv({allErrors: true});

var schema = {
  "title": "Song",
  "type": "object",
  "required": ["songId", "name"],
  "properties": {
    "songId": {
      "type": "string"
    },
    "title": {
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
  }
};

var validate = ajv.compile(schema);

//test very simply checks whatever input with the schema 
function test(data) {
  var valid = validate(data);
  if (valid) console.log("Valid!");
  else console.log("Invalid: " + ajv.errorsText(validate.errors));
}


var spotifyApi = new SpotifyWebApi({
  clientId : process.env.CLIENT_ID,
  clientSecret : process.env.CLIENT_SECRET,
});

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res){
  res.render('home');
});

app.get('/list', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/test';
  MongoClient.connect(url, function(err, db) {
    if (err){
      console.log('Unable to connect to db', err);
    } else {
      console.log('Connection established');
      var cl = db.collection('test');
      cl.find({}).toArray(function (err, result) {
        if (err) {
          res.send(err);
        } else if (result.length > 0) {
          res.render('collectionlist', {
            "collectionlist": JSON.stringify(result)
          });
        } else {
          res.render("empty");
        }
        db.close();
      });
    }
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

      var schema1 = {"songId": data.body.tracks.items[0].id, "name": data.body.tracks.items[0].name,
                      "artist": req.body.artist, "album": data.body.tracks.items[0].album.name};

      var schema2 = {"songId": data.body.tracks.items[1].id, "name": data.body.tracks.items[1].name,
                      "artist": req.body.artist, "album": data.body.tracks.items[1].album.name};

      var schema3 = {"songId": data.body.tracks.items[2].id, "name": data.body.tracks.items[2].name,
                "artist": req.body.artist, "album": data.body.tracks.items[2].album.name};

      var schema4 = {"songId": data.body.tracks.items[3].id, "name": data.body.tracks.items[3].name,
                "artist": req.body.artist, "album": data.body.tracks.items[3].album.name};

      var schema5 = {"songId": data.body.tracks.items[4].id, "name": data.body.tracks.items[4].name,
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
            var valid = validate(schemas[i]);
            if (!valid) console.log(validate.errors);
            else
            {
              console.log("validated!");
              cl.insert([schemas[i]]);

            }
        }
    //      cl.insert([{"artist": artistString, "track1": track1, "track2": track2
    //    , "track3": track3, "track4":track4, "track5": track5}]);
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
