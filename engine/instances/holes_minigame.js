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

        this.spawnPlatforms(this.lastY*2);

        this.addCheatCallback(this,function(self) {
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
            new HolePlatform(rx,yy,false,64-this.platformsSpawned/4);
            new HolePlatform(rx,yy,true,64-this.platformsSpawned/4);
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
        this.setSprite(new PIXI.Sprite($engine.getTexture("falling_rock_rocky_1")))
        this.setHitbox(new Hitbox(this,new RectangleHitbox(this, -32,-64,32,0)));
        this.allowSnapUp=false;
        this.turnLag = 2;
        this.turnLagStop=12;
        this.maxVelocity=8;
        this.srcMaxVelocity = this.maxVelocity;
    }

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        this.onEngineCreate();
    }

    step() {
        super.step();
        this.snapDistance = 8 + (HoleMinigameController.getInstance().cameraDy + this.dy)/2;
        if(this.snapDistance > 128-this.dy)
            this.snapDistance = 128-this.dy; // prevent phasing through platforms
        var accel = [0,0];
        if(!HoleMinigameController.getInstance().minigameOver()) {
            if(IN.keyCheck("KeyA") || IN.keyCheck("ArrowLeft")) {
                accel[0]-=this.acceleration;
            }
            if(IN.keyCheck("KeyD") || IN.keyCheck("ArrowRight")) {
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
            if(this.dy>=0)
                this.y = inst.getHitbox().getBoundingBoxTop();
            else {
                this.y = inst.getHitbox().getBoundingBoxBottom()+this.getSprite().height;
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
        if(IN.keyCheck("KeyQ"))
            $engine.endGame();
    }

    collisionCheck(x,y) {
        return x<=0 || x >= $engine.getWindowSizeX() || IM.instanceCollision(this,x,y,HolePlatform);
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
        if(type) {
            this.setHitbox(new Hitbox(this,new RectangleHitbox(this,-1024,-32,-holeWidth,32)))
        } else {
            this.setHitbox(new Hitbox(this,new RectangleHitbox(this,holeWidth,-32,1024,32)))
        }
    }

    step() {
        if(this.y < $engine.getCamera().getY()-256)
            this.destroy();
    }

    draw(gui,camera) {
        EngineDebugUtils.drawBoundingBox(camera,this);
    }
}