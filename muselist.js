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
  clientId :process.env.CLIENT_ID,
  clientSecret :process.env.CLIENT_SECRET,
  
});



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
    res.render('home');

});

app.post('/finalize', function(req, res){

      var j, x, i;
    for (i = songs.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = songs[i];
        songs[i] = songs[j];
        songs[j] = x;
    }
 
    res.render('display',{songs_played:songs} );

});

app.post('/delete', function(req, res){

  if (req.body.song_number > 0){
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


      

  array_song.push(data.body.tracks.items[0].name + " by, " + data.body.tracks.items[0].artists[0].name);
  songs.push(song_id + String(data.body.tracks.items[0].id));

  


    //console.log(data.body.tracks.items[0]);
  
     res.render('home', {songs_played: array_song});
  }).catch(function(err) {
    console.log('Unfortunately, something has gone wrong.', err.message);
  });
});




app.post('/user', function(req, res){
  // Retrieve an access token
  // spotifyApi.authorizationCodeGrant(authorizationCode)
  // .then(function(data) {
    // Set the access token on the API object so that it's used in all future requests
    //spotifyApi.setAccessToken(data.body['access_token']);

    res.render('user');

  //console.log(req.body.selectpicker);


  //   return spotifyApi.createPlaylist('1250209420', 'My awesome playlist'); //name of search field is "artist"
  // }).then(function(data) {

  //   //console.log(data.body);
  //   res.render('user', {email: data.body.email}); //send artist and tracks to the search-results.handlebars page
  //  // console.log(data.body.email);

  // }).catch(function(err) {
  //   console.log('Unfortunately, something has gone wrongggggg.', err.message);
  // });
});
//



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




/*
 *        DATABASE STUFF
 *
 */
 
var data = require('./data');

app.get('/cleardata', function(req, res) {
  data.clear(function() {
    res.render('clear');
  });
});

app.get('/viewdata', function(req, res) {
  data.list(function (ret) {
    listCallBack(res, ret);
  });
});

app.get('/savedata', function(req, res) {

  //first, create the playlist
  var playlistId = Math.floor((Math.random(8999) + 1000)).toString();
  var title = "Playlist Numero " + playlistId;
  data.insertPlaylist(playlistId, title, [], function() {

    var songIdList = [];
    var songTitleList = [];
    var songArtistList = [];
    //initialize songs array
    for (i in array_song)
    {
      var toAdd = array_song[i].split(" by, ");
      songTitleList.push(toAdd[0]);
      songArtistList.push(toAdd[1]);
      songIdList.push(songs[i]);

    }

    //insert songs into the database & playlist
    createSongs(songIdList, songTitleList, songArtistList, playlistId, function() {
      console.log("WE DONE NOW");
      res.render('home');
    });

  });

});

function createSongs (songIdList, songTitleList, songArtistList, playlistId, callback) {
  console.log(songIdList.length + " songs left to add...");
  if (songIdList.length < 1)
    callback();
  else
  {
    //insert song into database
    data.insertSong(songIdList[0], songTitleList[0], songArtistList[0], "", 0, function() {

      //insert song into playlist
      data.addItemToList(songIdList[0], playlistId, "Song", "Playlist", function() {

        //now we're done, time for the rest
        console.log(songTitleList[0] + " added to database & playlist");
        createSongs(songIdList.slice(1), songTitleList.slice(1), songArtistList.slice(1), playlistId, callback);
      });

    });
  }
}

function listCallBack (res, ret) {
      if (ret)
    {
        res.render('collectionlist', 
        {
          "TotalString": ret[0], "SongString": ret[1], 
         "PlaylistString": ret[2], "UserString": ret[3], 
         "TestString": ret[4],});
        }
    else
    {
      console.log("invalid return array");
      res.render('home');
    }
}


/*
 *
 *        END DATABASE STUFF
 *
 */

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
