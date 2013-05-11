// (function() {
	console.log("Y brain loaded.");

	var canvas, stage, container;

	var update = true;

	var whiteField = {
		x: 15,
		y: 10,
		width: 172,
		height: 637,
		pieceWidth: 32,
		pieceHeight: 34
	};

	var blackField = {
		x: 811,
		y: 15,
		width: 172,
		height: 637,
		pieceWidth: 32,
		pieceHeight: 34
	};

	var positions = [{"x":482,"y":359},{"x":560,"y":314},{"x":390,"y":268},{"x":481,"y":188},{"x":429,"y":127},{"x":292,"y":384},
	{"x":533,"y":357},{"x":675,"y":384},{"x":511,"y":321},{"x":377,"y":357},{"x":585,"y":356},{"x":652,"y":325},{"x":481,"y":287},
	{"x":629,"y":226},{"x":524,"y":272},{"x":246,"y":400},{"x":382,"y":222},{"x":666,"y":279},{"x":619,"y":271},{"x":697,"y":337},
	{"x":580,"y":223},{"x":377,"y":172},{"x":342,"y":269},{"x":530,"y":226},{"x":428,"y":356},{"x":480,"y":94},{"x":454,"y":320},
	{"x":403,"y":312},{"x":292,"y":277},{"x":535,"y":130},{"x":357,"y":314},{"x":481,"y":239},{"x":430,"y":175},{"x":311,"y":323},
	{"x":632,"y":368},{"x":264,"y":338},{"x":480,"y":139},{"x":583,"y":175},{"x":332,"y":371},{"x":606,"y":314},{"x":432,"y":224},
	{"x":534,"y":177},{"x":437,"y":271},{"x":720,"y":402},{"x":333,"y":224},{"x":571,"y":268},{"x":480,"y":527},{"x":560,"y":479},
	{"x":457,"y":399},{"x":287,"y":562},{"x":361,"y":407},{"x":524,"y":443},{"x":231,"y":464},{"x":450,"y":562},{"x":314,"y":484},
	{"x":482,"y":601},{"x":541,"y":523},{"x":503,"y":399},{"x":731,"y":468},{"x":552,"y":398},{"x":316,"y":425},{"x":387,"y":553},
	{"x":480,"y":446},{"x":646,"y":427},{"x":438,"y":442},{"x":328,"y":535},{"x":576,"y":553},{"x":508,"y":490},{"x":226,"y":529},
	{"x":511,"y":563},{"x":614,"y":583},{"x":407,"y":396},{"x":549,"y":596},{"x":271,"y":507},{"x":637,"y":533},{"x":403,"y":482},
	{"x":272,"y":445},{"x":567,"y":434},{"x":687,"y":447},{"x":416,"y":596},{"x":350,"y":583},{"x":650,"y":482},{"x":365,"y":508},
	{"x":604,"y":409},{"x":677,"y":562},{"x":597,"y":508},{"x":454,"y":490},{"x":606,"y":458},{"x":692,"y":507},{"x":422,"y":523},
	{"x":732,"y":530},{"x":356,"y":460},{"x":396,"y":435}];

	var boardImage, blackPieceImage, whitePieceImage;
	var boardObject, blackPieceObject, whitePieceObject;
	var pieces = [];
	var socket;

	function init() {

		socket = io.connect();
		socket.on('connect', function() {
			socket.emit('game',{gameID: getQueryVariable('game')});
		});

		socket.on('gamestart', function(data) {
			console.log(data);
		});

		canvas = document.getElementById("boardCanvas");

		document.getElementById("loader").className = "loader";

		stage = new createjs.Stage(canvas);
		createjs.Touch.enable(stage);
		stage.enableMouseOver(50);
		stage.mouseMoveOutside = true;

		container = new createjs.Container();
		stage.addChild(container);

		async.parallel(
			{
				board: function(callback) {
					console.log("Loading board.");
					boardImage = new Image();
					boardImage.src = "/images/board.png";
					boardImage.onload = function(event) {
						callback(null, event.target);
					};
				},
				blackpiece: function(callback) {
					console.log("Loading black piece.");
					blackPieceImage = new Image();
					blackPieceImage.src = "/images/black_piece.png";
					blackPieceImage.onload = function(event) {
						callback(null, event.target);
					};
				},
				whitepiece: function(callback) {
					console.log("Loading white piece");
					whitePieceImage = new Image();
					whitePieceImage.src = "/images/white_piece.png";
					whitePieceImage.onload = function(event) {
						callback(null, event.target);
					};
				}
			},
			function(err, results) {
				if (!err) {
					boardObject = new createjs.Bitmap(results.board);
					container.addChild(boardObject);
					boardObject.name = "board";

					var blackImage = results.blackpiece;
					var whiteImage = results.whitepiece;

					var images = [blackImage, whiteImage];
					var fields = [blackField, whiteField];
					var colors = ["black", "white"];

					for (var i = 0; i < 94; i++) {
						var imageObject = images[i%2];
						var field = fields[i%2];

						var piece = new createjs.Bitmap(imageObject);
						
						piece.x = field.x + Math.floor(Math.random() * (field.width - field.pieceWidth));
						piece.y = field.y + Math.floor(Math.random() * (field.height - field.pieceHeight));
						piece.cursor = 'move';
						piece.name = colors[i%2] + '_' + i;
						piece.color = colors[i%2];
						piece.colorIndex = i%2;
						pieces.push(piece);

						container.addChild(piece);

						(function(target) {
							piece.onPress = function(evt) {
								var previewPiece = new createjs.Bitmap(images[target.colorIndex]);
								previewPiece.set({alpha: 0});
								container.addChild(previewPiece);

								container.addChild(target);
								var offset = {x:target.x-evt.stageX, y:target.y-evt.stageY};

								evt.onMouseMove = function(ev) {
									target.x = ev.stageX + offset.x;
									target.y = ev.stageY + offset.y;

									var pos = findNearestWithMinDistance({x: target.x, y: target.y}, positions, 30);
									if (pos) {
										previewPiece.x = pos.x;
										previewPiece.y = pos.y;
										previewPiece.set({alpha: .5});
									} else {
										previewPiece.set({alpha: 0});
									}

									update = true;

									socket.emit('move', {
										pieceName: target.name,
										x: target.x,
										y: target.y
									});
								}

								evt.onMouseUp = function(ev) {
									document.body.style.cursor = 'default';
									console.log(ev);
									var pos = findNearestWithMinDistance({x: target.x, y: target.y}, positions, 30);
									if (pos) {
										target.x = pos.x;
										target.y = pos.y;
										update = true;

										socket.emit('move', {
											pieceName: target.name,
											x: target.x,
											y: target.y
										});
									} else {
										console.log("Could not snap.");
									}
									container.removeChild(previewPiece);
								}
							}
						})(piece);
					}

					document.getElementById("loader").className = "";
					createjs.Ticker.addEventListener("tick", tick);

					socket.on('move', function(data) {
						console.log(data);
						var target;
						for (var t in container.children) {
							if (container.children[t].name == data.pieceName) {
								target = container.children[t];
								break;
							}
						}
						if (target) {
							target.x = data.x;
							target.y = data.y;
							update = true;
						}
					});

					

				} else {
					console.log("Error: ");
					console.log(err);
				}
			}
		);


	}

	function handleBoardImageLoad(event) {
		console.log("board image loaded.");

		var image = event.target;
		var bitmap;
		var container = new createjs.Container();
		stage.addChild(container);

		bitmap = new createjs.Bitmap(image);
		container.addChild(bitmap);

		document.getElementById("loader").className = "";
		createjs.Ticker.addEventListener("tick", tick);
	}

	function tick() {
		if (update) {
			update = false;
			stage.update();
		}
	}

	$().ready(init);
// })();

function findNearestWithMinDistance(coordinates, pointList, minDistance) {
	// coordinates:  {x: x-coordinate, y: y-coordinate}
	// pointList: [{x: x-coordinate, y: y-coordinate, ...}, {...}, {...}]
	// minDistance:  whole number

	var minDistSquared = minDistance * minDistance;
	var lowestDistance = 1000000000;
	var distance, point, nearestPoint;

	for (var i in pointList) {
		point = pointList[i];
		distance = Math.pow(point.x - coordinates.x, 2) + Math.pow(point.y - coordinates.y, 2);
		// console.log(i, distance, point);
		if (distance < lowestDistance) {
			lowestDistance = distance;
			nearestPoint = point;
		}
	}
	// console.log(lowestDistance);
	if (lowestDistance <= Math.pow(minDistance,2)) {
		return nearestPoint;
	} else {
		return null;
	}
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}