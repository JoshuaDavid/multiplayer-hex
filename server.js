var port = 6891;
var url = require("url");
var path = require("path");
var fs = require("fs");
var http = require("http");

var io = require("socket.io").listen(port);
var waitingSocket = null;

io.sockets.on('connection', function(socket) {
    socket.emit("status", "connected");
    if(!waitingSocket) {
        socket.emit("status", "waiting for opponent");
        waitingSocket = socket;
    }
    else {
        var socket1 = waitingSocket;
        var socket2 = socket;
        var game = new Game(socket1, socket2);
        waitingSocket = null;
    }
});

function Game(socket1, socket2) {
    var s1 = socket1;
    var s2 = socket2;
    socket1.emit("status", "joined game");
    socket2.emit("status", "joined game");
    var board = this.board = [];
    var size = this.size = 11;
    var player = this.player = 1;
    var color = this.color = "red";
    socket1.emit("set", {color: "red"})
    socket2.emit("set", {color: "blue"})
    socket1.emit("start", size)
    socket2.emit("start", size)
    for(var y = 0; y < size; y++) {
        board[y] = [];
        for(var x = 0; x < size; x++) {
            var space = {};
            space.fill = 0;
            space.seesTop    = (y === 0)
            space.seesBottom = (y === size - 1)
            space.seesLeft   = (x === 0)
            space.seesRight  = (x === size - 1)
            board[y][x] = space;
        }
    }
    socket1.emit("request", "move");
    socket1.on("move", move1);
    socket2.on("move", move2);
    function move1(data) {
        if(player !== 1) {
            socket1.emit("status", "not your turn");
            return false;
        }
        if(data && data.x && data.y) {
            var x = data.x, y = data.y;
            if(x >= 0 && y >= 0 && x < size && y < size) {
                doMove(x, y);
                player = 3 - player;
                color = player === 1 ? "red" : "blue";
                socket2.emit("request", "move");
            }
            else socket1.emit("request", "move");
        }
        else socket1.emit("request", "move");
    }
    function move2(data) {
        if(player !== 2) {
            socket2.emit("status", "not your turn");
            return false;
        }
        if(data && data.x && data.y) {
            var x = data.x, y = data.y;
            if(x >= 0 && y >= 0 && x < size && y < size) {
                doMove(x, y);
                player = 3 - player;
                color = player === 1 ? "red" : "blue";
                socket1.emit("request", "move");
            }
            else socket2.emit("request", "move");
        }
        else socket2.emit("request", "move");
    }
    function doMove(x, y) {
        var space = board[y][x];
        s1.emit("color", {x: x, y: y, color: color});
        s2.emit("color", {x: x, y: y, color: color});
        for(var i = 0; i < size * size; i++) {
            for(var y = 0; y < size; y++) {
                for(var x = 0; x < size; x++) {
                    seeLikeNeighbors(x, y);
                }
            }
        }
        if(color === "red" && space.seesTop && space.seesBottom) {
            // red wins
            socket1.emit("status", "Red wins!");
            socket2.emit("status", "Red wins!");
        }
        console.log(space);
        if(color === "blue" && space.seesLeft && space.seesRight) {
            // blue wins
            socket1.emit("status", "Blue wins!");
            socket2.emit("status", "Blue wins!");
        }
    }
    function seeLikeNeighbors(x, y) {
        seeSame(x, y, x - 1, y + 0);
        seeSame(x, y, x + 1, y + 0);
        seeSame(x, y, x - 1, y - 1);
        seeSame(x, y, x + 1, y + 1);
        seeSame(x, y, x - 0, y - 1);
        seeSame(x, y, x - 0, y + 1);
    }
    function seeSame(x1, y1, x2, y2) {
        if(x1 < 0 || y1 < 0 || x2 < 0 || y2 <0) return;
        if(x1 >= size || y1 >= size || x2 >= size || y2 >= size) return;
        var s1 = board[y1][x1];
        var s2 = board[y2][x2];
        if(!s1.fill) return;
        try {
            if(s1.fill !== s2.fill) {
                return;
            }
            s1.seesBottom = s2.seesBottom = s1.seesBottom || s2.seesBottom;
            s1.seesRight  = s2.seesRight  = s1.seesRight  || s2.seesRight;
            s1.seesLeft   = s2.seesLeft   = s1.seesLeft   || s2.seesLeft;
            s1.seesTop    = s2.seesTop    = s1.seesTop    || s2.seesTop;
        }
        catch(e) {
            console.error(e);
        }
    }
};
