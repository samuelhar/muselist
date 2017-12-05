# muselist
Added ability to choose genre songs, add songs by artist, and play songs individually. 


data.js & data_route.js -> used for all things data related. Some useful functions:

  #### validate - used to validate a JSON query. probably not needed outside of data.js
  
  
  #### list(callback) - gathers & organizes data and renders an html page that shows the contents
  
    callback: a function list passes in the data array upon completion
    
    
  #### clear - deletes all items in the database
  
    callback: a function called upon completion
    
    
  #### post - validates & inserts a query to the database (use this for testing - actual posts should be done with insert)
  
    type: type of object ("User", "Song", "Playlist", or "Test")
    
    query: JSON to be added
    
    callback: a function called upon completion
    
    
 #### connect - connects to the mongo server (probably not needed outside data.js)
  
    callback: a function called upon completion
    
    
  #### insertUser - updates or inserts a user to the database
  
    userId: unique identifier for item
    
    name: name
    
    anthem: favorite song
    
    playlists: list of lists of songs
    
    callback: a function called upon completion
    
    
  #### insertSong - updates or inserts a song to the database
  
    songId: unique identifier for song
    
    title: title of track
    
    artist: artist of track
    
    album: album track is on
    
    year: year track was released
    
    callback: a function called upon completion
    
    
  #### insertPlaylist - updates or inserts a playlist to the database
    playlistId: unique identifier for playlist
    
    title: name of playlist
    
    playlist: list of songs
    
    callback: a function called upon completion
  
  
  #### addItemToList - updates the songslist in a playlist, or the playlist-list in a user
    itemId: unique identifier for the item (songId, or playlistId)

    listId: unique identifier for the list (playlistId, or userId)

    itemType: type of the item (Song, or Playlist)

    listType: type of the list (Playlist, or User)

    callback: a function called upon completion
  
  
  
  Make sure to include the following fields to the .env file:

    DATABASE_URL = mongodb://localhost:27017/test (note: subject to change)

    DATABASE_COLLECTION = test (note: subject to change)

  
  Also start the database before doing any connections (the terminal command is simply 'mongod')
  
  And finally type in 'npm install' to install all the packages needed (ajv & mongodb)
