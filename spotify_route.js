//spotify_route.js
var express = require('express');
var router = express.Router();
var spotify = require("./spotify");
var func = require("./func");
var querystring = require('querystring');


router.get('/', function(req, res, next) {
	console.log("at spotify...");
});

router.get('/login', function (req, res) {
  var state = func.generateRandomString(16);
  res.cookie(spotify.stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: spotify.client_id,
      scope: scope,
      redirect_uri: spotify.redirect_uri,
      state: state
    }));
});


  //create playlist here

  module.exports = router;