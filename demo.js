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
  board.oneRound();
  board.redraw();
});

var interval_id;
run.addEventListener("click", function() {
  if (interval_id) {
    clearInterval(interval_id);
    interval_id = undefined;
    run.value = "Run";
  } else {
    interval_id = setInterval(function() {
      board.oneRound();
      board.redraw();
    }, 1000);
    run.value = "Stop";
  }
});
