class WaterMinigameController extends MinigameController {
    onEngineCreate() { 
        $engine.unlockMinigame(ENGINE_MINIGAMES.WATERING)
        super.onEngineCreate();
        var scoreOffset = $engine.hasItem(ENGINE_ITEMS.FERTILIZER) ? 3 : 0
        this.score = 12 + scoreOffset;
        this.maxScore = 12 + scoreOffset;
        this.penalty = 0;
        this.next = 0;
        this.numberarrows = 0;

        this.buffer = 0;
        this.currentTimer = 0;

        this.lines = [];
        this.measure = -1;
        this.part = 0;
        this.chart = this.convert("charts/chart.txt");

        new ParallaxingBackground("background_garden1");
    
        this.timer = 0;
        this.speedtimer = 0;
        this.speedmul = 0.008;
        this.attempts = 6;

        this.textureBest = $engine.getTexture("ddr_feedback_0");
        this.textureOk = $engine.getTexture("ddr_feedback_1");
        this.textureBad = $engine.getTexture("ddr_feedback_2");

        this.lastNoteResult = $engine.createManagedRenderable(this, new PIXI.Sprite(PIXI.Texture.EMPTY));
        this.lastNoteResult.anchor.set(0.5);
        this.lastNoteResult.scale.set(0.3)

        this.lastNoteResult.x = $engine.getWindowSizeX()/2;
        this.lastNoteResult.y = $engine.getWindowSizeY()/2+120;

        this.feedbackTimer = 9999;

        this.eventListenerAttached = false;
        this.musicPlaying = false;
        this.fulltimer = 0;
        
        this.startTimer(60*60);
        this.getTimer().setSurvivalMode();
        this.x = 149;
        this.y = $engine.getWindowSizeY() -180;

        var ddr_tiles = ["arrow_left_c", "arrow_down_c", "arrow_up_c", "arrow_right_c"];
        this.ddr_tiles = ddr_tiles;

        this.sprite0 = new PIXI.Sprite($engine.getTexture("arrow_left"));
        $engine.createRenderable(this, this.sprite0, true);
        this.sprite1 = new PIXI.Sprite($engine.getTexture("arrow_down"));
        $engine.createRenderable(this, this.sprite1, true);
        this.sprite1.dx = 120;


        this.sprite2 = new PIXI.Sprite($engine.getTexture("arrow_up"));
        $engine.createRenderable(this, this.sprite2, true);
        this.sprite2.dx = 240;
        this.sprite3 = new PIXI.Sprite($engine.getTexture("arrow_right"));
        $engine.createRenderable(this, this.sprite3, true);
        this.sprite3.dx = 360;

        var plant_array = [];
        this.plant_array = plant_array;

        var plant_sprites = ["plant_1", "plant_2", "plant_3", "plant_1_ded", "plant_2_ded", "plant_3_ded"];
        this.plant_sprites = plant_sprites;

       

        this.shakeTimer = 0;
        this.shakeFactor = 8;

        for(var i = 0; i < 12; i++) {
            if(i < 3){
                plant_array[i] = new WaterPlant(90*2+200*i, $engine.getWindowSizeY()/2 -110);        
            }if(i >= 3 && i < 6){
                plant_array[i] = new WaterPlant(90*2+200*(i-3), $engine.getWindowSizeY()/2+25);        
            }if(i >= 6 && i < 9){
                plant_array[i] = new WaterPlant(90*3+200*(i-6), $engine.getWindowSizeY()/2 +90);
            }if(i >= 9 && i < 12){
                plant_array[i] = new WaterPlant(90*3+200*(i-9), $engine.getWindowSizeY()/2 -70);
            }
        }

        this.addOnCheatCallback(this, function(controller){
            $engine.audioPauseSound(WaterMinigameController.getInstance().musicStandard)
            $engine.audioPauseSound(WaterMinigameController.getInstance().musicCheat)
            if(WaterMinigameController.getInstance().musicPlaying){
                WaterMinigameController.getInstance().fulltimer = (120 + Math.abs(WaterMinigameController.getInstance().y-100)/6)+5;
            }
            WaterMinigameController.getInstance().musicPlaying = false;
            WaterMinigameController.getInstance().chart = WaterMinigameController.getInstance().convert("charts/cheatChart.txt");
            if(WaterMinigameController.getInstance().measure >= 0){
                WaterMinigameController.getInstance().currLength = 120/(WaterMinigameController.getInstance().chart[WaterMinigameController.getInstance().measure].length);
            }
            WaterMinigameController.getInstance().lines = [];
            controller.speedmul = 0;
            IM.with(DDRTiles, function(tile){
                tile.destroy();
            });
        });

        this.addOnGameEndCallback(this, function(self) {
            IM.with(DDRTiles, function(tile){
                tile.destroy();
            });
        });

        //this.hitbox = new Hitbox(this,new RectangleHitbox(this,-25,-37,25,37));

        var text = new PIXI.Text("Use the movement keys to water the plants.\n Follow the orders, pressing the keys at the right time.\n Missed watering steps causes plants to die. \n\n Keep at least ONE plant alive, and keep up.\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.setControls(true,false);
        this.skipPregame();

        this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;

        this.updateProgressText();
        this.randomPlantSelect();
        new WaterCan(); // must be in this order
        
        this.setCheatTooltip("Let's try simplifying this, shall we?");
        this.setLossReason("Maybe try practicing on BreadHeist?");
    }

    _onMinigameEnd(self, expired){
        window.removeEventListener("blur", this.focusOutHandler, true);
        window.removeEventListener("focusout", this.focusOutHandler, true);
        console.log('hehe')
        super._onMinigameEnd(self, expired);
    }

    stopMusic(){
        $engine.audioPauseSound(this.musicStandard);
        $engine.audioPauseSound(this.musicCheat);
    }

    _initMusic() {
        this.musicStandard = $engine.audioPlaySound("minigame_music",0.5)
        $engine.audioPauseSound(this.musicStandard)

        this.musicCheat = $engine.audioPlaySound("minigame_music_cheat",0.5)
        $engine.audioSetVolume(this.musicCheat,0); // this call is because the engine uses the input volume for future calculations.
        $engine.audioPauseSound(this.musicCheat)

        this.ambience = $engine.audioPlaySound("minigame_ambience",1,true,EngineUtils.random(111),111)
        $engine.audioSetLoopPoints(this.ambience,0,111)
        $engine.audioSetVolume(this.ambience,0);
    }

    startMinigame(){
        if(this._minigameStarted)
            throw new Error("Minigame is already started.")
        this._minigameStarted=true;
        $engine.audioPlaySound("minigame_start",0.75)

        this.delayedAction($engine.isGamePaused() ? 0 : 60, function() {
            if(this._timer && !this._skipPregame)
                this._timer.unpauseTimer();
            this._onGameStart();
            this.routine(this._fadeInMusic);
        });
    }

    handleShake() {
        var camera = $engine.getCamera();
        var fac = EngineUtils.interpolate(this.shakeTimer/this.shakeFactor,0,1,EngineUtils.INTERPOLATE_OUT_QUAD);
        camera.setRotation(EngineUtils.randomRange(-0.01,0.01)*fac);
        camera.setLocation(EngineUtils.irandomRange(-2,2) * fac, EngineUtils.irandomRange(-2,2) * fac);
        this.shakeTimer--;
    }

    focusOutHandler(event) {
        WaterMinigameController.getInstance().stopMusic()
        WaterMinigameController.getInstance().buffer = 13
        WaterMinigameController.getInstance().currentTimer = 1
        WaterMinigameController.getInstance().musicPlaying = false
    }

    shake(factor = 20) {
        if(this.shakeTimer < 0);
            this.shakeTimer=0;
        this.shakeTimer+=factor;
    }

    notifyFramesSkipped(frames) {
    }

    onCreate() { 
        super.onCreate();
        this.onEngineCreate();
    }

    min(num1, num2){
        if(num1 < num2){
            return num1
        }
        else{
            return num2
        }
    }

    step() {
        super.step();

        if(IN.keyCheckPressed("RPGup")){
            this.sprite2.tint = 0x888888;
        }

        if(IN.keyCheckReleased("RPGup")){
            this.sprite2.tint = 0xFFFFFF;
        }

        if(IN.keyCheckPressed("RPGleft")){
            this.sprite0.tint = 0x888888;
        }

        if(IN.keyCheckReleased("RPGleft")){
            this.sprite0.tint = 0xFFFFFF;
        }

        if(IN.keyCheckPressed("RPGdown")){
            this.sprite1.tint = 0x888888;
        }

        if(IN.keyCheckReleased("RPGdown")){
            this.sprite1.tint = 0xFFFFFF;
        }

        if(IN.keyCheckPressed("RPGright")){
            this.sprite3.tint = 0x888888;
        }

        if(IN.keyCheckReleased("RPGright")){
            this.sprite3.tint = 0xFFFFFF;
        }

        if(this.minigameOver()){
            if(!this.hasCheated() && this.score == this.maxScore){
                $engine.activateAchievement("WATERING_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            return;
        }

        // if((this.timer >= (30 -  this.speedtimer * this.speedmul)) && this.numberarrows <= 74){

        //     new DDRTiles(149, 100, 0);
        //     this.numberarrows++;
        //     this.timer = 0;
        // }
        if(this.timer >= 120 && this.measure <= 27){
            this.measure++;
            this.timer = 0;

            if(this.measure <= 27){
                this.currLength = 120/(this.chart[this.measure].length);
            }
        }

        if(this.fulltimer > (120 + 5 + Math.abs(this.y-100)/6) && !this.musicPlaying && this.buffer == 0){
            this._startMusic();
            this.musicPlaying = true;

            if(this.currentTimer != 0){
                var tile = IM.find(DDRTiles, 0);
                if(tile === undefined){
                    return;
                }
                var nice = Math.abs(tile.y - this.currentTimer)/6
                console.log("nice")
                console.log(nice)
                this.currentTimer = 0
            }
            if(!this.eventListenerAttached){
                window.addEventListener("blur", this.focusOutHandler, true);
                window.addEventListener("focusout", this.focusOutHandler, true);
                this.eventListenerAttached = true;
            }

            // window.observe('focus:in', function(event) {
                
            // });

            // window.observe('focus:out', function(event) {
            //     this.stopMusic()
            // });
            // if (window.addEventListener){
            //     window.addEventListener("focus", WaterMinigameController.getInstance()._startMusic, true);
            //     window.addEventListener("blur", WaterMinigameController.getInstance().stopMusic, true);
            // } else {
            //     window.observe("focusin", WaterMinigameController.getInstance()._startMusic);
            //     window.observe("focusout", WaterMinigameController.getInstance().stopMusic);
            // }
        }

        if(this.timer%this.currLength == 0 && this.timer >= 0 && this.buffer == 0 && this.measure <= 27){
            var note = this.chart[this.measure][this.timer/this.currLength];
            this.lines.push(note);

            for(var i = 0; i < note.length; i++){
                if(note[i] != '0'){
                    new DDRTiles(149, 100, i);
                }
            }
        }

        if(this.score <= 0){
            this.getTimer().pauseTimer;
            window.removeEventListener("blur", this.focusOutHandler, true);
            window.removeEventListener("focusout", this.focusOutHandler, true);

            this.endMinigame(false);
        }

        if(this.getTimer().getTimeRemaining() < 1){
            window.removeEventListener("blur", this.focusOutHandler, true);
            window.removeEventListener("focusout", this.focusOutHandler, true);
        }

        this.tileHit();

        if(this.penalty > 0){
            this.penalty--;
        }

        this.updateProgressText();
        this.handleShake();
        this.handleFeedback();
        if(this.buffer == 0){
            this.timer++;
        }
        else{
            this.buffer--;
            if(this.buffer == 0){
                this.timer++;
            }
        }
        this.fulltimer++;
        this.speedtimer++;
    }
    
    handleFeedback() {
        var fac = EngineUtils.interpolate(this.feedbackTimer/20,0,0.3,EngineUtils.INTERPOLATE_OUT_BACK);
        this.lastNoteResult.scale.y = fac;
        var fac2 = EngineUtils.interpolate((this.feedbackTimer-20)/10,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this.lastNoteResult.alpha = fac2;
        this.feedbackTimer++;
    }

    randomPlantSelect(){
        this.index = EngineUtils.irandomRange(0, WaterMinigameController.getInstance().plant_array.length-1);
        this.plant = WaterMinigameController.getInstance().plant_array[this.index];
    }

    tileHit() {
        var current_line = this.lines[0];
        var current_tiles = [0,0,0,0];
        var current_tile = IM.find(DDRTiles, 0);
        var count = 0;
        if(current_tile === undefined || current_line === undefined || this.penalty != 0){
            return;
        }
        for(var i = 0; i < current_line.length; i++){
            if(current_line[i] != '0'){
                var current = IM.find(DDRTiles, count);
                count++;
                current_tiles[current.arrow] = current;
            }
        }

        var success = false;
        if($engine.getWindowSizeY() -220 <= current_tile.y && current_tile.y <= $engine.getWindowSizeY()){

            var line_list = Array.from(current_line)
            if(IN.keyCheckPressed("RPGleft") && current_line[0] != '0'){
                WaterMinigameController.getInstance().next = 1;
                $engine.audioPlaySound("card_flip");
                line_list[0] = '0';
                current_tiles[0].clicked = true;
                current_tiles[0].destroy();
                success = true;
            }
            if(IN.keyCheckPressed("RPGdown") && current_line[1] != '0'){
                WaterMinigameController.getInstance().next = 1;
                $engine.audioPlaySound("card_flip");
                line_list[1] = '0';
                current_tiles[1].clicked = true;
                current_tiles[1].destroy();
                success = true;
            }
            if(IN.keyCheckPressed("RPGup") && current_line[2] != '0'){
                WaterMinigameController.getInstance().next = 1;
                $engine.audioPlaySound("card_flip");
                line_list[2] = '0';
                current_tiles[2].clicked = true;
                current_tiles[2].destroy();
                success = true;
            }
            if(IN.keyCheckPressed("RPGright") && current_line[3] != '0'){
                WaterMinigameController.getInstance().next = 1;
                $engine.audioPlaySound("card_flip");
                line_list[3] = '0';
                current_tiles[3].clicked = true;
                current_tiles[3].destroy();  
                success = true;  
            }
            current_line = line_list.join('');
            this.lines[0] = current_line;
        }
        if(current_line == '0000' || current_tile.y >= $engine.getWindowSizeY()){
            this.lines.shift();
        }

        if(!success && ((IN.keyCheckPressed("RPGright") && current_line[3] == '0') || (IN.keyCheckPressed("RPGdown") && current_line[1] == '0')
        || (IN.keyCheckPressed("RPGleft") && current_line[0] == '0') || (IN.keyCheckPressed("RPGup") && current_line[2] == '0')
        || (current_tile.y > $engine.getWindowSizeY()))){
            this.penalty = 0;
            current_tile.getSprite().tint = (0xab1101);
            $engine.audioPlaySound("wall_miss");
            this.notifyHit(-1,false)
        }
    }

    notifyHit(location, hit=true) {
        var diff = Math.abs(this.y - location);

        this.feedbackTimer = 0;
        if(!hit || location >= $engine.getWindowSizeY()){
            this.lastNoteResult.texture=this.textureBad;
            return;
        }
        if(diff < 12) {
            this.lastNoteResult.texture=this.textureBest
        } else {
            this.lastNoteResult.texture=this.textureOk
        }
    }


    updateProgressText() {
        this.progressText.text = "Progress:  Plants Alive  "+String(this.score+" / "+String(this.maxScore));
    }

    convert(file){
        var content = EngineUtils.readLocalFile(file);
        var contentList = content.split(',\r\n');
        for(var i = 0; i < contentList.length; i++){
            contentList[i] = contentList[i].split('\r\n');
            contentList[i].pop();
        }
        return contentList;
    }
  

    draw(gui, camera) {
        super.draw(gui, camera);     
        //EngineDebugUtils.drawHitbox(camera,this);
        $engine.requestRenderOnCameraGUI(this.progressText);
        $engine.requestRenderOnCameraGUI(this.lastNoteResult);
    }

}


class DDRTiles extends EngineInstance {
    onCreate(x,y,arrow) {
        this.depth = -10;
        this.arrow = arrow;
        this.x = x + this.arrow*120;
        this.y = y;
        this.speed = 6;
        this.setSprite(new PIXI.Sprite($engine.getTexture(WaterMinigameController.getInstance().ddr_tiles[this.arrow])));
        this.clicked = false;
    }

    step(){
        this.y += this.speed;
        
        //if(this.y >= $engine.getWindowSizeY() - 170){  /// testing for new track
        if(this.y - 24 >= $engine.getWindowSizeY() - 140){     
            WaterMinigameController.getInstance().score--;
            WaterMinigameController.getInstance().shake();
            $engine.audioPlaySound("sky_donk");
            //console.log(WaterMinigameController.getInstance().speedtimer / 60);
            //var plant = IM.randomInstance(WaterPlant);
            var plant = WaterMinigameController.getInstance().plant;
            plant.getSprite().texture = $engine.getTexture(WaterMinigameController.getInstance().plant_sprites[plant.index + 3]);

            WaterMinigameController.getInstance().plant_array.splice(WaterMinigameController.getInstance().index, 1);
            var line_list = Array.from(WaterMinigameController.getInstance().lines[0]);
            line_list[this.arrow] = '0';
            WaterMinigameController.getInstance().lines[0] = line_list.join('');
            this.destroy();
            WaterMinigameController.getInstance().next = 2;
        }
    }

    onDestroy() {
        WaterMinigameController.getInstance().notifyHit(this.y, this.clicked);
    }
}


class WaterPlant extends EngineInstance {
    onCreate(x,y) {
        this.x = x;
        this.y = y;
        this.index = EngineUtils.irandomRange(0,2);
        this.score = 1;
        this.setSprite(new PIXI.Sprite($engine.getTexture(WaterMinigameController.getInstance().plant_sprites[this.index])));
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-25,-37,25,37));
        this.clicked = false;
    }
}


class WaterCan extends EngineInstance {
    onCreate() {
        this.timer = 0;
        this.endTime = 20;
        this.depth = -9;

        var plant = WaterMinigameController.getInstance().plant;
        console.log(plant);
        this.x = plant.x -50;
        this.y = plant.y -60;
        this.ex = this.x;
        this.ey = this.y;
        this.sx = this.x;
        this.sy = this.y;

        this.animation = $engine.createRenderable(this,new PIXI.extras.AnimatedSprite($engine.getAnimation("water_can_anim")));
        //this.animation.animationSpeed = 0.12;
        this.animation.animationSpeed = 0.2;
        //this.x = x-100;
        //this.y = y;
        this.setSprite(this.animation);
        //this.setSprite(new PIXI.Sprite($engine.getTexture("worm_5")));
    }

    step(){
        this.timer++;
        this.animation.update(1);
        if((WaterMinigameController.getInstance().next === 1 || WaterMinigameController.getInstance().next === 2) && WaterMinigameController.getInstance().plant_array.length >= 1){  
            //$engine.audioPlaySound("umbrella_rain_1");
            //$engine.audioPauseSound("umbrella_rain_1");
            WaterMinigameController.getInstance().randomPlantSelect();
            var plant = WaterMinigameController.getInstance().plant;
            //console.log(plant);

           
            this.ex = plant.x -50;
            this.ey = plant.y -60;

            this.sx = this.x;
            this.sy = this.y;
            WaterMinigameController.getInstance().next = 0;
            this.timer = 0;
        }

        

        if(this.x != this.ex && this.y != this.ey){
            this.x = EngineUtils.interpolate(this.timer/this.endTime,this.sx,this.ex,EngineUtils.INTERPOLATE_SMOOTH);
            this.y = EngineUtils.interpolate(this.timer/this.endTime,this.sy,this.ey,EngineUtils.INTERPOLATE_SMOOTH);
        }
        
    }
    

    draw(gui,camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }

}