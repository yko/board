var ctx;
if (canvas.getContext) {
  ctx = canvas.getContext('2d');
} else
  throw "This browser doesn't support canvas.getContext :(";

var board = new AiBoard(ctx, { x_size: 20, y_size: 15 });
var target = board.addUnit({
    x: Math.floor(Math.random() * board.x_size),
    y: Math.floor(Math.random() * board.y_size),
    color: 'blue'
});

function playerAI(board) {
    // playerAI called on each turn to calculate the next move.
    // Use this.x, this.y for coordinates of the unit
    // board is a 2d array of board states at current turn
    // The goal is for player unit to reach tartet.x, target.y

    // Return value to move the unit:
    //  { action: 'move', x: $NEXT_X_POS, y: $NEXT_Y_POS }
   return { action: 'move', x: this.x+1, y: this.y };
}

var player_x, player_y;
while (1) {
    player_x = Math.floor(Math.random() * board.x_size),
    player_y = Math.floor(Math.random() * board.y_size);
    if (Math.abs(player_x - target.x) < board.x_size/2 || Math.abs(player_y - target.y) < board.y_size/2) {
        continue;
    }
    break;
}

board.addUnit({x: player_x, y: player_y, color: 'red', ai: playerAI });

board.redraw();

step.addEventListener("click", function() {
    board.drawOneStep();
});

run.addEventListener("click", function() {
    if (board.isGameRunning()) {
        board.stopTheGame();
        run.value = "Start";
    } else {
        board.runTheGame();
        run.value = "Stop";
    }
});
