
/*
 * Y home page.
 */

 var _ = require('underscore');

var games = {};

exports.index = function(req, res){
  res.render('Y', { title: 'Y' });
};

global.io.of('/y').on('connection', function(socket) {
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