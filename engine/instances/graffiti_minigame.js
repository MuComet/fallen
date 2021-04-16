class GraffitiMinigameController extends MinigameController { // controls the minigame
    onEngineCreate() {
        super.onEngineCreate();
        this.instructiontext = $engine.createRenderable(this,new PIXI.Text("WAIT! " + String(60), $engine.getDefaultSubTextStyle()),false);
        this.instructiontext.anchor.x=0.5
        this.instructiontext.x = $engine.getWindowSizeX()/2;
        this.instructiontext.y = $engine.getWindowSizeY()-80;

        new ParallaxingBackground("background_wall_1");

        this.totalScore=0;

        var text = new PIXI.Text("Click the mouse to start drawing, and make sure \n to HOLD, don't let go until you are done. \n"
            + "Trace the entire outline of the shape.\n\n Make no extra lines in the process.\n"
            + "There are 3 drawings to trace in 20 sec.\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.setControls(true,false);
        this.setCheatTooltip("Zoom zoom zoom zoom zoom!");
        this.skipPregame();

        this.reloadDrawings();
        this.graphicInd=-1;
        this.totalGraphics = this.images.length
        this.currentGraphic = undefined;
        this.targetTime = -1;

        this.timeToNextDroplet = EngineUtils.irandomRange(6,12);
        this.dropletContainer = $engine.createManagedRenderable(this, new PIXI.Sprite(PIXI.Texture.EMPTY))

        this.currentTurnSpeed = 0;

        this.baseSpeed = 2;
        this.baseTurnRate = Math.PI/256; // 64 frames to turn around

        this.bufferTime = 0*60; // 0 extra seconds. (can cut corners)

        this.cheatFactor = 1;

        this.addOnCheatCallback(this, function(self) {
            self.cheatFactor = 3; // ZOOM ZOOM ZOOM
            self.currentTurnSpeed=0;
        })

        this.addOnGameStartCallback(this, function(self) {
            this.waitTimer = 0;
        })
        this.waitTimer = 0;


        $engine.setCeilTimescale(true)
        this.nextGraphic();

        this.startTimer(this.targetTime)
        this.setPreventEndOnTimerExpire(true); // take direct control using below function
        this.getTimer().addOnTimerStopped(this, function(self) {
            self.onImageComplete();
        })
        this.getTimer().setWarningTime(this.bufferTime); // 3 seconds.

        this.setupControllerGraphics();

        this.arrowGraphic = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("arrow")))

        this.depth = -1;
    }

    setupControllerGraphics() {
        this.setSprite(new PIXI.Sprite($engine.getTexture("sponge")));
        this.spongeMask = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("sponge_mask")));
    }

    renderToMasks() {
        this.spongeMask.x = this.x;
        this.spongeMask.y = this.y;
        this.spongeMask.scale.x = this.xScale;
        this.spongeMask.scale.y = this.yScale;
        this.spongeMask.rotation = this.angle;
        this.currentGraphic.render(this.spongeMask);
        IM.with(Droplet,function(drop) {
            drop.maskSprite.x = drop.x;
            drop.maskSprite.y = drop.y;
            drop.maskSprite.rotation = drop.angle;
            drop.maskSprite.xScale = drop.xScale;
            drop.maskSprite.alpha = drop.alpha;
        })
        this.currentGraphic.render(this.dropletContainer)
    }

    onImageComplete() {
        this.nextImageWaitTimer = 180;
        this.images[this.graphicInd].calculateScore()
        if(this.graphicInd < this.totalGraphics) {
            this.nextGraphic();
            this.getTimer().restartTimer(this.targetTime)
        } else {
            this.finishMinigame();
        }
    }

    finishMinigame() {
        var won = this.calcWin()>0.75;
        if(!won) {
            this.setLossReason("Try following the lines next time.")
        }
        this.endMinigame(won);
    }

    calcWin() {
        this.totalScore/=3;
        return this.totalScore;
    }

    onCreate() {
        this.onEngineCreate();
    }

    reloadDrawings() {
        var data = $engine.getSaveData().drawingMinigameLines;
        if(!data) { // testing
            data = [];
            data.push({
                line:ShapeToDraw.paths[0].path,
                distance:ShapeToDraw.paths[0].dist
            })
            data.push({
                line:ShapeToDraw.paths[1].path,
                distance:ShapeToDraw.paths[1].dist
            })
            data.push({
                line:ShapeToDraw.paths[2].path,
                distance:ShapeToDraw.paths[2].dist
            })
        }
        this.images = [];
        for(var i=0;i<3;i++) {
            this.images.push(new ShapeToClean(data[i]))
        }
    }

    nextGraphic() {
        this.graphicInd++;
        if(this.graphicInd>this.totalGraphics) {
            this.images[this.graphicInd].setVisible(false)
            this.currentGraphic=undefined;
            return;
        }

        IM.destroy(Droplet)

        if(this.graphicInd>0) {
            this.images[this.graphicInd-1].setVisible(false)
        }
        this.currentGraphic = this.images[this.graphicInd];
        this.currentGraphic.setVisible(true)

        if(this.graphicInd>=this.totalGraphics) {
            this.done = true;
            return;
        }

        this.targetTime = this.currentGraphic.getDistance() / this.baseSpeed + this.bufferTime; // time to clean + buffer.

        $engine.audioPlaySound("draw_start")
        $engine.audioPlaySound("draw_shake",1,true)
        
        var loc = this.currentGraphic.getStartLocation();
        this.x = loc.x + $engine.getWindowSizeX()/2;
        this.y = loc.y + $engine.getWindowSizeY()/2;
        this.currentDirection = this.currentGraphic.getStartAngle();
        this.currentTurnSpeed = 0;
    }

    step() {
        super.step();
        if(this.minigameOver())
            return;

        this.waitTimer++;
        if(this.waitTimer<150) {
            if(this.waitTimer<=60) {
                this.instructiontext.alpha=1;
                this.instructiontext.text = "WAIT! " + String(60-this.waitTimer)
            } else {
                this.instructiontext.text = "GO!!!!"
                this.instructiontext.alpha = 1-(this.waitTimer-60)/40 + Math.sin(this.waitTimer/2)/2
                $engine.audioStopSound("draw_shake");
            }
        } else {
            this.instructiontext.text = "";
        }
        this.handleMove();
        this.wobble();
        this.handleDroplets();
        this.renderToMasks();
    }

    handleDroplets() {
        if(--this.timeToNextDroplet<=0) {
            this.timeToNextDroplet = EngineUtils.irandomRange(6,12);
            new Droplet(this.x+EngineUtils.randomRange(-24,24),this.y+EngineUtils.randomRange(-24,24));
        }
    }

    handleMove() {
        if(IN.keyCheck("RPGright")) {
            if(this.hasCheated()) {
                this.currentDirection+=this.baseTurnRate * 4; // direct
            } else {
                this.currentTurnSpeed+=this.baseTurnRate;
            }
        }
        if(IN.keyCheck("RPGleft")) {
            if(this.hasCheated()) {
                this.currentDirection-=this.baseTurnRate * 4; // direct
            } else {
                this.currentTurnSpeed-=this.baseTurnRate;
            }
        }
        this.currentDirection+=this.currentTurnSpeed;
        this.currentTurnSpeed*=0.965
        var xMove = Math.cos(this.currentDirection) * this.baseSpeed * this.cheatFactor;
        var yMove = Math.sin(this.currentDirection) * this.baseSpeed * this.cheatFactor;
        if(this.x+xMove < 0 || this.x + xMove > $engine.getWindowSizeX()) {
            this.currentDirection = V2D.mirrorAngle(this.currentDirection,0);
            xMove = -xMove;
        }
        if(this.y+yMove < 0 || this.y + yMove > $engine.getWindowSizeY()) {
            this.currentDirection = V2D.mirrorAngle(this.currentDirection,Math.PI/2);
            yMove = -yMove;
        }

        this.x+=xMove
        this.y+=yMove
    }

    wobble() {
        this.xScale = 1+Math.sin($engine.getGameTimer()/13)/12;
        this.yScale = 1+Math.sin($engine.getGameTimer()/13+10)/12;
        this.angle = Math.cos($engine.getGameTimer()/16)/8;
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);
    }

    draw(gui, camera) {
        super.draw(gui, camera);
        $engine.requestRenderOnCamera(this.instructiontext);
        this.updateArrow()
    }

    updateArrow() {
        var constOffset = 12
        var offsetFactor = 30
        var dir = this.currentDirection;
        var fac2 = Math.abs(Math.sin($engine.getGameTimer()/16))/8 + 0.25
        this.arrowGraphic.scale.set(fac2)
        this.arrowGraphic.x = this.x + V2D.lengthDirX(dir,constOffset+fac2*offsetFactor);
        this.arrowGraphic.y = this.y - V2D.lengthDirY(dir,constOffset+fac2*offsetFactor);
        this.arrowGraphic.rotation = dir;
    }

    getDropletContainer() {
        return this.dropletContainer;
    }

}

class BubbleParticle extends EngineInstance {

}

class Droplet extends EngineInstance {
    onCreate(x,y) {
        this.depth = -2;
        this.dy = 0;
        this.grav = 0.25;
        this.angle = Math.PI/2;
        this.x = x;
        this.y = y;
        var idx = EngineUtils.irandom(2);
        this.maskSprite = new PIXI.Sprite($engine.getTexture("drop_sprites_"+String(idx+3)));
        GraffitiMinigameController.getInstance().getDropletContainer().addChild(this.maskSprite); // for fast rendering
        this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("drop_sprites_"+String(idx))),true);
        this.lifeTime = EngineUtils.irandomRange(30,50);
        this.lifeTimer=0;
        this.yScale = 0.5;
        this.fadeTime = EngineUtils.irandomRange(5,20);
    }

    step() {
        this.y+=this.dy;
        this.dy+=this.grav;
        this.xScale = EngineUtils.clamp(this.dy,0,1.5)
        if(this.lifeTimer>this.lifeTime) {
            this.destroy();
        }
        if(this.lifeTimer>=this.lifeTime-this.fadeTime) {
            this.alpha = EngineUtils.interpolate((this.lifeTimer-(this.lifeTime-this.fadeTime))/this.fadeTime,1,0,EngineUtils.INTERPOLATE_OUT);
        }
        this.lifeTimer++
    }

    onDestroy() {
        GraffitiMinigameController.getInstance().getDropletContainer().removeChild(this.maskSprite);
    }

}

class ShapeToClean extends EngineInstance {

    onCreate(data) {
        if(data.distance===-1)
            return;

        this.distance = data.distance;
        this.startLocation = data.line[0]
        var nextPoint = data.line[1];
        if(nextPoint) { // edge case of 1 long line.
            this.startAngle = V2D.calcDir(nextPoint.x - this.startLocation.x, nextPoint.y - this.startLocation.y);
        } else {
            this.startAngle=0;
        }
        

        this.percentCleaned = -1;

        this.createImages(data.line);

        this.setVisible(false);
        
    }

    setVisible(bool) {
        // save the poor GPU
        this.showing = bool;
        this.sprite.visible = bool;
        this.maskSprite.visible=bool;
        this.waterMaskSprite.visible=bool;
        this.waterSprite.visible=bool
    }

    render(spr) {
        spr.tint = 0;
        if(spr.children) {
            for(const child of spr.children)
                child.tint = 0;
        }
        $engine.getRenderer().render(spr,this.renderTextureClean1,false,null,false);
        spr.tint = 0xffffff;
        if(spr.children) {
            for(const child of spr.children)
                child.tint = 0xffffff;
        }
        $engine.getRenderer().render(spr,this.renderTextureClean2,false,null,false);
    }

    getStartLocation() {
        return this.startLocation
    }

    getStartAngle() {
        return this.startAngle
    }

    getDistance() {
        return this.distance
    }

    createImages(points) {
        var graphics = new PIXI.Graphics();
        var colourOuter = 0xdfdfdf
        var colourInner = 0xbfbfbf

        graphics.x = $engine.getWindowSizeX()/2;
        graphics.y = $engine.getWindowSizeY()/2;

        graphics.moveTo(points[0].x,points[0].y);
        graphics.lineStyle(12,colourOuter)
        for(var i =1;i<points.length-1;i++) {
            var xc = (points[i].x + points[i + 1].x) / 2;
            var yc = (points[i].y + points[i + 1].y) / 2;
            graphics.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        graphics.lineTo(points[points.length-1].x,points[points.length-1].y)

        graphics.moveTo(points[0].x,points[0].y);
        graphics.lineStyle(4,colourInner)
        for(var i =1;i<points.length-1;i++) {
            var xc = (points[i].x + points[i + 1].x) / 2;
            var yc = (points[i].y + points[i + 1].y) / 2;
            graphics.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        graphics.lineTo(points[points.length-1].x,points[points.length-1].y)

        graphics.lineStyle(0,colourOuter)
        graphics.beginFill(colourOuter);
        graphics.drawCircle(points[0].x,points[0].y,5)
        graphics.drawCircle(points[points.length-1].x,points[points.length-1].y,5)
        graphics.endFill();

        // score texture
        this.renderTexture = $engine.createManagedRenderable(this, PIXI.RenderTexture.create(816,624));

        // mask texture (for line itself)
        this.renderTextureClean1 = $engine.createManagedRenderable(this, PIXI.RenderTexture.create(816,624));

        // mask texture (for water)
        this.renderTextureClean2 = $engine.createManagedRenderable(this, PIXI.RenderTexture.create(816,624));

        // temp result texture (for calculating score)
        this.renderTextureResult = $engine.createManagedRenderable(this, PIXI.RenderTexture.create(816,624));

        // used to clear the pixel buffer
        var whiteGraphics = new PIXI.Graphics();
        whiteGraphics.beginFill(0xffffff);
        whiteGraphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY());
        whiteGraphics.endFill();

        var blackGraphics = new PIXI.Graphics();
        blackGraphics.beginFill(0);
        blackGraphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY());
        blackGraphics.endFill();

        // render the line to the render tex
        $engine.getRenderer().render(graphics,this.renderTexture,false,null,false);

        // set up our masks
        $engine.getRenderer().render(whiteGraphics,this.renderTextureClean1,false,null,false);
        $engine.getRenderer().render(blackGraphics,this.renderTextureClean2,false,null,false);

        // delete the temporary graphics
        $engine.freeRenderable(graphics);
        $engine.freeRenderable(whiteGraphics);
        $engine.freeRenderable(blackGraphics);

        this.sprite = $engine.createRenderable(this, new PIXI.Sprite(this.renderTexture));
        this.maskSprite = $engine.createRenderable(this, new PIXI.Sprite(this.renderTextureClean1));
        this.sprite.mask = this.maskSprite;

        this.waterMaskSprite = $engine.createRenderable(this, new PIXI.Sprite(this.renderTextureClean2));
        this.waterSprite = $engine.createRenderable(this, new PIXI.extras.TilingSprite($engine.getTexture("water_tile"),816,624))
        this.waterSprite.anchor.set(0)
        this.waterSprite.mask=this.waterMaskSprite;

        this.calculateBaseline(this.renderTexture);
    }

    calculateBaseline(renderTexture) {
        var pixels = $engine.getRenderer().plugins.extract.pixels(renderTexture);
        var baseline = 0;
        for(var yy = 0;yy<624;yy++) {
            for(var xx = 0;xx<816;xx++) {
                baseline += pixels[(xx + yy*816)<<2] // count the number of pixels in terms of how grey they are.
            }
        }
        this.baselineScore = baseline;
    }

    calculateScore() {
        $engine.getRenderer().render(this.sprite,this.renderTextureResult,false,null,false); // render the result to the temp render tex
        var pixels = $engine.getRenderer().plugins.extract.pixels(this.renderTextureResult);
        var count = 0;
        for(var yy = 0;yy<624;yy++) {
            for(var xx = 0;xx<816;xx++) {
                count += pixels[(xx + yy*816)<<2] // count the number of pixels in terms of how grey they are.
            }
        }
        this.percentCleaned = 1 - (count / this.baselineScore);
        console.log("Score"+String(this.percentCleaned*100)+"% ("+String(count)+" missed)")
    }
}