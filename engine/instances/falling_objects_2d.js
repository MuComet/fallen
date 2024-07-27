class FallingObjectsController extends MinigameController {
    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.CATCH)
        super.onEngineCreate();

        var bg = new ParallaxingBackground("background_sheet_2");
        var spr = new PIXI.Sprite($engine.getTexture("background_leaves_0"));
        spr.anchor.set(0);
        bg.addIndex(5,spr);
        var foreground = new EmptyInstance($engine.getTexture("background_leaves_1"));
        foreground.x = $engine.getWindowSizeX()/2;
        foreground.y = $engine.getWindowSizeY()/2;
        foreground.depth = -2;

        var text = new PIXI.Text("Use movement keys to walk left and right.\n Acquire CRUNCHY Leaves, disregard the earthy clumps! \n\nPress ENTER to cheat!", $engine.getDefaultTextStyle());

        this.setInstructionRenderable(text);

        this.startTimer(30*60);
        this.player = new FallingObjectsPlayer($engine.getWindowSizeX()/2,$engine.getWindowSizeY()-32);

        this.fallTimer = 25;
        this.nextObject = 30;
        this.gameEndDelay = 40;
        this.gameEndDelaySwitch = false;
        this.cameraShakeTimer = 0;
        this.columns = 9;
        this.healthArr = [1,1,1,1,1];

        this.score = 0;
        this.maxScore = 15;
        this.lives = 5;
        this.noleaf = 0;
        this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;
        for(var h = 0; h < this.lives; h++){
            new FallingHealth(730 - 25*h, 590, h);
        }
        this.shakeTimer = 0;
        this.shakeFactor = 8;

        this.setCheatTooltip("Damn, this sucks!");
        this.setLossReason("Where did the rocks even come from??");

        this.setControls(true,false);
        this.skipPregame();
        this.updateProgressText();
    }

    onCreate() {
        this.onEngineCreate();
        super.onCreate();
    }

    step() {
        super.step();

        if(this.minigameOver()){
            return;
        }

        var leafCorrection = EngineUtils.randomRange(-0.4,0.4);
        if(this.score >= this.maxScore && this.lives > 0){
            IM.with(FallingObject, function(object){
                object.destroy();
            })
            if(this.lives == 5){
                $engine.activateAchievement("CATCH_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            this.endMinigame(true);
        }
        if(this.lives <= 0 && !this.gameEndDelaySwitch){ // BIG DROP
            IM.with(FallingObject, function(object){
                object.destroy();
            });
            /*for(var l = 0; l< 100; l++) {
                new FallingObject(EngineUtils.irandomRange(200,600),-50,0,leafCorrection,-1);
            }*/
            this.gameEndDelaySwitch = true;
        }          
        
        if(this.gameEndDelaySwitch){
            this.gameEndDelay--;
            if(this.gameEndDelay == 0){
                this.endMinigame(false);
            }
        }


       
        if(this.fallTimer>=this.nextObject) {
            this.fallTimer = 0;

            if(EngineUtils.irandomRange(0,100) >= 75 || this.noleaf >= 3){
                this.noleaf = 0;
                new FallingObject(EngineUtils.irandomRange(26,52) + 80 * EngineUtils.irandom(this.columns),-50,0,leafCorrection,80);
            }else{
                this.noleaf++;
                new FallingObject(EngineUtils.irandomRange(26,52) + 80 * EngineUtils.irandom(this.columns),-50,1,leafCorrection,80);
            }   
        }

        this.fallTimer++;
        this.handleShake();
        this.updateProgressText();
        
    }

    handleShake() {
        var camera = $engine.getCamera();
        var fac = EngineUtils.interpolate(this.shakeTimer/this.shakeFactor,0,1,EngineUtils.INTERPOLATE_OUT_QUAD);
        camera.setRotation(EngineUtils.randomRange(-0.01,0.01)*fac);
        camera.setLocation(EngineUtils.irandomRange(-2,2) * fac, EngineUtils.irandomRange(-2,2) * fac);
        this.shakeTimer--;
    }

    shake(factor = 20) {
        if(this.shakeTimer < 0);
            this.shakeTimer=0;
        this.shakeTimer+=factor;
    }

    shakeCamera(fac) {
        this.cameraShakeTimer+=fac;
    }

    updateProgressText() {
        this.progressText.text = "Progress:  Leaves  "+String(this.score+" / "+String(this.maxScore));
    }

    draw(gui,camera) {
        super.draw(gui,camera);
        $engine.requestRenderOnCamera(this.progressText);
    }

    notifyFramesSkipped(frames) {
    }

    getPlayer() {
        return this.player;
    }
    
}

class FallingHealth extends EngineInstance {
    onEngineCreate() {
        this.setSprite(new PIXI.Sprite($engine.getTexture("health_heart")));
        this.xScale = 0.7;
        this.yScale = 0.7;
    }

    onCreate(x,y,num) {
        this.x = x;            
        this.y = y;
        this.num = num;
        this.onEngineCreate();
    }

    step() {
        if(FallingObjectsController.getInstance().healthArr[this.num] === 0){
            //$engine.audioPlaySound("worm_die");
            this.destroy();
        }
    }
    draw(gui,camera) {
    }
}



class FallingObject extends EngineInstance {

    onEngineCreate() {
        
        this.dy = EngineUtils.randomRange(17,21);
        this.fell = false;

        
        var imageTextureName = !this.isLeaf ? "falling_object_rocks" : "leaf_particles";
        var signTextureName = !this.isLeaf  ? "falling_object_warning" : "falling_object_leaf";
        this.warning = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture(signTextureName)));
        this.warning.y = 200;
        this.warning.x = this.x;

        this.dz = EngineUtils.randomRange(-0.05,0.05);
        this.grav = 0.25;

        this.xScale = EngineUtils.irandom(1)===1 ? 1 : -1;
        this.angle = EngineUtils.random(10);

        this.drag = 0.95;
        this.magnetEffect =  0.15;
        this.magnetFalloffDistance = 256;
        this.yScale = 0.4;
        this.xScale = 0.4;

        this.setSprite(new PIXI.Sprite($engine.getRandomTextureFromSpritesheet(imageTextureName)));

        if(this.isLeaf) {
            this.hitbox = new Hitbox(this, new RectangleHitbox(this,-56,-56,56,56))
        } else {
            this.hitbox = new Hitbox(this, new RectangleHitbox(this,-32,-32,32,32))
        }

        if(this.isLeaf && FallingObjectsController.getInstance().hasCheated())
            this.dy/=4;
    }

    onCreate(x,y,object,leafDir,time) {
        this.x=x;
        this.y=y;
        this.dx = leafDir;
        this.object = object;
        this.isLeaf = object===0
        this.warningTime = time;
        this.onEngineCreate();
    }

    step() {
        this.warningTime--;
        if(this.warningTime > 0){
            this.warning.visible = true;
            // invis for last 20 frames
            this.warning.alpha = EngineUtils.interpolate((this.warningTime-20)/30,0,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL)
        }else{
            this.warning.visible = false;
            this.x+=this.dx;
            this.y+=this.dy;
        }


        if(this.y > $engine.getWindowSizeY() - 80 && !this.fell){
            this.dx = EngineUtils.randomRange(-2,2);
            this.dy = EngineUtils.randomRange(-5,-2.5);
            this.dz = EngineUtils.randomRange(-0.05,0.05);
            this.fell = true;
            if(!this.isLeaf) {
                $engine.audioPlaySound("catch_landing_rock",0.8).speed = EngineUtils.randomRange(0.8,1.2);
                FallingObjectsController.getInstance().shake(5);
            }
        }

        if(this.fell) {
            this.x+=this.dx;
            this.y+=this.dy;
            this.dy += this.grav;
        }

        this.angle+=this.dz;

        if(this.fell && this.y > $engine.getWindowSizeY() + 40){
            this.destroy();
        }

        var controller = FallingObjectsController.getInstance();

        if(controller.hasCheated() && this.isLeaf) {
            var off = this.x - controller.getPlayer().x
            var fac = EngineUtils.interpolate(Math.abs(off/this.magnetFalloffDistance),this.magnetEffect,0,EngineUtils.INTERPOLATE_IN_QUAD);
            this.dx+=fac * -Math.sign(off);
            this.dx*=this.drag
        }
       

        if(!this.fell && IM.instanceCollision(this,this.x,this.y,FallingObjectsPlayer)) {
            if(this.object == 0){
                controller.score++;
                $engine.audioPlaySound("sky_donk");
            }else{
                controller.lives--;
                controller.healthArr[controller.lives] = 0;
                controller.shake();
                //console.log(controller.healthArr);
                $engine.audioPlaySound("sky_bonk");
            }
            //IM.find(FallingObjectsPlayer,0).hasBeenHurt = true;
            this.destroy();
        }
    }

    draw(gui,camera) {
        $engine.requestRenderOnCamera(this.warning);
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}




class FallingObjectsPlayer extends InstanceMover {
    onEngineCreate() {
        super.onEngineCreate();
        this.dx=0;
        this.hitbox = new Hitbox(this, new RectangleHitbox(this,-96,-640,96,-520));
        this.maxVelocity=14;
        this.turnLagStop=5;
        this.turnLag=1;
        this.animationWalk = $engine.getAnimation("eson_walk_basket");
        this.animationStand = [$engine.getTexture("eson_walk_basket_0")];
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
    }

    canControl() {
        return true;
    }

    collisionCheck(x,y) {
        return x < 32 || x > $engine.getWindowSizeX() - 32;
    }

    canControl() {
        return true;
    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}

