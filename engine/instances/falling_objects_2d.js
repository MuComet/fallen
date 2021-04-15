class FallingObjectsController extends MinigameController {
    onEngineCreate() {
        super.onEngineCreate();

        this.audioReference = $engine.generateAudioReference("Minigame-001");
        AudioManager.playBgm(this.audioReference);
        AudioManager.fadeInBgm(1);

        var bg = new ParallaxingBackground("background_sheet_2");


        var text = new PIXI.Text("Use Arrow Keys to walk left and right.\n Acquire CRUNCHY Leafs, Disregard the Earthy Clumps! \n\nPress ENTER to cheat!", $engine.getDefaultTextStyle());

        this.setInstructionRenderable(text);

        this.warning = new PIXI.Sprite($engine.getTexture("falling_object_warning"));
        this.warning.visible = false;
        this.warning.y = 200;
        this.rx = EngineUtils.random($engine.getWindowSizeX());
        this.fac;
        this.dropNew = false;

        this.maxTime = 60*60;
        this.minigameTimer = new MinigameTimer(this.maxTime);
        this.player = new FallingObjectsPlayer($engine.getWindowSizeX()/2,$engine.getWindowSizeY()-32);
        $engine.setBackgroundColour(0x72af22)
        this.fallTimer = 55;
        this.nextObject = 105;
        this.warningTimer = 0;
        this.cameraShakeTimer =0;

        this.score = 0;
        this.scoreText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        this.scoreText.anchor.set(0.5,0.5);
        this.scoreText.x = $engine.getWindowSizeX()/2;
        this.scoreText.y = $engine.getWindowSizeY()-30;
        $engine.createManagedRenderable(this,this.scoreText);
        this.updateScoreText();
    }

    onCreate() {
        this.onEngineCreate();
        super.onCreate();
    }

    step() {
        super.step();
        this.fallTimer++;
        if(this.fallTimer>=this.nextObject) {
            this.warningTimer = 50;
            this.fallTimer = 0;
            this.warning.visible = true;
 
            this.rx = 26 + 80 * EngineUtils.irandomRange(0, 9);
            this.fac = EngineUtils.interpolate(this.minigameTimer.getTimeRemaining()/this.maxTime,0.125,0.4444,EngineUtils.INTERPOLATE_OUT_QUAD);
            this.warning.x = this.rx;
            this.dropNew = true;
        }

        if(this.warningTimer > 0){
            this.warning.visible = true;     
        }else if (this.dropNew){
            new FallingObject(this.rx,0,EngineUtils.random(1)<=this.fac);
            this.warning.visible = false;
            this.dropNew = false;
        }
        this.cameraShakeTimer-=1;
        if(this.cameraShakeTimer<0)
            this.cameraShakeTimer=0;
        $engine.getCamera().setLocation(EngineUtils.randomRange(-this.cameraShakeTimer/6,this.cameraShakeTimer/6),
                                        EngineUtils.randomRange(-this.cameraShakeTimer/6,this.cameraShakeTimer/6));

        this.warningTimer--;
    }

    shakeCamera(fac) {
        this.cameraShakeTimer+=fac;
    }

    changeScore(delta) {
        if(this.minigameTimer.isTimerDone())
            return;
        this.score+=delta;
        this.updateScoreText();
    }

    updateScoreText() {
        this.scoreText.text = "Score: "+String(this.score);
    }

    draw(gui,camera) {
        super.draw(gui,camera);
        $engine.requestRenderOnGUI(this.scoreText);
        $engine.requestRenderOnGUI(this.warning);
    }

    notifyFramesSkipped(frames) {
        this.minigameTimer.tickDown(frames);
    }
    
}



class FallingObjectsPlayer extends InstanceMover {
    onEngineCreate() {
        super.onEngineCreate();
        this.stunTimer=0;
        this.dx=0;
        this.hitbox = new Hitbox(this, new RectangleHitbox(this,-64,-464,64,-64))
        this.maxVelocity=14;
        this.turnLagStop=5;
        this.turnLag=1;
        this.hasBeenHurt=false;
        this.animationWalk = $engine.getAnimation("eson_walk");
        this.animationStand = [$engine.getTexture("eson_walk_0")];
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
        this.stunTimer--;
        var accel = [0,0]
        if(IN.keyCheck("RPGright")) {
            accel[0]+=1.6;
        }
        if(IN.keyCheck("RPGleft")) {
            accel[0]-=1.6;
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

       

        this.lmx = IN.getMouseXGUI();
        this.lmy = IN.getMouseYGUI();
    }

    canControl() {
        return true;
    }

    collisionCheck(x,y) {
        return x < 32 || x > $engine.getWindowSizeX() - 32;
    }

    preDraw() {
        if(this.hasBeenHurt) {
            this.getSprite().tint = 0xff0000;
        } else {
            this.getSprite().tint = 0xffffff;
        }
    }

    collisionCheckObject(x,y) {
        return x<=0+this.getSprite().width/2 || x>=$engine.getWindowSizeX()-this.getSprite().width/2 || y<=0+this.getSprite().height || y >= $engine.getWindowSizeY();
    }

    canControl() {
        return this.stunTimer<=0;
    }

    objectHit(obj) {
        if(!this.canControl())
            return;
        if(!obj.good) {
            this.stunTimer = 60;
            var dx = this.x-obj.x;
            var dy = 1;
            var angle = V2D.calcDir(dx,dy);
            var mag = 20;
            this.vel[0] = V2D.lengthDirX(angle,mag)/3;
            this.vel[1] = -V2D.lengthDirY(angle,mag)/3;
            FallingObjectsController.getInstance().changeScore(-4);
        } else {
            FallingObjectsController.getInstance().changeScore(1);
        }
        
    }

    draw(gui, camera) {
        EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}

class FallingObject extends EngineInstance {

    onEngineCreate() {
        this.dx = EngineUtils.randomRange(0.2,0.8);
        this.maxDy = EngineUtils.randomRange(2,4);
        this.dy = this.maxDy;
        this.grav = 0.25;
        this.angle = V2D.calcDir(this.dx,this.dy);
        //var dist = V2D.calcMag(this.dx,this.dy);

        this.hitbox = new Hitbox(this, new RectangleHitbox(this,-25,-25,25,25))
        this.setSprite(new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("leaf_particles")));
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
        if(IM.instanceCollision(this,this.x,this.y,Test)) {
            this.destroy();
        }
        if(IM.instanceCollision(this,this.x,this.y,FallingObjectsPlayer)) {
            FallingObjectsController.getInstance().score--;
            IM.find(FallingObjectsPlayer,0).hasBeenHurt = true;
            this.destroy();
        }

    }

    draw(gui,camera) {
        EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}



class FallingObjectShadow extends EngineInstance {
    onCreate(x,y) {
        this.setSprite(new PIXI.Sprite($engine.getTexture("falling_object_shadow")))
        this.depth = 1; // render below player
        this.x = x;
        this.y = y;
    }
}


class DustParticle extends EngineInstance {

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        this.xScale = EngineUtils.randomRange(0.1,0.2);
        this.yScale = EngineUtils.randomRange(0.1,0.2);
        this.dx = EngineUtils.randomRange(-5,5);
        this.dy = EngineUtils.randomRange(-5,5);
        this.lifeTimer = EngineUtils.irandomRange(25,90);
        this.timer = 0;
        this.dr = EngineUtils.randomRange(-0.25,0.25);
        this.depth = -1;
        this.setSprite(new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("dust_particles")))
    }

    step() {
        this.x+=this.dx;
        this.y+=this.dy;
        this.angle+=this.dr;
        this.dx /= 1.05;
        this.dy /= 1.05;
        this.dr /= 1.05;
        this.timer++;
        if(this.timer>this.lifeTimer)
            this.destroy();
        if(this.timer > this.lifeTimer/2) {
            this.alpha = 1-EngineUtils.interpolate((this.timer-this.lifeTimer/2)/(this.lifeTimer/2),0,1,EngineUtils.INTERPOLATE_OUT_QUAD);
        }
    }
} 