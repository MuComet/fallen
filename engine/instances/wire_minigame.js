class WireMinigameController extends MinigameController {
    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.WIRE)
        super.onEngineCreate();
        this.skipPregame();
        this.numRows = 10;
        this.numCols = 10;
        this.tiles = []

        this.tileWidth = 50;
        this.tileHeight = 50;

        var distributions = [0.6,0.85,1];

        this.pathLength = -1;

        var total = this.numCols * this.numRows;
        var distIdx = 0;
        var results = []
        for(var i = 0;i<total;i++) {
            var fac = i/total;
            if(fac>distributions[distIdx]) {
                distIdx++;
            }
            results.push(distIdx);
        }

        EngineUtils.shuffleArray(results);


        var tileXStart = $engine.getWindowSizeX()/2-(this.numCols-1)/2*this.tileWidth;
        var tileYStart = $engine.getWindowSizeY()/2-(this.numRows-1)/2*this.tileHeight;

        for(var x = 0;x<this.numCols;x++) {
            var arr = [];
            for(var y = 0;y<this.numRows;y++) {
                var tile = new WireTile(tileXStart + x * this.tileWidth, tileYStart + y * this.tileHeight, results[x*this.numRows+y],x,y);
                tile.xTile = x;
                tile.yTile = y;
                arr.push(tile);
            }
            this.tiles.push(arr);
        }

        this.startY = -1;
        this.endY = -1;

        this.startTile = undefined;
        this.endTile = undefined;

        this.generatePath();
        this.recalculate();

        this.time = $engine.hasItem(ENGINE_ITEMS.ENIGMA_DECRYPTER) ? 70*60 : 60*60;


        this.startTimer(this.time);
        this.getTimer().alpha = 0.85

        this.setSprite(new PIXI.Sprite($engine.getTexture("wire_board")))

        $engine.setBackground(new PIXI.Sprite($engine.getTexture("wall_tile")))

        var inSprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("wire_inputs_0")));
        inSprite.anchor.x = 1;
        inSprite.anchor.y = 0.5;
        inSprite.x = tileXStart-this.tileWidth/2 - 16;
        inSprite.y = this.startY * this.tileHeight + tileYStart

        var outSprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("wire_inputs_1")));
        outSprite.anchor.x = 0;
        outSprite.anchor.y = 0.5;
        outSprite.x = tileXStart + this.tileWidth * this.numCols - this.tileWidth/2 + 16;
        outSprite.y = this.endY * this.tileHeight + tileYStart

        this.addOnCheatCallback(this, function(self) {
            for(var x = 0;x<self.numCols;x++) {
                for(var y = 0;y<self.numRows;y++) {
                    if(!self.tiles[x][y].isPartOfSolution)
                        self.tiles[x][y].wireAnimation.tint = 0x666666; // make all tiles that aren't part of the generator solution darker.
                }
            }

            if(self.getTimer().getTimeRemaining()<self.time/2) { // give them at least 30 seconds to solve
                self.getTimer().setTimeRemaining(self.time/2)
            }
        })
        this.setCheatTooltip("The inner workings!");
        this.setLossReason("Maybe don't play with electricity...")
        this.setControls(false,true);
        var instr = new PIXI.Text("Click on tiles to rotate them.\nConnect the flow of electricity from the start on the left\nto the goal on the right before "
            + "time runs out!\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle())
        this.setInstructionRenderable(instr)
    }

    step() {
        super.step();
        this.timerLogic();
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames)
    }

    timerLogic() {
        var fac = EngineUtils.interpolate((IN.getMouseY()-96)/196,0.2,0.85,EngineUtils.INTERPOLATE_OUT);
        this.getTimer().alpha = fac;
    }

    generatePath() {
        while(true) {
            try {
                this.resetAllTiles();
                var samples = 5;
                var change = this.numCols/samples
                var path = [];

                var randStartY = EngineUtils.irandom(this.numRows-1);

                for(var i =0;i<samples-1;i++) {
                    path.push(new EngineLightweightPoint(Math.floor(i*change)+1,EngineUtils.irandom(this.numRows-1)))
                }
                while(this.isNotShuffled(path))
                    EngineUtils.shuffleArray(path);

                if(path[0].y===randStartY) {
                    path[0].y++; // reserve this tile as the starting location.
                }

                var endTile = new EngineLightweightPoint(Math.floor((samples-1)*change)+1,EngineUtils.irandom(this.numRows-1))
                path.push(endTile) // add end tile
                var cx = 0;
                var cy = Math.floor(randStartY);
                // this.getTileAt(cx,cy).wireAnimation.tint = 0x00ff00

                var pathIndex = 0;
                var target = path[0];
                var TWO_PI = Math.PI*2
                var targetTile = undefined;
                var lastTile = this.getTileAt(cx,cy);
                var visitedTiles = [lastTile];
                lastTile.visitParity=1;
                lastTile.visitCount=1;
                var lastParity = 1;
                var currentParity = -1;
                var ox, oy;

                this.startTile = this.getTileAt(cx,cy);
                this.endTile = this.getTileAt(endTile.x,endTile.y);
                this.startTile.isPartOfSolution=true;

                this.startY = randStartY;
                this.endY = endTile.y;

                // visit every sample point
                while((pathIndex++)<samples) {
                    var tx = target.x;
                    var ty = target.y;
                    target = path[pathIndex]; // set up for next
                    while(cx!==tx || cy !==ty) {
                        var angle = (V2D.calcDir(tx-cx,cy-ty)+(TWO_PI))%TWO_PI; // make sure positive
                        var sx = 1; // desired direction you want to move (sign)
                        var sy = 1;

                        if(angle < Math.PI)
                            sy = -1;
                        if(angle > Math.PI/2 && angle < Math.PI/2*3)
                            sx = -1;
                        
                        var xFac = Math.cos(angle); // implict yFac
                        xFac*=xFac
                        var rand = EngineUtils.random(1);
                        var tileX = this.getTileAt(cx+sx,cy)
                        var tileY = this.getTileAt(cx,cy+sy)
                        // first, try desired direction
                        if(rand < xFac) {
                            targetTile = tileX;
                            currentParity = 1;
                            ox = sx;
                            oy = 0;
                        } else {
                            targetTile = tileY;
                            currentParity = 0;
                            ox = 0;
                            oy = sy;
                        }
                        if(this.canVisitTile(targetTile, lastTile)) {
                            this.visitTile(targetTile, lastTile, currentParity!==lastParity);
                            lastParity=currentParity;
                            lastTile = targetTile;
                            cx += ox;
                            cy += oy;
                            visitedTiles.push(targetTile)
                        } else {
                            // try all surrounding tiles if we couldn't go in the desired direction
                            ox = [1, 0, -1, 0];
                            oy = [0, 1, 0, -1];
                            for(var i =0;i<4;i++) {
                                var testTile = this.getTileAt(cx+ox[i],cy+oy[i]);
                                currentParity = (i+1)%2;
                                if(this.canVisitTile(testTile, lastTile)) {
                                    this.visitTile(testTile, lastTile, currentParity!==lastParity);
                                    lastParity=currentParity;
                                    lastTile = testTile;
                                    cx+=ox[i];
                                    cy+=oy[i];
                                    visitedTiles.push(testTile)
                                    break;
                                }
                            }
                            if(i===4) {
                                throw new Error("Failed to find path"); // reset and try again.
                            }
                        }
                    }
                }
                if(lastTile.visitCount===1 && lastTile.visitParity===0) // make sure last tile points to end
                    lastTile.isBend=true;
                for(const tile of visitedTiles) {
                    // tile.wireAnimation.tint = 0x00ff00
                    if(tile.isBend)
                        tile.changeType(1);
                    else if(tile.visitCount===1)
                        tile.changeType(0);
                    else if(tile.visitCount===2)
                        tile.changeType(2)
                }
                var lastTile = visitedTiles[visitedTiles.length-1];
                /*for(const p of path) {
                    this.getTileAt(p.x,p.y).wireAnimation.tint = 0xff0000
                }*/
                return;
            } catch (e) {};
        }
    }

    isNotShuffled(array) {
        var len = array.length-1;
        // make sure we have at least one out of order target
        for(var i =0;i<len;i++) {
            if(array[i].x > array[i+1].x) {
                return false;
            }
        }
        return true;
    }

    canVisitTile(tile, lastTile) {
        if(tile===undefined || tile.isBend || tile.visitCount===2) // can never re-visit a bend tile, cannot visit a tile that has been visited twice (should be impossible anyway)
            return false;
        var ox = tile.xTile - lastTile.xTile;
        if(ox!==0) {
            if(tile.visitParity===1) // was visited before in the same direction, don't let them backtrack
                return false;
            return true;
        } else {
            if(tile.visitParity===0)
                return false;
            return true;
        }
    }

    visitTile(tile, lastTile, changedPolarity) {
        if(changedPolarity)
            lastTile.isBend=true;
        tile.visitCount++;
        tile.isPartOfSolution=true;
        var ox = tile.xTile - lastTile.xTile;
        tile.visitParity = ox!==0 ? 1 : 0;
    }

    resetAllTiles() {
        for(var x = 0;x<this.numCols;x++) {
            for(var y = 0;y<this.numRows;y++) {
                this.tiles[x][y].visitParity=-1;
                this.tiles[x][y].visitCount=0;
                this.tiles[x][y].isBend=false;
                this.tiles[x][y].isPartOfSolution = false;
                // this.tiles[x][y].wireAnimation.tint = 0xffffff;
            }
        }
    }

    getTileAt(x,y) {
        var t = this.tiles[x]
        if(!t)
            return t;
        return t[y];
    }

    recalculate() {
        var oldPathLength = this.pathLength;
        var tempPathLength = 0;
        
        // reset all tiles
        for(var x = 0;x<this.numCols;x++) {
            for(var y = 0;y<this.numRows;y++) {
                this.tiles[x][y].liveCount = 0;
                this.tiles[x][y].energized = false;
            }
        }

        // visit all tiles
        var currentTile = this.startTile;
        var fromDir = WireTile.WEST
        // if end is the current tile, check if the output dir is EAST
        while(currentTile && !(currentTile === this.endTile && currentTile.getOutputDirection(fromDir) === WireTile.EAST)) { 
            if(currentTile.canInputFrom(fromDir)) {
                currentTile.liveCount++;
                currentTile.energized=true;
                currentTile.liveParity = (fromDir + currentTile.currentRotation) % 2;
                fromDir = (currentTile.getOutputDirection(fromDir) + 2) % 4
                currentTile = this.getNextTile(currentTile, fromDir);
                tempPathLength++;
            } else {
                currentTile = undefined;
            }
        }

        if(currentTile===this.endTile && currentTile.canInputFrom(fromDir) && currentTile.getOutputDirection(fromDir) === WireTile.EAST) {
            currentTile.liveCount++;
            currentTile.energized=true;
            tempPathLength++;
            for(var x = 0;x<this.numCols;x++) {
                for(var y = 0;y<this.numRows;y++) {
                    this.tiles[x][y].lock();
                }
            }
            if(this.getTimer().getTimeRemaining() >= 2700){
                $engine.activateAchievement("WIRE_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            this.endMinigame(true);
        }

        for(var x = 0;x<this.numCols;x++) {
            for(var y = 0;y<this.numRows;y++) {
                this.tiles[x][y].updateSprite();
            }
        }

        this.pathLength = tempPathLength;

        if(oldPathLength===-1) { // init
            return;
        }
        if(this.pathLength > oldPathLength) {
            $engine.audioPlaySound("wire_connect");
        } else if(this.pathLength < oldPathLength) {
            $engine.audioPlaySound("wire_disconnect");
        }
    }

    getNextTile(tile, invDirection) { // takes in the inverse output direction of the last tile
        var cx = tile.tileX;
        var cy = tile.tileY;
        if(invDirection === WireTile.SOUTH) {
            return this.getTileAt(cx,cy-1);
        }
        if(invDirection === WireTile.WEST) {
            return this.getTileAt(cx+1,cy);
        }
        if(invDirection === WireTile.NORTH) {
            return this.getTileAt(cx,cy+1);
        }
        if(invDirection === WireTile.EAST) {
            return this.getTileAt(cx-1,cy);
        }
        console.log(invDirection)
    }
}

class WireTile extends EngineInstance{
    onCreate(x,y, type, tileX, tileY) {
        this.x = x;
        this.y = y;

        this.tileX = tileX;
        this.tileY = tileY;

        this.visitCount = 0; // for generation
        this.isBend = false;
        this.visitParity = -1;
        this.isPartOfSolution = false;

        this.currentRotation = 0;

        this.visualRotation = 0;
        this.currentVisualRotation = 0;

        this.liveCount = 0; // for live sprites
        this.liveParity = -1;

        this.locked = false;

        this.connections = undefined; // [N E S W]

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this, -25,-25,25,25)));

        this.container = $engine.createRenderable(this, new PIXI.Container())

        this.wireAnimation = $engine.createManagedRenderable(this, new PIXI.extras.AnimatedSprite([PIXI.Texture.EMPTY]));
        this.wireAnimation.anchor.set(0.5)
        this.wireAnimation.animationSpeed=0.1;
        this.container.addChild(this.wireAnimation)
        this.container.x = x;
        this.container.y = y;

        this.standardAnimation = [];
        this.energizedAnimation1 = [];
        this.energizedAnimation2 = [];
        this.energizedAnimation3 = [];

        this.energized = false;

        this.setRotation(EngineUtils.irandom(3));

        this.type = type;

        this.changeType(this.type);
    }

    setEnergized(bool) {
        this.energized = bool;
        this.updateSprite();
        
    }

    updateSprite() {
        if(!this.energized) {
            this.wireAnimation.textures = this.standardAnimation;
            return;
        }
        if(this.type===2)
            this.updateSpriteCross();
        else
            this.updateSpriteOther();
        
    }

    updateSpriteCross() {
        if(this.liveCount===1) {
            if(this.liveParity===0) {
                this.wireAnimation.textures = this.energizedAnimation1;
            } else {
                this.wireAnimation.textures = this.energizedAnimation2;
            }
        } else {
            this.wireAnimation.textures = this.energizedAnimation3;
        }
    }

    updateSpriteOther() {
        this.wireAnimation.textures = this.energizedAnimation1;
    }

    changeType(type) {
        switch(type) {
            case(0):
                this.connections = [false, true, false, true] // straight line horizontal
                this.energizedAnimation1 = $engine.getAnimation("anim_wire_straight");
            break;
            case(1):
                this.connections = [true, true, false, false] // turn NE
                this.energizedAnimation1 = $engine.getAnimation("anim_wire_bend");
            break;
            case(2):
                this.connections = [true, true, true, true]
                this.energizedAnimation1 = $engine.getAnimation("anim_wire_cross_a");
                this.energizedAnimation2 = $engine.getAnimation("anim_wire_cross_b");
                this.energizedAnimation3 = $engine.getAnimation("anim_wire_cross_c");
            break;
        }
        this.standardAnimation = [$engine.getTexture("wire_tiles_"+String(type))];
        this.updateSprite();
        this.type = type;
    }

    step() {
        if((IN.mouseCheckPressed(0) || IN.mouseCheckPressed(2)) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)) {
            this.rotate(IN.mouseCheckPressed(0) ? 1 : -1);
            WireMinigameController.getInstance().recalculate();
        }
        this.wireAnimation.update(1);

        var diff = this.visualRotation - this.currentVisualRotation;
        this.currentVisualRotation+=diff/1.5;
        this.container.rotation = Math.PI/2 * this.currentVisualRotation;

    }

    rotate(dir) {
        if(this.locked)
            return;
        $engine.audioPlaySound("wire_rotate");
        this.currentRotation = ((this.currentRotation + dir) + 4) %4;
        this.visualRotation+=dir;
    }

    setRotation(rotation) {
        this.currentRotation = rotation;
        this.container.rotation = Math.PI/2 * this.currentRotation;
        this.currentVisualRotation=rotation;
        this.visualRotation=rotation;
    }

    applySprites() {

    }

    lock() {
        this.locked = true;
    }

    canInputFrom(inputDirection) { // alias.
        return this.checkConnectionCorrected(inputDirection);
    }

    getOutputDirection(inputDirection) {
        switch(this.type) {
            case(0):
            case(2):
                return (inputDirection+2)%4;
            case(1):
                if(this.checkConnectionCorrected(inputDirection+1)) // a left turn
                    return (inputDirection+1)%4
                return (inputDirection+3)%4 // + 4 - 1 (non negative)
        }
    }

    checkConnectionCorrected(direction) {
        return this.connections[(direction - this.currentRotation + 4)%4];
    }
}
WireTile.NORTH = 0;
WireTile.EAST = 1;
WireTile.SOUTH = 2;
WireTile.WEST = 3;