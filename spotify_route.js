//spotify_route.js
var express = require('express');
var router = express.Router();
var spotify = require("./spotify");
var querystring = require('querystring');


router.get('/', function(req, res, next) {
	console.log("at spotify...");
});

router.get('/login', function (req, res) {
  var state = generateRandomString(16);
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


var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};


  //create playlist here

  module.exports = router;