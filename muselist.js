var express = require('express');

require('dotenv').config();

var app = express();

app.disable('x-powered-by');

var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(require('body-parser').urlencoded({extended: true}));

var formidable = require('formidable');

var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
  clientId :'',
  clientSecret :'',
  
});

var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

var playlistId;

app.set('port', process.env.PORT || 3000);


var array_artist = [];
var array_song = [];
var numbers_generated = [];
var songs = [];
var song_id = "http://open.spotify.com/embed?uri=spotify:track:";


app.get('/', function(req, res){
  res.render('home');
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
