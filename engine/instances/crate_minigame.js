class CrateMinigameController extends MinigameController {
    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.BOXES)
        this.lampSpriteFactor = $engine.hasItem(ENGINE_ITEMS.LAMP_OIL) ? 1.25 : 1;
        super.onEngineCreate();
        this.sizeX = 70;
        this.sizeY = 70;

        this.camX = 0;
        this.camY = 0;

        var rows = 26;
        var columns = 26;
        var totalSpaces = rows*columns;
        var totalCrates = 512;

        this.totalWidth = this.sizeX * columns + 38;
        this.totalHeight = this.sizeY * rows;

        this.setControls(true,true);
        this.skipPregame();

        this.depthIndex = -1;

        this.lastInst = undefined;

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this, -128,-128,128,128)))

        this.destroyTimer = 0;
        this.destroyDelay = 4;
        this.destroyTarget = undefined;

        this.lampSprite = $engine.createManagedRenderable(this, new PIXI.extras.AnimatedSprite($engine.getAnimation("crate_mask_animation")));
        this.lampSprite.animationSpeed = 0.1; // 6FPS

        this.lampSprite.scale.set(this.lampSpriteFactor);

        var arr = [];
        this.targetCrate = new Crate(true);
        arr.push(this.targetCrate);
        for(var i =1;i<totalCrates;i++)
            arr.push(new Crate(false));
        for(var i = totalCrates;i<totalSpaces;i++)
            arr.push(undefined);

        EngineUtils.shuffleArray(arr);

        this.glowFilter = new PIXI.filters.GlowFilter();

        // randomly place the crates.
        for(var i = 0;i<totalSpaces;i++) {
            if(!arr[i])
                continue;
            var xx = this.sizeX * (i % columns);
            var yy = this.sizeY * Math.floor(i / columns);
            arr[i].x=xx + EngineUtils.irandomRange(-8,8) + (Math.floor(i / columns)%2==0 ? EngineUtils.irandomRange(26,38) : 0);
            arr[i].y=yy + EngineUtils.irandomRange(-8,8);
        }

        this.setupBackground(this.totalWidth, this.totalHeight);

        this.mx = 0;
        this.my = 0;

        this.maxScroll =10;

        this.depth = 100; // render the tile far behind.

        this.startTimer(60*30);

        this.addOnCheatCallback(this,function(self) {
            self.lampSprite.scale.x = 1.5 * self.lampSpriteFactor;
            self.lampSprite.scale.y = 1.5 * self.lampSpriteFactor;
            if(this.lastInst) {
                this.lastInst.getSprite().filters = [];
            }
        })

        this.saveX = 0;
        this.saveY = 0;

        this.addOnGameEndCallback(this, function(self) {
            self.saveX = $engine.getCamera().getX();
            self.saveY = $engine.getCamera().getY();
            self.targetCrate.getSprite().filters = [self.glowFilter];
            self.glowFilter.outerStrength = 0;
            self.glowFilter.innerStrength = 0;
            self.targetCrate.depth = -1;
            if(self.lastInst)
                self.lastInst.getSprite().filters = [];

            self.destroyTarget=undefined;
            self.setLossReason("Next time try clicking one of the crates.")
        });

        this.lampSprite.x = $engine.getWindowSizeX()/2;
        this.lampSprite.y = $engine.getWindowSizeY()/2;
        this.shakeTimer = 0;
        this.shakeFactor = 8;

        this.setCheatTooltip("Laser?!");

        var container = new PIXI.Sprite(PIXI.Texture.EMPTY);
        var text = $engine.createManagedRenderable(this,new PIXI.Text("A SINGLE marked crate is located within the room.\n Use the Mouse to move the light around and click \n"
                + "on the marked crate.\nMovement keys can be used to move the camera.\n\nClicking the wrong crate will result in a time penalty!\n\n"
                + "Press ENTER to cheat!",$engine.getDefaultTextStyle()));

        text.anchor.set(0.5)

        var crate = $engine.createManagedRenderable(this, new PIXI.Sprite(this.targetCrate.getSprite().texture))
        crate.anchor.set(0.5);
        crate.y = 200;

        container.addChild(text,crate);
        
        this.setInstructionRenderable(container);

    }

    onMinigameComplete(frames) {
        var fac = EngineUtils.interpolate(frames/60,1,0,EngineUtils.INTERPOLATE_SMOOTH_EXPONENTIAL);
        this.lampSprite.alpha = fac;
        var diffX = this.saveX - this.targetCrate.x;
        var diffY = this.saveY - this.targetCrate.y;

        var fac2 = Math.abs(Math.sin($engine.getGlobalTimer()/16)) * 8 + 1;
        this.glowFilter.innerStrength = fac2 * (1-fac);

        if(!this.hasCheated() && this.getTimer().getTimeRemaining() >= 1200){
            $engine.activateAchievement("BOXES_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
        }

        $engine.getCamera().setLocation(this.targetCrate.x-(1-fac)*$engine.getWindowSizeX()/2+diffX * fac,
                                        this.targetCrate.y-(1-fac)*$engine.getWindowSizeY()/2+diffY * fac)

        if(frames===180)
            this.advanceGameOver();
    }

    setupBackground(width, height) {
        var bg = new PIXI.extras.TilingSprite($engine.getTexture("wall_tile"),width, height);
        $engine.createRenderable(this,bg,false)
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);
    }

    handleShake() {
        var camera = $engine.getCamera();
        var fac = EngineUtils.interpolate(this.shakeTimer/this.shakeFactor,0,1,EngineUtils.INTERPOLATE_OUT_QUAD);
        camera.setRotation(EngineUtils.randomRange(-0.005,0.005)*fac);
        camera.translate(EngineUtils.randomRange(-2,2) * fac, EngineUtils.irandomRange(-2,2) * fac);
        this.shakeTimer--;
    }

    shake(factor = 20) {
        if(this.shakeTimer < 0);
            this.shakeTimer=0;
        this.shakeTimer+=factor;
    }

    handleMoveScreen() {
        var mxGUI = IN.getMouseXGUI();
        var myGUI = IN.getMouseYGUI();
        var threshold = 64;
        var highX = $engine.getWindowSizeX();
        var highY = $engine.getWindowSizeY();

        var pressingRight = IN.keyCheck("KeyD") || IN.keyCheck("ArrowRight") || mxGUI > highX - threshold
        var pressingLeft = IN.keyCheck("KeyA") || IN.keyCheck("ArrowLeft") || mxGUI < threshold
        var pressingDown = IN.keyCheck("KeyS") || IN.keyCheck("ArrowDown") || myGUI > highY - threshold
        var pressingUp = IN.keyCheck("KeyW") || IN.keyCheck("ArrowUp") || myGUI < threshold

        if(pressingRight) {
            this.mx++;
        }

        if(pressingLeft) {
            this.mx--;
        }

        if(!pressingLeft && !pressingRight) {
            this.mx -= Math.sign(this.mx);
        }
        
        if(pressingDown) {
            this.my++;
        }

        if(pressingUp) {
            this.my--;
        }

        if(!pressingUp && !pressingDown) {
            this.my -= Math.sign(this.my);
        }

        this.mx = EngineUtils.clamp(this.mx, -this.maxScroll, this.maxScroll);
        this.my = EngineUtils.clamp(this.my, -this.maxScroll, this.maxScroll);
        
        var camera = $engine.getCamera();
        this.camX = camera.getX()+this.mx;
        this.camY = camera.getY()+this.my;

        if(this.camX > this.totalWidth-highX || this.camX < 0)
            this.mx=0;
        if(this.camY > this.totalHeight-highY || this.camY < 0)
            this.my = 0;

        camera.setLocation(EngineUtils.clamp(this.camX,0,this.totalWidth-highX), EngineUtils.clamp(this.camY,0,this.totalHeight-highY))
    }

    step() {
        super.step();
        this.lampSprite.update(1);
        if(this.minigameOver())
            return;
        this.handleMoveScreen();
        var sx = EngineUtils.clamp(IN.getMouseXGUI(),0,$engine.getWindowSizeX());
        var sy = EngineUtils.clamp(IN.getMouseYGUI(),0,$engine.getWindowSizeY());
        this.lampSprite.x = sx;
        this.lampSprite.y = sy;

        var fac2 = Math.abs(Math.sin($engine.getGlobalTimer()/16));
        this.glowFilter.innerStrength = fac2;
        if(this.hasCheated()) {
            this.x =IN.getMouseX();
            this.y =IN.getMouseY();
            if(this.destroyTimer>=this.destroyDelay) {
                var oldTarget = this.destroyTarget; // because the engine does not immediately remove instances from the world, we must
                if(this.destroyTarget) { // temporarily remove this instance from the pool when checking.
                    this.destroyTarget.destroy();
                    $engine.audioPlaySound("explosion_maze",0.4).speed = EngineUtils.randomRange(0.5,2);
                    new CrateParticle(this.destroyTarget.x-16,this.destroyTarget.y).xScale = 1;
                    new CrateParticle(this.destroyTarget.x+16,this.destroyTarget.y).xScale = -1;
                    for(var i=0;i<12;i++) {
                        var part = new CrateParticle(this.destroyTarget.x,this.destroyTarget.y)
                        part.xScale = EngineUtils.randomRange(0.2,0.5);
                        part.yScale = EngineUtils.randomRange(0.2,0.5);
                    }
                    this.shake();
                    var saveTargetX = this.destroyTarget.x;
                    this.destroyTarget.x = 9999999; // get outta here.
                }
                var saveX = this.targetCrate.x;
                this.targetCrate.x = 999999999999;
                var instances = IM.instanceCollisionList(this,this.x,this.y,Crate);
                this.targetCrate.x = saveX;

                this.destroyTarget = IM.instanceNearestPoint(this.x,this.y,...instances);
                if(this.destroyTarget) {
                    this.destroyTimer=0;
                    $engine.audioPlaySound("crate_laser",0.3).speed = EngineUtils.randomRange(1.5,2);
                }
                if(oldTarget) {
                    oldTarget.x = saveTargetX; // ok you can come back now
                }
            }
            if(this.destroyTarget) {
                var col = Math.round(this.destroyTarget.originalTintFactor * (1-this.destroyTimer/this.destroyDelay));
                this.destroyTarget.getSprite().tint = (col<<16) | (col<<8) | col
            }

        }
        
        var inst = IM.instancePosition(IN.getMouseX(),IN.getMouseY(),Crate);
        if(this.lastInst) {
            this.lastInst.getSprite().filters = [];
        }
        if(inst) {
            this.lastInst = inst;
            inst.getSprite().filters = [this.glowFilter]
            inst.depth = --this.depthIndex;
        }

        this.destroyTimer++;
        this.handleShake();
    }

    draw(gui, camera) {
        super.draw(gui,camera);
        $engine.requestRenderOnCameraGUI(this.lampSprite);

        if(this.destroyTarget) {
            camera.moveTo(this.x,this.y)
            camera.lineStyle(4,0xff0000);
            camera.lineTo(this.destroyTarget.x+this.sizeX/2,this.destroyTarget.y+this.sizeY/2);
        }
    }

}

class Crate extends EngineInstance {

    onCreate(mark) {
        this.marked = mark;
        this.broken = 0;
        var texture = undefined;
        if(mark) { // i d e a l   c o d e
            texture = $engine.getRandomTextureFromSpritesheet("crate_marked");
        } else {
            texture = $engine.getRandomTextureFromSpritesheet("crate_normal");
        }

        this.setSprite(new PIXI.Sprite(texture));
        var r = EngineUtils.irandomRange(178,255);
        this.originalTintFactor = r;
        this.getSprite().tint = (r<<16) | (r<<8) | r; // add some variation via a brightness adjustment
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,0,0,64,64)));
    }

    step() {
        var controller = CrateMinigameController.getInstance();
        if(IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)) {
            if(this.marked){
                $engine.audioPlaySound("sky_bonk");
                controller.endMinigame(this.marked);
            }
            if(!controller.hasCheated() && controller.getTimer().getTimeRemaining() > 3*60 && this.broken == 0 && !this.marked) { // if they cheat, don't let them accidently click a wrong crate
                controller.shake();
                $engine.audioPlaySound("sky_donk");
                this.getSprite().texture = $engine.getTexture("box_break");
                this.broken = 1;
                controller.getTimer().setTimeRemaining(controller.getTimer().getTimeRemaining() - 3*60);
            }
                //if(!this.marked) {
                    //controller.setLossReason("But they all looked so similar... :(")
                //}   
        }
    }
}

class CrateParticle extends EngineInstance {
    onCreate(x,y) {
        this.x = x;
        this.y = y;

        var texture = $engine.getTexture("box_break");
    
        this.setSprite(new PIXI.Sprite(texture));
        var r = EngineUtils.irandomRange(178,255);
        this.getSprite().tint = (r<<16) | (r<<8) | r; // add some variation via a brightness adjustment

        this.dy = EngineUtils.randomRange(-8,-4);
        this.dx = EngineUtils.randomRange(-2,2);
        this.dz = EngineUtils.randomRange(-0.05,0.05);
        this.grav = 0.25;
        this.lifeTimer = 0;
        this.lifeTime = EngineUtils.irandomRange(45,75);
    }
    
    step() {
        this.lifeTimer++;
        if(this.lifeTimer>this.lifeTime)
            this.destroy();
        this.alpha = EngineUtils.interpolate((this.lifeTimer-(this.lifeTime-24))/24,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this.x+=this.dx;
        this.y+=this.dy;
        this.angle+=this.dz;
        this.dy += this.grav;
    }
}