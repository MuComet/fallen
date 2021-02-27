class FallingObjectsController extends MinigameController {
    onEngineCreate() {
        super.onEngineCreate();

        this.audioReference = $engine.generateAudioReference("Minigame-001");
        AudioManager.playBgm(this.audioReference);
        AudioManager.fadeInBgm(1);

        this.maxTime = 60*60
        this.minigameTimer = new MinigameTimer(this.maxTime);
        this.player = new FallingObjectsPlayer($engine.getWindowSizeX()/2, $engine.getWindowSizeY()/2);
        $engine.setBackgroundColour(0x72af22)
        this.fallTimer = 60;
        this.nextObject = 90;
        this.SPRITE_GOOD = "falling_object_flower";
        this.SPRITE_BAD = "falling_object_spike";
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
            this.fallTimer = 0;
            this.nextObject=EngineUtils.clamp(this.nextObject-2,24,90);
            var rx = EngineUtils.random($engine.getWindowSizeX());
            var ry = EngineUtils.random($engine.getWindowSizeY());
            var fac = EngineUtils.interpolate(this.minigameTimer.getTimeRemaining()/this.maxTime,0.125,0.4444,EngineUtils.INTERPOLATE_OUT_QUAD)
            new FallingObject(rx,ry,EngineUtils.random(1)<=fac)
        }
        this.cameraShakeTimer-=1;
        if(this.cameraShakeTimer<0)
            this.cameraShakeTimer=0;
        $engine.getCamera().setLocation(EngineUtils.randomRange(-this.cameraShakeTimer/6,this.cameraShakeTimer/6),
                                        EngineUtils.randomRange(-this.cameraShakeTimer/6,this.cameraShakeTimer/6))
    }

    shakeCamera(fac) {
        this.cameraShakeTimer+=fac;
    }

    changeScore(delta) {
        if(this.minigameTimer.stopped())
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
    }

    
}

class FallingObjectsPlayer extends InstanceMover {
    onCreate(x,y) {
        super.onCreate();
        this.stunTimer=0;
        this.addControlButtons("KeyW","KeyA","KeyS","KeyD")
        this.addControlButtons("ArrowUp","ArrowLeft","ArrowDown","ArrowRight")
        this.setSprite(new PIXI.Sprite($engine.getTexture("falling_rock_rocky_1")))
        this.setHitbox(new Hitbox(this,new RectangeHitbox(this,-32,-64,32,0)));
        this.x = x;
        this.y = y;
        this.drag=0.1;
    }

    step() {
        super.step();
        this.stunTimer--;
        this.move(this.getAccelVector(),this.vel);
    }

    collisionCheck(x,y) {
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
            var dx = this.x-obj.x
            var dy = this.y-obj.y
            var angle = V2D.calcDir(dx,dy)
            var mag = 20;
            this.vel[0] = V2D.lengthDirX(angle,mag)/3;
            this.vel[1] = -V2D.lengthDirY(angle,mag)/3;
            FallingObjectsController.getInstance().changeScore(-4);
        } else {
            FallingObjectsController.getInstance().changeScore(1);
        }
        
    }
}

class FallingObject extends EngineInstance {
    onCreate(x,y,good) {
        var spr = "";
        var inst = FallingObjectsController.getInstance();
        if(good) {
            spr = inst.SPRITE_GOOD;
        } else {
            spr = inst.SPRITE_BAD;
        }
        this.good = good;
        this.x = x;
        this.y = y;
        this.xStart = x;
        this.yStart = y;
        this.dr = EngineUtils.randomRange(-0.01,0.01);
        this.setSprite(new PIXI.Sprite($engine.getTexture(spr)));
        this.setHitbox(new Hitbox(this,new RectangeHitbox(this,-32,-32,32,32)));
        this.depth = good ? -400 : -750; // use for height and render.
        this.maxDepth = -364
        this.dz = good ? 1 :4;
        this.grav = good ? 0.0125 : 0.025;
        this.shadow = new FallingObjectShadow(this.x,this.y);
        this.blurFilter = new PIXI.filters.BlurFilter()
        this.blurFilter.blur = 5;
        this.maxBlur = 36;
        this.getSprite().filters = [this.blurFilter];
        this.timer = 0;
    }

    step() {
        this.timer++;
        this.depth+=this.dz;
        this.angle+=this.dr;
        if(this.depth>=0) {
            this.depth = -1;
            var inst = IM.instancePlace(this,this.x,this.y,FallingObjectsPlayer);
            if(inst) {
                inst.objectHit(this);
            }
            if(!this.good) {
                var rand = EngineUtils.irandomRange(8,18);
                
                for(var i = 0;i<rand;i++)
                    new DustParticle(this.x,this.y);
                FallingObjectsController.getInstance().shakeCamera(18);
            }
            this.destroy();
            return;
        }
        
        this.dz+=this.grav;
        this.shadow.x = this.x;
        this.shadow.y = this.y;
        var dist = EngineUtils.clamp(Math.abs(this.depth/this.maxDepth),0,1);
        var shadowFac = EngineUtils.interpolate(this.timer/128,0,1,EngineUtils.INTERPOLATE_OUT)
        this.shadow.alpha = shadowFac/2;
        this.shadow.xScale = shadowFac;
        this.shadow.yScale = shadowFac;
        this.alpha = EngineUtils.clamp(1-dist*2,0,1)
        this.blurFilter.blur = dist*this.maxBlur;
        this.xScale = dist*6+1;
        this.yScale = dist*6+1;
    }

    onDestroy() {
        this.shadow.destroy();
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