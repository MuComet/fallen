class PuyoMinigameController extends MinigameController { // All classes that can be added to the engine MUST extend EngineInstance

    onEngineCreate() { // called when the instance is made from a room.
        super.onEngineCreate();
        PuyoMinigameController.score = 0;
        PuyoMinigameController.timer = 60;
        PuyoMinigameController.endTime = 60;
        PuyoMinigameController.pCamY = 0;
        PuyoMinigameController.nCamY = 0;

        $engine.setBackgroundColour(0xa58443);
        this.startTimer(60*60);

        new ParallaxingBackground();

        // instructions

        var text = new PIXI.Text("Place 4 same-coloured blobs in a group to pop them.\nTry to get a score of 2500 or more!\n Rotate with Z and X and move with the arrow keys.\nPress Enter to cheat!",$engine.getDefaultTextStyle())

        this.setInstructionRenderable(text)
        this.setControls(true,false);
        this.skipPregame();

        this.setCheatTooltip("Chain ready!")

        this.Board = new PuyoBoard()
        this.getTimer().useEndText(false)
        this.myText = $engine.createManagedRenderable(this,new PIXI.Text("Score: " + this.Board.score, $engine.getDefaultSubTextStyle()));
        this.myText.anchor.set(1,1)
        this.myText.y = $engine.getWindowSizeY() - 10
        this.myText.x = $engine.getWindowSizeX()/2
        // progress
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
        this.myText.text = "Score: " + this.Board.score;
        PuyoMinigameController.timer++;
    }

    draw(gui,camera) {
        super.draw(gui,camera)
        $engine.requestRenderOnCameraGUI(this.myText)
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
        PuyoMinigameController.getInstance().setPreventEndOnTimerExpire(true)
        this.puyo1 = this.generateStartPuyo()
        this.puyo2 = this.generateStartPuyo()
        this.puyo3 = this.generateStartPuyo()
        this.next1 = [new BoardSpace(3,7), new BoardSpace(4,7)]
        this.next2 = [new BoardSpace(4,8), new BoardSpace(5,8)]
        this.currentPuyo = null
        this.state = 0
        this.orientation = 0
        this.currentX = [2,2]
        this.currentY = [0,1]
        this.score = 0
        this.columns = [0,0,0,0,0,0]
        this.chainNum = 0
        this.dropRate = 0
        this.bufferRight = 10
        this.bufferLeft = 10
        this.droppedColumns = [0,0,0,0,0,0]
        this.bufferChain = 30
        this.dropping = true
        this.visited = []
        this.gameEnd = false
        this.chainPower = [0,4,12,24,33,50,101,169,254,341,428,538,648,763,876,990,999,999,999,999]
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
            if(PuyoMinigameController.getInstance().getTimer().isTimerDone()){
                if(this.score >= 2500){
                    PuyoMinigameController.getInstance().endMinigame(true)
                } else {
                    PuyoMinigameController.getInstance().endMinigame(false)
                }
            }
            if(this.board[1][2].getState()==2){
                if(this.score >= 2500){
                    PuyoMinigameController.getInstance().endMinigame(true)
                }
                else{
                    PuyoMinigameController.getInstance().endMinigame(false)
                }
            }
        }
        if(!PuyoMinigameController.getInstance().minigameOver()){
            if(this.state == 0){
                this.resetValues()
            }
            if(this.state == 1){
                this.placingMode()
            }
            if(this.state == 2){
                this.chainMode();
            }
        }
    }

    resetValues(){
        this.currentPuyo = this.puyo1
        this.puyo1 = this.puyo2
        this.puyo2 = this.puyo3
        this.puyo3 = this.generatePuyo()
        this.next1[0].setPuyo(this.puyo1[0])
        this.next1[1].setPuyo(this.puyo1[1])
        this.next2[0].setPuyo(this.puyo2[0])
        this.next2[1].setPuyo(this.puyo2[1])
        this.next1[0].setState(1)
        this.next1[1].setState(1)
        this.next2[0].setState(1)
        this.next2[1].setState(1)
        this.orientation = 0
        this.currentX = [2,2]
        this.bufferRight = 10
        this.bufferLeft = 10
        this.currentY = [0,1]
        this.placePuyos(1)
        this.state = 1
        this.chainNum = 0
        this.dropRate = 0
        this.droppedColumns = [0,0,0,0,0,0]
        this.bufferChain = 30
        this.dropping = true
        this.visited = []
    }

    placingMode(){
        this.bufferRight++
        this.bufferLeft++
        if(IN.keyCheck('ArrowDown')){
            this.dropRate+=10
            this.score+=1
        } else {
            this.dropRate++
        }
        if(IN.keyCheck('ArrowRight')){
            if(this.movePossible(0) && this.bufferRight >= 10){
                this.removePuyos(0)
                this.currentX[0]++
                this.currentX[1]++
                this.placePuyos(1)
                this.bufferRight = 0
            }
        } else if(IN.keyCheck('ArrowLeft')){
            if(this.movePossible(1) && this.bufferLeft >= 10){
                this.removePuyos(0)
                this.currentX[0]--
                this.currentX[1]--
                this.placePuyos(1)
                this.bufferLeft = 0
            }
        } if(IN.keyCheckPressed('KeyX')){
            this.rotateController(0)
        } else if(IN.keyCheckPressed('KeyZ')){
            this.rotateController(1)
        }
        if(this.dropRate>=30){
            this.dropRate = 0
            if(this.movePossible(2)){
                this.removePuyos(0)
                this.currentY[0]++
                this.currentY[1]++
                this.placePuyos(1)
            } else {
                this.columns[this.currentX[0]]++
                this.columns[this.currentX[1]]++
                this.state = 2
            }
        }
    }

    chainMode(){
        if(this.bufferChain >= 30 && this.dropping){
            this.droppedColumns = this.drop();
            this.dropping = false;
            this.bufferChain = 0;
        }
        if(this.bufferChain >= 30 && !this.dropping){
            var chainInfo = this.chain();
            var isChain = chainInfo[0]
            var puyo = chainInfo[1]
            console.log(chainInfo)
            if(isChain){
                this.chainNum++;
                this.score += this.scoreCalculate(puyo);
            } else{
                this.state = 0;
            }
            this.dropping = true;
            this.bufferChain = 0;
        }
        this.bufferChain++;
    }

    scoreCalculate(puyo){
        return (10*puyo)*(this.chainPower[this.chainNum])
    }

    drop(){
        var droppedColumns = [0,0,0,0,0,0]
        for(i = 0; i <= 5; i++){
            var columnDone = false;
            var currentRow = 13
            var hole;
            while(!columnDone){
                currentRow--
                if(this.board[currentRow][i].getState()!=2){
                    droppedColumns[i] = this.columns[i] - (12-currentRow)
                    columnDone = true
                    var hole = currentRow
                }
                if(currentRow == 0){
                    columnDone = true
                }
            }
            var j = 0
            while(j < droppedColumns[i]){
                console.log("currentRow: " + currentRow)
                if(this.board[currentRow][i].getState()!=0 && hole != currentRow){
                    this.board[hole][i].setPuyo(this.board[currentRow][i].getPuyo());
                    this.board[hole][i].setState(2);
                    this.board[currentRow][i].setPuyo(null);
                    this.board[currentRow][i].setState(0);
                    j++
                    hole--
                } else if (this.board[currentRow][i].getState()!=0 && hole == currentRow) {
                    this.board[hole][i].setState(2);
                    j++
                    hole--
                }
                currentRow--
            }
        }
        return droppedColumns;
    }

    chain(){
        console.log(this.droppedColumns)
        console.log(this.columns)
        var chain = false;
        var totalPuyos = 0;
        this.visited = []
        var chainSources = []
        for(var i = 0; i <= 5; i++){
            for(var j = 0; j < this.droppedColumns[i]; j++){
                var row = 13 - this.columns[i] + j;
                var puyos = 0;
                console.log("row: " + row)
                console.log("i: " + i)
                console.log("j: " + j)
                if(!this.visited.includes(i*13+row)){
                    puyos = this.surroundings(row, i, this.board[row][i].getPuyo().getColour());
                }
                if(puyos >= 4){
                    totalPuyos += puyos
                    chain = true;
                    chainSources.push(i*13+row)
                }
            }
        }
        for(var i = 0; i < chainSources.length; i++){
            var row = chainSources[i]%13
            var column = (chainSources[i]-row)/13
            this.pop(row, column, 0, this.board[row][column].getPuyo().getColour());
        }
        return [chain, totalPuyos];
    }

    //direction = 0 means this is the first space checked
    //direction = 1 means check from bottom
    //direction = 2 means check from right
    //direction = 3 means check from top
    //direction = 4 means check from left
    surroundings(y,x,colour){
        var puyos = 1;
        this.visited.push(x*13+y)
        if(!this.visited.includes(x*13+(y+1)) && y <= 11 && this.board[y+1][x].getState() == 2 && this.board[y+1][x].getPuyo().getColour() == colour){
            puyos += this.surroundings(y+1,x,colour);
        }
        if(!this.visited.includes((x+1)*13+y) && x <= 4 && this.board[y][x+1].getState() == 2 && this.board[y][x+1].getPuyo().getColour() == colour){
            puyos += this.surroundings(y,x+1,colour);
        }
        if(!this.visited.includes(x*13+(y-1)) && y >= 2 && this.board[y-1][x].getState() == 2 && this.board[y-1][x].getPuyo().getColour() == colour){
            puyos += this.surroundings(y-1,x,colour);
        }
        if(!this.visited.includes((x-1)*13+y) && x >= 1 && this.board[y][x-1].getState() == 2 && this.board[y][x-1].getPuyo().getColour() == colour){
            puyos += this.surroundings(y,x-1,colour);
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
        if(direction == 3){
            if(this.currentY[0] == 0 || this.currentY[1] == 0){
                return false;
            }
            return true;
        }
    }

    rotateController(rotation){
        if(rotation == 0){
            this.orientation--;
            this.orientation+=4;
            this.orientation%=4;
        }
        if(rotation == 1){
            this.orientation++;
            this.orientation%=4;
        }
        this.rotate();
    }


    //orientation = 0 means upright, pivot puyo below
    //orientation = 1 means horizontal, pivot puyo left
    //orientation = 2 means upright, pivot puyo above
    //orientation = 3 means horizontal, pivot puyo right
    rotate(){
        if(this.orientation == 0){
            this.removePuyos(0);
            if(!this.movePossible(2)) {
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
            if(!this.movePossible(3)) {
                this.currentY[0]++;
            }
            this.currentY[1] = this.currentY[0]-1;
            this.currentX[1] = this.currentX[0];
            this.placePuyos(1);
        }
        if(this.orientation == 3){
            this.removePuyos(0);
            if(this.movePossible(1)) {
                this.currentX[1] = this.currentX[0]-1;
                this.currentY[1] = this.currentY[0];
            } else {
                if(this.movePossible(0)){
                    this.currentX[0]++;
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



class Puyo extends EngineInstance {

    onCreate(colour, pivot) {
        this.colour = colour;
        this.pivot = pivot;
    }

    getColour() {
        return this.colour;
    }
}

class BoardSpace extends EngineInstance {

    //state = 0 means space is empty
    //state = 1 means space has controllable falling Puyo
    //state = 2 means space has dropped Puyo
    onCreate(y, x) {
        this.xScale = 0.1;
        this.yScale = 0.1;
        this.state = 0;
        this.puyo = null;
        this.x = $engine.getWindowSizeX()/2+(x-5)*35;
        this.y = $engine.getWindowSizeY() - ((16-y)*35);
        this.setSprite(new PIXI.Sprite(PIXI.Texture.empty))
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
        if(state != 0){
            if(this.puyo.colour == 0){
                this.getSprite().texture = ($engine.getTexture("green_puyo"));
            } else if(this.puyo.colour == 1) {
                this.getSprite().texture = ($engine.getTexture("red_puyo"));
            } else if(this.puyo.colour == 2) {
                this.getSprite().texture = ($engine.getTexture("blue_puyo"));
            } else {
                this.getSprite().texture = ($engine.getTexture("yellow_puyo"));
            }
        } else if(state == 0) {
            this.getSprite().texture = PIXI.Texture.empty;
        }
    }

    setPuyo(puyo){
        this.puyo = puyo;
    }
}
