class MazeMinigameController extends MinigameController {
    onEngineCreate() { 
        $engine.unlockMinigame(ENGINE_MINIGAMES.MAZE)
        this.lampSpriteFactor = $engine.hasItem(ENGINE_ITEMS.LAMP_OIL) ? 1.25 : 1;
        super.onEngineCreate();
        this.timer = 0;
        this.score = 0;
        this.sizeX = 64;
        this.sizeY = 64;
        this.numRows = 55;
        this.numCols = 23;

        this.startX = Math.floor(this.numCols/2);
        this.startY = this.numRows-1;

        this.totalWidth = this.sizeX * this.numCols;
        this.totalHeight = this.sizeY * this.numRows;


        this.setControls(true,false);

        this.lampSprite = $engine.createManagedRenderable(this, new PIXI.extras.AnimatedSprite($engine.getAnimation("crate_mask_animation")));
        this.lampSprite.animationSpeed = 0.1; // 6FPS
        this.lampSprite.scale.set(this.lampSpriteFactor)
        
        this.startTimer(45*60);
        this.getTimer().pauseTimer();

        this.setCheatTooltip("What maze?")

        this.setLossReason("The colouring book mazes did not prepare you for this one.")

        this.paperBackground = new PIXI.extras.TilingSprite($engine.getTexture("background_paper_tile"),this.totalWidth,this.totalHeight);
        $engine.setBackground(this.paperBackground);

        var text = new PIXI.Text("Use movement keys to move Eson through the maze.\nYou start at the bottom and must reach the top\n"
            + "MEMORIZE THE LAYOUT and travel through as fast as you can.\nDon't make a wrong turn!"
            + "\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.setControls(true,false);
        //this.skipPregame();

        this.setupMaze();

        var bufferTime = 8;
        this.upBuffer = new BufferedKeyInput("RPGup", bufferTime);
        this.leftBuffer = new BufferedKeyInput("RPGleft", bufferTime);
        this.rightBuffer = new BufferedKeyInput("RPGright", bufferTime);
        this.downBuffer = new BufferedKeyInput("RPGdown",bufferTime);

        this.currentX = this.startX;
        this.currentY = this.startY;

        this.x = this.currentX * this.sizeX + this.sizeX/2;
        this.y = this.currentY * this.sizeY + this.sizeY/2;

        // pre camera setup, overwritten below.
        var camera = $engine.getCamera();
        camera.setLocation(this.x - $engine.getWindowSizeX()/2, this.totalHeight - $engine.getWindowSizeY())

        this.wantedCameraX = camera.getX();
        this.wantedCameraY = camera.getY();

        this.setSprite(new PIXI.Sprite($engine.getTexture("maze_runner")))

        this.baseXScale = 0.5;
        this.baseYScale = 0.5;
        this.xScale = this.baseXScale
        this.yScale = this.baseYScale

        this.animTimer = 0;
        this.timeToNextRotation = 24;
        this.timeSinceLastMove = 9999;
        this.targetX = this.startX;
        this.targetY = this.startY;
        this.lastX = this.startX;
        this.lastY = this.startY;

        this.lampSprite.scale.x = 2;
        this.lampSprite.scale.y = 2;

        this.shakeTimer = 0;

        this.flashlightTick();
        this.lampSprite.alpha = 0;
        this.getTimer().alpha = 0;

        camera.setWidth(this.totalWidth);
        camera.setHeight(this.totalWidth * $engine.getWindowSizeX()/$engine.getWindowSizeY());
        camera.setLocation(0,0)

        this.blackGraphics = $engine.createManagedRenderable(this, new PIXI.Graphics());

        this.blackGraphics.beginFill(0);
        this.blackGraphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY());

    }

    onBeforeMinigame(frames) {
        var camera = $engine.getCamera();
        if(frames>210 && frames <= 490) {
            var fac = EngineUtils.interpolate((frames-210)/240,0,1,EngineUtils.INTERPOLATE_SMOOTH);
            var dy = this.totalHeight - this.totalWidth * $engine.getWindowSizeX()/$engine.getWindowSizeY()
            camera.setLocation(0,dy*fac);
        }

        if(frames>490 && frames <= 520) {
            var fac = EngineUtils.interpolate((frames-490)/30,-$engine.getWindowSizeX(),0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.blackGraphics.x = fac;
            $engine.requestRenderOnGUI(this.blackGraphics)
        }
        if(frames>520) {
            this.lampSprite.alpha = 1;
            this.getTimer().alpha = 1;

            
            camera.setLocation(this.x - $engine.getWindowSizeX()/2, this.totalHeight - $engine.getWindowSizeY())
            camera.setScale(1,1);
            var fac = EngineUtils.interpolate((frames-520)/30,0,$engine.getWindowSizeX(),EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            this.blackGraphics.x = fac;
            $engine.requestRenderOnGUI(this.blackGraphics)
        }
        if(frames>550) {
            this.startMinigame();
        }
        this.paperBackground.tilePosition.x = -camera.getX()*camera.getScaleX();
        this.paperBackground.tilePosition.y = -camera.getY()*camera.getScaleY();
        
    }

    setupMaze() {
        this.tiles = [];

        for(var x = 0;x<this.numCols;x++) {
            var arr = [];
            for(var y = 0;y<this.numRows;y++) {
                arr.push(false); // generate a maze where all tiles are unpassable (false)
            }
            this.tiles.push(arr);
        }

        this.path = [];

        for(var x = 0;x<this.numCols;x++) {
            var arr = [];
            for(var y = 0;y<this.numRows;y++) {
                arr.push(-1); // setup path (to make sure maze isn't ulta unsolvable)
            }
            this.path.push(arr);
        }

        var shortestDistance = -1;

        while(shortestDistance < 75 || shortestDistance > 115) { // the maze must be solvable in at most 115 moves, and at least 75 moves
            this.generateMaze();
            shortestDistance = this.path[this.startX][this.numRows-1];
        }

        this.objects = [];

        for(var x = 0;x<this.numCols;x++) {
            var arr = [];
            for(var y = 0;y<this.numRows;y++) {
                if(!this.tiles[x][y])
                    arr.push(new MazeBlock(this.sizeX * x + this.sizeX/2, this.sizeY * y + this.sizeY/2));
                else
                    arr.push(undefined)
            }
            this.objects.push(arr);
        }
        var block = new MazeBlock(this.sizeX * this.startX + this.sizeX/2, this.sizeY/2);
        block.getSprite().texture = $engine.getTexture("maze_end");
    }

    resetMaze() {
        for(var x = 0;x<this.numCols;x++) {
            for(var y = 0;y<this.numRows;y++) {
                this.tiles[x][y]=false;
                this.path[x][y]=-1;
            }
        }
    }

    flood(startX, startY) {
        var currentSet = [];
        var tempSet = [];
        var idx = 0;

        currentSet.push(new EngineLightweightPoint(startX,startY));

        while(currentSet.length!==0) {
            for(const point of currentSet) {
                this.floodSurroundings(tempSet, point)
                this.path[point.x][point.y]=idx;
            }
            idx++;
            currentSet = tempSet;
            tempSet = [];
        }


    }

    floodSurroundings(set, location) {
        var ox =  [1, 0, -1, 0];
        var oy =  [0, 1, 0, -1];
        for(var i =0;i<4;i++) {
            var xx = location.x+ox[i]
            var yy = location.y+oy[i]
            if(!this.inBounds(xx,yy))
                continue;
            if(this.tiles[xx][yy] && this.path[xx][yy]===-1)
                set.push(new EngineLightweightPoint(xx,yy));
        }
    }

    inBounds(x,y) {
        return x>= 0 && x<this.numCols && y >= 0 && y < this.numRows;
    }

    generateMaze() {
        this.resetMaze();
        var openSet = [];

        this.tiles[this.startX][this.startY] = true; // mark as start
        this.tiles[this.startX][0] = true; // mark as end

        this.addAllSurroundings(openSet, new EngineLightweightPoint(Math.floor(this.numCols/2),this.numRows-2));

        while(openSet.length!==0) {
            var tile = openSet.splice(EngineUtils.irandom(openSet.length-1),1)[0];
            if(!this.checkTile(tile.dst)) {
                this.markAsPassable(tile.middle);
                this.markAsPassable(tile.dst);
                this.addAllSurroundings(openSet, tile.dst);
            }
        }

        this.flood(this.startX,0); // flood from the end.
    }

    checkTile(tile) {
        return this.tiles[tile.x][tile.y];
    }

    markAsPassable(tile) {
        this.tiles[tile.x][tile.y]=true;
    }

    addAllSurroundings(openSet, point) {
        if(point.x > 2 && !this.tiles[point.x-2][point.y]) {
            var obj = {
                middle: new EngineLightweightPoint(point.x-1,point.y),
                dst: new EngineLightweightPoint(point.x-2,point.y),
            }
            openSet.push(obj)
        }
        if(point.x < this.numCols - 2 && !this.tiles[point.x+2][point.y]) {
            var obj = {
                middle: new EngineLightweightPoint(point.x+1,point.y),
                dst: new EngineLightweightPoint(point.x+2,point.y),
            }
            openSet.push(obj)
        }
        if(point.y > 2 && !this.tiles[point.x][point.y-2]) {
            var obj = {
                middle: new EngineLightweightPoint(point.x,point.y-1),
                dst: new EngineLightweightPoint(point.x,point.y-2),
            }
            openSet.push(obj)
        }
        if(point.y <this.numRows - 2 && !this.tiles[point.x][point.y+2]) {
            var obj = {
                middle: new EngineLightweightPoint(point.x,point.y+1),
                dst: new EngineLightweightPoint(point.x,point.y+2),
            }
            openSet.push(obj)
        }
    }



    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);  
    }

    onCreate() { 
        super.onCreate();
        this.onEngineCreate();
    }

    checkCamera() {
        var xBuf = 64;
        var yBuf = 128;
        var cam = $engine.getCamera();
        if(this.x - cam.getX() < xBuf) {
            this.tryMoveCamera(-$engine.getWindowSizeX(),0)
        }
        if(this.x - cam.getX() > $engine.getWindowSizeX() - xBuf) {
            this.tryMoveCamera($engine.getWindowSizeX(),0)
        }
        if(this.y - cam.getY() < yBuf) {
            this.tryMoveCamera(0,-$engine.getWindowSizeY()+yBuf*2)
        }
        if(this.y - cam.getY() > $engine.getWindowSizeY() - yBuf) {
            this.tryMoveCamera(0,$engine.getWindowSizeY()-yBuf*2)
        }
    }

    tryMoveCamera(dx, dy) {
        var camera = $engine.getCamera();
        if(dx!==0) {
            var xx = EngineUtils.clamp(camera.getX()+dx,0,this.totalWidth-$engine.getWindowSizeX());
            this.wantedCameraX = xx;
        }
        if(dy!==0) {
            var yy = EngineUtils.clamp(camera.getY()+dy,0,this.totalHeight-$engine.getWindowSizeY());
            this.wantedCameraY = yy;
        }
    }

    cameraTick() {
        this.checkCamera();

        var camera = $engine.getCamera();
        var dx = this.wantedCameraX - camera.getX();
        var dy = this.wantedCameraY - camera.getY();
        dx/=3;
        dy/=3;
        camera.translate(dx,dy);

        if(this.shakeTimer>0)
            this.shakeTimer--;
        var ox = EngineUtils.randomRange(-this.shakeTimer/2,this.shakeTimer/2);
        var oy = EngineUtils.randomRange(-this.shakeTimer/2,this.shakeTimer/2);
        camera.translate(ox,oy);
        this.paperBackground.tilePosition.x = -camera.getX();
        this.paperBackground.tilePosition.y = -camera.getY();
    }

    animationTick() {
        if(this.animTimer>=this.timeToNextRotation) {
            this.angle = EngineUtils.randomRange(-0.1,0.1);
            this.animTimer=0;
            this.timeToNextRotation= EngineUtils.irandomRange(12,42);
        }
        this.animTimer++;

        var fac = EngineUtils.interpolate(this.timeSinceLastMove/12,0,1, EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        var fac2 = EngineUtils.interpolate(this.timeSinceLastMove/12,0.5,1, EngineUtils.INTERPOLATE_OUT);
        this.x = this.toXLocation(this.lastX) + (this.toXLocation(this.targetX) - this.toXLocation(this.lastX)) * fac;
        this.y = this.toYLocation(this.lastY) + (this.toYLocation(this.targetY) - this.toYLocation(this.lastY)) * fac;
        if(this.targetY === this.lastY) {
            this.yScale = fac2 * this.baseYScale;
            this.xScale = this.baseXScale;
        } else {
            this.yScale = this.baseYScale;
            this.xScale = fac2 * this.baseXScale;
        }
        this.timeSinceLastMove++;
    }

    toXLocation(x) {
        return x * this.sizeX + this.sizeX/2;
    }

    toYLocation(y) {
        return y * this.sizeY + this.sizeY/2;
    }

    isOpen(x, y) {
        if(this.hasCheated()) {
            this.destroyCrate(this.getObjectAt(x,y));
            return this.inBounds(x,y);
        }
        return this.tiles[x] && this.tiles[x][y];
    }

    getObjectAt(x,y) {
        if(!this.inBounds(x,y))
            return undefined;
        var obj = this.objects[x][y];
        this.objects[x][y] = undefined;
        return obj
    }

    destroyCrate(crate) {
        if(crate===undefined)
            return;
        crate.setDestroyed();
        this.shakeTimer += 12;
        if(this.shakeTimer>30)
            this.shakeTimer=30;
    }

    movement() {
        for(var i =0;i<4;i++) {
            if(((IN.keyCheck("RPGup") && this.timeSinceLastMove >=10) || this.upBuffer.check()) && this.isOpen(this.currentX,this.currentY-1)) {
                this.upBuffer.consumeImmedaitely();
                this.timeSinceLastMove = 0;
                this.lastY = this.currentY;
                this.currentY--;
                this.targetY = this.currentY;
                this.lastX = this.currentX;
                $engine.audioPlaySound("eson_move_maze").speed = EngineUtils.randomRange(0.85,1.15);
            }
            if(((IN.keyCheck("RPGleft") && this.timeSinceLastMove >=10) || this.leftBuffer.check()) && this.isOpen(this.currentX-1,this.currentY)) {
                this.leftBuffer.consumeImmedaitely();
                this.timeSinceLastMove = 0;
                this.lastX = this.currentX;
                this.currentX--;
                this.targetX = this.currentX;
                this.lastY = this.currentY;
                this.baseXScale=-0.5;
                $engine.audioPlaySound("eson_move_maze").speed = EngineUtils.randomRange(0.85,1.15);
            }
            if(((IN.keyCheck("RPGright") && this.timeSinceLastMove >=10) || this.rightBuffer.check()) && this.isOpen(this.currentX+1,this.currentY)) {
                this.rightBuffer.consumeImmedaitely();
                this.timeSinceLastMove = 0;
                this.lastX = this.currentX;
                this.currentX++;
                this.targetX = this.currentX;
                this.lastY = this.currentY;
                this.baseXScale=0.5;
                $engine.audioPlaySound("eson_move_maze").speed = EngineUtils.randomRange(0.85,1.15);
            }
            if(((IN.keyCheck("RPGdown") && this.timeSinceLastMove >=10) || this.downBuffer.check()) && this.isOpen(this.currentX,this.currentY+1)) {
                this.downBuffer.consumeImmedaitely();
                this.timeSinceLastMove = 0;
                this.lastY = this.currentY;
                this.currentY++;
                this.targetY = this.currentY;
                this.lastX = this.currentX;
                $engine.audioPlaySound("eson_move_maze").speed = EngineUtils.randomRange(0.85,1.15);
            }
        }
        if(this.currentX===this.startX && this.currentY===0) {
            if(!this.hasCheated() && this.getTimer().getTimeRemaining() >= 900){
                $engine.activateAchievement("MAZE_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            this.endMinigame(true);
        }
    }

    flashlightTick() {
        this.lampSprite.update(1);
        this.lampSprite.x = this.x - $engine.getCamera().getX();
        this.lampSprite.y = this.y - $engine.getCamera().getY();
    }

    checkTimerOpacity() {
        var yDiff = this.y - $engine.getCamera().getY();

        var fac = EngineUtils.interpolate((yDiff-128)/512,0.5,1,EngineUtils.INTERPOLATE_SMOOTH);
        this.getTimer().alpha = fac;
    }

    step() {
        super.step();
        if(this.isPregame())
            return;
        this.cameraTick();
        this.animationTick();
        this.flashlightTick();
        this.checkTimerOpacity();
        if(this.minigameOver()){
            return;
        }
        this.movement();
        
    }

    draw(gui, camera) {
        super.draw(gui, camera);
        $engine.requestRenderOnCameraGUI(this.lampSprite);
    }
 
}


class MazeBlock extends EngineInstance {
    onCreate(x,y, particle = false) {
        this.x = x;
        this.y = y;

        var texture = $engine.getTexture("maze_block");

        this.xScale = 0.5;
        this.yScale = 0.5;

        this.particle = particle;
    
        this.setSprite(new PIXI.Sprite(texture));
        var r = EngineUtils.irandomRange(178,255);
        this.originalTintFactor = r;
        this.getSprite().tint = (r<<16) | (r<<8) | r; // add some variation via a brightness adjustment

        this.dy = EngineUtils.randomRange(-8,-4);
        this.dx = EngineUtils.randomRange(-2,2);
        this.dz = EngineUtils.randomRange(-0.05,0.05);
        this.grav = 0.25;
        this.lifeTimer = 0;
        this.lifeTime = EngineUtils.irandomRange(45,75);

        this.changeTimer = EngineUtils.irandom(60);
        this.angle = EngineUtils.randomRange(-0.05,0.05)
    }

    setDestroyed() {
        if(this.destroyed)
            return;
        $engine.audioPlaySound("explosion_maze").speed = EngineUtils.randomRange(0.85,1.15);
        this.destroyed = true
        var count = EngineUtils.irandomRange(8,24);
        for(var i = 0;i<count;i++) { // reduce, reuse, recycle
            var block = new MazeBlock(this.x, this.y, true);
            block.xScale = EngineUtils.randomRange(0.1,0.2);
            block.yScale = EngineUtils.randomRange(0.1,0.2);
            block.x+=EngineUtils.randomRange(-24,24);
            block.y+=EngineUtils.randomRange(-24,24);
            block.destroyed=true
        }
        var block = new MazeBlock(this.x,this.y);
        block.getSprite().texture = $engine.getTexture("maze_block_faded")
    }
    
    step() {
        if(this.destroyed) {
            this.lifeTimer++;
            if(this.lifeTimer>this.lifeTime)
                this.destroy();
            this.alpha = EngineUtils.interpolate((this.lifeTimer-(this.lifeTime-24))/24,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.x+=this.dx;
            this.y+=this.dy;
            this.angle+=this.dz;
            this.dy += this.grav;
        } else if(--this.changeTimer<=0) {
            this.changeTimer=EngineUtils.irandomRange(18,60);
            this.angle = EngineUtils.randomRange(-0.03,0.03)
        }
    }
}