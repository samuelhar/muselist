
var artist;
var i
var web = 'http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=';
var api_key = '&api_key=fb91e961be0de3aa3b1be7da6917aafc';
//var artist = 'kanye&';
var json = '&format=json';
var input;
function setup (){
  createCanvas(1000,1000);

  var button = select('#submit');

  button.mousePressed(artistAsk);
  input = select('#artist');
  
}

function artistAsk(){
	clear();
	var url = web+input.value()+api_key+json;
  //loadJSON('http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=kanye&api_key=fb91e961be0de3aa3b1be7da6917aafc&format=json',gotData);
  loadJSON(url,gotData);
}
function gotData(data){
 //print(data);
 
 artist = data;
 var i;
 var tracker;
 tracker = 30;
 if (artist.message == "The artist you supplied could not be found") {
    textSize(32);
  text('This artist does not exist', 10, 30);
  fill(0, 102, 153);
 

 }
 else {
for (i = 0; i < 5; i++) { 
  textSize(32);
 //text(weather.toptracks.track[0].name,10,30);
  text(artist.toptracks.track[i].artist.name + " = "+artist.toptracks.track[i].name, 10, tracker);
  fill(0, 102, 153);
  tracker+=50;
  //text(weather.toptracks.track[1].name, 10, 70);
  //fill(0, 102, 153);
  }

 }
 //print(weather.topalbums.album[0].playcount);
}

function draw(){
 // background(0);
 // if (weather){
   // print(" weather.topalbums.album[0].playcount");
   // ellipse(50,100, weather.topalbums.album[0].playcount,weather.topalbums.album[0].playcount);
  //}
}