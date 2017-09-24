
var express = require('express');
var app = express();
var https = require('https');
var querystring = require('querystring');
var bodyParser = require('body-parser');
var json = require('express-json');
var superagent = require('superagent');


var username = 'u936aac10e495e0a6ee236e00445461bd';
var password = '674E7A2E488D39FFA582390C1A94A0C3';
var realtimeKey = '3c7a24f0e00f4458815822eb30fe4c42';
var locationLookupKey = '3542c4147f184b648e7b6deb10c629cf';
var tripPlannerKey = 'e06dc18ccade4d2abfd0ca5e3ad89a1b';
var postFields = {
  from:    "RouteBud", 
  to:      "", 
  message: ""
  }

var key = new Buffer(username + ':' + password).toString('base64');

var options = {
  hostname: 'api.46elks.com',
  path:     '/a1/SMS',
  method:   'POST',
  headers:  {
    'Authorization': 'Basic ' + key
    }
  };

var customer = "";

var locationCallback1 = function(response){
  var str = ''
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log(str);
  });
}

var locationCallback2 = function(response){
  var str = ''
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log(str);
  });
}


var callback = function(response) {
  var str = ''
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log(str);
  });
}


var sendMessage = function(to, message){
var request = https.request(options, callback);
postFields.to = to;
postFields.message = message;
var postData = querystring.stringify(postFields);

request.write(postData);
request.end();
}
// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.use(json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


app.post("/sms", function (request, response) {
  console.log(request.body);
  findRoute(request.body.from, request.body.message);
});

var findRoute = function(from, message){
  var parts = message.split(" ");
  var src = parts[0];
  var dest = parts[1];
  var srcId = '';
  var destId = '';
  customer = from;
  var locationRequest1={
    hostname: 'http://api.sl.se/api2',
    path:     '/typeahead.json?key=3542c4147f184b648e7b6deb10c629cf&searchstring=' + src,
    method:   'GET',
  };
  
  //var findRouteRequest1 = https.request(locationRequest1, locationCallback1);
  superagent
  .get('http://api.sl.se/api2/typeahead.json')
  .query({ key: '3542c4147f184b648e7b6deb10c629cf', searchstring: src }) // query string
  .end((err, res) => {
    srcId = res.body.ResponseData[0].SiteId;
  });
  //findRouteRequest1.end();
  

  
  var locationRequest2={
    hostname: 'http://api.sl.se/api2',
    path:     '/typeahead.json?key=3542c4147f184b648e7b6deb10c629cf&searchstring=' + dest,
    method:   'GET',
    port: 8080,
  };
//  var findRouteRequest2 = https.request(locationRequest2, locationCallback2);
  
//  findRouteRequest2.end();
  superagent
  .get('http://api.sl.se/api2/typeahead.json')
  .query({ key: '3542c4147f184b648e7b6deb10c629cf', searchstring: dest }) // query string
  .end((err, res) => {
    if(res.body){
      destId = res.body.ResponseData[0].SiteId;
    
    calculateRoute(srcId, destId);
      }
  });
  
}
//Request the route from SL journey planner

var calculateRoute = function(srcId, destId){
  var options = {
  hostname: 'http://api.sl.se/api2/TravelplannerV3/trip.json',
  path: 'key=e06dc18ccade4d2abfd0ca5e3ad89a1b&originid='+ srcId + '&destid=' + destId,
  method: 'GET',
  }
  
  superagent.get(options.hostname)
  .query({ key: tripPlannerKey, originid: srcId, destid: destId }) // query string
  .end((err, res) => {
    
    var steps = '';
    if(res.body){
      var Legs = res.body.Trip[0].LegList.Leg;
      Legs.map(function(l, i){
      var origin = l.Origin.name;
      var time = l.Origin.time;
      var dest = l.Destination.name;
      var mode = l.name == "" ? "WALK" : l.name;
      steps = steps + "Step " + i + ": " + "Take " + mode + " from " + origin + " to " + dest + " at " + time + "\n";
    });
    sendMessage(customer, steps);
    }
  });          
  
  
};


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});