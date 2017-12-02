/* CS 411 Muselist
*/

var express = require('express');
var request = require('request');
var path = require('path');
require('dotenv').config();
var querystring = require('querystring');
var app = express();
var cookieParser = require('cookie-parser');
app.disable('x-powered-by');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(require('body-parser').urlencoded({extended: true}));
var formidable = require('formidable');
var SpotifyWebApi = require('spotify-web-api-node');

var client_id = ''; // Your client id
var client_secret = ''; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; 

var access_token;

var spotifyApi = new SpotifyWebApi({
  clientId :'',
  clientSecret :'',
  
});

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var playlistId;

app.set('port', process.env.PORT || 8888);

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

var array_artist = [];
var array_song = [];
var numbers_generated = [];
var songs = [];
var song_id = "http://open.spotify.com/embed?uri=spotify:track:";


app.get('/', function(req, res){
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));


  //create playlist here
});

app.get('/continue', function(req, res){
  res.render('home');
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
  //res.redirect('https://google.com');
});

app.use(function(req, res, next){
	console.log("Looking for URL : " + req.url);
  next();
});

app.post('/process', function(req, res){
  // Retrieve an access token
  array_song = [];
  songs = [];
  spotifyApi.clientCredentialsGrant()
.then(function(data) {
  // Set the access token on the API object so that it's used in all future requests
  spotifyApi.setAccessToken(data.body['access_token']);


  

    return spotifyApi.searchTracks('artist:'+ req.body.artist, {limit: 50}) //name of search field is "artist"
  }).then(function(data) {


    for (i = 0; i < req.body.total_songs; i++){
      var random = Math.floor(Math.random() * 50);
      while (true){
        
        if (numbers_generated.includes(random)){
          random = Math.floor(Math.random() * 50);
        }

        else {
          numbers_generated.push(random);
          break;
        }
      }
      

  array_song.push(data.body.tracks.items[random].name + " by, " + data.body.tracks.items[random].artists[0].name);
  songs.push(song_id + String(data.body.tracks.items[random].id));

  }


    numbers_generated = [];
  
      res.render('user', {song: song_id});
  }).catch(function(err) {
    console.log('Unfortunately, something has gone wrong.', err.message);
  });
});


// app.post('/user', function(req, res){
//   // Retrieve an access token
//   // spotifyApi.authorizationCodeGrant(authorizationCode)
//   // .then(function(data) {
//     // Set the access token on the API object so that it's used in all future requests
//     //spotifyApi.setAccessToken(data.body['access_token']);

//     res.render('user');

//   //console.log(req.body.selectpicker);


//   //   return spotifyApi.createPlaylist('1250209420', 'My awesome playlist'); //name of search field is "artist"
//   // }).then(function(data) {

//   //   //console.log(data.body);
//   //   res.render('user', {email: data.body.email}); //send artist and tracks to the search-results.handlebars page
//   //  // console.log(data.body.email);

//   // }).catch(function(err) {
//   //   console.log('Unfortunately, something has gone wrongggggg.', err.message);
//   // });
// });
// //



var playlist_id;



app.post('/display', function(req, res){


  numbers_generated = [];
 


  spotifyApi.clientCredentialsGrant()
  .then(function(data) {
   
    spotifyApi.setAccessToken(data.body['access_token']);

  



  spotifyApi.getPlaylistsForCategory('pop', { //latin pop hiphop chill
      country: 'US',
      limit : 2,
      offset : 0
    })
  .then(function(data) {
   
   playlist_id = String(data.body.playlists.items[Math.floor(Math.random() * 2)].id);
   
   spotifyApi.getPlaylistTracks('spotify', playlist_id, { 'offset' : 0, 'limit' : 20, 'fields' : 'items' })
  .then(function(data) {

   
    for (i = 0; i < req.body.total_pop; i++){
      var random = Math.floor(Math.random() * 20);
      while (true){
        
        if (numbers_generated.includes(random)){
          random = Math.floor(Math.random() * 20);
        }

        else {
          numbers_generated.push(random);
          break;
        }
      }
      


    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }

  numbers_generated = [];
  spotifyApi.getPlaylistsForCategory('hiphop', { //latin pop hiphop chill country
      country: 'US',
      limit : 2,
      offset : 0
    })
  .then(function(data) {
   
   playlist_id = String(data.body.playlists.items[Math.floor(Math.random() * 2)].id);
   
   spotifyApi.getPlaylistTracks('spotify', playlist_id, { 'offset' : 0, 'limit' : 20, 'fields' : 'items' })
  .then(function(data) {

   // console.log(req.body.rap_select);
    for (i = 0; i < req.body.total_rap; i++){
      var random = Math.floor(Math.random() * 20);
      while (true){
        
        if (numbers_generated.includes(random)){
          random = Math.floor(Math.random() * 20);
        }

        else {
          numbers_generated.push(random);
          break;
        }
      }
      
    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }
numbers_generated = [];
  spotifyApi.getPlaylistsForCategory('latin', { //latin pop hiphop chill country
      country: 'US',
      limit : 2,
      offset : 0
    })
  .then(function(data) {
   
   playlist_id = String(data.body.playlists.items[Math.floor(Math.random() * 2)].id);
   
   spotifyApi.getPlaylistTracks('spotify', playlist_id, { 'offset' : 0, 'limit' : 20, 'fields' : 'items' })
  .then(function(data) {

   // console.log(req.body.rap_select);
    for (i = 0; i < req.body.total_latin; i++){
      var random = Math.floor(Math.random() * 20);
      while (true){
        
        if (numbers_generated.includes(random)){
          random = Math.floor(Math.random() * 20);
        }

        else {
          numbers_generated.push(random);
          break;
        }
      }
      

    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }
  numbers_generated = [];
  spotifyApi.getPlaylistsForCategory('country', { //latin pop hiphop chill country
      country: 'US',
      limit : 2,
      offset : 0
    })
  .then(function(data) {
   
   playlist_id = String(data.body.playlists.items[Math.floor(Math.random() * 2)].id);
   
   spotifyApi.getPlaylistTracks('spotify', playlist_id, { 'offset' : 0, 'limit' : 20, 'fields' : 'items' })
  .then(function(data) {

   // console.log(req.body.rap_select);
    for (i = 0; i < req.body.total_country; i++){
      var random = Math.floor(Math.random() * 20);
      while (true){
        
        if (numbers_generated.includes(random)){
          random = Math.floor(Math.random() * 20);
        }

        else {
          numbers_generated.push(random);
          break;
        }
      }
      


    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }



    res.render('display', {artist: array_artist, tracks: array_song, songs_played:songs}); //send artist and tracks to the search-results.handlebars page

  }).catch(function(err) {
    console.log('Unfortunately, something has gone wrong.', err.message);
  });
});
  });

});
  });

});

  });

});
  });

});


app.post('/createPlaylist', function(req, res) {
  //creates a playlist
  var createdplaylist = {
          url: 'https://api.spotify.com/v1/users/' + 'griffin123b' + '/playlists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          body: {"description": "Creates Muselist Playlist",
                 "public": false,
                 "name": "Muselist Playlist"},
          json: true
  };
  request.post(createdplaylist, function(error, response, body) {
    createdplaylistid = body.id;
    //console.log("User Created Playlist Information")
    //console.log(body)
  })
})


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
