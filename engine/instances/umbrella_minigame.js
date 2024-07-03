class UmbrellaMinigameController extends MinigameController {
    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.UMBRELLA)
        super.onEngineCreate();

        this.score = $engine.hasItem(ENGINE_ITEMS.CATNIP) ? 850 : 750;

        this.skipPregame();

        this.setControls(true,false);

        this.setCheatTooltip("That's one big umbrella!");


        var text = new PIXI.Text("Use movement keys to walk left and right.\n Avoid getting Cano Pe wet by staying under the umbrella! \n\nPress ENTER to cheat!", $engine.getDefaultTextStyle());

        this.setInstructionRenderable(text);

        this.player = new UmbrellaPlayer($engine.getWindowSizeX()/2,$engine.getWindowSizeY()-32);
        this.umbrella = new Umbrella($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/1.6-32);

        var bg = new ParallaxingBackground("background_sheet_2");

        bg.applyToAll(x=> x.tint = 0x95aac0);
        bg.removeIndex(1) // delete the clouds

        this.startTimer(60*60);
        this.getTimer().setSurvivalMode();
        $engine.setBackgroundColour(0x080820)

        this.setupBGS();
        this.bgsTimer = 0;
        this.bgsFadeTime = 30;

        this.scoreBar = new ProgressBar(this.score, ProgressBar.HEALTH, true);
        this.scoreBar.setFloatingFactor(0.1);
        var container = this.scoreBar.getContainer();
        container.x = $engine.getWindowSizeX()/2;
        container.y = 80;
        container.scale.set(0.5)
        this.scoreBar.setAutoText(false);
        this.scoreBar.setText("");
    }

    setupBGS() {
        this.rainSound1 = $engine.audioPlaySound("umbrella_rain_1",1.25,true);
        this.rainSound2 = $engine.audioPlaySound("umbrella_rain_2",1.25,true);
        $engine.audioSetVolume(this.rainSound1, 0);
        $engine.audioPauseSound(this.rainSound1);
        $engine.audioPauseSound(this.rainSound2);
        this.addOnGameEndCallback(this,function(self) {
            $engine.audioFadeSound(self.rainSound1,60);
            $engine.audioFadeSound(self.rainSound2,60);
        })
        this.addOnGameStartCallback(this,function(self) {
            $engine.audioResumeSound(self.rainSound1);
            $engine.audioResumeSound(self.rainSound2);
            $engine.audioFadeInSound(self.rainSound2,30);
        })
    }

    step() {
        super.step();
        if(this.minigameOver()){
            if(!this.hasCheated() && this.score>=150){
                greenworks.activateAchievement("UMBRELLA_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            return;
        }
        this.bgsTick();
        /*if(IN.mouseCheckPressed(0)) {
            new Test(IN.getMouseX(), IN.getMouseY());
        }*/
        $engine.getCamera().setX(-($engine.getWindowSizeX()/2-this.player.x)/4)
        this.scoreBar.setTextTint(0xffffff);
    }

    bgsTick() {
        var dx = this.umbrella.x - this.player.x;
        if(Math.abs(dx)>64 * (this.hasCheated() ? 1.5 : 1)) {
            this.bgsTimer++;
        } else {
            this.bgsTimer--;
        }
        this.bgsTimer = EngineUtils.clamp(this.bgsTimer,0,this.bgsFadeTime);
        var fac = this.bgsTimer/this.bgsFadeTime;
        $engine.audioSetVolume(this.rainSound1,0.25+fac*0.75);
        $engine.audioSetVolume(this.rainSound2,1-fac);
    }

    decrementScore() {
        if(this.minigameOver())
            return;
        this.score--;
        if(this.score<=0) {
            this.score = 0;
            this.setLossReason("How hard is it to just stay under the umbrella???")
            this.endMinigame(false);
        }
        if(!this.minigameOver()) {
            var snd = $engine.audioPlaySound("umbrella_hit",1.4);
            snd.speed = EngineUtils.randomRange(0.6,1.5)
        }
        this.updateScoreText();
        this.scoreBar.setTextTint(0xff0000);
    }

    updateScoreText() {
        this.scoreBar.setValue(this.score)
    }

    onCreate() {
        throw new Error("Do not instantiate this class outside of a room.")
    }

    draw(gui,camera) {
        super.draw(gui,camera);
        //EngineDebugUtils.drawPhysicsObject(camera,this.physicsFloor)
    }

    notifyFramesSkipped(frames) {
        // do nothing
    }

}


class UmbrellaPlayer extends InstanceMover {
    onEngineCreate() {
        super.onEngineCreate();
        this.dx=0;
        this.hitbox = new Hitbox(this, new RectangleHitbox(this,-64,-364,64,-128))
        this.maxVelocity=14;
        this.turnLagStop=5;
        this.turnLag=1;
        this.hasBeenHurt=false;
        this.animationWalk = $engine.getAnimation("eson_walk_cat");
        this.animationStand = [$engine.getTexture("eson_walk_cat_0")];
        this.animation = $engine.createRenderable(this,new PIXI.extras.AnimatedSprite(this.animationStand));
        this.animation.animationSpeed = 0.1;

        this.xScale = 0.4;
        this.yScale = 0.4;

        this.baseXScale = this.xScale;

        this.depth = -2

        this.setSprite(this.animation);
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {
        this.animation.update(1)
        this.hasBeenHurt=false;
        super.step();
        var accel = [0,0]
        if(IN.keyCheck("RPGright")) {
            accel[0]+=1.6;
        }
        if(IN.keyCheck("RPGleft")) {
            accel[0]-=1.6;
        }

        if((this.vel[0] != 0 && $engine.getGlobalTimer() % 20 === 0)) {
            $engine.audioPlaySound("walking");
        }

        this.move(accel,this.vel);

        if(Math.abs(this.vel[0])<0.1) {
            EngineUtils.setAnimation(this.animation,this.animationStand);
        } else {
            EngineUtils.setAnimation(this.animation,this.animationWalk);
            this.animation.animationSpeed = this.vel[0]/(this.maxVelocity*7.5);
        }

        var sign = Math.sign(this.vel[0]);
        if(sign!==0)
            this.xScale = sign * this.baseXScale;

        this.animation.skew.x=-this.vel[0]/256;

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

        //console.log(IN.getMouseX(),IN.getMouseY());

        //console.log(IN.getMouseX(),IN.getMouseY(), $engine.getCamera().getX(), $engine.getCamera().getY());
    }

    canControl() {
        return true;
    }

    collisionCheck(x,y) {
        return x < -96 || x > $engine.getWindowSizeX()+96;
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
        this.timer = 90;
        this.endTime = 75;
        this.rx = this.x;
        this.ry = this.y;
        this.sx = this.x;
        this.sy = this.y;
        this.dx = 0;
        this.dy = 0;
        this.setHitbox(new Hitbox(this,new PolygonHitbox(this, new Vertex(-304,-32),new Vertex(-288,-96),new Vertex(-272,-113),
                                new Vertex(-251,-129),new Vertex(-206,-142),new Vertex(-152,-146),
                                new Vertex(-127,-150),new Vertex(-100,-157),new Vertex(-59,-176),
                                new Vertex(-37,-191),new Vertex(-12,-214),new Vertex(-2,-223),
                                new Vertex(2,-223),new Vertex(12,-214), new Vertex(37,-191),
                                new Vertex(59,-176),new Vertex(100,-157), new Vertex(127,-150),
                                new Vertex(152,-146),new Vertex(206,-142), new Vertex(251,-129),
                                new Vertex(272,-113),new Vertex(288,-96),new Vertex(304,-32))))
        this.setSprite(new PIXI.Sprite($engine.getTexture("umbrella")))
        this.depth = -1;
        this.wide = 1.5;
        this.wideTimer = 0;
        this.endWideTime = 30;

        this.fake = false;
        this.fakeTime = 0;
        this.fakeTimer = 0;
        this.hasFaked = false;
        this.fakeX = 0;
        this.fakeY = 0;
        this.timesSinceLastFake=0;

        this.xScale = 0.3;
        this.yScale = 0.3;
        this.baseXScale = this.xScale;
        this.baseYScale = this.yScale;

        this.fakeOutTimes = [];
        for(var i =9;i>=0;i--) {
            this.fakeOutTimes.push(EngineUtils.irandomRange(i * 6 * 60,(i+1) * 6 * 60));
        }
        this.fakeIndex = 0;
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
        // rx can be no greater than 100%  (start of game) / 50% (end of game) of the screen
        var moveFac = (this.endTime-25)/50 // 1 at start of game, 0 at end
        this.rx = EngineUtils.clamp(this.rx,this.x-$engine.getWindowSizeX()/(2-moveFac),this.x+$engine.getWindowSizeX()/(2-moveFac))
        this.ry = EngineUtils.randomRange(72+4.5*(this.endTime-15),132+4.5*(this.endTime-15));

        this.sx = this.x;
        this.sy = this.y;
    }

    step() {
        // very old code. Literally was the first minigame programmed and was mostly to test collision.
        this.angle = EngineUtils.clamp(this.dx/64,-Math.PI/4,Math.PI/4)
        for(var i =0;i<EngineUtils.clamp(-(this.endTime-75)/2,1,14);i++)
            new Raindrop(EngineUtils.randomRange(-124,924),-64);
        this.timer++;
        if(this.timer>this.endTime*2) {
            this.timer=0;
            this.endTime = EngineUtils.clamp(this.endTime-2,25,90)

            var controller = UmbrellaMinigameController.getInstance();
            this.fake = (controller.getTimer().getTimeRemaining()<this.fakeOutTimes[this.fakeIndex] && !controller.hasCheated());
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
                        this.fakeIndex++;
                        $engine.audioPlaySound("umbrella_juke");
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
        } else {
            this.dx = 0;
            this.dy = 0;
        }
        var controller = UmbrellaMinigameController.getInstance();
        if(controller.hasCheated() && this.wideTimer<=this.endWideTime) {
            this.xScale = EngineUtils.interpolate(this.wideTimer/this.endWideTime,this.baseXScale,this.baseXScale*this.wide,EngineUtils.INTERPOLATE_SMOOTH)
            this.yScale = EngineUtils.interpolate(this.wideTimer/this.endWideTime,this.baseXScale,this.baseYScale*this.wide,EngineUtils.INTERPOLATE_SMOOTH)
            this.wideTimer++;
        }
        this.getSprite().skew.x = EngineUtils.clamp(-this.dx/64,-0.1,0.1);
    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}

class Raindrop extends EngineInstance {

    onEngineCreate() {
        this.dx = EngineUtils.randomRange(0.2,0.8);
        this.maxDy = EngineUtils.randomRange(20,24)
        this.dy = this.maxDy;
        this.grav = 0.25;
        this.angle = V2D.calcDir(this.dx,this.dy)
        var dist = V2D.calcMag(this.dx,this.dy);
        this.xScale = EngineUtils.clamp(dist/6,0,2)
        this.hitbox = new Hitbox(this, new RectangleHitbox(this,0,-1,25,1))
        this.setSprite(new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("rain_sprites")))
        this.yScale = 0.5;
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {
        this.x+=this.dx;
        this.y+=this.dy;
        if(this.dy < this.maxDy)
            this.dy+=this.grav;
        this.angle = V2D.calcDir(this.dx,this.dy)
        var dist = V2D.calcMag(this.dx,this.dy);
        this.xScale = EngineUtils.clamp(dist/12,0.25,2)
        if(this.y>=$engine.getWindowSizeY() || this.x<-128 || this.x > 944) {
            this.destroy();
        }
        var inst = IM.instancePlace(this,this.x,this.y,Umbrella)
        if(inst) {
            var spd = V2D.calcMag(this.dx,this.dy);
            var angle = V2D.calcDir(this.x-inst.x,inst.y-this.y);
            spd/=8
            var diff = this.x-inst.x;
            var dxAdd = inst.dx
            if(Math.sign(diff) !== Math.sign(inst.dx) || Math.abs(diff)<60)
                dxAdd=0;
            if(inst.dx === 0) {
                dxAdd = EngineUtils.clamp(diff/32,-2.5,2.5)
            }
            if(spd<0.5)
                spd=0;
            this.dx = V2D.lengthDirX(angle,spd) +dxAdd;
            this.dy = V2D.lengthDirY(angle,spd);
        }
        if(IM.instanceCollision(this,this.x,this.y,UmbrellaPlayer)) {
            UmbrellaMinigameController.getInstance().decrementScore();
            IM.find(UmbrellaPlayer,0).hasBeenHurt = true;
            this.destroy();
        }

    }

    draw(gui,camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}
