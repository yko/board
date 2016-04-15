var ctx;
if (canvas.getContext) {
  ctx = canvas.getContext('2d');
} else
  throw "This browser doesn't support canvas.getContext :(";

var board = new AiBoard(ctx);

function redAi(board) {
   return { action: 'clone', x: this.x+1, y: this.y };
}

function blueAi(board) {
   return { action: 'move', x: this.x, y: this.y-1 };
}

board.addUnit({x: 1, y: 1, color: 'red', ai: redAi });
board.addUnit({x: 8, y: 8, color: 'blue', ai: blueAi });

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
