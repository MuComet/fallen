class PuyoMinigameController extends MinigameController { // All classes that can be added to the engine MUST extend EngineInstance

    onEngineCreate() { // called when the instance is made from a room.
        $engine.unlockMinigame(ENGINE_MINIGAMES.VIDEO_GAME)
        super.onEngineCreate();
        PuyoMinigameController.score = 0;
        if($engine.isDifficulty(ENGINE_DIFFICULTY.EASY)){
            PuyoMinigameController.timer = 90;
            PuyoMinigameController.endTime = 90;
        }
        else{
            PuyoMinigameController.timer = 60;
            PuyoMinigameController.endTime = 60;
        }
        PuyoMinigameController.pCamY = 0;
        PuyoMinigameController.nCamY = 0;

        $engine.setBackgroundColour(0xa58443);
        this.startTimer(PuyoMinigameController.timer*60);

        var background = new PIXI.Sprite($engine.getTexture("background_table_cards"));
        $engine.setBackground(background);

        // instructions

        var text = new PIXI.Text("Place 4 same-coloured fruits in a group to pop them.\nTry to get a score of 2424 or more!\n Rotate with Z and X and move with the movement keys.\nCreate longer chains of matches to get more points.\nWatch out for the X! Do not place a fruit in that space.\nPress Enter to cheat!",$engine.getDefaultTextStyle())

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
        this.puyo1 = this.generateStartPuyo(3,8)
        this.puyo2 = this.generateStartPuyo(4,9)
        this.puyo3 = this.generateStartPuyo(4,9)
        this.puyo1[0].sendNext2()
        this.puyo1[1].sendNext2()
        this.puyo1[0].sendNext1()
        this.puyo1[1].sendNext1()
        this.puyo2[0].sendNext2()
        this.puyo2[1].sendNext2()
        this.next1 = [new BoardSpace(4,8), new BoardSpace(3,8)]
        this.next2 = [new BoardSpace(5,9), new BoardSpace(4,9)]
        new BoardSpace(1,2,1)
        this.currentPuyo = null
        this.state = 0
        this.cheatNotApplied = true
        this.orientation = 2
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
        this.setSprite(new PIXI.Sprite($engine.getTexture("p-board_back")))
        this.x = $engine.getWindowSizeX()/2+(3-5)*35;
        this.y = $engine.getWindowSizeY() - ((15-7)*35);
        this.next = new PIXI.Sprite($engine.getTexture("p-prev_back"));
        this.next.x = $engine.getWindowSizeX()/2+(9-5)*35;
        this.next.y = $engine.getWindowSizeY() - ((17-4.5)*35);
        this.edge = new EmptyInstance($engine.getTexture("p-board_edge"))
        this.edge.x = $engine.getWindowSizeX()/2+(3-5)*35;
        this.edge.y = $engine.getWindowSizeY() - ((15-7)*35);
        this.edge.depth = 1
        $engine.createRenderable(this, this.next);
        $engine.createManagedRenderable(this, this.edge);
        this.z = -1
        this.chaText = $engine.createManagedRenderable(this,new PIXI.Text(this.chainNum + "-chain!", $engine.getDefaultSubTextStyle()));
        this.chaText.anchor.set(0,0)
        this.chaText.alpha = 0
        this.depth = 3
        this.chaining = false
    }

    //state = 0 means nothing is happening
    //state = 1 means controllable puyo is falling
    //state = 2 means mid-chain
    //orientation = 0 means upright, pivot puyo below
    //orientation = 1 means horizontal, pivot puyo left
    //orientation = 2 means upright, pivot puyo above
    //orientation = 3 means horizontal, pivot puyo right
    draw(){
        $engine.requestRenderOnCameraGUI(this.chaText)
    }

    step() {
        if(this.state == 0){
            if(PuyoMinigameController.getInstance().getTimer().isTimerDone()){
                if(this.score >= 5000 && !PuyoMinigameController.getInstance().hasCheated()){
                    $engine.activateAchievement("VIDEO_GAME_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
                }
                if(this.score >= 2424){
                    PuyoMinigameController.getInstance().endMinigame(true)
                } else {
                    PuyoMinigameController.getInstance().endMinigame(false)
                }
            }
            if(this.board[1][2].getState()==2){
                if(this.score >= 5000 && !PuyoMinigameController.getInstance().hasCheated()){
                    $engine.activateAchievement("VIDEO_GAME_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
                }
                if(this.score >= 2424){
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
            if(this.state==0.1){
                var done = this.currentPuyo[0].sendNext()
                var done2 = this.currentPuyo[1].sendNext()
                if(done && done2){
                    this.state = 1
                }
            }
            if(this.state == 1){
                this.placingMode()
            }
            if(this.state == 2){
                this.chainMode();
            }
        }
        if(PuyoMinigameController.getInstance().hasCheated() && this.cheatNotApplied){
            this.cheatNotApplied = false
            this.cheat();
        }
    }
    cheat(){
        for(var i = 0; i <= 5; i++){
            for(var j = 12; j >= 10; j--){
                var newPuyo = new Puyo(i%3,false,i,j+2)
                if(this.board[j][i].getState()==2){
                    this.board[j][i].getPuyo().destroy()
                }
                if(this.board[j][i].getState()==1){
                    this.state = 0
                    this.currentPuyo[0].destroy()
                    this.currentPuyo[1].destroy()
                }
                this.board[j][i].setPuyo(newPuyo)
                newPuyo.sendNext2()
                this.board[j][i].setState(2)
            }
            if(this.columns[i] < 3){
                this.columns[i] = 3
            }
        }
    }

    resetValues(){
        this.currentPuyo = this.puyo1
        this.puyo1 = this.puyo2
        this.puyo2 = this.puyo3
        this.puyo3 = this.generatePuyo()
        this.puyo1[0].sendNext1()
        this.puyo1[1].sendNext1()
        this.puyo2[0].sendNext2()
        this.puyo2[1].sendNext2()
        this.next1[0].setPuyo(this.puyo1[0])
        this.next1[1].setPuyo(this.puyo1[1])
        this.next2[0].setPuyo(this.puyo2[0])
        this.next2[1].setPuyo(this.puyo2[1])
        this.next1[0].setState(1)
        this.next1[1].setState(1)
        this.next2[0].setState(1)
        this.next2[1].setState(1)
        this.orientation = 2
        this.currentX = [2,2]
        this.bufferRight = 10
        this.bufferLeft = 10
        this.currentY = [1,0]
        this.placePuyos(1)
        if(!this.movePossible(2)){
            this.board[this.currentY[0]][this.currentX[0]].getPuyo().aboutToLand()
            this.board[this.currentY[1]][this.currentX[1]].getPuyo().aboutToLand()
        }
        this.state = 0.1
        this.chainNum = 0
        this.dropRate = 0
        this.droppedColumns = [0,0,0,0,0,0]
        this.bufferChain = 30
        this.dropping = true
        this.visited = []
    }

    placingMode(){
        var prevLanding1 = this.board[this.currentY[0]][this.currentX[0]].getPuyo().landing
        var prevLanding2 = this.board[this.currentY[1]][this.currentX[1]].getPuyo().landing
        this.bufferRight++
        this.bufferLeft++
        if(!this.movePossible(2)){
            this.board[this.currentY[0]][this.currentX[0]].getPuyo().landing = true
            this.board[this.currentY[1]][this.currentX[1]].getPuyo().landing = true
        }
        else{
            this.board[this.currentY[0]][this.currentX[0]].getPuyo().landing = false
            this.board[this.currentY[1]][this.currentX[1]].getPuyo().landing = false
            if(prevLanding1 || prevLanding2){
                this.dropRate = 34 - (($engine.getWindowSizeY() - this.board[this.currentY[0]][this.currentX[0]].getPuyo().y - 1) % 35)
            }
        }
        if(IN.keyCheck('RPGdown')){
            this.dropRate+=10
            this.score+=1
            this.board[this.currentY[0]][this.currentX[0]].getPuyo().fastfall()
            this.board[this.currentY[1]][this.currentX[1]].getPuyo().fastfall()
        } else {
            this.dropRate+=0.5   
            this.board[this.currentY[0]][this.currentX[0]].getPuyo().fall()
            this.board[this.currentY[1]][this.currentX[1]].getPuyo().fall()
        }
        if(IN.keyCheck('RPGright')){
            if(this.movePossible(0) && this.bufferRight >= 8){
                this.removePuyos(0)
                this.currentX[0]++
                this.currentX[1]++
                this.placePuyos(1)
                this.board[this.currentY[0]][this.currentX[0]].getPuyo().moveRight()
                this.board[this.currentY[1]][this.currentX[1]].getPuyo().moveRight()
                this.bufferRight = 0
                if(prevLanding1 || prevLanding2){
                    this.dropRate = 0
                }
            }
        } else if(IN.keyCheck('RPGleft')){
            if(this.movePossible(1) && this.bufferLeft >= 8){
                this.removePuyos(0)
                this.currentX[0]--
                this.currentX[1]--
                this.placePuyos(1)
                this.board[this.currentY[0]][this.currentX[0]].getPuyo().moveLeft()
                this.board[this.currentY[1]][this.currentX[1]].getPuyo().moveLeft()
                this.bufferLeft = 0
                if(prevLanding1 || prevLanding2){
                    this.dropRate = 0
                }
            }
        } else if($engine.hasItem(ENGINE_ITEMS.ENIGMA_DECRYPTER)){
            if(IN.keyCheckPressed('RPGup')){
                this.currentPuyo[0].pop()
                this.currentPuyo[1].pop()
                this.removePuyos(0)
                this.state = 0
            }
        }
        if(IN.keyCheckPressed('KeyX')){
            this.rotateController(0)
        } else if(IN.keyCheckPressed('KeyZ')){
            this.rotateController(1)
        }
        if(this.dropRate>=35){
            this.dropRate -= 35
            if(this.movePossible(2)){
                this.removePuyos(0)
                this.currentY[0]++
                this.currentY[1]++
                this.placePuyos(1)
            } else {
                this.board[this.currentY[0]][this.currentX[0]].getPuyo().land(this.currentY[1])
                this.board[this.currentY[1]][this.currentX[1]].getPuyo().land(this.currentY[0])
                this.columns[this.currentX[0]]++
                this.columns[this.currentX[1]]++
                this.state = 2
            }
        }
    }

    chainText(bufferChain){
        this.chaText.y = $engine.getWindowSizeY() - ((17-8)*35) - Math.sin(bufferChain*Math.PI/30)*2
        this.chaText.alpha = Math.sin(bufferChain*Math.PI/30)
        this.chaText.x = $engine.getWindowSizeX()/2+(9-5)*35;
        this.chaText.text = this.chainNum + "-chain!";
        this.chaText.style.fontSize = this.chainNum + 35
    }

    chainMode(){
        if(this.bufferChain >= 30 && this.dropping){
            this.chaining = false
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
                this.chaining = true
                this.chainNum++;
                var audioChain = Math.min(7, this.chainNum)
                $engine.audioPlaySound("puyo_chain"+audioChain)
                this.score += this.scoreCalculate(puyo);
            } else{
                this.state = 0;
            }
            this.dropping = true;
            this.bufferChain = 0;
        }
        if(this.chaining){
            this.chainText(this.bufferChain+1)
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
                    var thePuyo = this.board[currentRow][i].getPuyo()
                    this.board[hole][i].setPuyo(thePuyo);
                    thePuyo.drop(hole)
                    this.board[hole][i].setState(2);
                    this.board[currentRow][i].setPuyo(null);
                    this.board[currentRow][i].setState(0);
                    j++
                    hole--
                } else if (this.board[currentRow][i].getState()!=0 && hole == currentRow) {
                    this.board[hole][i].setState(2);
                    this.board[hole][i].getPuyo().land(hole)
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
        this.board[y][x].getPuyo().pop()
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
        this.rotate(rotation);
    }


    //orientation = 0 means upright, pivot puyo below
    //orientation = 1 means horizontal, pivot puyo left
    //orientation = 2 means upright, pivot puyo above
    //orientation = 3 means horizontal, pivot puyo right
    rotate(direction){
        var move = false
        if(this.orientation == 0){
            this.removePuyos(0);
            if(!this.movePossible(2)) {
                this.currentY[0]--;
                move = true
                this.dropRate = 0
            }
            this.currentY[1] = this.currentY[0]+1;
            this.currentX[1] = this.currentX[0];
            this.placePuyos(1);
            this.currentPuyo[0].rotate(0,direction,move)
            this.currentPuyo[1].rotate(0,direction,move)
        }
        if(this.orientation == 1){
            this.removePuyos(0);
            if(this.movePossible(0)) {
                this.currentX[1] = this.currentX[0]+1;
                this.currentY[1] = this.currentY[0];
                this.currentPuyo[0].rotate(1,direction,false)
                this.currentPuyo[1].rotate(1,direction,false)
            } else {
                if(this.movePossible(1)){
                    this.currentX[0]--;
                    this.currentX[1] = this.currentX[0]+1;
                    this.currentY[1] = this.currentY[0];
                    this.currentPuyo[0].rotate(1,direction,true)
                    this.currentPuyo[1].rotate(1,direction,true)
                }
            }
            this.placePuyos(1);
        }
        if(this.orientation == 2){
            this.removePuyos(0);
            if(!this.movePossible(3)) {
                this.currentY[0]++;
                move = true
            }
            this.currentY[1] = this.currentY[0]-1;
            this.currentX[1] = this.currentX[0];
            this.placePuyos(1);
            this.currentPuyo[0].rotate(2,direction,move)
            this.currentPuyo[1].rotate(2,direction,move)
        }
        if(this.orientation == 3){
            this.removePuyos(0);
            if(this.movePossible(1)) {
                this.currentX[1] = this.currentX[0]-1;
                this.currentY[1] = this.currentY[0];
                this.currentPuyo[0].rotate(3,direction,false)
                this.currentPuyo[1].rotate(3,direction,false)
            } else {
                if(this.movePossible(0)){
                    this.currentX[0]++;
                    this.currentX[1] = this.currentX[0]-1;
                    this.currentY[1] = this.currentY[0];
                    this.currentPuyo[0].rotate(3,direction,true)
                    this.currentPuyo[1].rotate(3,direction,true)
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
        return [new Puyo(Math.floor(Math.random()*4), true,9,5), new Puyo(Math.floor(Math.random()*4), false,9,4)];
    }

    generateStartPuyo() {
        return [new Puyo(Math.floor(Math.random()*3), true,9,5), new Puyo(Math.floor(Math.random()*3), false,9,4)];
    }
}



class Puyo extends EngineInstance {

    onCreate(colour, pivot, x, y) {
        this.colour = colour;
        this.pivot = pivot
        this.x = $engine.getWindowSizeX()/2+(x-5)*35;
        this.y = $engine.getWindowSizeY() - ((17-y)*35);
        this.setSprite(new PIXI.Sprite(PIXI.Texture.empty))
        this.landing = false
        this.landToggle = false
        this.rotateToggle = false
        this.direction = 0
        this.i = 0
        this.currentAngle = Math.PI/2
        this.target = 0
        this.move = false
        this.dy = EngineUtils.randomRange(-8,-4);
        this.dx = EngineUtils.randomRange(-2,2);
        this.dz = EngineUtils.randomRange(-0.05,0.05);
        this.grav = 0.25;
        this.lifeTimer = 0;
        this.lifeTime = EngineUtils.irandomRange(45,75);
        this.destroyed = false;
        this.dropToggle = false;
        this.dropLength = 0
        this.depth = 2
        this.j = 0
        this.k = 0
        this.l = 0
    }

    step(){
        if(this.landToggle && !this.rotateToggle && !this.dropToggle){
            this.dropping()
            this.land2()
            this.i++
            if(this.i >= 7){
                this.landToggle = false
                this.i = 0
            }
        }
        if(this.rotateToggle){
            this.rotation()
            this.i++
            if(this.i >= 7){
                this.rotateToggle = false
                this.i = 0
            }
        }
        if(this.left){
            this.x -= 5
            this.pivotX -= 5
            this.j++
            if(this.j >= 7){
                this.left = false
                this.j = 0
            }
        }
        if(this.right){
            this.x += 5
            this.pivotX += 5
            this.k++
            if(this.k >= 7){
                this.right = false
                this.k = 0
            }
        }
        if(this.up){
            this.y -= 5
            this.pivotY -= 5
            this.l++
            if(this.l >= 7){
                this.up = false
                this.l = 0
            }
        }
        if(this.dropToggle && !this.rotateToggle){
            this.dropping()
            this.i++
            if(this.i >= 7){
                this.dropToggle = false
                this.land(this.hole)
                this.i = 0
            }
        }
        if(this.destroyed) {
            new ExplosionParticle(this.getSprite().texture,this.x,this.y)
            this.lifeTimer++;
            if(this.lifeTimer>this.lifeTime)
                this.destroy();
            this.alpha = EngineUtils.interpolate((this.lifeTimer-(this.lifeTime-24))/24,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.x+=this.dx;
            this.y+=this.dy;
            this.angle+=this.dz;
            this.dy += this.grav;
        }
    }

    sendNext(){
        if(this.i == 0){    
            this.x = $engine.getWindowSizeX()/2+(2-5)*35;
            if(this.pivot){
                this.y = $engine.getWindowSizeY() - ((15-0)*35);
            }
            else{
                this.getSprite().texture = PIXI.Texture.empty;
                this.y = $engine.getWindowSizeY() - ((15+1)*35);
            }
        }
        if(this.i == 6){
            if(this.colour == 0){
                this.getSprite().texture = ($engine.getTexture("puyo-g"));
            } else if(this.colour == 1) {
                this.getSprite().texture = ($engine.getTexture("puyo-r"));
            } else if(this.colour == 2) {
                this.getSprite().texture = ($engine.getTexture("puyo-b"));
            } else {
                this.getSprite().texture = ($engine.getTexture("puyo-y"));
            }
        }
        this.y += 5
        if(this.i == 6){
            this.i = 0 
            this.pivotX = this.x
            this.pivotY = this.y + 35
            return true
        }
        this.i++
        return false
    }

    sendNext1(){
        this.x = $engine.getWindowSizeX()/2+(8-5)*35;
        if(this.pivot){
            this.y = $engine.getWindowSizeY() - ((17-4)*35);
        } else {
            this.y = $engine.getWindowSizeY() - ((17-3)*35);
        }
    }

    sendNext2(){
        if(this.colour == 0){
            this.getSprite().texture = ($engine.getTexture("puyo-g"));
        } else if(this.colour == 1) {
            this.getSprite().texture = ($engine.getTexture("puyo-r"));
        } else if(this.colour == 2) {
            this.getSprite().texture = ($engine.getTexture("puyo-b"));
        } else {
            this.getSprite().texture = ($engine.getTexture("puyo-y"));
        }
    }

    getColour() {
        return this.colour;
    }

    fall(){
        if(!this.landing){
            this.y += 0.5
            this.pivotY += 0.5
        }
    }

    fastfall(){
        if(!this.landing){
            this.y += 10 
            this.pivotY += 10
        }
    }

    aboutToLand(){
        this.landing = true
    }

    moveLeft(){
        this.x -= 35
        this.pivotX -= 35
        $engine.audioPlaySound("puyo_move")
    }

    moveRight(){
        this.x += 35
        this.pivotX += 35
        $engine.audioPlaySound("puyo_move")
    }

    rotate(target, direction, move){
        if(this.rotateToggle){
            this.i = 6
            this.rotation()
            this.i = 0
        }
        this.target = target
        this.direction = direction
        this.move = move
        this.rotateToggle = true
        $engine.audioPlaySound("puyo_rotate")
        var targetAngle
        if(this.target == 0){
            targetAngle = 3*Math.PI/2
            if(this.move){
                this.up = true
            }
        }
        else if(this.target == 3){
            targetAngle = Math.PI
            if(this.move){
                this.right = true
            }
        }
        else if(this.target == 2){
            targetAngle = Math.PI/2
        }
        else{
            targetAngle = 0
            if(this.move){
                this.left = true
            }
        }
        if(direction == 0 && this.currentAngle < targetAngle){
            this.currentAngle += 2*Math.PI
        }
        else if(direction == 1 && this.currentAngle > targetAngle){
            this.currentAngle -= 2*Math.PI
        }
        this.angleShift = Math.abs(this.currentAngle-targetAngle)/7
    }

    rotation(){
        var targetAngle
        if(this.target == 0){
            targetAngle = 3*Math.PI/2
        }
        else if(this.target == 3){
            targetAngle = Math.PI
        }
        else if(this.target == 2){
            targetAngle = Math.PI/2
            if(this.move){
                this.y += 5
                this.pivotY += 5
            }
        }
        else{
            targetAngle = 0
        }
        if(this.direction == 0){
            this.currentAngle -= this.angleShift
        }
        else{
            this.currentAngle += this.angleShift
        }
        if(this.i == 6){
            this.currentAngle = targetAngle
        }
        if(!this.pivot){
            this.x = this.pivotX + Math.cos(this.currentAngle)*35
            this.y = this.pivotY - Math.sin(this.currentAngle)*35
        }
    }

    drop(hole){
        this.hole = hole
        this.dropLength = (($engine.getWindowSizeY() - ((15-hole)*35))-this.y)/7
        this.dropToggle = true
    }

    dropping(){
        if(this.i == 6){
            this.y = $engine.getWindowSizeY() - ((15-this.hole)*35)
        }
        else{
            this.y += this.dropLength
        }
    }

    pop(){
        this.destroyed = true
    }

    land(y){
        this.drop(y)
        this.dropToggle = false
        this.landToggle = true
    }

    land2(){
        if(this.i == 0){
            $engine.audioPlaySound("puyo_land")
            this.y += ($engine.getWindowSizeY()-10-this.y)%35 - 25
        }
        this.yScale = (Math.cos(((2*Math.PI)/6)*this.i)+2)/3
    }
}

class BoardSpace extends EngineInstance {

    //state = 0 means space is empty
    //state = 1 means space has controllable falling Puyo
    //state = 2 means space has dropped Puyo
    onCreate(y, x, isX = 0) {
        this.state = 0;
        this.puyo = null;
        this.high = false;
        if(y == 0){
            this.high = true;
        }
        this.x = $engine.getWindowSizeX()/2+(x-5)*35;
        this.y = $engine.getWindowSizeY() - ((15-y)*35);
        this.setSprite(new PIXI.Sprite(PIXI.Texture.empty))
        if(isX == 1){
            this.z = -0.5
            this.getSprite().texture = ($engine.getTexture("puyo-x"));
        }
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
        // if(state != 0 && !this.high){
        //     if(this.puyo.colour == 0){
        //         this.getSprite().texture = ($engine.getTexture("puyo-g"));
        //     } else if(this.puyo.colour == 1) {
        //         this.getSprite().texture = ($engine.getTexture("puyo-r"));
        //     } else if(this.puyo.colour == 2) {
        //         this.getSprite().texture = ($engine.getTexture("puyo-b"));
        //     } else {
        //         this.getSprite().texture = ($engine.getTexture("puyo-y"));
        //     }
        // } else if(state == 0) {
        //     this.getSprite().texture = PIXI.Texture.empty;
        // }
    }

    setPuyo(puyo){
        this.puyo = puyo;
    }
}
