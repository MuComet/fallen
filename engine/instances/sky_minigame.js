class SkyMinigameController extends MinigameController { // All classes that can be added to the engine MUST extend EngineInstance

    onEngineCreate() { // called when the instance is made from a room.
        $engine.unlockMinigame(ENGINE_MINIGAMES.SKYBUILD)
        super.onEngineCreate();
        SkyMinigameController.score = 0;
        SkyMinigameController.nextBlock = 0;
        SkyMinigameController.timer = 20;
        SkyMinigameController.endTime = 20;
        SkyMinigameController.pCamY = 0;
        SkyMinigameController.nCamY = 0;
        SkyMinigameController.iBuffer = undefined
        SkyMinigameController.maxScore = 24;

        new SkyBuildPlayer($engine.getWindowSizeX()/2,0,0);
        new FallingTowerPlatform($engine.getWindowSizeX()/2,$engine.getWindowSizeY()-50);
        //$engine.setBackgroundColour(12067);
        $engine.setBackgroundColour(0xa58443);
        SkyMinigameController.iBuffer = new BufferedKeyInput('Space',2);

        this.achievement = true;
        this.startTimer(5*60);
        this.getTimer().setWarningTime(2*60); // last 2 seconds

        //SkyMinigameController.minigameTimer = new MinigameTimer(60*5);
        /*SkyMinigameController.minigameTimer.addOnTimerStopped(this, function(parent, bool) {
            if(bool)
                $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS);
            else {
                $engine.setOutcomeWriteBackValue(ENGINE_RETURN.WIN);
            }
            AudioManager.fadeOutBgm(1)
            $engine.startFadeOut(30,false)
            $engine.endGame();
        })*/

        new ParallaxingBackground();

        // instructions

        var text = new PIXI.Text("Press the SPACE key to drop the swinging slabs.\n Drop each slab within 5 seconds.\n Only the highest tower slab can be stacked on.\n Reach the goal height.\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle())
        this.setInstructionRenderable(text);
        this.setControls(true,false);
        this.skipPregame();

        this.setCheatTooltip("Magnetic sand!")

        // progress
        this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;
        this.updateProgressText();

        this.addOnGameEndCallback(this,function(self) {
            self.setLossReason("You're supposed to drop the block, not watch it.")
        })
    } 

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames)
    }

    updateProgressText() {
        this.progressText.text = "Progress: "+String(SkyMinigameController.score+" / "+String(SkyMinigameController.maxScore))
    }

    onCreate() { // called when you construct the instance yourself
        this.onEngineCreate();
        super.onCreate();
    }

    step() {
        super.step();
        var timer = SkyMinigameController.timer;
        var endTime = SkyMinigameController.endTime;
        if(timer<=endTime) { 
            var camera = $engine.getCamera()
            camera.setY(EngineUtils.interpolate(timer/endTime,SkyMinigameController.pCamY,SkyMinigameController.nCamY,EngineUtils.INTERPOLATE_OUT_BACK));
            var fac = EngineUtils.interpolate(timer/endTime,1,0,EngineUtils.INTERPOLATE_OUT_QUAD);
            camera.setRotation(EngineUtils.randomRange(-0.01,0.01)*fac)
            camera.setLocation(EngineUtils.irandomRange(-2,2) * fac, camera.getY() + EngineUtils.irandomRange(-2,2) * fac)
        }
        SkyMinigameController.timer++;
    }

    draw(gui,camera) {
        super.draw(gui,camera)
        $engine.requestRenderOnCameraGUI(this.progressText);
    }

    onDestroy() {
        super.onDestroy();
        SkyMinigameController.iBuffer.destroy();
    }
}

class SkyBuildPlayer extends EngineInstance {

    onCreate(x,y,speed) {
        this.x = x;
        this.y = y;
        this.yStart = y;
        this.xStart = x;
        this.speed = speed;
        this.activated = true;
        this.nextnext = IM.find(SkyBuildPlayer, SkyMinigameController.nextBlock);
        this.setSprite(new PIXI.Sprite($engine.getTexture("falling_tower_1")))
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-43,2,43,100));
        this.dropping = false;
        this.randomOffset = EngineUtils.irandom(120);
        this.swingMove();
        this.shakeTimer = 0;
        this.shakeTime = 12;
        this.dropX = 0;
        this.dropY = 0;
        this.dropAngle = 0;
        this.dropTimer=0;
        this.dropFadeTime = 24;
        this.lastX = 0;
        this.lastDir = 0;
        this.fallPlayed = false;
        this.targetXDiff = 0;
        this.maxCorrection = 56;
        for(var i =0;i<1000;i++) {
            this.registerInterpolationVariable("x","xInterp");
            this.registerInterpolationVariable("y","yInterp");
        }
    }

    swingMove() {
        var sin = Math.sin($engine.getGameTimer()/EngineUtils.clamp(24-SkyMinigameController.score,5,24) + this.randomOffset);
        this.angle = -sin/2;
        var angle2 = Math.PI*3/2+sin/2;
        this.lastX=this.x;
        this.x = this.xStart + V2D.lengthDirX(angle2,300);
        this.y = this.yStart + V2D.lengthDirY(angle2,300);

        
        this.lastDir = this.dir;
        this.dir = Math.sign(this.lastX - this.x);
        if(this.dir===0)
            this.dir = -this.lastDir;

        if(this.lastDir!==this.dir) {
            if(this.dir===-1) {
                $engine.audioPlaySound("sky_woosh_1")
            } else {
                $engine.audioPlaySound("sky_woosh_2")
            }
        } 
    }

    step() {
        if(this.y>$engine.getWindowSizeY()+100) {
            this.destroy();
        }

        if(this.activated && this.y > $engine.getCamera().getY()+$engine.getWindowSizeY() && ! this.fallPlayed) {
            $engine.audioPlaySound("sky_fall"); // hehe
            this.fallPlayed = true;
        }

        if(!this.dropping) {
            this.swingMove();
        } else {
            if(this.shakeTimer>this.shakeTime) {
                this.dropTimer = EngineUtils.clamp(this.dropTimer+1,0,this.dropFadeTime);
                this.angle = 0;
                this.y+=EngineUtils.interpolate(this.dropTimer/this.dropFadeTime,0,this.speed,EngineUtils.INTERPOLATE_IN_BACK);
                if(this.activated)
                    this.speed+=0.5;
            } else {
                var fac = this.shakeTimer/this.shakeTime; // % way through shake.
                this.angle = EngineUtils.interpolate(fac,this.dropAngle,0,EngineUtils.INTERPOLATE_OUT) + EngineUtils.randomRange(-0.125,0.125)*(1-fac);
                var offset = 0;
                if(SkyMinigameController.getInstance().hasCheated()) {
                    SkyMinigameController.getInstance().achievement = false;
                    offset = EngineUtils.interpolate(fac,0,this.targetXDiff, EngineUtils.INTERPOLATE_OUT_QUAD)
                }
                this.x = this.dropX + EngineUtils.randomRange(-18,18) * (1-fac) + offset;
                this.y = this.dropY + EngineUtils.randomRange(-18,18) * (1-fac)
                this.shakeTimer++;
            }
        }
        var consume = SkyMinigameController.iBuffer.consume()

        if(this.activated == true && !this.dropping && consume) {
            this.dropping = true;
            this.speed+=20 + SkyMinigameController.score/8;
            this.dropX = this.x;
            this.dropY = this.y;
            this.dropAngle = this.angle
            SkyMinigameController.getInstance().getTimer().pauseTimer();
            $engine.audioPlaySound("sky_wobble");
            this.targetXDiff = EngineUtils.clamp(this.nextnext.x-this.x,-this.maxCorrection,this.maxCorrection);
        }


        if(SkyMinigameController.score >= 1 && this.activated){
            var tower = IM.instancePlace(this,this.x,this.y,this.nextnext);
            if(tower) { // don't use 'in', use 'of'
                if(tower.activated === false){
                    if(SkyMinigameController.getInstance().getTimer().getTimeRemaining() < 60){
                        SkyMinigameController.getInstance().achievement = false;
                    }
                    SkyMinigameController.getInstance().getTimer().setTimeRemaining(60*5)
                    SkyMinigameController.getInstance().getTimer().unpauseTimer();
                    SkyMinigameController.score+= 1;
                    SkyMinigameController.getInstance().updateProgressText();
                    this.speed = 0;
                    this.activated = false;
                    SkyMinigameController.nextBlock += 1;
                    this.y = tower.hitbox.getBoundingBoxTop()-100;
                    tower.getSprite().tint = 0x444444;
                    $engine.audioPlaySound("sky_land");
                    SkyMinigameController.timer=0;
                    if(SkyMinigameController.score>=3){
                        SkyMinigameController.endTime = EngineUtils.clamp(SkyMinigameController.endTime-1,10,20);
                        SkyMinigameController.pCamY=$engine.getCamera().getY();
                        SkyMinigameController.nCamY = -100 * (SkyMinigameController.score-3)-100;
                    }
                    if(SkyMinigameController.score>=SkyMinigameController.maxScore) {
                        if(SkyMinigameController.getInstance().achievement){
                            $engine.activateAchievement("SAND_CASTLE_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
                        }
                        SkyMinigameController.getInstance().getTimer().stopTimer();
                        SkyMinigameController.nCamY = SkyMinigameController.pCamY;
                    } else {
                        new SkyBuildPlayer($engine.getWindowSizeX()/2,64 - 100 * SkyMinigameController.score,0);
                    }

                    /*var bb1 = tower.hitbox.getBoundingBox();
                    var bb2 = this.hitbox.getBoundingBox();

                    bb2.x1 = Math.max(bb1.x1,bb2.x1)
                    bb2.x2 = Math.min(bb1.x2,bb2.x2)

                    this.hitbox.setHitbox(new RectangeHitbox(this,bb2.x1-this.x,bb2.y1-this.y,bb2.x2-this.x,bb2.y2-this.y))*/
                }
            }
        }
    }

    onDestroy() {
        SkyMinigameController.getInstance().getTimer().expire();
        SkyMinigameController.getInstance().setLossReason("Nice aim.")
    }

    draw(gui, camera) {     
        //EngineDebugUtils.drawHitbox(camera,this)
        if(this.activated && !this.dropping) {
            camera.lineStyle(5,0x00).moveTo(this.xInterp,this.yInterp).lineTo($engine.getWindowSizeX()/2,this.yStart);
        }

    }
}



class FallingTowerPlatform extends SkyBuildPlayer {

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        
        this.setSprite(new PIXI.Sprite($engine.getTexture("sky_platform")));
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-150,10,150,35));
    }

    step() { 
        if(SkyMinigameController.score < 1){
            var towers = IM.instanceCollisionList(this,this.x,this.y,SkyBuildPlayer);
            for(const tower of towers) { // don't use 'in', use 'of'
                if(tower.activated == true){
                    if(SkyMinigameController.getInstance().getTimer().getTimeRemaining() < 60){
                        SkyMinigameController.getInstance().achievement = false;
                    }
                    SkyMinigameController.getInstance().getTimer().setTimeRemaining(60*5)
                    SkyMinigameController.getInstance().getTimer().unpauseTimer();
                    SkyMinigameController.score+= 1;
                    SkyMinigameController.getInstance().updateProgressText();
                    SkyMinigameController.timer=0;
                    $engine.audioPlaySound("sky_land");
                    tower.speed = 0;
                    tower.activated = false;
                    new SkyBuildPlayer($engine.getWindowSizeX()/2,64 - 100 * SkyMinigameController.score,0);
                    tower.y = this.hitbox.getBoundingBoxTop()-100;
                    this.getSprite().tint = 0x444444;
                }
            }
        }
  
    }
}