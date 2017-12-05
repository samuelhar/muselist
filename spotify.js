//spotify.js

/* spotify setup */
var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = 'http://localhost:8888/callback';
var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
  clientId : client_id,
  clientSecret : client_secret,
});
var stateKey = 'spotify_auth_state';

module.exports.client_id = client_id;
module.exports.client_secret = client_secret;
module.exports.stateKey = stateKey;
module.exports.redirect_uri = redirect_uri;