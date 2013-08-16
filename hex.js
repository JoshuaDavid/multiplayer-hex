var socket;
window.onload = function() {
    socket = io.connect();
    socket.on("status", logStatus);
    socket.on("set", setVars);
    socket.on("start", buildBoard);
    socket.on("color", colorSpace);
}


var game = {};
var board;
function logStatus(data) {
    console.log(data);
}

function setVars(obj) {
    console.log(obj);
    for(name in obj) {
        if(obj.hasOwnProperty(name)) {
            game[name] = obj[name];
        }
    }
}

function buildBoard(size) {
    var boardEl = document.createElement("div");
    var topEl = document.createElement("div");
    topEl.classList.add("red");
    topEl.classList.add("row");
    var ctr = document.getElementById('container');
    ctr.innerHTML = "";
    boardEl.appendChild(topEl);
    board = [];
    for(var y = 0; y < size; y++) {
        var rowEl = document.createElement("div");
        rowEl.style["margin-left"] = 0.5 * y + "em";
        board[y] = [];
        for(var x = 0; x < size; x++) {
            var space = document.createElement('div');
            space.classList.add('space');
            space.x = x;
            space.y = y;
            space.onclick = doMove;
            board[y][x] = space;
            rowEl.appendChild(space);
        }
        boardEl.appendChild(rowEl);
    }
    var bottomEl = document.createElement("div");
    bottomEl.classList.add("red");
    bottomEl.classList.add("row");
    bottomEl.style["margin-left"] = 0.5 * y + "em";
    boardEl.appendChild(bottomEl);
    ctr.appendChild(boardEl);
}

function doMove(e) {
    var space = e.target;
    var x = space.x;
    var y = space.y;
    socket.emit("move", {x: x, y: y});
}

function colorSpace(data) {
    var x = data.x;
    var y = data.y;
    var color = data.color;
    board[y][x].classList.add(color);
}
