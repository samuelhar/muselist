// data.js
// ========

var Ajv = require('ajv');
var ajv = new Ajv();
require('dotenv').config();
var mongodb = require('mongodb');
var log = false;


var ss = require('./schema/songSchema.json');
var us = require('./schema/userSchema.json');
var ps = require('./schema/playlistSchema.json');

var songValidate = ajv.compile(ss);
var userValidate = ajv.compile(us);
var playlistValidate = ajv.compile(ps);

function validate(collection, toAdd) {
	var valid;
	if (log)
	{
		console.log(JSON.stringify(toAdd));
		console.log(collection);
	}	
	if (collection === "Song")
		valid = songValidate(toAdd);
	else if (collection === "User")
		valid = userValidate(toAdd);
	else if (collection === "Playlist")
		valid = playlistValidate(toAdd);
	else if (collection === "Test")
		valid = true;
	else
		valid = null;

	if (log) console.log(valid);
	return valid;

	}

function post(res, query, collection) {
		if (log)
		{
			console.log('received: ' + JSON.stringify(query));
			console.log("collection: " + collection);
		}
		var MongoClient = mongodb.MongoClient;
		var url = process.env.MONGO_URL;
		MongoClient.connect(url, function(err, db) {
			if (err) {
				console.log('Unable to connect to db', err);
			}
			else {
				console.log('Connection established');
				var cl = db.collection("test");
				var valid = validate(collection, query);
				if (valid)
				{
					cl.insert(query);
					console.log('inserted ' + query);
				}
				else
					console.log(query + " failed validation...");
			}
			db.close();
		});
		res.render('home');
	}

function list(res)  {
	var MongoClient = mongodb.MongoClient;
	var url = process.env.MONGO_URL;
	MongoClient.connect(url, function(err, db) {
		if (err) {
			console.log('Unable to connect to db', err);
		} else {
			console.log('Connection established');
			var songString = "";
			var playlistString = "";
			var userString = "";
			var testString = "";
			var totalString = "";
			var cl = db.collection('test');
			cl.find().each( function(err, doc) {
				if (err) console.log("unable to find");
				else if (doc)
				{
					var unknown = false;
					if (log) console.log('doc.type: ' + doc.Type);
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
						totalString += JSON.stringify(doc);
					}
				}
				else
				{
					db.close();

					var ret = [totalString, songString, playlistString, userString, testString];

					if (log) console.log("total: " + ret[0]);
					    res.render('collectionlist', 
     					 {"TotalString": ret[0], "SongString": ret[1], 
			               "PlaylistString": ret[2], "UserString": ret[3], 
			               "TestString": ret[4],}
              	);

				}
			});
		}
	});

}

module.exports.post = post;
module.exports.validate = validate;
module.exports.list = list;