class UmbrellaMinigameController extends MinigameController {
    onEngineCreate() {
        super.onEngineCreate();


        this.audioReference = $engine.generateAudioReference("Minigame-001");
        AudioManager.playBgm(this.audioReference);
        AudioManager.fadeInBgm(1);

        this.score = 7500;
        this.scoreText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        this.scoreText.anchor.set(0.5,0.5);
        this.scoreText.x = $engine.getWindowSizeX()/2;
        this.scoreText.y = $engine.getWindowSizeY()-30;
        $engine.createManagedRenderable(this,this.scoreText);
        this.updateScoreText();

        // instructions
        var text = new PIXI.Text("Left and Right arrow keys to move,\n don't touch the rain!\n\nPress Enter to cheat!",{fontFamily: 'GameFont',
                        fontSize: 50, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 })
        this.setInstructionRenderable(text)

        new Man($engine.getWindowSizeX()/2,$engine.getWindowSizeY())
        new Umbrella($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/1.4);

        this.timer = new MinigameTimer(60*60);
        this.timer.addOnTimerStopped(this,function(parent,expired) {
            if(!expired)
                $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS)
            else   
                $engine.setOutcomeWriteBackValue(ENGINE_RETURN.WIN)

            AudioManager.fadeOutBgm(1)
            $engine.startFadeOut(30,false)
            $engine.endGame();
            $engine.pauseGame();
        })
        this.timer.setSurvivalMode();
        $engine.setBackgroundColour(0x080820)
    }

    decrementScore() {
        if(this.timer.stopped())
            return;
        this.score--;
        if(this.score<=0) {
            this.score = 0;
            if(!this.timer.stopped())
                this.timer.stopTimer();
        }
        this.updateScoreText();
    }

    updateScoreText() {
        this.scoreText.text = "Life: "+String(this.score);
    }

    onCreate() {
        throw new Error("Do not instantiate this class outside of a room.")
    }

    draw(gui,camera) {
        super.draw(gui,camera);
        $engine.requestRenderOnGUI(this.scoreText);
    }

}

class Man extends InstanceMover {
    onEngineCreate() {
        super.onEngineCreate();
        this.dx=0;
        this.hitbox = new Hitbox(this, new RectangeHitbox(this,-32,-128,32,0))
        this.setSprite(new PIXI.Sprite($engine.getTexture("man")))
        this.maxVelocity=14;
        this.turnLagStop=5;
        this.turnLag=1;
        this.hasBeenHurt=false;
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {
        this.hasBeenHurt=false;
        super.step();
        var accel = [0,0]
        if(IN.keyCheck('ArrowRight')) {
            accel[0]+=1.6;
        }
        if(IN.keyCheck('ArrowLeft')) {
            accel[0]-=1.6;
        }

        this.move(accel,this.vel);

        /*$engine.getCamera().setScaleX($engine.getCamera().getScaleX()-IN.getWheel()/1000);
        
        if(IN.mouseCheck(0)) {
            var dx = IN.getMouseXGUI()-this.lmx;
            var dy = IN.getMouseYGUI()-this.lmy;
            this.filter.velocity = [-dx,-dy]
            $engine.getCamera().translate(-dx,-dy)
        }

        if(IN.keyCheckPressed("ShiftLeft")) {
            $engine.removeFilter(this.filter)
        }
        if(IN.keyCheckPressed("ShiftRight")) {
            $engine.removeFilter(this.filter2)
        }*/

        this.lmx = IN.getMouseXGUI();
        this.lmy = IN.getMouseYGUI();

        //console.log(IN.getMouseX(),IN.getMouseY(), $engine.getCamera().getX(), $engine.getCamera().getY());
    }

    canControl() {
        return true;
    }

    collisionCheck(x,y) {
        return x < 0 || x > $engine.getWindowSizeX();
    }

    preDraw() {
        if(this.hasBeenHurt) {
            this.getSprite().tint = 0xff0000;
        } else {
            this.getSprite().tint = 0xffffff;
        }
    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}

class Umbrella extends EngineInstance {
    onEngineCreate() {
        this.xScale=3;
        this.yScale=3;
        this.timer = 90;
        this.endTime = 75;
        this.rx = this.x;
        this.ry = this.y;
        this.sx = this.x;
        this.sy = this.y;
        this.dx = 0;
        this.dy = 0;
        this.setHitbox(new Hitbox(this,new PolygonHitbox(this,new Vertex(-32,-6),new Vertex(32,-6),new Vertex(32,-13),
            new Vertex(16,-27),new Vertex(0,-29),new Vertex(-16,-27),new Vertex(-32,-13))));
        this.setSprite(new PIXI.Sprite($engine.getTexture("umbrella")))
        this.depth = -1;
        this.wide = 4.5;
        this.wideTimer = 0;
        this.endWideTime = 30;

        this.fake = false;
        this.fakeTime = 0;
        this.fakeTimer = 0;
        this.hasFaked = false;
        this.fakeX = 0;
        this.fakeY = 0;
        this.timesSinceLastFake=0;
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    findNewLocation() {
        do {
            this.rx = EngineUtils.randomRange(32,$engine.getWindowSizeX()-32);
        } while(Math.abs(this.rx-this.x)<$engine.getWindowSizeX()/4) // must be at least 1/4 of the screen
        // rx can be no greater than 66% of the screen
        this.rx = EngineUtils.clamp(this.rx,this.x-$engine.getWindowSizeX()/2,this.x+$engine.getWindowSizeX()/1.5)
        this.ry = EngineUtils.randomRange(200+5*(this.endTime-15),264+5*(this.endTime-15));
        
        this.sx = this.x;
        this.sy = this.y;
    }

    step() {
        this.angle = EngineUtils.clamp(this.dx/64,-Math.PI/4,Math.PI/4)
        for(var i =0;i<EngineUtils.clamp(-(this.endTime-75)/2,1,12);i++)
            new Raindrop(EngineUtils.randomRange(-100,800),-64);
        this.timer++;
        if(this.timer>this.endTime*2) {
            this.timer=0;
            this.endTime = EngineUtils.clamp(this.endTime-2,25,90)

            this.fake = (this.timesSinceLastFake > 8 || EngineUtils.random(1)<=0.125) && !UmbrellaMinigameController.getInstance().hasCheated(); // 10% chance for the umbrella to "fake"
            if(this.fake) {
                this.fakeTime = EngineUtils.irandomRange(this.endTime/3,this.endTime/2);
                this.hasFaked = false;
                this.fakeTimer = 0;
                this.timesSinceLastFake=0;
            } else {
                this.timesSinceLastFake++;
            }
            this.findNewLocation();
            
        }
        if(this.timer<=this.endTime) {
            var lx = this.x, ly = this.y;
            if(!this.fake) {
                this.x = EngineUtils.interpolate(this.timer/this.endTime,this.sx,this.rx,EngineUtils.INTERPOLATE_SMOOTH)
                this.y = EngineUtils.interpolate(this.timer/this.endTime,this.sy,this.ry,EngineUtils.INTERPOLATE_SMOOTH)
            } else {
                var giveUp = 0;
                var maxTries = 200; // edge case that the umbrella is as far to one side as it can be.
                var diff = Math.sign(this.x-this.rx)
                var srx = this.rx
                var sry = this.ry;
                var ssx = this.sx
                var ssy = this.sy
                if(this.timer===this.fakeTime && !this.hasFaked) {
                    while(Math.sign(this.x-this.rx) === diff && giveUp++ < maxTries)
                        this.findNewLocation();
                    if(giveUp>=maxTries) { // undo our changes
                        this.fake = false;
                        this.rx = srx;
                        this.sx = ssx;
                    } else {
                        this.hasFaked=true;
                        this.fakeX = this.x;
                        this.fakeY = this.y;
                    }
                    this.ry = sry // keep the old y location though
                    this.sy = ssy;
                }
                if(this.hasFaked && this.fakeTimer<=24) {
                    this.getSprite().tint = 0xff0000;
                    this.fakeTimer++;
                    this.timer--;
                    this.x = this.fakeX+EngineUtils.randomRange(-24+this.fakeTimer,24-this.fakeTimer)
                    this.y = this.fakeY+EngineUtils.randomRange(-24+this.fakeTimer,24-this.fakeTimer)
                } else {
                    this.getSprite().tint=0xffffff;
                    if(this.timer>=this.fakeTime && this.fake) { // as if it wasn't hard enough
                        this.x = EngineUtils.interpolate((this.timer-this.fakeTime)/(this.endTime-this.fakeTime),this.sx,this.rx,EngineUtils.INTERPOLATE_OUT_QUAD)
                        this.y = EngineUtils.interpolate((this.timer-this.fakeTime)/(this.endTime-this.fakeTime),this.sy,this.ry,EngineUtils.INTERPOLATE_OUT_QUAD)
                    } else {
                        this.x = EngineUtils.interpolate(this.timer/this.endTime,this.sx,this.rx,EngineUtils.INTERPOLATE_SMOOTH)
                        this.y = EngineUtils.interpolate(this.timer/this.endTime,this.sy,this.ry,EngineUtils.INTERPOLATE_SMOOTH)
                    }
                }
                
            }

            this.dx = this.x - lx;
            this.dy = this.y - ly;
        }
        var controller = UmbrellaMinigameController.getInstance();
        if(controller.hasCheated() && this.wideTimer<=this.endWideTime) {
            this.xScale = EngineUtils.interpolate(this.wideTimer/this.endWideTime,3,this.wide,EngineUtils.INTERPOLATE_SMOOTH)
            this.yScale = EngineUtils.interpolate(this.wideTimer/this.endWideTime,3,this.wide,EngineUtils.INTERPOLATE_SMOOTH)
            this.wideTimer++;
        }
    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}

class Raindrop extends EngineInstance {

    onEngineCreate() {
        this.dx = EngineUtils.randomRange(0.2,0.8);
        this.dy = EngineUtils.randomRange(20,24);
        this.angle = V2D.calcDir(this.dx,this.dy)
        var dist = V2D.calcMag(this.dx,this.dy);
        this.xScale = EngineUtils.clamp(dist/6,0,2)
        this.hitbox = new Hitbox(this, new RectangeHitbox(this,0,-1,16,1))
        this.setSprite(new PIXI.Sprite($engine.getTexture("raindrop")))
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {
        this.x+=this.dx;
        this.y+=this.dy;
        if(this.y>=$engine.getWindowSizeY() || this.x<0 || this.x > 816 || IM.instanceCollision(this,this.x,this.y,Umbrella)) {
            this.destroy();
        }
        if(IM.instanceCollision(this,this.x,this.y,Man)) {
            UmbrellaMinigameController.getInstance().decrementScore();
            IM.find(Man,0).hasBeenHurt = true;
            this.destroy();
        }

    }

    draw(gui,camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}