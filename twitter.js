var Twitter = require('twitter');
require('dotenv').config();

var log = true;
var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});


module.exports = {
	tweet: function(stat) {
		twitterClient.post('statuses/update', {status: stat}, function(error, tweet, response) {
			if (!error)
			{
				if (log) console.log("tweeted out: " + stat);
			}
			else
			{
				if (log) console.log(error);
			}
		});
	}
};
