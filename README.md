# muselist
Added ability to choose genre songs, add songs by artist, and play songs individually. 


Data.js -> used for all things data related. Current features:
  validate - used to validate a JSON query. probably not needed outside of data.js
  post - adds a JSON query to the database assuming it is valid (see above).
  list - gathers & organizes data and renders an html page that shows the contents
  
  to use any of these functions start with:
  var data = require('./data');
  
  then to post a new query:
    data.post(Type, query, function () {
      data.postCallBack(res);
     });

     where Type is the type of the query ('Song', 'Playlist', 'User', or 'Test')
     and query is the JSON query to be added
     Note that data.postCallBack(res) can be replaced
   
   to list database data:
     data.list( function(ret) {
       data.listCallBack(res, ret);
     });
     
   where ret is the array of data returned by data.list

  
