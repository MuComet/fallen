class WireMinigameController extends MinigameController {
    onEngineCreate() {
        super.onEngineCreate();
        this.skipPregame();
        this.numRows = 10;
        this.numCols = 10;
        this.tiles = []

        this.tileWidth = 50;
        this.tileHeight = 50;

        var distributions = [0.6,0.85,1];

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
                var tile = new WireTile(tileXStart + x * this.tileWidth, tileYStart + y * this.tileHeight, results[x*this.numRows+y]);
                tile.xTile = x;
                tile.yTile = y;
                arr.push(tile);
            }
            this.tiles.push(arr);
        }

        this.generatePath();
    }

    generatePath() {
        while(1) {
            try {
                this.resetAllTiles();
                var samples = 5;
                var change = this.numCols/samples
                var path = [];

                for(var i =0;i<samples-1;i++) {
                    path.push(new EngineLightweightPoint(Math.floor(i*change)+1,EngineUtils.irandom(this.numRows-1)))
                }
                while(this.isNotShuffled(path))
                    EngineUtils.shuffleArray(path);

                if(path[0].y===Math.floor(this.numRows/2)) {
                    path[0].y++; // reserve this tile as the starting location.
                }

                path.push(new EngineLightweightPoint(Math.floor((samples-1)*change)+1,EngineUtils.irandom(this.numRows-1))) // add end tile
                var cx = 0;
                var cy = Math.floor(this.numRows/2);
                this.getTileAt(cx,cy).wireSprite.tint = 0x00ff00

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

                while((pathIndex++)<samples) {
                    var tx = target.x;
                    var ty = target.y;
                    target = path[pathIndex]; // set up for next
                    while(cx!==tx || cy !==ty) {
                        var angle = (V2D.calcDir(tx-cx,cy-ty)+(TWO_PI))%TWO_PI;
                        var sx = 1; // sign
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
                    tile.wireSprite.tint = 0x00ff00
                    if(tile.isBend)
                        tile.changeType(1);
                    else if(tile.visitCount===1)
                        tile.changeType(0);
                    else if(tile.visitCount===2)
                        tile.changeType(2)
                }
                var lastTile = visitedTiles[visitedTiles.length-1];
                for(const p of path) {
                    this.getTileAt(p.x,p.y).wireSprite.tint = 0xff0000
                }
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
        var ox = tile.xTile - lastTile.xTile;
        tile.visitParity = ox!==0 ? 1 : 0;
    }

    resetAllTiles() {
        for(var x = 0;x<this.numCols;x++) {
            for(var y = 0;y<this.numRows;y++) {
                this.tiles[x][y].visitParity=-1;
                this.tiles[x][y].visitCount=0;
                this.tiles[x][y].isBend=false;
                this.tiles[x][y].wireSprite.tint = 0xffffff;
            }
        }
    }

    getTileAt(x,y) {
        var t = this.tiles[x]
        if(!t)
            return t;
        return t[y];
    }
}

class WireTile extends EngineInstance{
    onCreate(x,y, type) {
        this.x = x;
        this.y = y;

        this.visitCount = 0; // for generation
        this.isBend = false;
        this.visitParity = -1;

        this.currentRotation = 0;

        this.locked = false;

        this.connections = undefined; // [N E S W]

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this, -25,-25,25,25)));

        this.container = $engine.createRenderable(this, new PIXI.Container())

        this.wireSprite = $engine.createManagedRenderable(this, new PIXI.Sprite(PIXI.Texture.EMPTY));
        this.wireSprite.anchor.set(0.5)
        this.container.addChild(this.wireSprite)
        this.container.x = x;
        this.container.y = y;

        this.setRotation(EngineUtils.irandom(3));

        this.changeType(type);

    }

    changeType(type) {
        switch(type) {
            case(0):
                this.connections = [false, true, false, true] // straight line horizontal
            break;
            case(1):
                this.connections = [true, true, false, false] // turn NE
            break;
            case(2):
                this.connections = [true, true, true, true]
            break;
        }
        this.wireSprite.texture = $engine.getTexture("wire_tiles_"+String(type))
    }

    step() {
        if(IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)) {
            this.rotate();
            for(var i =0;i<4;i++)
                console.log(this.canInputFrom(i));
        }
    }

    rotate() {
        if(this.locked)
            return;
        this.currentRotation = (this.currentRotation+1)%4;
        this.container.rotation = Math.PI/2 * this.currentRotation;
    }

    setRotation(rotation) {
        this.currentRotation= rotation;
        this.container.rotation = Math.PI/2 * this.currentRotation;
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
        switch(type) {
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