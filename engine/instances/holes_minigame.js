class HoleMinigameController extends MinigameController {

    onEngineCreate() {
        super.onEngineCreate();

        this.cameraDy = 1.75;
        this.cameraDyChange = 0.001;
        this.cameraY = 0;
        this.shakeTimer=0;
        this.startTimer(40*60);
        this.getTimer().setSurvivalMode();
        this.height = 178;
        this.lastY = -256;
        this.player = new HolePlayer($engine.getWindowSizeX()/2,$engine.getWindowSizeY()+this.lastY);
        this.lastX = $engine.getWindowSizeX()/2
        this.minDistance = 96;
        this.maxDistance = 300;
        this.platformsSpawned=0;
        this.sound1 = $engine.audioPlaySound("drain_stream",0.5,true);
        this.sound2 = $engine.audioPlaySound("drain_drop",0.9,true);

        this.addOnGameEndCallback(this,function(self) {
            $engine.audioFadeSound(self.sound1);
            $engine.audioFadeSound(self.sound2);
        })

        $engine.setBackgroundColour(0x7332a7)

        new ParallaxingBackground();

        this.pipeBackground = $engine.createRenderable(this,new PIXI.extras.TilingSprite($engine.getTexture("pipes_background"),
                                                        $engine.getWindowSizeX()+32,$engine.getWindowSizeY()+32));
        this.pipeBackground.x = -16;
        this.pipeBackground.tilePosition.x = 16;
        this.pipeBackground.y = -this.lastY+this.height
        this.originalBackgroundY = this.pipeBackground.y+16;
        this.spawnPlatforms(this.lastY*2);

        this.depth = 2;

        this.setInstructionRenderable(new PIXI.Text("Use the Arrows to move left and right and\n descend down the sewer. Watch out for the bounce and \ndon't miss the gaps!\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle()))
        this.setControls(true,false);
        this.skipPregame();

        this.setCheatTooltip("Eson lookin' kinda THICC.");

        this.addOnCheatCallback(this,function(self) {
            self.setLossReason("Not even THICC Eson can make you good at video games.");
        });
        this.setLossReason("To be fair, this has to be the\nmost complicated sewer network in the world.");

        this.addOnCheatCallback(this,function(self) {
            self.cameraDy=4;
            self.cameraDyChange=0;
            IM.with(HolePlatform,function(platform) {
                platform.setWidth(128);
            });
            IM.with(HoleSeparator,function(sep) {
                sep.setWidth(256);
            });
        })
    }

    onCreate() {
        super.onCreate();
        this.onEngineCreate();
    }

    spawnPlatforms(yLoc) {
        while(yLoc+2048 >= this.lastY) { // spawn a LOT into the future.
            var rx = this.lastX;
            while(rx<64 || rx > $engine.getWindowSizeX() - 64 || Math.abs(rx-this.lastX)<=this.minDistance) {
                rx = this.lastX+EngineUtils.irandomRange(-this.maxDistance, this.maxDistance)
            }
            var yy = this.lastY+$engine.getWindowSizeY()+64;
            var offset =64-this.platformsSpawned/4
            if(this.hasCheated())
                offset = 128;
            var hp1 = new HolePlatform(rx,yy,false,offset);
            var hp2 =new HolePlatform(rx,yy,true,offset);
            var hs = new HoleSeparator(rx,yy,offset*2)

            hp1.idx = this.platformsSpawned;
            hp2.idx = this.platformsSpawned;

            hp1.otherPlatform = hp2;
            hp1.separator = hs;

            hp2.otherPlatform = hp1;
            hp2.separator = hs;

            this.lastY += this.height;
            this.lastX = rx;
            this.platformsSpawned++;
        }
    }

    step() {
        super.step();
        this.cameraDy+=this.cameraDyChange;
        this.cameraY+=this.cameraDy;
        var camera = $engine.getCamera()
        camera.setLocation(0,this.cameraY);

        var cameraY = $engine.getCamera().getY()
        this.spawnPlatforms(cameraY);

        if(this.player.y <= cameraY) {
            this.endMinigame(false);
        }

        if(cameraY>this.originalBackgroundY) {
            this.pipeBackground.y = cameraY-16;
            var diff = cameraY - this.originalBackgroundY;
            this.pipeBackground.tilePosition.y = -diff;
        }

        if(--this.shakeTimer>=0) {
            var rx = EngineUtils.randomRange(-this.shakeTimer/4,this.shakeTimer/4)
            var ry = EngineUtils.randomRange(-this.shakeTimer/4,this.shakeTimer/4)
            camera.translate(rx,ry);
        }

    }

    shake(frames=30) {
        if(this.shakeTimer<0)
            this.shakeTimer=0;
        this.shakeTimer+=frames;
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
        this.setSprite(new PIXI.extras.AnimatedSprite(this.animationStand))
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

        this.cheatTimer = 0;
    }

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        this.onEngineCreate();
    }

    step() {
        super.step();
        this.animationTick();

        var controller = HoleMinigameController.getInstance();

        if(controller.hasCheated()) {
            this.defaultXScale = EngineUtils.interpolate(++this.cheatTimer/60,0.2,0.6,EngineUtils.INTERPOLATE_IN_ELASTIC)
        }

        this.snapDistance = 8 + (controller.cameraDy + this.dy)/2;
        if(this.snapDistance > 128-this.dy)
            this.snapDistance = 128-this.dy; // prevent phasing through platforms
        var accel = [0,0];
        if(!controller.minigameOver()) {
            if(IN.keyCheck("RPGleft")) {
                accel[0]-=this.acceleration;
            }
            if(IN.keyCheck("RPGright")) {
                accel[0]+=this.acceleration;
            }
        }
        this.move(accel,this.vel);
        if(this.vel[0] != 0 && $engine.getGlobalTimer() % 10 == 0){
            $engine.audioPlaySound("walking");
        }

        // gravity doesn't use 2d mover.
        if(this.dy===0)
            this.dy+=this.grav*8;
        else
            this.dy+=this.grav;
        var inst = IM.instancePlace(this,this.x,this.y+this.dy,HolePlatform)
        if(inst!==undefined) {
            if(this.dy>=0) { // land
                this.y = inst.getHitbox().getBoundingBoxTop();               

                if(controller.hasCheated()) {
                    this.handleDestroyBlock(inst);
                }
            } else { // hit head
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

    handleDestroyBlock(block) {
        if(block.idx%2!==0) {
            return false;
        }

        $engine.audioPlaySound("sky_land");
        var t1 = block;
        var t2 = block.otherPlatform;
        var t3 = block.separator;

        t1.break();
        t2.break();
        t3.break();

        HoleMinigameController.getInstance().shake();

        return true;
    }

    collisionCheck(x,y) {
        return x<=0 || x >= $engine.getWindowSizeX() || IM.instanceCollision(this,x,y,HolePlatform);
    }

    animationTick() {
        if(this.vel[0]!==0) {
            this.xScale = Math.sign(this.vel[0]) * this.defaultXScale;
        } else {
            this.xScale = Math.sign(this.xScale) * this.defaultXScale; // for cheat
        }
        if((IN.keyCheck("RPGright") || IN.keyCheck("RPGleft")) && ! HoleMinigameController.getInstance().minigameOver()) {
            this.setAnimation(this.animationWalk)
        } else {
            this.setAnimation(this.animationStand)
            return;
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
}

class HolePlatform extends EngineInstance {
    onCreate(x,y, type, holeWidth) {
        this.x = x;
        this.y = y;
        this.originalWidth = holeWidth;
        this.originalType = type;
        this.setSprite(new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("pipes")));
        if(type) { // left side
            this.getSprite().anchor.x = 1;
            this.x-=holeWidth;
            this.setHitbox(new Hitbox(this,new RectangleHitbox(this,-1024,-26,0,26)))
        } else {
            this.x+=holeWidth;
            this.setHitbox(new Hitbox(this,new RectangleHitbox(this,0,-26,1024,26)))
        }

        this.isBroken = false;
        this.dy = EngineUtils.randomRange(-8,-4);
        this.dx = EngineUtils.randomRange(-8,8);
        this.dr = EngineUtils.randomRange(-0.01,0.01);
        this.grav = EngineUtils.randomRange(0.2,0.225);
    }

    setWidth(newWidth) {
        if(this.originalType) {
            this.x-=newWidth-this.originalWidth;
        } else {
            this.x+=newWidth-this.originalWidth;
        }
    }

    step() {
        if(this.y < $engine.getCamera().getY()-256)
            this.destroy();
        
        if(this.isBroken) {
            this.x+=this.dx;
            this.y+=this.dy;
            this.angle+=this.dr;
            this.dy+=this.grav;
            if(this.y > $engine.getCamera().getY()+2048)
                this.destroy()
        }
    }

    break() {
        this.isBroken=true;
        this.setHitbox(new Hitbox(this,new RectangleHitbox(this,-99999,-99999,-99999,-99999))) // yeet the hitbox
    }
}

class HoleSeparator extends EngineInstance {
    onCreate(x,y,width) {
        this.x = x;
        this.y = y;
        this.setSprite(new PIXI.Sprite($engine.getTexture("pipes_separator")))
        var fac = (width+8)/256;
        this.xScale = fac;
        this.depth = 1;

        this.isBroken = false;
        this.dy = EngineUtils.randomRange(-8,-4);
        this.dx = EngineUtils.randomRange(-8,8);
        this.dr = EngineUtils.randomRange(-0.1,0.1);
        this.grav = EngineUtils.randomRange(0.2,0.225);
    }

    step() {
        if(this.y < $engine.getCamera().getY()-256)
            this.destroy();
        
        if(this.isBroken) {
            this.x+=this.dx;
            this.y+=this.dy;
            this.angle+=this.dr;
            this.dy+=this.grav;
            if(this.y > $engine.getCamera().getY()+2048)
                this.destroy()
        }
    }

    setWidth(newWidth) {
        var fac = (newWidth+8)/256;
        this.xScale = fac;
    }

    break() {
        this.isBroken=true;
    }
}