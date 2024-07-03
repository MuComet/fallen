class GardenMinigameController extends MinigameController {
    
    onEngineCreate() { 
        $engine.unlockMinigame(ENGINE_MINIGAMES.WORMS)
        super.onEngineCreate();
        var scoreOffset = $engine.hasItem(ENGINE_ITEMS.FERTILIZER) ? 1 : 0
        this.score = 5 + scoreOffset;
        this.maxScore = 5 + scoreOffset;
        this.wormsmissed = 0;
        this.wormsMax = 10 + scoreOffset * 2;
        this.speedup = 0;


        new ParallaxingBackground("background_garden1");
    
        this.timer = 40;
        this.attempts = 6;
        this.waiting = false;
        this.waitTimer = 0;
        this.rightbound = 90*2+200;
        
        this.startTimer(30*60);
        this.getTimer().setSurvivalMode();
        this.x = 90*2-100;
        this.y = $engine.getWindowSizeY()/2 -150;

        this.sprite = new PIXI.Sprite($engine.getTexture("selector_cloud"));
        $engine.createRenderable(this, this.sprite, true);
        this.sprite.dx = 27;
        this.sprite2 = new PIXI.Sprite($engine.getTexture("selector_cloud"));
        $engine.createRenderable(this, this.sprite2, true);
        this.sprite2.dx = 200+27;
        this.sprite2.visible = false;

        this.addOnCheatCallback(this, function(selector){
            selector.rightbound = 90*2;
            if(selector.x === 480 || selector.x === 570){
                selector.x -= 200;
            }
            selector.sprite2.visible = true;
        });

        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-25,-37,25,37));

        var text = new PIXI.Text("Use Arrows to select a worm's spawn hole. Protect the \n garden's vegetation and spray the worms\n before they can retreat and eat the plants. \n Press SPACE to spray.\n\n You may lose at most "+String(this.maxScore)+" plants \n AND miss spraying at most "+String(this.wormsMax)+" worms. \n\nPress ENTER to cheat!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.setControls(true,false);
        this.skipPregame();

        //this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        //$engine.createManagedRenderable(this,this.progressText);
        //this.progressText.anchor.set(0.5,0.5);
        //this.progressText.x = $engine.getWindowSizeX()/2 - 30;
        //this.progressText.y = $engine.getWindowSizeY()-30;

        var plant_array = [];
        this.plant_array = plant_array;

        var plant_sprites = ["plant_0", "plant_1", "plant_2", "plant_3"];
        this.plant_sprites = plant_sprites;

        this.shakeTimer = 0;
        this.shakeFactor = 8;

        for(var i = 0; i < 9; i++) {
            if(i < 3){
                plant_array[i] = new GardenPlant(90*2+200*i, $engine.getWindowSizeY()/2 -150, i);
                new GardenHoles(90*2+200*i, $engine.getWindowSizeY()/2 -150);        
            }if(i >= 3 && i < 6){
                plant_array[i] = new GardenPlant(90*3+200*(i-3), $engine.getWindowSizeY()/2, i);
                new GardenHoles(90*3+200*(i-3), $engine.getWindowSizeY()/2);
            }if(i >= 6 && i < 9){
                plant_array[i] = new GardenPlant(90*2+200*(i-6), $engine.getWindowSizeY()/2 +150, i);
                new GardenHoles(90*2+200*(i-6), $engine.getWindowSizeY()/2 +150);
            }
        }

        this.healthArr = [];
        for(var i =0;i<this.wormsMax;i++) {
            this.healthArr.push(1);
        }
        for(var h = 0; h < this.wormsMax; h++){
            new GardenHealth(760 - 25*h, 590, h);
        }

        this.healthPlantArr = [];
        for(var i =0;i<this.maxScore;i++) {
            this.healthPlantArr.push(1);
        }
        for(var p = 0; p < this.maxScore; p++){
            new GardenPlantHealth(760 - 25*p, 530, p);
        }


        //this.updateProgressText();
        this.setCheatTooltip("I found an EXTRA spray can!");
        this.setLossReason("WORMS SLOW DOWN PLEASE");
    }

    notifyFramesSkipped(frames) {
        // this.getTimer().tickDown(frames); // survival mode, do nothing.
    }

    onCreate() { 
        super.onCreate();
        this.onEngineCreate();
    }

    step() {
        super.step();
        if(this.minigameOver()){
            if(!this.hasCheated() && this.wormsmissed == 0){
                greenworks.activateAchievement("WORM_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            return;
        }
        if(this.timer >= 75 - this.speedup*0.008){
            var spawnI = EngineUtils.irandomRange(0,8);
            IM.with(GardenWorm, function(worm){
                if(worm.index === spawnI){
                    spawnI = EngineUtils.irandomRange(0,8);;
                }
            });
            this.spawnWorm(spawnI);
            $engine.audioPlaySound("worm_digup");
            //$engine.audioPlaySound("worm_appear");
            this.timer = 0;
        }

        this.moveSpray();
        this.countPlants();
        //this.updateProgressText();
        this.handleShake();
        this.timer++;
        this.speedup++;
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

    //updateProgressText() {
        //this.progressText.text = "Progress:  Plants Left  "+String(this.score+" / "+String(this.maxScore));
    //}
  
    countPlants(){
        var temp_score = 0;
        for(var i = 0; i < 9; i++){
            if(this.plant_array[i] == undefined){
                temp_score++;
            }
        }
        this.score = this.maxScore - temp_score;
        if(this.score <= 0 || this.wormsmissed >= this.wormsMax){
            this.getTimer().pauseTimer();
            this.endMinigame(false);
        }
    }

    spawnWorm(spawnI){
        if(spawnI < 3){
            new GardenWorm(90*2+200*spawnI, $engine.getWindowSizeY()/2 -150, spawnI);       
        }if(spawnI >= 3 && spawnI < 6){
            new GardenWorm(90*3+200*(spawnI-3), $engine.getWindowSizeY()/2, spawnI);
        }if(spawnI >= 6 && spawnI < 9){
            new GardenWorm(90*2+200*(spawnI-6), $engine.getWindowSizeY()/2 +150, spawnI);
        }
    }

    moveSpray(){
        if(IN.keyCheckPressed("RPGright") && this.x <= this.rightbound){  
            this.x += 200;
        }
        //console.log(this.x, this.rightbound);
        if(IN.keyCheckPressed("RPGleft") && this.x > 90*2){
            this.x -= 200;
        }
        if(IN.keyCheckPressed("RPGdown") && this.y < $engine.getWindowSizeY()/2 +150){
            if(this.x === 90*2-100 || this.x === 90*2+100 || this.x === 90*2+300){
                this.x += 90;
            }else{
                this.x -= 90;
            }
            this.y += 150;
        }
        if(IN.keyCheckPressed("RPGup") && this.y > $engine.getWindowSizeY()/2 -150){
            if(this.x === 90*2-100 || this.x === 90*2+100 || this.x === 90*2+300){
                this.x += 90;
            }else{
                this.x -= 90;
            }
            this.y -= 150;
        }
        
    }


    draw(gui, camera) {
        super.draw(gui, camera);     
        //EngineDebugUtils.drawHitbox(camera,this);
        //$engine.requestRenderOnCameraGUI(this.progressText);
    }

}

class GardenHoles extends EngineInstance {
    onCreate(x,y) {
        this.depth = 10;
        this.x = x-100;
        this.y = y;
        this.setSprite(new PIXI.Sprite($engine.getTexture("worm_0")));
    }
}


class GardenWorm extends EngineInstance {
    onCreate(x,y,index) {
        this.depth = 10;

        this.index = index;
        this.animation = $engine.createRenderable(this,new PIXI.extras.AnimatedSprite($engine.getAnimation("worm_anim")));
        //this.animation.animationSpeed = 0.12;
        this.animation.animationSpeed = 0.18;
        this.x = x-100;
        this.y = y;
        this.setSprite(this.animation);
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-25,-37,25,37));
        this.clicked = false;
        this.wormTimer = 0;
        this.wormTimerEat = 60;
        this.deathTime = 0;    
    }

    step(){
        if(this.deathTime === 0){
            this.animation.update(1);
        }

        if(this.wormTimer >= this.wormTimerEat && this.deathTime === 0 && GardenMinigameController.getInstance().plant_array[this.index] != undefined){            
            GardenMinigameController.getInstance().plant_array[this.index] = undefined;
            GardenMinigameController.getInstance().healthPlantArr[GardenMinigameController.getInstance().score -1] = 0;
            GardenMinigameController.getInstance().wormsmissed++;
            GardenMinigameController.getInstance().healthArr[GardenMinigameController.getInstance().wormsMax - GardenMinigameController.getInstance().wormsmissed] = 0;
            this.destroy();
        }else if(this.wormTimer >= this.wormTimerEat && this.deathTime === 0){            
            //GardenMinigameController.getInstance().plant_array[this.index] = undefined;
            GardenMinigameController.getInstance().wormsmissed++;
            GardenMinigameController.getInstance().healthArr[GardenMinigameController.getInstance().wormsMax - GardenMinigameController.getInstance().wormsmissed] = 0;
            this.destroy();
        }

        if(GardenMinigameController.getInstance().hasCheated()){
            if(IN.keyCheckPressed("Space") && (IM.instanceCollisionPoint(GardenMinigameController.getInstance().x,
            GardenMinigameController.getInstance().y, this) || IM.instanceCollisionPoint(GardenMinigameController.getInstance().x + 200,
            GardenMinigameController.getInstance().y, this)) && this.deathTime === 0){

                GardenMinigameController.getInstance().shake();
                this.deathTime = this.wormTimer;
                this.getSprite().texture = $engine.getTexture("garden_worm_dead");
                $engine.audioStopSound("worm_digup");
                $engine.audioPlaySound("worm_kill");
            }
        }else if(IN.keyCheckPressed("Space") && IM.instanceCollisionPoint(GardenMinigameController.getInstance().x,
         GardenMinigameController.getInstance().y, this) && this.deathTime === 0){

            GardenMinigameController.getInstance().shake();
            this.deathTime = this.wormTimer;
            this.getSprite().texture = $engine.getTexture("garden_worm_dead");
            $engine.audioStopSound("worm_digup");
            $engine.audioPlaySound("worm_kill");
        }

        if(this.wormTimer > this.deathTime + 60 && this.deathTime !== 0){
            this.destroy();
            //$engine.audioPlaySound("worm_die");
        }
        this.wormTimer++;
    }

}

class GardenPlant extends EngineInstance {
    onCreate(x,y,index) {
        this.x = x;
        this.y = y;
        this.index = index;
        this.score = 1;
        this.setSprite(new PIXI.Sprite($engine.getTexture(GardenMinigameController.getInstance().plant_sprites[EngineUtils.irandomRange(1,3)])));
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-25,-37,25,37));
        this.clicked = false;
    }
    step(){
        if(!this.clicked && GardenMinigameController.getInstance().plant_array[this.index] === undefined){
            this.getSprite().texture = $engine.getTexture(GardenMinigameController.getInstance().plant_sprites[0]);
            $engine.audioPlaySound("worm_chomp");
            this.clicked = true;
        }
    }
}


class GardenPlantHealth extends EngineInstance {
    onEngineCreate() {
        this.setSprite(new PIXI.Sprite($engine.getTexture(GardenMinigameController.getInstance().plant_sprites[3])));
        this.xScale = 0.9;
        this.yScale = 0.9;
    }

    onCreate(x,y,num) {
        this.x = x;            
        this.y = y;
        this.num = num;
        this.onEngineCreate();
    }

    step() {
        if(GardenMinigameController.getInstance().healthPlantArr[this.num] == 0){
            this.destroy();
        }
    }
    draw(gui,camera) {
    }
}




class GardenHealth extends EngineInstance {
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
        if(GardenMinigameController.getInstance().healthArr[this.num] == 0){
            this.destroy();
        }
    }
    draw(gui,camera) {
    }
}