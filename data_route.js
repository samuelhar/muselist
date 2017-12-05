var express = require('express');
var router = express.Router();
var db = require('./data');
var muse = require('./muselist');

// middleware that is specific to this router

// define the home page route
router.get('/', function (req, res) {
  db.list(function (ret) {
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
      console.log("error. invalid return array");
      res.render('collectionList');
    }
  });
});

router.get('/clear', function(req, res) {
	db.clear(function() {
		res.render('clear');
	});
});

router.get('/select', function(req, res) {
    db.getAllItems("Playlist", function(ret) {
    if (ret === null)
    {
      console.log("error getting data.");
      res.render('home');
    }
    else
    {

      var idList = ret[0];
      var retList = [];
      db.getAllSongsByPlaylist(idList, retList, function(retList) {
        if (retList === null)
        {
          console.log("error getting playlists");
          res.render('home');
        }
        else
        {
          res.render('select_playlist', {songsList: retList});
        }
      });

    }
  });
});

router.get('/save', function(req, res) {
  //first create the playlist
  var playlistId = (Math.floor(Math.random() * (9999-1000)) + 1000).toString();
  var title = "Playlist Numero " + playlistId;

  console.log("SONG ID ARRAY: " + db.songId_array);
  console.log("SONG TITLE ARRAY: " + db.songTitle_array);
  console.log("SONG ALBUM ARRAY: " + db.songAlbum_array);
  console.log("SONG ARTIST ARRAY: " + db.songArtist_array);
  db.insertPlaylist(playlistId, title, [], function() {

    //insert songs into the database & playlist
    db.createSongs(db.songId_array, db.songTitle_array, db.songArtist_array, playlistId, function() {
      db.songId_array = [];
      db.songTitle_array = [];
      db.songAlbum_array = [];
      db.songArtist_array = [];
      res.render('home');
    });
  });
});

router.get('/switch', function(req, res) {
  var playlist = req.query.playlistId;
  db.getAllItems("Playlist", function(ret) {
    if (ret === null)
    {
      console.log("error getting data.");
      res.render('home');
    }
    else
    {
      var idList = ret[0];
      var nameList = ret[1];
      var retList = [];
      console.log("switch to playlist: " + idList[playlist-1] + " name: " + nameList[playlist-1]);
      db.getSongsByPlaylist(idList[playlist-1], function(retList) {
        if (retList === null)
        {
          console.log("error getting data.");
          res.render('home');
        }
        else
        {
          playlistId = idList[playlist-1];
          db.songId_array = retList[0];
          db.songTitle_array = retList[1];
          muse.array_song = retList[1];
          muse.songs = retList[0];
          res.render('home');
        }
      });

    }
  });
});

module.exports = router;