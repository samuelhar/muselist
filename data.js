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
var log = false;


/* pull in schemas */
var ss = require('./schema/songSchema.json');
var us = require('./schema/userSchema.json');
var ps = require('./schema/playlistSchema.json');


/* compile schemas & set them up for validation */
var songValidate = ajv.compile(ss);
var userValidate = ajv.compile(us);
var playlistValidate = ajv.compile(ps);


/* * * * * * * * * * * MAIN FUNCTIONS * * * * * * * * * * * */

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

function insertItem (type, id, f1, f2, f3, f4, callback) {
	/* inserts a song to the database. if it already exists (identified by the songId) then it is updated
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
		str["songId"] = id;
		str["title"] = f1;
		str["artist"] = f2;
		str["album"] = f3;
		str["year"] = f4;
	}
	else if (type === "User")
	{
		str["userId"] = id;
		str["name"] = f1;
		str["anthem"] = f2;
		str["playlists"] = f3;
	}
	else
	{
		str["playlistId"] = id;
		str["title"] = f1;
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

/* * * * * * * * * * * EXPORT FUNCTIONS * * * * * * * * * * * */

module.exports.post = post;
module.exports.validate = validate;
module.exports.list = list;
module.exports.insertItem = insertItem;
module.exports.clear = clear;

/* * * * * * * * * * * HELPER FUNCTIONS * * * * * * * * * * * */

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
