# muselist
Added ability to choose genre songs, add songs by artist, and play songs individually. 


Data.js -> used for all things data related. Current features:
  validate - used to validate a JSON query. probably not needed outside of data.js
  list - gathers & organizes data and renders an html page that shows the contents
  clear - deletes all items in the database
  insertItem - inserts (or updates if it already exists) a Song, User, or Playlist to the database
  connect - connects to the mongo server (probably not needed outside data.js)
  
  Make sure to include the following fields to the .env file:
  DATABASE_URL = mongodb://localhost:27017/test (note: subject to change)
  DATABASE_COLLECTION = test (note: subject to change)
  
  Also start the database before doing any connections (the terminal command is simply 'mongod')
  
  And finally type in 'npm install' to install all the packages needed (ajv & mongodb)
