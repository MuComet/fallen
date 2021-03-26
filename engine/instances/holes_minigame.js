class HoleMinigameController extends MinigameController {

    onEngineCreate() {
        super.onEngineCreate();

        this.cameraDy = 1.75;
        this.cameraDyChange = 0.00098; // 0.001 was too fast
        this.startTimer(40*60);
        this.getTimer().setSurvivalMode();
        this.height = 178;
        this.lastY = -256;
        this.player = new HolePlayer($engine.getWindowSizeX()/2,$engine.getWindowSizeY()+this.lastY);
        this.lastX = $engine.getWindowSizeX()/2
        this.minDistance = 96;
        this.maxDistance = 300;
        this.platformsSpawned=0;
        $engine.setBackgroundColour(0x7332a7)

        new ParallaxingBackground();

        this.pipeBackground = $engine.createRenderable(this,new PIXI.extras.TilingSprite($engine.getTexture("pipes_background"),$engine.getWindowSizeX(),$engine.getWindowSizeY()));
        this.pipeBackground.y = -this.lastY+this.height
        this.originalBackgroundY = this.pipeBackground.y;
        this.spawnPlatforms(this.lastY*2);

        this.depth = 2;

        this.setCheatTooltip("Eson lookin' kinda thicc.")

        this.addOnCheatCallback(this,function(self) {
            self.setLossReason("Not even thicc eson can make you good at video games.")
        })
        this.setLossReason("To be fair, this has to be the\nmost complicated sewer network in the world.")

        this.addOnCheatCallback(this,function(self) {
            self.cameraDy*=0.6666;
            self.cameraDyChange*=0.6666;
        })
    }

    onCreate() {
        super.onCreate();
        this.onEngineCreate();
    }

    spawnPlatforms(yLoc) {
        while(yLoc+2048 >= this.lastY) {
            var rx = this.lastX;
            while(rx<64 || rx > $engine.getWindowSizeX() - 64 || Math.abs(rx-this.lastX)<=this.minDistance) {
                rx = this.lastX+EngineUtils.irandomRange(-this.maxDistance, this.maxDistance)
            }
            var yy = this.lastY+$engine.getWindowSizeY()+64;
            var offset =64-this.platformsSpawned/4
            new HolePlatform(rx,yy,false,offset);
            new HolePlatform(rx,yy,true,offset);
            new HoleSeparator(rx,yy,offset*2)
            this.lastY += this.height;
            this.lastX = rx;
            this.platformsSpawned++;
        }
    }

    step() {
        super.step();
        this.cameraDy+=this.cameraDyChange;
        $engine.getCamera().translate(0,this.cameraDy);

        var cameraY = $engine.getCamera().getY()
        this.spawnPlatforms(cameraY);

        if(this.player.y <= cameraY) {
            this.endMinigame(false);
        }

        if(cameraY>this.originalBackgroundY) {
            this.pipeBackground.y = cameraY;
            var diff = cameraY - this.originalBackgroundY;
            this.pipeBackground.tilePosition.y = -diff;
        }
    }

    notifyFramesSkipped(frames) {
        // do nothing, it's survival.
    }
}

class HolePlayer extends InstanceMover {

    onEngineCreate() {
        super.onEngineCreate(); 
        this.acceleration=0.75;
        this.dy = 0;
        this.grav = 0.25;
        this.animationWalk = $engine.getAnimation("eson_walk");
        this.animationStand = [$engine.getTexture("eson_walk_0")];
        this.setSprite($engine.createRenderable(this,new PIXI.extras.AnimatedSprite(this.animationStand)))
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-64,-512,64,0)));
        this.sprite = this.getSprite();

        this.sprite.animationSpeed = 0.1;

        this.allowSnapUp=false;
        this.turnLag = 2;
        this.turnLagStop=12;
        this.maxVelocity=8;
        this.srcMaxVelocity = this.maxVelocity;

        this.defaultXScale=0.2;
        this.defaultYScale=0.2;

        this.xScale = this.defaultXScale;
        this.yScale = this.defaultYScale;
    }

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        this.onEngineCreate();
    }

    step() {
        super.step();
        this.animationTick();
        this.snapDistance = 8 + (HoleMinigameController.getInstance().cameraDy + this.dy)/2;
        if(this.snapDistance > 128-this.dy)
            this.snapDistance = 128-this.dy; // prevent phasing through platforms
        var accel = [0,0];
        if(!HoleMinigameController.getInstance().minigameOver()) {
            if(IN.keyCheck("RPGleft")) {
                accel[0]-=this.acceleration;
            }
            if(IN.keyCheck("RPGright")) {
                accel[0]+=this.acceleration;
            }
        }
        this.move(accel,this.vel);

        // gravity doesn't use 2d mover.
        if(this.dy===0)
            this.dy+=this.grav*8;
        else
            this.dy+=this.grav;
        var inst = IM.instancePlace(this,this.x,this.y+this.dy,HolePlatform)
        if(inst!==undefined) {
            if(this.dy>=0) // land
                this.y = inst.getHitbox().getBoundingBoxTop();
            else { // hit head
                this.y = inst.getHitbox().getBoundingBoxBottom()+(this.getHitbox().getBoundingBoxBottom()-this.getHitbox().getBoundingBoxTop());
            }
            if(Math.abs(this.dy)<5) {
                this.dy = 0;
                this.maxVelocity=this.srcMaxVelocity/1.3; // utilize the bounce or dIE
            } else {
                this.dy = -this.dy/3
            }
        } else {
            this.maxVelocity=this.srcMaxVelocity;
        }
        this.y+=this.dy;
    }

    collisionCheck(x,y) {
        return x<=0 || x >= $engine.getWindowSizeX() || IM.instanceCollision(this,x,y,HolePlatform);
    }

    animationTick() {
        if(IN.keyCheck("RPGright") || IN.keyCheck("RPGleft")) {
            this.setAnimation(this.animationWalk)
        } else {
            this.setAnimation(this.animationStand)
            return;
        }
        if(this.vel[0]!==0) {
            this.xScale = Math.sign(this.vel[0]) * this.defaultXScale;
        }
        this.sprite.update(1);
    }

    setAnimation(anim) {
        if(this.sprite.textures === anim)
            return;
        this.sprite.textures = anim;
        this.sprite._currentTime = 0;
    }

    canControl() {
        return true;
    }

    draw(gui,camera) {
        EngineDebugUtils.drawBoundingBox(camera,this);
    }
}

class HolePlatform extends EngineInstance {
    onCreate(x,y, type, holeWidth) {
        this.x = x;
        this.y = y;
        this.setSprite($engine.createRenderable(this,new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("pipes"))));
        if(type) { // left side
            this.getSprite().anchor.x = 1;
            this.x-=holeWidth;
            this.setHitbox(new Hitbox(this,new RectangleHitbox(this,-1024,-26,0,26)))
        } else {
            this.x+=holeWidth;
            this.setHitbox(new Hitbox(this,new RectangleHitbox(this,0,-26,1024,26)))
        }
    }

    step() {
        if(this.y < $engine.getCamera().getY()-256)
            this.destroy();
    }
}

class HoleSeparator extends EngineInstance {
    onCreate(x,y,width) {
        this.x = x;
        this.y = y;
        this.setSprite($engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("pipes_separator"))))
        var fac = (width+8)/256;
        this.xScale = fac;
        this.depth = 1;
    }

    step() {
        if(this.y < $engine.getCamera().getY()-256)
            this.destroy();
    }
}