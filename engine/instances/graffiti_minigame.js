class GraffitiMinigameController extends MinigameController { // controls the minigame
    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.GRAFFITI)
        super.onEngineCreate();
        this.instructiontext = $engine.createRenderable(this,new PIXI.Text("WAIT! " + String(60), $engine.getDefaultSubTextStyle()),false);
        this.instructiontext.anchor.x=0.5
        this.instructiontext.x = $engine.getWindowSizeX()/2;
        this.instructiontext.y = $engine.getWindowSizeY()-80;

        new ParallaxingBackground("background_wall_1");

        this.totalScore = 0;
        this.lastScore = 0;

        var text = new PIXI.Text("Use the left and right movement keys to\nchange the direction of the sponge.\n"
            + "Scrub off all the graffiti\n\nYou must clean at least 85/100 of all the graffiti on the wall.\n"
            + "Each graffiti gets its own timer.\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.setControls(true,false);
        this.setCheatTooltip("Zoom zoom zoom zoom zoom!");
        this.skipPregame();

        this.reloadDrawings();
        this.graphicInd=-1;
        this.totalGraphics = this.images.length
        this.currentGraphic = undefined;
        this.targetTime = -1;

        this.averageScoreTotal = 0;
        this.countedScores = 0;

        this.winThreshold = 0.85; // 85%

        this.maxAllowedTime = 3600;

        this.timeToNextDroplet = EngineUtils.irandomRange(6,12);
        this.timeToNextBubble = EngineUtils.irandomRange(6,12);
        this.dropletContainer = $engine.createManagedRenderable(this, new PIXI.Sprite(PIXI.Texture.EMPTY))

        this.isWaiting = true;
        this.waitTimer = 60;

        this.currentTurnSpeed = 0;

        this.baseSpeed = 2;
        this.baseTurnRate = Math.PI/256; // 64 frames to turn around

        this.bufferTime = $engine.hasItem(ENGINE_ITEMS.BRICK_LAYER) ? 60 : 0; // extra second if you have brick layer.
        this.nextImageWaitTimer=99999;

        this.cheatFactor = 1;

        this.addOnCheatCallback(this, function(self) {
            self.cheatFactor = 3; // ZOOM ZOOM ZOOM
            self.currentTurnSpeed=0;
        })

        this.addOnGameStartCallback(this, function(self) {
            this.waitTimer = 0;
            $engine.audioPlaySound("draw_start")
        })

        this.setupControllerGraphics();

        this.arrowGraphic = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("arrow")))
        this.depth = -1;


        $engine.setCeilTimescale(true)
        this.nextGraphic();

        this.startTimer(this.targetTime)
        this.getTimer().pauseTimer();
        this.setPreventEndOnTimerExpire(true); // take direct control using below function
        this.getTimer().addOnTimerStopped(this, function(self) {
            self.onImageComplete();
        })
        this.getTimer().setWarningTime(3*60); // 3 seconds.
        this.wobble();

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
        this.nextImageWaitTimer = 140;
        this.waitTimer=this.maxAllowedTime
        this.images[this.graphicInd].calculateScore()
        IM.destroy(Droplet)
        IM.destroy(BubbleParticle)
        $engine.audioStopSound("graffiti_wipe");
        this.isWaiting=true;
        this.checkCanWin();
    }

    checkCanWin() {
        if(this.totalGraphics - this.graphicInd===1)
            return; // last drawing
        var test = this.averageScoreTotal;
        test+= this.totalGraphics - this.graphicInd-1;
        test/=this.totalGraphics;
        if(test<0.5) { // if the best score they could get at this point (i.e. they ace all subsequent ones) is < 0.5, just end early.
            this.endMinigame(false);
            this.setLossReason("Now that's just a sad display.")
        }
    }

    finishMinigame() {
        var won = this.averageScoreTotal/this.countedScores>=this.winThreshold;
        if(this.averageScoreTotal/this.countedScores >= 0.999){
            $engine.activateAchievement("CLEAN_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
        }
        if(!won) {
            var wonDrawing = $engine.getSaveData().drawingMinigameResult; // whether they won drawing minigame v1 or not
            if(wonDrawing === undefined)
                wonDrawing = true;
            if(!wonDrawing) // they lost drawing last time
                this.setLossReason("Try following the lines next t- Really? Again??")
            else
                this.setLossReason("Try following the lines next time")
        }
        this.endMinigame(won);
    }

    getLastScore() {
        return this.lastScore;
    }

    onCreate() {
        this.onEngineCreate();
    }

    reloadDrawings() {
        var data = $engine.getSaveData().drawingMinigameLines;
        var offset = [false,false,false]; // the source drawings are centered at 0,0. But user drawings are centered at the center of the screen.
        if(!data) { // player didn't play drawing minigame day 0
            offset = [true,true,true];
            data = [];
            var rand = [0,1,2,3,4,5]; // pick 3 random drawings
            EngineUtils.shuffleArray(rand);
            for(var i =0;i<3;i++) {
                data.push({
                    line:ShapeToDraw.paths[rand[i]].path,
                    distance:ShapeToDraw.paths[rand[i]].dist
                })
            }
        } else {
            // acquire the drawing minigame data
            data = data.data;

            // fill in blanks, if applicable
            for(var i=0;i<3;i++) {
                if(data[i].distance===-1) { // player missed that drawing, fill in the blanks with the source
                    var sourceIndex = data[i].index;
                    data[i].line = ShapeToDraw.paths[sourceIndex].path
                    data[i].distance = ShapeToDraw.paths[sourceIndex].dist
                    offset[i] = true;
                }
            }
        }
        this.images = [];
        for(var i=0;i<3 && data[i].distance!==-1;i++) {
            this.images.push(new ShapeToClean(data[i],offset[i]))
            this.totalGraphics=i+1;
        }
    }

    nextGraphic() {
        this.graphicInd++;
        if(this.graphicInd>=this.totalGraphics) {
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
        this.isWaiting=true;
        this.waitTimer=0;

        if(this.graphicInd>=this.totalGraphics-1) {
            this.done = true;
        }

        this.targetTime = this.currentGraphic.getDistance() / this.baseSpeed + this.bufferTime; // time to clean + buffer.
        if(this.targetTime>this.maxAllowedTime)
            this.targetTime=this.maxAllowedTime;

        if(this.graphicInd!==0) // pick up at game start
            $engine.audioPlaySound("draw_start")
        
        var loc = this.currentGraphic.getStartLocation();
        this.x = loc.x + $engine.getWindowSizeX()/2;
        this.y = loc.y + $engine.getWindowSizeY()/2;
        this.currentDirection = this.currentGraphic.getStartAngle();
        this.currentTurnSpeed = 0;
        this.updateArrow();
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
                if(this.waitTimer===61)
                    $engine.audioPlaySound("graffiti_wipe",1,true);
                this.isWaiting=false;
                this.getTimer().unpauseTimer();
                this.instructiontext.text = "GO!!!!"
                this.instructiontext.alpha = 1-(this.waitTimer-60)/40 + Math.sin(this.waitTimer/2)/2
            }
        } else if(this.waitTimer > this.maxAllowedTime){
            var score = this.getLastScore()*100;
            this.instructiontext.text = "Percent cleaned: "+String(score).substring(0,4)
                 + "\nCurrent average score: "+String(this.averageScoreTotal/this.countedScores*100).substring(0,4);
            this.instructiontext.alpha = 1;
        }

        this.wobble();
            this.updateArrow()

        if(!this.isWaiting) {
            this.handleMove();
            this.handleDroplets();
            this.handleBubbles();
            this.renderToMasks();
        }
        this.awaitNextImage();
    }

    awaitNextImage() {
        if(--this.nextImageWaitTimer<=0) {
            if(!this.done) {
                this.nextGraphic();
                this.getTimer().restartTimer(this.targetTime)
                this.getTimer().pauseTimer();
            } else {
                this.finishMinigame();
            }
            this.nextImageWaitTimer=99999;
        }
    }

    handleDroplets() {
        if(--this.timeToNextDroplet<=0) {
            this.timeToNextDroplet = EngineUtils.irandomRange(6,12);
            new Droplet(this.x+EngineUtils.randomRange(-12,12),this.y+EngineUtils.randomRange(-12,12));
        }
    }

    handleBubbles() {
        if(--this.timeToNextBubble<=0) {
            this.timeToNextBubble = EngineUtils.irandomRange(8,24);
            new BubbleParticle(this.x+EngineUtils.randomRange(-12,12),this.y+EngineUtils.randomRange(-12,12));
        }
    }

    handleMove() {
        if(IN.keyCheck("RPGright")) {
            if(this.hasCheated()) {
                this.currentDirection+=this.baseTurnRate * 12; // direct
            } else {
                this.currentTurnSpeed+=this.baseTurnRate / 1.4;
            }
        }
        if(IN.keyCheck("RPGleft")) {
            if(this.hasCheated()) {
                this.currentDirection-=this.baseTurnRate * 12; // direct
            } else {
                this.currentTurnSpeed-=this.baseTurnRate / 1.4;
            }
        }
        this.currentDirection+=this.currentTurnSpeed;
        this.currentTurnSpeed*=0.94
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
        var fac = 0.6;
        if(this.hasCheated()) {
            fac = 1;
        }
        this.xScale = fac+Math.sin($engine.getGameTimer()/13)/12;
        this.yScale = fac+Math.sin($engine.getGameTimer()/13+10)/12;
        this.angle = Math.cos($engine.getGameTimer()/16)/8;
    }

    notifyFramesSkipped(frames) {
        //do nothing.
    }

    draw(gui, camera) {
        super.draw(gui, camera);
        $engine.requestRenderOnCamera(this.instructiontext);
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

    notifyScore(score) {
        this.lastScore = score;
        this.averageScoreTotal += score;
        this.countedScores++;
    }

}

class BubbleParticle extends EngineInstance {

    onCreate(x,y) {
        this.x = x;
        this.startX = x;
        this.y = y;
        this.animation = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite($engine.getAnimation("bubble_animation"),false),true);
        this.animation.animationSpeed = 0.1;
        this.rand1 = EngineUtils.random(20); // offset into frame period
        this.rand2 = EngineUtils.randomRange(20,45); // frame period
        this.rand3 = EngineUtils.randomRange(6,24); // how much to wobble

        this.dy = EngineUtils.randomRange(-2,-1);

        this.lifeTime = EngineUtils.irandomRange(60,180)
        this.lifeTimer=0;

        var randSize = EngineUtils.randomRange(0.1,0.5);
        this.xScale = randSize
        this.yScale = randSize
    }

    step() {
        this.animation.update(1);


        var startFac = EngineUtils.interpolate(this.lifeTimer/24,0,1,EngineUtils.INTERPOLATE_OUT_QUAD);
        this.y+=this.dy;
        this.x = this.startX + Math.sin((this.lifeTimer + this.rand1)/this.rand2) * this.rand3 * startFac;

        var endFac = EngineUtils.interpolate((this.lifeTimer-this.lifeTime+30)/30,1,0,EngineUtils.INTERPOLATE_OUT);
        this.alpha = endFac;
        if(this.lifeTimer > this.lifeTime)
            this.destroy();

        this.lifeTimer++;
    }

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

    onCreate(data, useOffset) {
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

        this.createImages(data.line, useOffset);

        this.setVisible(false);

        if(!useOffset) {
            this.startLocation.x-=$engine.getWindowSizeX()/2;
            this.startLocation.y-=$engine.getWindowSizeY()/2;
        }
        
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

    createImages(points, useOffset) {
        var graphics = new PIXI.Graphics();
        var colourOuter = 0xdfdfdf
        var colourInner = 0xbfbfbf


        if(useOffset) {
            graphics.x = $engine.getWindowSizeX()/2;
            graphics.y = $engine.getWindowSizeY()/2;
        }

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
        GraffitiMinigameController.getInstance().notifyScore(this.percentCleaned);
    }
}