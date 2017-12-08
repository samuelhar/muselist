# muselist
Added ability to choose genre songs, add songs by artist, and play songs individually. 

To run, install node & npm, and enter the following command in the directory containing the application:
     npm install

Enter to run the app:


     node muselist.js

Ensure that a file named '.env' is in the directory with the following contents:


      CLIENT_ID = '<replace with client id for spotify>'
      CLIENT_SECRET = '<replace with client secret for spotify>'
      TWITTER_CONSUMER_KEY = '<replace with twitter consumer key>'
      TWITTER_CONSUMER_SECRET = '<replace with twitter consumer secret>'
      TWITTER_ACCESS_TOKEN = '<replace with twitter access token>'
      TWITTER_ACCESS_SECRET = '<replace with twitter access secret>'
      DATABASE_URL = '<replace with URL following this format:
                     mongodb://'<ip>':'<portNo>'/'<collection>'
                     EX: mongodb://localhost:27017/test
                     >'
      PORT = '<replace with portno to use for URL>'
                    
                    

data.js contains functions used for inserting, updating, and extracting data from the database.
data_route.js is used for routing all URL's involving viewing or saving data from within the app. Note that a machine must be running a mongodb (terminal command: 'mongod').

All project process documents are in the "documentation" folder.
UI and form field testing are combined into the one spreadsheet, separted by "click" vs actual value input.
The documented schemas in documentation folder are not those used in production because they cannot be compiled with comments.
