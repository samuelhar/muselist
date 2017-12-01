// data.js
// created by Sam Foreman
// CS455

/* contains mongodb URL */
require('dotenv').config();

/* package for compiling & validating JSON schemas */
var Ajv = require('ajv');
var ajv = new Ajv();

/* package for setting up database */
var mongodb = require('mongodb');

/* toggles debug information in console */
var log = false;


/* pull in schemas */
var ss = require('./schema/songSchema.json');
var us = require('./schema/userSchema.json');
var ps = require('./schema/playlistSchema.json');


/* compile schemas & set them up for validation */
var songValidate = ajv.compile(ss);
var userValidate = ajv.compile(us);
var playlistValidate = ajv.compile(ps);


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

function post(type, query, callback) {
	/* adds the inputted schema to the database
	 * the collection used is unimportant as long as it doesn't change since all the data is together
	 *
	 */
	if (log) console.log("DATA.POST : begin JSON post");


	//open connection to the database
	var MongoClient = mongodb.MongoClient;
	var url = process.env.MONGO_URL;
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.log('Unable to connect to db', err);
		}
		else 
		{

			//after connecting, validate the data
			console.log('Connection established');
			var cl = db.collection("test");
			validate(type, query, function(valid) {
				validateCallBack(valid, query, cl, callback);
			});

		}

		//close connection to the database
		if (log) console.log("DATA.POST -> closing connection to server");
		db.close();
	});
}

function list(callback)  {
	/* gathers all the data available and returns it as an array:
	 * [all data, Song data, Playlist data, User data, Test data]
	 * 
	 */

	//open connection to database
	if (log) console.log("DATA.LIST : begin db listing");
	var MongoClient = mongodb.MongoClient;
	var url = process.env.MONGO_URL;
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.log('Unable to connect to db', err);
		} else {
			console.log('Connection established');
			//initialize sorting strings
			//i could probably just do .find({"Type" : "Value"}) but hey this works too
			var songString = "";
			var playlistString = "";
			var userString = "";
			var testString = "";
			var totalString = "";
			var cl = db.collection('test');

			//after connection, grab each 
			cl.find().each( function(err, doc) {
				if (err) console.log("unable to find");
				else if (doc)
				{

					//sort items based on the Type field
					var unknown = false;
					if (doc.Type === "Song")
						songString += JSON.stringify(doc);
					else if (doc.Type === "User")
						songString += JSON.stringify(doc);
					else if (doc.Type === "Playlist")
						playlistString += JSON.stringify(doc);
					else if (doc.Type === "Test")
						testString += JSON.stringify(doc);
					else
					{
						console.log("unknown type: " + doc.Type);
						unknown = true;
					}
					if (!unknown)
					{
						//note: unknown types are still placed in the final array
						totalString += JSON.stringify(doc);
					}
				}
				else
				{
					//close connection & put all the strings into the final array
					if (log) console.log("DATA.LIST : end gathering");
					db.close();
					var ret = [totalString, songString, playlistString, userString, testString];
					callback(ret);
				}
			});
		}
	});

}

/* CALLBACK FUNCTIONS */


//goes to the html page that lists out the database results
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

//inserts the query into the collection (if it's valid)
function validateCallBack(valid, query, cl, callback)
{
	if (valid)
	{
		//if data is valid, add it to the database
		if (log) console.log("DATA.POST : JSON validated successfully");
		cl.insert(query);
	}
	else
	{
		console.log(query + " falied validation...");
	}
	callback();
}

//export functions to be used outside data.js
module.exports.post = post;
module.exports.validate = validate;
module.exports.list = list;
module.exports.listCallBack = listCallBack;
