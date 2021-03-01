class SkyMinigameController extends MinigameController { // All classes that can be added to the engine MUST extend EngineInstance

    onEngineCreate() { // called when the instance is made from a room.
        super.onEngineCreate();
        SkyMinigameController.score = 0;
        SkyMinigameController.nextBlock = 0;
        SkyMinigameController.timer = 20;
        SkyMinigameController.endTime = 20;
        SkyMinigameController.pCamY = 0;
        SkyMinigameController.nCamY = 0;
        SkyMinigameController.iBuffer = undefined
        SkyMinigameController.mingameTimer = undefined
        SkyMinigameController.maxScore = 32;

        new SkyBuildPlayer($engine.getWindowSizeX()/2,0,0);
        new FallingTowerPlatform($engine.getWindowSizeX()/2,$engine.getWindowSizeY()-50);
        //$engine.setBackgroundColour(12067);
        $engine.setBackgroundColour(0xa58443);
        SkyMinigameController.iBuffer = new BufferedKeyInput('Space',2);

        SkyMinigameController.mingameTimer = new MinigameTimer(60*5);
        SkyMinigameController.mingameTimer.addOnTimerStopped(this, function(parent, bool) {
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

        var text = new PIXI.Text("Press Space to drop a block\nPress Enter to cheat!",{ fontFamily: 'Helvetica',
                        fontSize: 50, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 })

        this.setInstructionRenderable(text)

        // progress
        this.progressText = new PIXI.Text("",{ fontFamily: 'Helvetica',
                    fontSize: 20, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 })
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;
        this.updateProgressText();

        this.seList = ["Bonk","Donk","Drill","Wobbly"];
        this.nextSoundTimer = 0;
        this.nextSoundRand = EngineUtils.irandomRange(60,150);

    } 

    notifyFramesSkipped(frames) {
        SkyMinigameController.mingameTimer.tickDown(frames)
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

        this.nextSoundTimer++; 
        if(this.nextSoundTimer>=this.nextSoundRand) {
            AudioManager.playSe($engine.generateAudioReference(this.seList[EngineUtils.irandom(3)]));
            this.nextSoundTimer=0;
            this.nextSoundRand = EngineUtils.irandomRange(60,150);
        }
    }

    draw(gui,camera) {
        super.draw(gui,camera)
        $engine.requestRenderOnGUI(this.progressText);
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
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-50,0,50,100));
        this.dropping=false;
        this.randomOffset = EngineUtils.irandom(120);
        this.swingMove();
        this.shakeTimer = 0;
        this.shakeTime = 12;
        this.dropX = 0;
        this.dropY = 0;
        this.dropAngle = 0;
        this.dropTimer=0;
        this.dropFadeTime = 24;
    }

    swingMove() {
        var controller = SkyMinigameController.getInstance();
        var val = controller.hasCheated() ? 0.5 : 1;
        var sin = Math.sin($engine.getGameTimer()/EngineUtils.clamp(32-SkyMinigameController.score * val,4,32) + this.randomOffset);
        this.angle = -sin/2;
        var angle2 = Math.PI*3/2+sin/2;
        this.x = this.xStart + V2D.lengthDirX(angle2,300);
        this.y = this.yStart + V2D.lengthDirY(angle2,300);
    }

    step() {
        if(this.y>$engine.getWindowSizeY()+100) {
            this.destroy();
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
                this.x = this.dropX + EngineUtils.randomRange(-18,18) * (1-fac)
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
            SkyMinigameController.mingameTimer.pauseTimer();
        }


        if(SkyMinigameController.score >= 1 && this.activated){
            var tower = IM.instancePlace(this,this.x,this.y,this.nextnext);
            if(tower) { // don't use 'in', use 'of'
                if(tower.activated == false){
                    SkyMinigameController.mingameTimer.setTimeRemaining(60*5)
                    SkyMinigameController.mingameTimer.unpauseTimer();
                    SkyMinigameController.score+= 1;
                    SkyMinigameController.getInstance().updateProgressText();
                    this.speed = 0;
                    this.activated = false;
                    SkyMinigameController.nextBlock += 1;
                    this.y = tower.hitbox.getBoundingBoxTop()-100;
                    tower.getSprite().tint = 0x444444;
                    SkyMinigameController.timer=0;
                    if(SkyMinigameController.score>=3){
                        SkyMinigameController.endTime = EngineUtils.clamp(SkyMinigameController.endTime-1,10,20);
                        SkyMinigameController.pCamY=$engine.getCamera().getY();
                        SkyMinigameController.nCamY = -100 * (SkyMinigameController.score-3)-100;
                    }
                    if(SkyMinigameController.score>=SkyMinigameController.maxScore) {
                        SkyMinigameController.mingameTimer.stopTimer();
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
        AudioManager.fadeOutBgm(1)
        $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS);
        $engine.startFadeOut(30,false)
        $engine.endGame();
    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(camera,this)
        if(this.activated && !this.dropping)
            camera.lineStyle(3,0xe74c3c).moveTo(this.x,this.y).lineTo($engine.getWindowSizeX()/2,this.yStart);

    }
}



class FallingTowerPlatform extends SkyBuildPlayer {

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        
        this.setSprite(new PIXI.Sprite($engine.getTexture("sky_platform")));
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-150,0,150,50));
    }

    step() {
        if(SkyMinigameController.score < 1){
            var towers = IM.instanceCollisionList(this,this.x,this.y,SkyBuildPlayer);
            for(const tower of towers) { // don't use 'in', use 'of'
                if(tower.activated == true){
                    SkyMinigameController.mingameTimer.setTimeRemaining(60*5)
                    SkyMinigameController.mingameTimer.unpauseTimer();
                    SkyMinigameController.score+= 1;
                    SkyMinigameController.getInstance().updateProgressText();
                    SkyMinigameController.timer=0;
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