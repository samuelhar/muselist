// data.js
// created by Sam Foreman
// CS455


/* * * * * * * * * * * SETUP / INIT * * * * * * * * * * * */


/* contains mongodb URL */
require('dotenv').config();

/* package for compiling & validating JSON schemas */
var Ajv = require('ajv');
var ajv = new Ajv();

/* package for setting up database */
var mongodb = require('mongodb');

/* toggles debug information in console */
var log = true;


/* pull in schemas */
var ss = require('./schema/songSchema.json');
var us = require('./schema/userSchema.json');
var ps = require('./schema/playlistSchema.json');


/* compile schemas & set them up for validation */
var songValidate = ajv.compile(ss);
var userValidate = ajv.compile(us);
var playlistValidate = ajv.compile(ps);


/* global arrays */
var songId_array = [];
var songTitle_array = [];
var songAlbum_array = [];
var songArtist_array = [];

/* * * * * * * * * * * EXPORT FUNCTIONS * * * * * * * * * * * */

module.exports.post = post;
module.exports.validate = validate;
module.exports.list = list;
module.exports.insertSong = insertSong;
module.exports.insertUser = insertUser;
module.exports.insertPlaylist = insertPlaylist;
module.exports.clear = clear;
module.exports.connect = connect;
module.exports.addItemToList = addItemToList;
module.exports.getAllItems = getAllItems;
module.exports.getSongsByPlaylist = getSongsByPlaylist;
module.exports.getAllSongsByPlaylist = getAllSongsByPlaylist;
module.exports.createSongs = createSongs;

module.exports.songId_array = songId_array;
module.exports.songTitle_array = songTitle_array;
module.exports.songAlbum_array = songAlbum_array;
module.exports.songArtist_array = songArtist_array;


/* * * * * * * * * * * MAIN FUNCTIONS * * * * * * * * * * * */

/*
 * getAllItems - returns all names & id's of all objects of a given type
 * list - returns all items in the database, organized by type
 * createSongs - takes in an array of songs, and adds them to the db with a given playlist
 * getAllSongsByPlaylist - returns all songs in a given playlist
 * addItemToList - adds an item (either Song or Playlist) to a list belonging to a Playlist or a User
 * insertSong - inserts a song to the db
 * insertUser - inserts a user to the db
 * insertPlaylist - inserts a playlist to the db
 * insertItem - inserts an item (Song, User, or Playlist) to the db 
 * post - validates & adds a query to the db
 * validate - checks if query is valid based on schema of its type
 * connect - attempts to connect to the MongoClient
 * clear - clears all data in the database
 * getSongsByPlaylist - returns an array of all the songs in a playlist
 * pushList - updates a playlist
 * validateCallBack - inserts a query into a collection (assuming it's valid)
 * initItems - initializes an array used for sorting items with the list function
 * getItems - sorts all database items into an array
 * update - updates an existing query
 * findSongName - returns an array with song names for all given ids
 * findItem - attempts to find an item with the given id
 *
 */

function getAllItems(type, callback) {
  /* returns an array containing the names and id's of all objects based on the type
   */

   var idRet = [];
   var nameRet = [];
   if (log) console.log("DATA.GET_ALL_ITEMS: getting all items of type = " + type);
   //connect to db
   connect(function(db) {
    if (db === null) 
    {
      console.log("error connecting to database.");
      callback(null);
    }
    else
    {
      var cl = db.collection(process.env.DATABASE_COLLECTION);
      cl.find({Type: "Playlist"}, {_id: false, playlist: false, Type: false}).toArray( function(err, doc) {
        if (err)
        {
          console.log(err)
          callback(null);
        } 
        else
        {
          for (i = 0; i < doc.length ; i++)
          {
            var array = JSON.stringify(doc[i]).split(",");
            var id = array[0].split(":")[1];
            id = id.slice(1, id.length-1);
            var title = array[1].split(":")[1];
            title = title.slice(1, title.length-2);
            idRet.push(id);
            nameRet.push(title);
          }
          var ret = [idRet, nameRet];
          callback(ret);
        }
      });
    }
   });
}

function list(callback) {
  /* returns all items in the database, sorted into an array based on 'Type'
   * callback upon completion, or failure at any step
   */

   //connect to the database
   if (log) console.log("DATA.LIST : calling connection to database");
  connect(function(db) {
    if (db === null) callback();
    else {
      //on success, get the items from the database
      if (log) console.log("DATA.LIST : calling initialize items");
      initItems(db, function(ret) {
        //regardless of success or failure, callback
        if (log) console.log("DATA.LIST : closing connection to database");
        db.close();
        if (log) console.log("DATA.LIST : calling callback...");
        callback(ret);
      });
    }
  });
}

function createSongs (songIdList, songTitleList, songArtistList, playlistId, callback) {
  /*
   * takes in an array of song titles, artists, and ids, and puts them in a database
   * these songs are also attached to the given playlist
   */
  if (songIdList.length < 1)
    callback();
  else
  {
    //insert song into database
    insertSong(songIdList[0], songTitleList[0], songArtistList[0], "", 0, function() {

      //insert song into playlist
      addItemToList(songIdList[0], playlistId, "Song", "Playlist", function() {

        //now we're done, time for the rest
        createSongs(songIdList.slice(1), songTitleList.slice(1), songArtistList.slice(1), playlistId, callback);
      });

    });
  }
}

function getAllSongsByPlaylist(idList, retList, callback)
//returns an array containing all the songs in a given playlist
{
  if (idList.length < 1)
  {
    callback(retList);
  }
  else
  {
    getSongsByPlaylist(idList[0], function(ret) {
      if (ret === null)
      {
        callback(null);
      }
      else
      {
        retList.push(ret);
        getAllSongsByPlaylist(idList.slice(1), retList, callback);
      }
    });
  }
}

function addItemToList(itemId, listId, itemType, listType, callback)
{
  //adds an item (Song or Playlist) to a list (Playlist or User)
  if (log) console.log("DATA.ADD_TO_PLAYLIST : begin add to playlist.");
  //connect to server
  connect(function(db) {
    if (db === null) callback();
    else
    {
      var cl = db.collection(process.env.DATABASE_COLLECTION);
      //find song (make sure it exists) 
      findItem(itemType, itemId, cl, function(item) {
        if (item === null || item.length < 1)
        {
          console.log("error. item does not exist.");
          db.close(); 
          if (log) console.log("DATA.ADD_TO_LIST : calling callback...");
          callback();
        }
        else
        {
          if (log) console.log("DATA.ADD_TO_LIST : item found, now searching for list");
          //find playlist (make sure it exists)
          findItem(listType, listId, cl, function(list){
            if (list === null || list.length < 1)
            {
              console.log("error. playlist does not exist.");
              db.close();
              if (log) console.log("DATA.ADD_TO_LIST : calling callback...");
              callback();
            }
            else
            {
              if (log) console.log("DATA.ADD_TO_LIST : list found, now updating");
              //get playlist of songs & append new song]
              var newP;
              if (listType === "Playlist")
                newP = list[0]["playlist"];
              else
                newP = list[0]["playlists"];
                pushList(newP, itemId, listId, listType, function() {
                if (log) console.log("DATA.ADD_TO_LIST : calling callback...");
                  callback();
                })
            }

          });

        }
      });

    }
  });
}

function insertSong (songId, title, artist, album, year, callback)
{
  insertItem("Song", songId, title, artist, album, year, function() {
    callback();
  });

}

function insertUser(userId, name, anthem, playlists, callback)
{
  insertItem("User", userId, name, anthem, playlists, null, function() {
    callback();
  });
}

function insertPlaylist(playlistId, title, playlist, callback)
{
  insertItem("Playlist", playlistId, title, playlist, null, null, function() {
    callback();
  });
}

function insertItem (type, id, f1, f2, f3, f4, callback) {

  // TODO : REMOVE FIELDS THAT ARE NULL OR KEEP THEM THE SAME
  /* inserts an item to the database. if it already exists (identified by the songId) then it is updated
   * any fields === empty string are ignored (note the query might fail validation)
   *
   * argument order should be:
   * SONG: songId = id | title = f1 | artist = f2 | album = f3 | year = f4
   * USER: userId = id | name = f1 | anthem = f2 | playlists = f3
   * PLAYLIST: playlistId = id | title = f1 | playlist = f2
   */

  //create JSON query based on inputs
  var str = {};
  str["Type"] = type;
  if (type === "Song")
  {
    if (id !== null || id !== "")
      str["songId"] = id;
    if (f1 !== null || f1 !== "")
      str["title"] = f1;
    if (f2 !== null || f2 !== "")
      str["artist"] = f2;
    if (f3 !== null || f3 !== "")
      str["album"] = f3;
    if (f4 !== null || f4 !== "")
      str["year"] = f4;
  }
  else if (type === "User")
  {
    if (id !== null || id !== "")
      str["userId"] = id;
    if (f1 !== null || f1 !== "")
      str["name"] = f1;
    if (f2 !== null || f2 !== "")
      str["anthem"] = f2;
    if (f3 !== null || f3 !== "")
      str["playlists"] = f3;
  }
  else
  {   
    if (id !== null || id !== "")
      str["playlistId"] = id;
    if (f1 !== null || f1 !== "")
      str["title"] = f1;
    if (f2 !== null || f2 !== "")
      str["playlist"] = f2;
  }

  var add = JSON.parse(JSON.stringify(str));

  //connect to database
  if (log) console.log("DATA.INSERT_ITEM : begin connection to database");
  connect(function(db) {

    //NOTE TO SELF: if i have time, consolidate the POST and UPDATE functions
    //to one UPDATE function with UPSERT enabled
    if (db === null) callback();
    else
    {
      //on success, search for the item
      var cl = db.collection(process.env.DATABASE_COLLECTION);
      findItem(type, id, cl, function(result) {
        if (result === null) 
        {
          if (log) console.log("DATA.INSERT_ITEM : closing connection to database");
          db.close();
          if (log) console.log("DATA.INSERT_ITEM : calling callback...");
          callback();
        } 
        else if (result.length < 1)
        {
          //item does not already exist: insert a new item
          if (log) console.log("DATA.INSERT_ITEM : Query is unique - insert to db");
          post(type, add, function () {
            if (log) console.log("DATA.INSERT_ITEM : calling callback...");
            callback();
          });
        }
        else
        {
          //item already exists: update fields
          if (log) console.log("DATA.INSERT_ITEM : Query already exists - update existing");
          update(cl, add, function() {
            if (log) console.log("DATA.INSERT_ITEM : calling callback...");
            callback();
          })
        }
      });
    }
  });
}

function post(type, query, callback) {
  /* adds the inputted schema to the database
   * the collection used is unimportant as long as it doesn't change since all the data is together
   *
   * note: it would probably be more efficient to validate BEFORE connecting
   */

   //connect to the database
  if (log) console.log("DATA.POST : calling connection to database");
  connect(function(db) {
    if (db === null) callback();
    else {
      //on success, validate the query
      var cl = db.collection(process.env.DATABASE_COLLECTION);
      validate(type, query, function(valid) {
        //call special validate callback function to check actual validity & insert to db
        validateCallBack(valid, query, cl, function() {
          if (log) console.log("DATA.POST : closing connection to server");
          db.close();
          callback();
        });
      });
    }
  });
}

function validate(type, toAdd, callback) {
  /* returns true if inputted collection schema is valid 
   * type is the value of the "Type" field ('Song', 'User', 'Playlist', or 'Test')
   * ...I could probably get this automatically but it's much easier this way
   * toAdd is the JSON to be validated
   */

  if (log) console.log("DATA.VALIDATE : begin validation");
  var valid;

  /* use the validate function based on the collection & return */
  if (type === "Song")
    valid = songValidate(toAdd);
  else if (type === "User")
    valid = userValidate(toAdd);
  else if (type === "Playlist")
    valid = playlistValidate(toAdd);
  else if (type === "Test")
    valid = true;
  else
    valid = null;

  if (log) console.log("DATA.VALIDATE : returning " + valid);
  callback(valid);

}

function connect(callback) {
/* connects to the mongo client.
 * on success, callback with the database object
 * on failure, callback with null
 */
  if (log) console.log("DATA.CONNECT : Begin connect to database");
  var MongoClient = mongodb.MongoClient;
  var url = process.env.DATABASE_URL;

  //connect to client
  MongoClient.connect(url, function(err, db) {
    if (err) {

      //failed
      console.log("Unable to connect to database: " + err);
      if (log) console.log("DATA.CONNECT : calling callback...");
      callback(null);
    }
    else
    {

      //success!
      if (log) console.log("DATA.CONNECT : Connection established to database");
      if (log) console.log("DATA.CONNECT : calling callback...");
      callback(db);
    }
  });
}

function clear(callback) {
  /* clears all data in the database
   *
   */
   if (log) console.log("DATA.CLEAR : begin connection to database");
   connect(function(db) {
    if (db === null) callback();
    else
    {
      var cl = db.collection(process.env.DATABASE_COLLECTION);
      cl.remove({});
      db.close();
      if (log) console.log("DATA.CLEAR : calling callback...");
      callback();
    }
   });
}

function getSongsByPlaylist(id, callback)
{
  connect(function(db) {
  if (db === null) callback(null);
  else
  {
    var cl = db.collection(process.env.DATABASE_COLLECTION);
    findItem("Playlist", id, cl, function(songId) {
      if (songId === null) callback(null);
      else
      {
        //parse through songId's
        var res = JSON.stringify(songId).split(",");
        var idArray = [];
        for (i = 4; i < res.length; i++)
        {
          var r = res[i];
          if (i === 4)
            r = r.slice(13, r.length-1);
          else if (i === res.length-1)
            r = r.slice(1, r.length-4);
          else
            r = r.slice(1, r.length-1);
          idArray.push(r);
        }
          //parse through song Names
        var titleArray = [];
        findSongName(idArray, titleArray, cl, function(titleArray)
        { 
          if (titleArray === null) callback(null);
          else
          {
           // var ret = [idArray, titleArray];
            callback(titleArray);
          } 
        });

        }
    });
  }
  });
}

/* * * * * * * * * * * HELPER FUNCTIONS * * * * * * * * * * * */
function pushList (newP, itemId, listId, type, callback)
//updates the playlist to include the new song
//   pushList(newP, songId, playlistId, listType, function() {
{
  contains = false;

  //check if duplicate
  for (item in newP)
  {
    if (newP[item] === itemId)
      contains = true;
  }
  if (contains)
  {
    console.log("playlist already contains the song");
    callback();
  }
  else
  {
    newP.push(itemId);


    //Update playlist
    if (type === "Playlist")
    {
      insertPlaylist(listId, "", newP, function(){
        callback();
      });
    }
    else
    {
      insertUser(listId, "", "", newP, function() {
        callback();
      });
    }
  }

}

function validateCallBack(valid, query, cl, callback)
//inserts the query into the collection (if it's valid)

{
  if (valid)
  {
    //if data is valid, add it to the database
    if (log) console.log("DATA.POST : JSON validated successfully");
    cl.insert(query);
  }
  else
  {

    console.log("query failed validation: " + JSON.stringify(query));
  }
  callback();
}

function initItems(db, callback)
/* initializes array used to sort objects in the database
 * callback afterwards regardless of success/failure
 * (the check to see if the return worked is done in a different function)
 */
{
  if (log) console.log("DATA.INIT_ITEMS : begin initialization");
  var songString = "";
  var playlistString = "";
  var userString = "";
  var testString = "";
  var totalString = "";
  var ret = [totalString, songString, playlistString, userString, testString];
  var cl = db.collection(process.env.DATABASE_COLLECTION);

  if (log) console.log("DATA.INIT_ITEMS : calling getItems");
  getItems(cl, ret, function(finalRet) {
    if (log) console.log("DATA.INIT_ITEMS : calling callback...");
    callback(finalRet);
  });
}

function getItems(cl, ret, callback)
/* grabs the data from the database and sorts it into the array
 * ret[0] = totalString | ret[1] = songString
 * ret[2] = playlistString | ret[3] = userString
 * ret[4] = testString
 */
{
  //get all items one at a time
  cl.find({}, {_id: false}).each( function(err, doc) {
    if (err)
    {
      //if error, callback with null
        console.log("error finding items: " + err)
        if (log) console.log("DATA.GET_ITEMS : calling callback...");
        callback(null);
    }
    else if (doc)
    {
      //for each item received, sort into the array based on Type
      var unknown = false;
      if (doc.Type === "Song")
        ret[1] += JSON.stringify(doc);
      else if (doc.Type === "Playlist")
        ret[2] += JSON.stringify(doc);
      else if (doc.Type === "User")
        ret[3] += JSON.stringify(doc);
      else if (doc.Type === "Test")
        ret[4] += JSON.stringify(doc);
      else
      {
        console.log("unknown type: " + doc.Type);
        unknown = true;
      }
      if (!unknown)
      {
        //note: unknown types ignored
        ret[0] += JSON.stringify(doc);
      }
    }
    else
    {
      //after getting all items, callback
      if (log) console.log("DATA.GET_ITEMS : end gathering");
      callback(ret);
    }
  });
}


function update(cl, add, callback)
{
  if (log) console.log("DATA.UPDATE : begin update existing query");
  var type = null;
  var id = null;
  var str = {};
  for (var key in add)
  {
    if (key === "songId")
    {
      type = "songId";
      id = add[key];  
    }
    else if (key === "playlistId")
    {
      type = "playlistId";
      id = add[key];
    }
    else if (key === "userId")
    {
      type = "userId";
      id = add[key];
    }
    else
    {
      if (add[key] !== null && add[key] !== "")
        str[key] = add[key];
    }
  }
  if (type === null)
  {
    console.log("unknown type. can't update");
    callback();
  }

  //I don't know why, but the update doesn't work if I pass in a variable for type
  //it must be a string (???)
  if (type === 'songId')
  {
    cl.updateOne({'songId': id}, {$set: JSON.parse(JSON.stringify(str))}, function(err, res) {
      if (err) console.log("error with update: " + err);
      else callback();
    });
  }
  else if (type === "userId")
  {
    cl.updateOne({'userId': id}, {$set: JSON.parse(JSON.stringify(str))}, function(err, res) {
    if (err) console.log("error with update: " + err);
    else callback();
    });
  }
  else
  {
    cl.updateOne({'playlistId': id}, {$set: JSON.parse(JSON.stringify(str))}, function(err, res) {
    if (err) console.log("error with update: " + err);
    else callback();
    });
  }

}

function findSongName(idArray, retArray, cl, callback)
{
  //returns an array with song names for all the given ids
  if (idArray.length < 1)
    callback(retArray);
  else
  {
    var id = idArray[0];
    cl.find({Type: "Song", songId: id}, {_id: false, songId: false, artist: false, album: false, Type: false, year: false}).toArray( function(err, res){
      if (err)
      {
        console.log(err);
        callback(null);
      }
      else
      {
        var newName = JSON.stringify(res).slice(11, JSON.stringify(res).length-3);
        retArray.push(newName);
        findSongName(idArray.slice(1), retArray, cl, callback);
      }
    });
  }
}

function findItem(type, id, cl, callback)
{
/* attempts to find an item with the specified id in the database
 */
   if (log) console.log("DATA.FIND_ITEM : begin find data from collection");
   //only seems to work if i pass in the actual string...
   if (type === "Song")
   {
    cl.find({"songId" : id}).toArray(function (err, result) {
    if (err)
    {
      console.log("DATA.FIND_ITEM : error getting data items");
      callback(null);
    }
    else
    {
      if (log) console.log("DATA.FIND_ITEM : calling callback...");
      callback(result);
    }
    });
   }
   else if (type === "User")
   {
    cl.find({"userId" : id}).toArray(function (err, result) {
    if (err)
    {
      console.log("DATA.FIND_ITEM : error getting data items");
      callback(null);
    }
    else
    {
      if (log) console.log("DATA.FIND_ITEM : calling callback...");
      callback(result);
    }
    });

   }
   else
   {
    cl.find({"playlistId" : id}).toArray(function (err, result) {
    if (err)
    {
      console.log("DATA.FIND_ITEM : error getting data items");
      callback(null);
    }
    else
    {
      if (log) console.log("DATA.FIND_ITEM : calling callback...");
      callback(result);
    }
    });

   }

}


/* * * * * * * * * * * * * END * * * * * * * * * * * * * * */