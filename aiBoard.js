var AiBoard = function (ctx, options) {
    this.ctx = ctx;

    function mergeConf(defaults, options, target) {
        if (typeof target == 'undefined')
            target = {};
        for (var attrname in defaults) target[attrname] = defaults[attrname];
        if (typeof options != 'undefined')
            for (var attrname in options) target[attrname] = options[attrname];
        return target;
    }

    var defaults = {
        x_size: 10,
        y_size: 10,
        cell_size: 20,
        border_width: 1,
    };
    mergeConf(defaults, options, this);

    if (typeof this.generation == 'undefined') {
        this.generation = [];
        for (var i = 0; i < this.x_size; i++)
            this.generation[i] = [];
    }

    var Unit = this.Unit = function (options) {
        var defaults = {
            x: 0,
            y: 0,
            color: 'black',
            ai: function () { return { action: 'none' }; },
        };
        mergeConf(defaults, options, this);

        this.clone = function () {
            return new Unit({
                x: this.x,
                y: this.y,
                color: this.color,
                ai: this.ai,
            });
        };
        this.isEnemy = function (color) {
            return color != this.color;
        };
    };

    this.drawOneStep = function () {
        var board = this;
        var result = board.oneRound();
        this.drawDebugOverlay(result.overlay);
        setTimeout(function() {
            board.redraw();
        }, 500);
    };

    this.stopTheGame = function () {
        clearInterval(this.gameInterval);
        this.gameInterval = undefined;
    };
    this.runTheGame = function () {
        if (this.gameInterval)
            throw "The game is already running";
        var board = this;

        this.gameInterval = setInterval(function() {
            board.drawOneStep();
        }, 1000);
    };

    this.isGameRunning = function () {
        return typeof this.gameInterval !== 'undefined';
    };

    this.clear = function () {
        this.ctx.clearRect(
            0,
            0,
            this.x_size * this.cell_size + this.x_size * this.border_width + this.border_width,
            this.y_size * this.cell_size + this.y_size * this.border_width + this.border_width
        );
    };

    this.redraw = function () {
        this.clear();
        this.drawGrid();
        this.drawGeneration(this.generation);
    };

    this.drawDebugOverlay = function (overlay) {
        for (var x = 0; x < this.x_size; x++) {
            for (var y = 0; y < this.y_size; y++) {
                for (var j = 0; j < overlay[x][y].length; j++) {
                    var item = overlay[x][y][j];
                    try {
                        item.call(item, x, y);
                    } catch (e) {
                        console.log("Debug overlay error from " + x + ", " + y + ": ", e);
                    };
                }
            }
        }
    };

    this.overlayArrow = function (to_x, to_y, color) {
        var board = this;
        var ctx = board.ctx;
        return function (x, y) {
            var start = {
                x: board.cell_size * x + board.border_width * x + board.cell_size / 2,
                y: board.cell_size * y + board.border_width * y + board.cell_size / 2
            };
            var end = {
                x: start.x + (to_x > x ? board.cell_size : to_x < x ? -board.cell_size : 0),
                y: start.y + (to_y > y ? board.cell_size : to_y < y ? -board.cell_size : 0)
            };
            var endRadians = Math.atan((end.y - start.y) / (end.x - start.x));
            endRadians += ((end.x >= start.x) ? 90 : -90) * Math.PI / 180;
            ctx.save();
            ctx.strokeStyle = "white";
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.translate(end.x, end.y);
            ctx.rotate(endRadians);
            ctx.lineTo(3, 10);
            ctx.lineTo(-3, 10);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.restore();
        };
    };

    this.drawGeneration = function () {
        for (var x = 0; x < this.x_size; x++) {
            for (var y = 0; y < this.y_size; y++) {
                if (typeof this.generation[x][y] != 'undefined') {
                    this.ctx.fillStyle = this.generation[x][y].color;
                    this.ctx.fillRect(
                        this.cell_size * x + this.border_width * x,
                        this.cell_size * y + this.border_width * y,
                        this.cell_size,
                        this.cell_size
                    );
                }
            }
        }
    };

    this.drawGrid = function () {
        var x_bottom = this.x_size * this.cell_size + this.x_size * this.border_width;
        var y_bottom = this.y_size * this.cell_size + this.y_size * this.border_width;

        this.ctx.beginPath();
        for (var x = 0; x < this.x_size + 1; x++) {
            ctx.moveTo(this.cell_size * x + this.border_width * x, 0);
            ctx.lineTo(this.cell_size * x + this.border_width * x, y_bottom);
        }

        for (var y = 0; y < this.y_size + 1; y++) {
            ctx.moveTo(0, this.cell_size * y + this.border_width * y);
            ctx.lineTo(x_bottom, this.cell_size * y + this.border_width * y);
        }

        this.ctx.closePath();
        this.ctx.stroke();
    };

    this.addUnit = function (options) {
        var unit = new Unit(options);
        this.generation[unit.x][unit.y] = unit;
        return unit;
    };

    this.oneRound = function(generation) {
        var result = this.calculateRound(this.generation);
        this.generation = result.generation;
        return result;
    };

    this.calculateRound = function(generation) {
        var next_generation = [];
        var attack_matrix = [];
        var overlay = [];
        var staticBoard = [];

        for (var i = 0; i < this.x_size; i++) {
            next_generation[i] = [];
            attack_matrix[i] = [];
            overlay[i] = [];
            staticBoard[i] = [];
            for (var j = 0; j < this.y_size; j++) {
                next_generation[i][j] = [];
                attack_matrix[i][j] = [];
                overlay[i][j] = [];
                if (typeof generation[i][j] == 'undefined') {
                    staticBoard[i][j] = 'none';
                } else {
                    staticBoard[i][j] = generation[i][j].color;
                }
            }
        }

        for (var x = 0; x < this.x_size; x++) {
            generation_pos: for (var y = 0; y < this.y_size; y++) {
                if (typeof generation[x][y] == 'undefined') continue;
                try {
                    var move = this.getNextMove(generation[x][y], JSON.parse(JSON.stringify(staticBoard)) );
                    if (move.action === 'none') {
                        next_generation[x][y].push(generation[x][y]);
                    } else if (move.action === 'clone') {
                        next_generation[x][y].push(generation[x][y]);
                        var cloned = generation[x][y].clone();
                        cloned.x = move.x, cloned.y = move.y;
                        next_generation[move.x][move.y].push(cloned);
                        overlay[x][y].push(this.overlayArrow(move.x, move.y, 'green'));
                    } else if (move.action === 'move') {
                        generation[x][y].x = move.x;
                        generation[x][y].y = move.y;
                        next_generation[move.x][move.y].push(generation[x][y]);
                        overlay[x][y].push(this.overlayArrow(move.x, move.y, 'black'));
                    } else if (move.action === 'attack') {
                        next_generation[x][y].push(generation[x][y]);
                        attack_matrix[move.x][move.y].push({ from: { x: x, y: y } });
                        overlay[x][y].push(this.overlayArrow(move.x, move.y, 'red'));
                    }
                } catch (e) {
                    console.log("Unit at " + x + ", " + y + ".  pdoruced an error", e);
                };
            }
        }

        for (var i = 0; i < this.x_size; i++) {
            for (var j = 0; j < this.y_size; j++) {
                if (next_generation[i][j].length != 1) {
                    next_generation[i][j] = undefined;
                } else {
                    next_generation[i][j] = next_generation[i][j][0];
                }
                if (attack_matrix[i][j].length) {
                    next_generation[i][j] = undefined;
                }
            }
        }

        return {
            generation: next_generation,
            overlay: overlay
        };
    };

    this.getNextMove = function (unit, staticBoard) {
        var old_x = unit.x, old_y = unit.y;
        var move = unit.ai.call(unit, staticBoard);
        if (old_x != unit.x || old_y != unit.y)
            throw "ai() modified unit's position";

        if (!'action' in move)
            throw "ai() is expected to return { action: '...', ... }";
        if (move.action === 'none')
            return move;

        if (move.action === 'attack' || move.action === 'clone' || move.action === 'move') {
            if (!'x' in move || !'y' in move)
                throw "ai() is expected to return { action: '" + move.action + "', x: int, y: int }";

            if (move.x >= this.x_size || move.x < 0 || move.y >= this.y_size || move.y < 0)
                throw "ai() returned a position that is outside of the board: " + move.x + ", " + move.y;

            if (Math.abs(old_x - move.x) > 1 || Math.abs(old_y - move.y) > 1)
                throw "ai() tried to " + move.action + " remote cell " + move.x + ", " + move.y;

            return move;
        }

        throw "Unknown action: '" + move.action + "'";
    };
};
