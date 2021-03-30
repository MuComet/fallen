class PuyoMinigameController extends MinigameController { // All classes that can be added to the engine MUST extend EngineInstance

    onEngineCreate() { // called when the instance is made from a room.
        super.onEngineCreate();
        PuyoMinigameController.score = 0;
        PuyoMinigameController.timer = 60;
        PuyoMinigameController.endTime = 60;
        PuyoMinigameController.pCamY = 0;
        PuyoMinigameController.nCamY = 0;
        PuyoMinigameController.maxScore = 10;

        $engine.setBackgroundColour(0xa58443);
        this.startTimer(60*60);

        new ParallaxingBackground();

        // instructions

        var text = new PIXI.Text("Place the same-coloured blobs 4 in a row to pop them. Try to get a chain of 10!\n Rotate with Z and X and move with the arrow keys.\nPress Enter to cheat!",{ fontFamily: 'Helvetica',
                        fontSize: 50, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 })

        this.setInstructionRenderable(text)
        this.setControls(true,false);
        this.skipPregame();

        this.setCheatTooltip("Chain ready!")

        // progress
        this.progressText = new PIXI.Text("",{ fontFamily: 'Helvetica',
                    fontSize: 20, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 })
        new PuyoBoard();

        this.addOnGameEndCallback(this,function(self) {
            self.setLossReason("I suppose this game is pretty difficult...")
        })
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames)
    }

    onCreate() { // called when you construct the instance yourself
        this.onEngineCreate();
        super.onCreate();
    }

    step() {
        super.step();
        var timer = PuyoMinigameController.timer;
        var endTime = PuyoMinigameController.endTime;
        if(timer<=endTime) {
            var camera = $engine.getCamera()
            camera.setY(EngineUtils.interpolate(timer/endTime,PuyoMinigameController.pCamY,PuyoMinigameController.nCamY,EngineUtils.INTERPOLATE_OUT_BACK));
            var fac = EngineUtils.interpolate(timer/endTime,1,0,EngineUtils.INTERPOLATE_OUT_QUAD);
            camera.setRotation(EngineUtils.randomRange(-0.01,0.01)*fac)
            camera.setLocation(EngineUtils.irandomRange(-2,2) * fac, camera.getY() + EngineUtils.irandomRange(-2,2) * fac)
        }
        PuyoMinigameController.timer++;
    }

    draw(gui,camera) {
        super.draw(gui,camera)
    }

    onDestroy() {
        super.onDestroy();
    }
}

class PuyoBoard extends EngineInstance {

    onCreate() {
        this.board = []
        for(i = 0; i <= 12; i++) {
            this.board[i] = [new BoardSpace(i,0), new BoardSpace(i,1), new BoardSpace(i,2), new BoardSpace(i,3), new BoardSpace(i,4), new BoardSpace(i,5)]
        }
        this.puyo1 = this.generateStartPuyo()
        this.puyo2 = this.generateStartPuyo()
        this.puyo3 = this.generateStartPuyo()
        this.currentPuyo = null
        this.state = 0
        this.orientation = 0
        this.currentX = [2,2]
        this.currentY = [0,1]
        this.maxChain = 0
        this.columns = [0,0,0,0,0,0]
    }

    //state = 0 means nothing is happening
    //state = 1 means controllable puyo is falling
    //state = 2 means mid-chain
    //orientation = 0 means upright, pivot puyo below
    //orientation = 1 means horizontal, pivot puyo left
    //orientation = 2 means upright, pivot puyo above
    //orientation = 3 means horizontal, pivot puyo right

    step() {
        if(this.state == 0){
            this.currentPuyo = this.puyo1;
            this.puyo1 = this.puyo2;
            this.puyo2 = this.puyo3;
            this.puyo3 = this.generatePuyo();
            this.orientation = 0;
            this.currentX = [2,2];
            this.currentY = [0,1];
            this.placePuyos(1);
            this.state = 1;
            var chain = 0;
            var dropRate = 0;
            var bufferRight = 6;
            var bufferLeft = 6;
            var bufferClock = 6;
            var bufferCounter = 6;
            var droppedColumns = [0,0,0,0,0,0];
            var bufferChain = 30;
            var dropping = true;
        }
        if(this.state == 1){
            if(IN.keyCheck('ArrowDown')){
                dropRate+=10;
            } else {
                dropRate++;
            }
            bufferRight++;
            bufferLeft++;
            bufferClock++;
            bufferCounter++;
            if(IN.keyCheck('ArrowRight')  && bufferRight >= 6){
                if(this.movePossible(0)){
                    this.removePuyos(0);
                    this.currentX[0]++;
                    this.currentX[1]++;
                    this.placePuyos(1);
                    bufferRight = 0;
                }
            } else if(IN.keyCheck('ArrowLeft') && bufferLeft >= 6){
                if(this.movePossible(1)){
                    this.removePuyos(0);
                    this.currentX[0]--;
                    this.currentX[1]--;
                    this.placePuyos(1);
                    bufferLeft = 0;
                }
            } else if(IN.keyCheck('Z') && bufferClock >= 6){
                this.rotateController(0);
                bufferClock = 0;
            } else if(IN.keyCheck('X') && bufferCounter >= 6){
                this.rotateController(1);
                bufferCounter = 0;
            }
            if(dropRate>=60){
                dropRate = 0;
                if(this.movePossible(2)){
                    this.removePuyos(0);
                    this.currentY[0]++;
                    this.currentY[1]++;
                    this.placePuyos(1);
                } else {
                    this.columns[this.currentX[0]]++;
                    this.columns[this.currentX[1]]++;
                    droppedColumns[this.currentX[0]]++;
                    droppedColumns[this.currentX[1]]++;
                    this.state = 2;
                }
            }
        }
        if(this.state == 2){
            if(bufferChain >= 30 && dropping){
                droppedColumns = this.drop();
                dropping = false;
                bufferChain = 0;
            }
            if(bufferChain >= 30 && !dropping){
                if(this.chain(droppedColumns)){
                    chain++;
                } else{
                    if(chain > this.maxChain){
                        this.maxChain = chain;
                    }
                    this.state = 0;
                }
                dropping = true;
                bufferChain = 0;
            }
            bufferChain++;
        }
    }

    drop(){
        var droppedColumns = [0,0,0,0,0,0]
        for(i = 0; i <= 5; i++){
            var columnDone = false;
            var currentRow = 13-this.columns[i]
            while(!columnDone){
                if(currentRow == 13){
                    columnDone = true;
                } else {
                    if(this.board[currentRow][i].getState()==2){
                        columnDone = true;
                    } else if(this.board[currentRow][i].getState()==1){
                        droppedColumns[i]++;
                        this.board[currentRow][i].setState(2);
                    } else {
                        droppedColumns[i]++;
                        var j = 0;
                        while(this.board[j][i].getState() == 0){
                            j++;
                        }
                        this.board[currentRow][i].setPuyo(this.board[j][i].getPuyo());
                        this.board[currentRow][i].setState(2);
                        this.board[j][i].setPuyo(null);
                        this.board[j][i].setState(0);
                    }
                }
            }
        }
        return droppedColumns;
    }

    chain(droppedColumns){
        var chain = false;
        for(i = 0; i <= 5; i++){
            for(j = 0; j < droppedColumns[i]; j++){
                var row = 13 - columns[i] - j;
                var puyos = this.surroundings(row, i, 0, this.board[row][i].getPuyo().getColour());
                if(puyos >= 4){
                    chain = true;
                    this.pop(row, i, 0, this.board[row][i].getPuyo().getColour());
                }
            }
        }
    }

    //direction = 0 means this is the first space checked
    //direction = 1 means check from bottom
    //direction = 2 means check from right
    //direction = 3 means check from top
    //direction = 4 means check from left
    surroundings(y,x,direction,colour){
        var puyos = 0;
        if(direction != 1 && y <= 11 && this.board[y+1][x].getState() == 2 && this.board[y+1][x].getPuyo().getColour() == colour){
            puyos = this.surroundings(y+1,x,3,colour) + 1;
        }
        if(direction != 2 && x <= 4 && this.board[y][x+1].getState() == 2 && this.board[y][x+1].getPuyo().getColour() == colour){
            puyos = this.surroundings(y,x+1,4,colour) + 1;
        }
        if(direction != 3 && y >= 2 && this.board[y-1][x].getState() == 2 && this.board[y-1][x].getPuyo().getColour() == colour){
            puyos = this.surroundings(y-1,x,1,colour) + 1;
        }
        if(direction != 4 && x >= 1 && this.board[y][x-1].getState() == 2 && this.board[y][x-1].getPuyo().getColour() == colour){
            puyos = this.surroundings(y,x-1,2,colour) + 1;
        }
        return puyos;
    }

    pop(y,x,direction,colour){
        this.columns[x]--;
        this.board[y][x].setPuyo(null);
        this.board[y][x].setState(0);
        if(direction != 1 && y <= 11 && this.board[y+1][x].getState() == 2 && this.board[y+1][x].getPuyo().getColour() == colour){
            this.pop(y+1,x,3,colour);
        }
        if(direction != 2 && x <= 4 && this.board[y][x+1].getState() == 2 && this.board[y][x+1].getPuyo().getColour() == colour){
            this.pop(y,x+1,4,colour);
        }
        if(direction != 3 && y >= 2 && this.board[y-1][x].getState() == 2 && this.board[y-1][x].getPuyo().getColour() == colour){
            this.pop(y-1,x,1,colour);
        }
        if(direction != 4 && x >= 1 && this.board[y][x-1].getState() == 2 && this.board[y][x-1].getPuyo().getColour() == colour){
            this.pop(y,x-1,2,colour);
        }
    }

    //direction = 0 means right
    //direction = 1 means left
    //direction = 2 means down
    movePossible(direction)
    {
        if(direction == 0){
            if(this.currentX[0] == 5 || this.currentX[1] == 5){
                return false;
            } else if(this.board[this.currentY[0]][this.currentX[0]+1].getState()==2){
                return false;
            } else if(this.board[this.currentY[1]][this.currentX[1]+1].getState()==2){
                return false;
            }
            return true;
        }
        if(direction == 1){
            if(this.currentX[0] == 0 || this.currentX[1] == 0){
                return false;
            } else if(this.board[this.currentY[0]][this.currentX[0]-1].getState()==2){
                return false;
            } else if(this.board[this.currentY[1]][this.currentX[1]-1].getState()==2){
                return false;
            }
            return true;
        }
        if(direction == 2){
            if(this.currentY[0] == 12 || this.currentY[1] == 12){
                return false;
            } else if(this.board[this.currentY[0]+1][this.currentX[0]].getState()==2){
                return false;
            } else if(this.board[this.currentY[1]+1][this.currentX[1]].getState()==2){
                return false;
            }
            return true;
        }
    }

    rotateController(rotation){
        if(rotation = 0){
            this.orientation--;
            this.orientation+=4;
            this.orientation%=4;
        }
        if(rotation = 1){
            this.orientation++;
            this.orientation%=4;
        }
        this.rotate();
    }

    rotate(){
        if(this.orientation == 0){
            this.removePuyos(0);
            if(this.movePossible(2)) {
                this.currentY[0]--;
            }
            this.currentY[1] = this.currentY[0]+1;
            this.currentX[1] = this.currentX[0];
            this.placePuyos(1);
        }
        if(this.orientation == 1){
            this.removePuyos(0);
            if(this.movePossible(0)) {
                this.currentX[1] = this.currentX[0]+1;
                this.currentY[1] = this.currentY[0];
            } else {
                if(this.movePossible(1)){
                    this.currentX[0]--;
                    this.currentX[1] = this.currentX[0]+1;
                    this.currentY[1] = this.currentY[0];
                }
            }
            this.placePuyos(1);
        }
        if(this.orientation == 2){
            this.removePuyos(0);
            this.currentY[1] = this.currentY[0]-1;
            this.currentX[1] = this.currentX[0];
            this.placePuyos(1);
        }
        if(orientation == 3){
            this.removePuyos(0);
            if(this.movePossible(1)) {
                this.currentX[1] = this.currentX[0]-1;
                this.currentY[1] = this.currentY[0];
            } else {
                if(this.movePossible(0)){
                    this.currentX[0]--;
                    this.currentX[1] = this.currentX[0]-1;
                    this.currentY[1] = this.currentY[0];
                }
            }
            this.placePuyos(1);
        }
    }

    removePuyos(state){
        this.board[this.currentY[0]][this.currentX[0]].setPuyo(null);
        this.board[this.currentY[1]][this.currentX[1]].setPuyo(null);
        this.board[this.currentY[0]][this.currentX[0]].setState(state);
        this.board[this.currentY[1]][this.currentX[1]].setState(state);
    }

    placePuyos(state){
        console.log(this.board);
        console.log(this.board[this.currentY[0]]);
        this.board[this.currentY[0]][this.currentX[0]].setPuyo(this.currentPuyo[0]);
        this.board[this.currentY[1]][this.currentX[1]].setPuyo(this.currentPuyo[1]);
        this.board[this.currentY[0]][this.currentX[0]].setState(state);
        this.board[this.currentY[1]][this.currentX[1]].setState(state);
    }

    generatePuyo() {
        return [new Puyo(Math.floor(Math.random()*4), true), new Puyo(Math.floor(Math.random()*4), false)];
    }

    generateStartPuyo() {
        return [new Puyo(Math.floor(Math.random()*3), true), new Puyo(Math.floor(Math.random()*3), false)];
    }
}



class Puyo extends PuyoBoard {

    onCreate(colour, pivot) {
        this.colour = colour;
        this.pivot = pivot;
    }

    getColour() {
        return this.colour;
    }
}

class BoardSpace extends PuyoBoard {

    //state = 0 means space is empty
    //state = 1 means space has controllable falling Puyo
    //state = 2 means space has dropped Puyo
    onCreate(y, x) {
        this.state = 0;
        this.puyo = null;
        this.x = x*60;
        this.y = y*60;
    }

    getPuyo() {
        if(this.state != 0){
            return this.puyo;
        }
    }

    getState() {
        return this.state;
    }

    setState(state) {
        this.state = state;
    }

    setPuyo(puyo){
        this.puyo = puyo;
    }

    step(){
        if(this.state != 0){
            if(this.puyo.colour == 0){
            this.setSprite(new PIXI.Sprite($engine.getTexture("green_puyo")));
            } else if(this.puyo.colour == 1) {
            this.setSprite(new PIXI.Sprite($engine.getTexture("red_puyo")));
            } else if(this.puyo.colour == 2) {
            this.setSprite(new PIXI.Sprite($engine.getTexture("blue_puyo")));
            } else {
            this.setSprite(new PIXI.Sprite($engine.getTexture("yellow_puyo")));
            }
        }
    }
}
