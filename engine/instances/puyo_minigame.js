class PuyoMinigameController extends MinigameController { // All classes that can be added to the engine MUST extend EngineInstance

    onEngineCreate() { // called when the instance is made from a room.
        super.onEngineCreate();
        PuyoMinigameController.score = 0;
        PuyoMinigameController.timer = 60;
        PuyoMinigameController.endTime = 60;
        PuyoMinigameController.pCamY = 0;
        PuyoMinigameController.nCamY = 0;
        PuyoMinigameController.iBuffer = undefined
        PuyoMinigameController.mingameTimer = undefined
        PuyoMinigameController.maxScore = 10;

        $engine.setBackgroundColour(0xa58443);
        PuyoMinigameController.mingameTimer = new MinigameTimer(60*5);
        PuyoMinigameController.mingameTimer.addOnTimerStopped(this, function(parent, bool) {
            if(bool)
                $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS);
            else {
                $engine.setOutcomeWriteBackValue(ENGINE_RETURN.WIN);
            }
            AudioManager.fadeOutBgm(1)
            $engine.startFadeOut(30,false)
            $engine.endGame();
        })

        new ParallaxingBackground();

        // audio
        this.audioReference = $engine.generateAudioReference("Minigame-001");
        AudioManager.playBgm(this.audioReference);
        AudioManager.fadeInBgm(1);

        // instructions

        var text = new PIXI.Text("Place the same-coloured blobs 4 in a row to pop them. Try to get a chain of 10!\nPress Enter to cheat!",{ fontFamily: 'Helvetica',
                        fontSize: 50, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 })

        this.setInstructionRenderable(text)

        // progress
        this.progressText = new PIXI.Text("",{ fontFamily: 'Helvetica',
                    fontSize: 20, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 })
        PuyoBoard()
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
        PuyoMinigameController.iBuffer.destroy();
    }
}

class PuyoBoard extends EngineInstance {

    onCreate() {
        this.board = []
        for(i = 0; i <= 12; i++)
            board[i] = [BoardSpace(), BoardSpace(), BoardSpace(), BoardSpace(), BoardSpace(), BoardSpace()];
        this.puyo1 = Puyo.generateStartPuyo();
        this.puyo2 = Puyo.generateStartPuyo();
        this.puyo3 = Puyo.generateStartPuyo();
        this.currentPuyo = null;
        this.state = 0; 
        this.orientation = 0;
        this.currentX = [2,2];
        this.currentY = [0,1];
        this.chain = 0;
        this.maxChain = 0;
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
        if(state == 0){
            currentPuyo = puyo1;
            puyo1 = puyo2;
            puyo2 = puyo3;
            puyo3 = Puyo.generatePuyo();
            orientation = 0;
            currentX = [2,2];
            currentY = [0,1];
            placePuyos(1)
            var dropRate = 0;
            var bufferRight = 6;
            var bufferLeft = 6;
            var bufferClock = 6;
            var bufferCounter = 6;
            var droppedColumns = [0,0,0,0,0,0];
            var bufferChain = 30;
            var dropping = true;
        }
        if(state == 1){
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
                if(movePossible(0)){
                    removePuyos(0);
                    currentX[0]++;
                    currentX[1]++;
                    placePuyos(1);
                    bufferRight = 0;
                }
            } else if(IN.keyCheck('ArrowLeft') && bufferLeft >= 6){
                if(movePossible(1)){
                    removePuyos(0);
                    currentX[0]--;
                    currentX[1]--;
                    placePuyos(1);
                    bufferLeft = 0;
                }
            } else if(IN.keyCheck('Z') && bufferClock >= 6){
                rotateController(0);
                bufferClock = 0;
            } else if(IN.keyCheck('X') && bufferCounter >= 6){
                rotateController(1);
                bufferCounter = 0;
            }
            if(dropRate>=60){
                dropRate = 0;
                if(movePossible(2)){
                    removePuyos(0);
                    currentY[0]++;
                    currentY[1]++;
                    placePuyos(1);
                } else {
                    columns[currentX[0]]++;
                    columns[currentX[1]]++;
                    droppedColumns[currentX[0]]++;
                    droppedColumns[currentX[1]]++;
                    state = 2;
                }
            }
        }
        if(state == 2){
            if(bufferChain >= 30 && dropping){
                droppedColumns = drop();
                dropping = false;
                bufferChain = 0;
            }
            if(bufferChain >= 30 && !dropping){
                if(chain(droppedColumns)){
                    chain++;
                } else{
                    if(chain > maxChain){
                        maxChain = chain;
                    }
                    chain = 0;
                    state = 0;
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
            var currentRow = 13-columns[i]
            while(!columnDone){
                if(currentRow == 13){
                    columnDone = true;
                } else {
                    if(board[currentRow][i].getState==2){
                        columnDone = true;
                    } else if(board[currentRow][i].getState==1){
                        droppedColumns[i]++;
                        board[currentRow][i].setState(2);
                    } else {
                        droppedColumns[i]++;
                        var j = 0;
                        while(board[j][i].getState == 0){
                            j++;
                        }
                        board[currentRow][i].setPuyo(board[j][i].getPuyo);
                        board[currentRow][i].setState(2);
                        board[j][i].setState(0);
                        board[j][i].setPuyo(null);
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
                puyos = surroundings(row, i, 0, board[row][i].getPuyo().getColour());
                if(puyos >= 4){
                    chain = true;
                    pop(row, i, 0, board[row][i].getPuyo().getColour());
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
        if(direction != 1 && y <= 11 && board[y+1][x].getState() == 2 && board[y+1][x].getPuyo().getColour() == colour){
            puyos = surroundings(y+1,x,3,colour) + 1;
        }
        if(direction != 2 && x <= 4 && board[y][x+1].getState() == 2 && board[y][x+1].getPuyo().getColour() == colour){
            puyos = surroundings(y,x+1,4,colour) + 1;
        }
        if(direction != 3 && y >= 2 && board[y-1][x].getState() == 2 && board[y-1][x].getPuyo().getColour() == colour){
            puyos = surroundings(y-1,x,1,colour) + 1;
        }
        if(direction != 4 && x >= 1 && board[y][x-1].getState() == 2 && board[y][x-1].getPuyo().getColour() == colour){
            puyos = surroundings(y,x-1,2,colour) + 1;
        }
        return puyos;
    }

    pop(y,x,direction,colour){
        columns[x]--;
        board[y][x].setState(0);
        board[y][x].setPuyo(null);
        if(direction != 1 && y <= 11 && board[y+1][x].getState() == 2 && board[y+1][x].getPuyo().getColour() == colour){
            pop(y+1,x,3,colour);
        }
        if(direction != 2 && x <= 4 && board[y][x+1].getState() == 2 && board[y][x+1].getPuyo().getColour() == colour){
            pop(y,x+1,4,colour);
        }
        if(direction != 3 && y >= 2 && board[y-1][x].getState() == 2 && board[y-1][x].getPuyo().getColour() == colour){
            pop(y-1,x,1,colour);
        }
        if(direction != 4 && x >= 1 && board[y][x-1].getState() == 2 && board[y][x-1].getPuyo().getColour() == colour){
            pop(y,x-1,2,colour);
        }
    }

    //direction = 0 means right
    //direction = 1 means left
    //direction = 2 means down
    movePossible(direction)
    {
        if(direction == 0){
            if(currentX[0] == 5 || currentX[1] == 5){
                return false;
            } else if(board[currentY[0]][currentX[0]+1].getState()==2){
                return false;
            } else if(board[currentY[1]][currentX[1]+1].getState()==2){
                return false;
            }
            return true;
        }
        if(direction == 1){
            if(currentX[0] == 0 || currentX[1] == 0){
                return false;
            } else if(board[currentY[0]][currentX[0]-1].getState()==2){
                return false;
            } else if(board[currentY[1]][currentX[1]-1].getState()==2){
                return false;
            }
            return true;
        }
        if(direction == 2){
            if(currentY[0] == 12 || currentY[1] == 12){
                return false;
            } else if(board[currentY[0]+1][currentX[0]].getState()==2){
                return false;
            } else if(board[currentY[1]+1][currentX[1]].getState()==2){
                return false;
            }
            return true;
        }
    }

    rotateController(rotation){
        if(rotation = 0){
            orientation--;
            orientation+=4;
            orientation%=4;
        }
        if(rotation = 1){
            orientation++;
            orientation%=4;
        }
        rotate();
    }

    rotate(){
        if(orientation == 0){
            removePuyos(0);
            if(movePossible(2)) {
                currentY[0]--;
            }
            currentY[1] = currentY[0]+1;
            currentX[1] = currentX[0];
            placePuyos(1);
        }
        if(orientation == 1){
            removePuyos(0);
            if(movePossible(0)) {
                currentX[1] = currentX[0]+1;
                currentY[1] = currentY[0];
            } else {
                if(movePossible(1)){
                    currentX[0]--;
                    currentX[1] = currentX[0]+1;
                    currentY[1] = currentY[0];
                }
            }
            placePuyos(1);
        }
        if(orientation == 2){
            removePuyos(0);
            currentY[1] = currentY[0]-1;
            currentX[1] = currentX[0];
            placePuyos(1);
        }
        if(orientation == 3){
            removePuyos(0);
            if(movePossible(1)) {
                currentX[1] = currentX[0]-1;
                currentY[1] = currentY[0];
            } else {
                if(movePossible(0)){
                    currentX[0]--;
                    currentX[1] = currentX[0]-1;
                    currentY[1] = currentY[0];
                }
            }
            placePuyos(1);
        }
    }

    removePuyos(state){
        board[currentY[0]][currentX[0]].setState(state);
        board[currentY[1]][currentX[1]].setState(state);
        board[currentY[0]][currentX[0]].setPuyo(null);
        board[currentY[1]][currentX[1]].setPuyo(null);
    }

    placePuyos(state){
        board[currentY[0]][currentX[0]].setState(state);
        board[currentY[1]][currentX[1]].setState(state);
        board[currentY[0]][currentX[0]].setPuyo(currentPuyo[0]);
        board[currentY[1]][currentX[1]].setPuyo(currentPuyo[1]);
    }
}



class Puyo extends PuyoBoard {

    onCreate(colour, pivot) {
        this.colour = colour;
        this.pivot = pivot;
    }

    step() {
        y++;
    }

    getColour() {
        return this.colour;
    }

    generatePuyo() {
        return [Puyo(Math.floor(Math.random()*4), true), Puyo(Math.floor(Math.random()*4), false)];
    }

    generateStartPuyo() {
        return [Puyo(Math.floor(Math.random()*3), true), Puyo(Math.floor(Math.random()*3), false)];
    }
}

class BoardSpace extends PuyoBoard {

    //state = 0 means space is empty
    //state = 1 means space has controllable falling Puyo
    //state = 2 means space has dropped Puyo
    onCreate() {
        this.state = 0;
        this.puyo = null;
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