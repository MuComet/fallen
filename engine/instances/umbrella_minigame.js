class UmbrellaMinigameController extends MinigameController {
    onEngineCreate() {
        super.onEngineCreate();

        this.score = 750;
        this.scoreText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        this.scoreText.anchor.set(0.5,0.5);
        this.scoreText.x = $engine.getWindowSizeX()/2;
        this.scoreText.y = $engine.getWindowSizeY()-30;
        $engine.createManagedRenderable(this,this.scoreText);
        this.updateScoreText();

        this.fakeOutTimes = [];
        for(var i =0;i<10;i++) { // TODO -----------------------------------------------------------------
            this.fakeOutTimes.push(EngineUtils.irandomRange(i * 6 * 60,(i+1) * 6 * 60));
        }
        

        // instructions
        var text = new PIXI.Text("Left and Right arrow keys to move,\n don't touch the rain!\n\nPress Enter to cheat!",{fontFamily: 'GameFont',
                        fontSize: 50, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 })
        this.setInstructionRenderable(text)

        this.player = new Man($engine.getWindowSizeX()/2,$engine.getWindowSizeY())
        this.umbrella = new Umbrella($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/1.4);

        var bg = new ParallaxingBackground("background_sheet_2");

        bg.applyToAll(x=> x.tint = 0x95aac0);

        this.timer = new MinigameTimer(60*60);
        this.timer.addOnTimerStopped(this,function(parent,expired) {
            if(!expired)
                $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS)
            else   
                $engine.setOutcomeWriteBackValue(ENGINE_RETURN.WIN)

            /*AudioManager.fadeOutBgm(1)
            $engine.startFadeOut(30,false)
            $engine.endGame();
            $engine.pauseGame();*/
        })
        this.timer.setSurvivalMode();
        $engine.setBackgroundColour(0x080820)

        $engine.physicsEnable();

        this.physicsFloor = Matter.Bodies.rectangle($engine.getWindowSizeX()/2,$engine.getWindowSizeY(),$engine.getWindowSizeX(),64,{isStatic:true});
        $engine.physicsAddBodyToWorld(this.physicsFloor);

        this.setupBGS();
        this.bgsTimer = 0;
        this.bgsFadeTime = 30;
    }

    setupBGS() {
        this.rainSound1 = $engine.audioPlaySound("umbrella_rain_1",1.25,true);
        this.rainSound2 = $engine.audioPlaySound("umbrella_rain_2",1.25,true);
        this.rainSound1.volume = 0;
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
        if(this.minigameOver())
            return;
        this.bgsTick();
        /*if(IN.mouseCheckPressed(0)) {
            new Test(IN.getMouseX(), IN.getMouseY());
        }*/
        $engine.getCamera().setX(-($engine.getWindowSizeX()/2-this.player.x)/4)
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
        if(this.timer.isTimerDone())
            return;
        this.score--;
        if(this.score<=0) {
            this.score = 0;
            //if(!this.timer.isTimerDone())
            //    this.timer.stopTimer();
            this.timer.removeAllOnTimerStopped();
            this.timer.preventExpire();
            this.endMinigame(false);
        }
        if(!this.minigameOver()) {
            var snd = $engine.audioPlaySound("umbrella_hit",1.4);
            snd.speed = EngineUtils.randomRange(0.6,1.5)
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
        //EngineDebugUtils.drawPhysicsObject(camera,this.physicsFloor)
    }

    notifyFramesSkipped(frames) {
        // do nothing
    }

}

class Test extends EnginePhysicsInstance {
    onCreate(x,y) {
        this.x = x;
        this.y = y;
        const phys = Matter.Bodies.rectangle(x,y,128,64, { restitution: 0.8 });
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-64,-32,64,32)))
        this.attachPhysicsObject(this.physicsObjectFromHitbox({ restitution: 0.8 }));
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-734/2,-245/2,734/2,245/2)))
        this.setSprite(new PIXI.Sprite($engine.getTexture("button_new_game_1")))
        this.xScale = 0.1743869;
        this.yScale = 0.5224489/2;
    }

    step() {
        if(IN.mouseCheckPressed(2) && IM.instanceCollisionPoint(IN.getMouseX(),IN.getMouseY(),this))
            this.destroy();
    }

    cleanup() {
        this.detachPhysicsObject();
    }

    draw(gui, camera) {
        //EngineDebugUtils.drawPhysicsHitbox(camera,this)
        //EngineDebugUtils.drawHitbox(camera,this)
    }
}

class Man extends InstanceMover {
    onEngineCreate() {
        super.onEngineCreate();
        this.dx=0;
        this.hitbox = new Hitbox(this, new RectangleHitbox(this,-52,-400,52,0))
        this.maxVelocity=14;
        this.turnLagStop=5;
        this.turnLag=1;
        this.hasBeenHurt=false;
        this.animationWalk = $engine.getAnimation("eson_walk_cat");
        this.animationStand = [$engine.getTexture("eson_walk_cat_0")];
        this.animation = $engine.createRenderable(this,new PIXI.extras.AnimatedSprite(this.animationStand));
        this.animation.animationSpeed = 0.1;

        this.xScale = 0.3;
        this.yScale = 0.3;

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
        if(IN.keyCheck('ArrowRight')) {
            accel[0]+=1.6;
        }
        if(IN.keyCheck('ArrowLeft')) {
            accel[0]-=1.6;
        }

        this.move(accel,this.vel);

        if(Math.abs(this.vel[0])<0.1) {
            this.setAnimation(this.animationStand);
        } else {
            this.setAnimation(this.animationWalk)
            this.animation.animationSpeed = this.vel[0]/(this.maxVelocity*7.5);
        }

        var sign = Math.sign(this.vel[0]);
        if(sign!==0)
            this.xScale = sign * this.baseXScale;

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

    setAnimation(anim) {
        if(this.animation.textures === anim)
            return;
        this.animation.textures = anim;
        this.animation._currentTime = 0;
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

        this.baseXScale = 0.3;
        this.baseYScale = 0.3;
        this.xScale = 0.3;
        this.yScale = 0.3;
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
        this.ry = EngineUtils.randomRange(100+5*(this.endTime-15),164+5*(this.endTime-15));
        
        this.sx = this.x;
        this.sy = this.y;
    }

    step() {
        this.angle = EngineUtils.clamp(this.dx/64,-Math.PI/4,Math.PI/4)
        for(var i =0;i<EngineUtils.clamp(-(this.endTime-75)/2,1,12);i++)
            new Raindrop(EngineUtils.randomRange(-124,924),-64);
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
        this.hitbox = new Hitbox(this, new RectangleHitbox(this,0,-1,16,1))
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
        if(IM.instanceCollision(this,this.x,this.y,Test)) {
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