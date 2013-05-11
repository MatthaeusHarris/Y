
/**
 * Module dependencies.
 */

/*
 var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3000);
*/

var _ = require('underscore');

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

var games = {};

var server = http.createServer(app);
server.listen(process.env.PORT || 3000);

// all environments
// app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
io.on('connection', function(socket) {
	console.log("Connection made.");

	socket.on('game', function(data) {
		console.log(JSON.stringify(data, null, 2));
		if (data.gameID) {
			if (games[data.gameID] && games[data.gameID].playerSockets.length === 1) {
				//Both players have connected.  Game on!
				games[data.gameID].playerSockets.push(socket);
				console.log("Game could start now.");
				for (var s = 0; s < 2; s++) {
					var thisSocket = games[data.gameID].playerSockets[s];
					var otherSocket = games[data.gameID].playerSockets[(s+1)%2];
					(function (thisSocket, otherSocket) {
						thisSocket.on('move', function(data) {
							otherSocket.emit('move', data);
						});
					})(thisSocket, otherSocket);

					thisSocket.emit('gamestart', {start:true});
				}
			} else {
				games[data.gameID] = {
					playerSockets: [ socket ],
					board: _.range(93).map(function(x) { return 0; })
				};
			}
		}
	});
});