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
var data_route = require('./data_route');
var db = require('./data');
app.use('/data', data_route);
var spotify_route = require('./spotify_route');
app.use('/spotify', spotify_route);
var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = 'http://localhost:8888/callback';
var access_token;

var spotifyApi = new SpotifyWebApi({
  clientId : client_id,
  clientSecret : client_secret,
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



app.set('port', process.env.PORT || 8888);

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

var array_artist = [];
var array_song = [];
var numbers_generated = [];
var songs = [];
var retSongs = [];
//var song_id = "http://open.spotify.com/embed?uri=spotify:track:";
var song_id = "spotify:track:";
var final_playlistId;
var username;


app.get('/', function(req, res){
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/logins', function(req, res) {
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
          //console.log(body);
          username = body.id;
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
  
});

app.use(function(req, res, next){
  console.log("Looking for URL : " + req.url);
  next();
});

var express = require('express');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var Twitter = require('twitter');

passport.use(new Strategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: 'http://localhost:8888/login/twitter/return'
  },
  function(token, tokenSecret, profile, cb) {

    return cb(null, profile);
  }));

  passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());


app.get('/returns',
  function(req, res) {
    res.render('home', {songs_played: array_song});
  });

app.get('/login_twitter',
  function(req, res){
    res.render('login');
  });

app.get('/login/twitter',
  passport.authenticate('twitter'));


app.get('/login/twitter/return', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/returns');
  });





app.post('/process', function(req, res){

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

      /*
       * DATABASE STUFF DON'T CHANGE THIS
       */
       db.songId_array.push(song_id + String(data.body.tracks.items[random].id));
       db.songTitle_array.push(data.body.tracks.items[random].name);
       db.songArtist_array.push(data.body.tracks.items[random].artists[0].name);

      /*
       * END DATABASE STUFF
       */

  array_song.push(data.body.tracks.items[random].name + " by, " + data.body.tracks.items[random].artists[0].name);
  songs.push(song_id + String(data.body.tracks.items[random].id));

  }


    numbers_generated = [];
  
      res.render('home', {songs_played: array_song});
  }).catch(function(err) {
    console.log('Unfortunately, something has gone wrong.', err.message);
  });
});



app.post('/search_for_artist', function(req, res){
 
    res.render('search_for_artist');

});


app.post('/remove_songs', function(req, res){
 
    res.render('remove_songs',{songs_played: array_song});

});


app.post('/search_for_song', function(req, res){
 
    res.render('search_for_song');

});

app.post('/clear', function(req, res){
  array_song=[];
  songs=[];

  /*
   * DATABASE STUFF DON'T CHANGE THIS
   */
   db.songId_array = [];
   db.songTitle_array = [];
   db.songArtist_array = [];

  /*
   * END DATABASE STUFF
   */

  res.render('home');

});

app.post('/finalize', function(req, res){
      retSongs = songs;
      var j, x, i;
    for (i = songs.length - 1; i > -1; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = songs[i];
        songs[i] = songs[j];
        songs[j] = x;
    }



    var final_url = 'https://api.spotify.com/v1/users/' + username + '/playlists/' + final_playlistId + '/tracks?uris=';

    for (i = songs.length - 1; i > -1; i--) {
       final_url = final_url + songs[i] + ',';
    //  console.log(final_url);
    }

          var createdplaylist = {
          //url: 'https://api.spotify.com/v1/users/' + username + '/playlists/' + final_playlistId + '/tracks?uris=spotify:track:4iV5W9uYEdYUVa79Axb7Rh,spotify:track:1301WleyT98MSxVHPZCA6M',
          url: final_url,
          headers: { 'Authorization': 'Bearer ' + access_token },
          body: {
                 "public": true,
                 },
          json: true
  };

    request.post(createdplaylist, function(error, response, body) {

      var final_playlist = 'https://open.spotify.com/embed?uri=spotify:user:'+username+':playlist:' + final_playlistId;
      var tweet ='https://twitter.com/intent/tweet?text=This%20is%20my%20new%20Party%20PlaylistId:%20'+ final_playlistId;
      //songs=[];

      console.log();
      console.log("SONGS LIST: " + array_song);
    res.render('display',{songs_played: songs,playlist: final_playlist, my_tweet:tweet} );
   
  })
    

});

app.post('/delete', function(req, res){

  if (req.body.song_number > 0){

    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.splice(req.body.song_number-1, 1);
     db.songTitle_array.splice(req.body.song_number-1, 1);
     db.songArtist_array.splice(req.body.song_number-1, 1);

    /*
     * END DATABASE STUFF
     */

    array_song.splice(req.body.song_number-1,1);
    songs.splice(req.body.song_number-1,1);

  }
  res.render('remove_songs',{songs_played: array_song});
});


app.post('/song_search', function(req, res){
  // Retrieve an access token
  //array_song = [];
  //songs = [];
  spotifyApi.clientCredentialsGrant()
.then(function(data) {
  // Set the access token on the API object so that it's used in all future requests
  spotifyApi.setAccessToken(data.body['access_token']);


  

    return spotifyApi.searchTracks('track:'+ req.body.song_name + ' artist:'+ req.body.artist)  //'track:Alright artist:Kendrick Lamar'
  }).then(function(data) {

    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.tracks.items[0].id));
     db.songTitle_array.push(data.body.tracks.items[0].name);
     db.songArtist_array.push(data.body.tracks.items[0].artists[0].name);

    /*
     * END DATABASE STUFF
     */
    

  array_song.push(data.body.tracks.items[0].name + " by, " + data.body.tracks.items[0].artists[0].name);
  songs.push(song_id + String(data.body.tracks.items[0].id));

  


    //console.log(data.body.tracks.items[0]);
    //console.log (username);
    //console.log(final_playlistId);
     res.render('home', {songs_played: array_song});
  }).catch(function(err) {
    console.log('Unfortunately, something has gone wrong.', err.message);
  });
});




app.post('/user', function(req, res){

    res.render('user');

});

app.post('/return_home', function(req, res){

    res.render('home', {songs_played: array_song});

});


var playlist_id;


app.post('/genres', function(req, res){


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
      
    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.items[random].track.id));
     db.songTitle_array.push(data.body.items[random].track.name);
     db.songArtist_array.push(data.body.items[random].track.artists[0].name);

    /*
     * END DATABASE STUFF
     */

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
      
    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.items[random].track.id));
     db.songTitle_array.push(data.body.items[random].track.name);
     db.songArtist_array.push(data.body.items[random].track.artists[0].name);

    /*
     * END DATABASE STUFF
     */

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
      
    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.items[random].track.id));
     db.songTitle_array.push(data.body.items[random].track.name);
     db.songArtist_array.push(data.body.items[random].track.artists[0].name);

    /*
     * END DATABASE STUFF
     */

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
      

    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.items[random].track.id));
     db.songTitle_array.push(data.body.items[random].track.name);
     db.songArtist_array.push(data.body.items[random].track.artists[0].name);

    /*
     * END DATABASE STUFF
     */

    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }

    numbers_generated = [];
  spotifyApi.getPlaylistsForCategory('rock', { //latin pop hiphop chill country rock
      country: 'US',
      limit : 2,
      offset : 0
    })
  .then(function(data) {
   
   playlist_id = String(data.body.playlists.items[Math.floor(Math.random() * 2)].id);
   
   spotifyApi.getPlaylistTracks('spotify', playlist_id, { 'offset' : 0, 'limit' : 20, 'fields' : 'items' })
  .then(function(data) {

   // console.log(req.body.rap_select);
    for (i = 0; i < req.body.total_rock; i++){
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
      

    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.items[random].track.id));
     db.songTitle_array.push(data.body.items[random].track.name);
     db.songArtist_array.push(data.body.items[random].track.artists[0].name);

    /*
     * END DATABASE STUFF
     */

    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }

      numbers_generated = [];
  spotifyApi.getPlaylistsForCategory('party', { //latin pop hiphop chill country rock party
      country: 'US',
      limit : 2,
      offset : 0
    })
  .then(function(data) {
   
   playlist_id = String(data.body.playlists.items[Math.floor(Math.random() * 2)].id);
   
   spotifyApi.getPlaylistTracks('spotify', playlist_id, { 'offset' : 0, 'limit' : 20, 'fields' : 'items' })
  .then(function(data) {

   // console.log(req.body.rap_select);
    for (i = 0; i < req.body.total_party; i++){
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
      

    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.items[random].track.id));
     db.songTitle_array.push(data.body.items[random].track.name);
     db.songArtist_array.push(data.body.items[random].track.artists[0].name);

    /*
     * END DATABASE STUFF
     */

    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }

      numbers_generated = [];
  spotifyApi.getPlaylistsForCategory('punk', { //latin pop hiphop chill country rock party
      country: 'US',
      limit : 2,
      offset : 0
    })
  .then(function(data) {
   
   playlist_id = String(data.body.playlists.items[Math.floor(Math.random() * 2)].id);
   
   spotifyApi.getPlaylistTracks('spotify', playlist_id, { 'offset' : 0, 'limit' : 20, 'fields' : 'items' })
  .then(function(data) {

   // console.log(req.body.rap_select);
    for (i = 0; i < req.body.total_punk; i++){
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
      

    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.items[random].track.id));
     db.songTitle_array.push(data.body.items[random].track.name);
     db.songArtist_array.push(data.body.items[random].track.artists[0].name);

    /*
     * END DATABASE STUFF
     */

    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }

        numbers_generated = [];
  spotifyApi.getPlaylistsForCategory('reggae', { //latin pop hiphop chill country rock party
      country: 'US',
      limit : 2,
      offset : 0
    })
  .then(function(data) {
   
   playlist_id = String(data.body.playlists.items[Math.floor(Math.random() * 2)].id);
   
   spotifyApi.getPlaylistTracks('spotify', playlist_id, { 'offset' : 0, 'limit' : 20, 'fields' : 'items' })
  .then(function(data) {

   // console.log(req.body.rap_select);
    for (i = 0; i < req.body.total_reggae; i++){
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
      

    /*
     * DATABASE STUFF DON'T CHANGE THIS
     */
     db.songId_array.push(song_id + String(data.body.items[random].track.id));
     db.songTitle_array.push(data.body.items[random].track.name);
     db.songArtist_array.push(data.body.items[random].track.artists[0].name);

    /*
     * END DATABASE STUFF
     */

    array_song.push(data.body.items[random].track.name + " by, " + data.body.items[random].track.artists[0].name);
    songs.push(song_id + String(data.body.items[random].track.id));

  }


  //mix up song order

  



    res.render('home', {artist: array_artist, tracks: array_song, songs_played:array_song}); //send artist and tracks to the search-results.handlebars page

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

  });

});

  });

});
  });

});
});
});

app.post('/createPlaylist', function(req, res) {


  /*
   * DATABASE STUFF DON'T CHANGE THIS
   */
   db.songId_array = [];
   db.songTitle_array = [];
   db.songArtist_array = [];

  /*
   * END DATABASE STUFF
   */

   
  //creates a playlist
  array_song=[];
  songs=[];
  var createdplaylist = {
          url: 'https://api.spotify.com/v1/users/' + username + '/playlists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          body: {"description": "Creates Muselist Playlist",
                 "public": true,
                 "name": "Muselist Playlist35"},
          json: true
  };
  // var createdplaylist = {
  //         url: 'https://api.spotify.com/v1/users/' + '1250209420' + '/playlists/4PKIxql9UZHamEeCVJRfAO/tracks?uris=spotify:track:4iV5W9uYEdYUVa79Axb7Rh,spotify:track:1301WleyT98MSxVHPZCA6M',
  //         headers: { 'Authorization': 'Bearer ' + access_token },
  //         body: {"description": "Creates Muselist Playlist",
  //                "public": true,
  //                "name": "Muselist Playlist35"},
  //         json: true
  // };

  request.post(createdplaylist, function(error, response, body) {
  //   createdplaylistid = body.id;
    final_playlistId = body.id;


    res.render('home');
   // console.log(createdplaylistid)
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

module.exports.array_song = retSongs;
module.exports.songs = songs;
