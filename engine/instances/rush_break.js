class RushBreakController extends EngineInstance {

    // important note: This class, by nature of having to deal with engine start, is allowed access to engine data.

    onEngineCreate() {

        $__engineData.__readyOverride=false;

        this.loadText = $engine.createManagedRenderable(this, new PIXI.Text("Press L to load crash autosave.", $engine.getDefaultTextStyle()));
        this.loadText.anchor.x = 0.5;
        this.loadText.anchor.y = 1;
        this.loadText.x = $engine.getWindowSizeX()/2;
        this.loadText.y = $engine.getWindowSizeY();

        this.cameraTargetX =0;
        this.cameraTargetY =0;

        this.data = $engine.getEngineGlobalData();
        
        if(this.data.rushGames === undefined){
            this.rushGameLost();
            this.data.lastResult = 2
            this.data.didCheat = 2
        }
        if(this.data.bestRunCheat === undefined){
            this.data.bestRunCheat = 1;
            this.data.bestRunNoCheat = 1;
        }

        this.choices = this.selectRushGames();

        this.activeButtons = [];
        this.activeButton = undefined;

        this.backButton = undefined;

        this.totalUnlockedEndings = 0;
        this.totalUnlockedMinigames = 0;

        this.timer = 0;
        $engine.setBackgroundColour(0x65ceeb)
        this.bg = new PIXI.Sprite($engine.getTexture("intro_background"))
        this.bg.x = -92;
        $engine.setBackground(this.bg)
        this.graphics = $engine.createRenderable(this,new PIXI.Graphics())
        this.endTime = 0;
        this.nextCloud = 0;
        this.nextLeaf = 0;

        this.isFading=false;
        $engine.startFadeIn();

        this.tooltip = $engine.createRenderable(this, new PIXI.Text("",$engine.getDefaultTextStyle()))
        this.tooltip.anchor.x = 0.5;
        this.tooltip.anchor.y = 1;

        RushBreakController.instance = this;

        this.minigameList = [];
        for(const val in ENGINE_MINIGAMES) {
            this.minigameList.push(ENGINE_MINIGAMES[String(val)]);
            if($engine.hasMinigame(val)){
                this.totalUnlockedMinigames++;
            }
        }

        this.selectedMinigameIndex = 0;
        this.selectedMinigameTimer = 0;

        // overwrite the mouse location, PIXI doesn't update immedaitely...
        /*IN.getMouseXGUI()
        IN.__mouseXGUI=410;
        IN.__mouseYGUI=120;*/

        this.menuMusic = $engine.audioPlaySound("extras",1,true)
        $engine.audioSetLoopPoints(this.menuMusic,16,48);

        this.extrasMusic = $engine.audioPlaySound("extras",1,true);
        $engine.audioSetLoopPoints(this.extrasMusic,16,48);
        $engine.audioSetVolume(this.extrasMusic,0)

        this.extrasMusicTimer = 0;

        this.currentRegion = -1;

        this.createButtons();
        this.handleLetters();
        if(this.data.lastResult == 1){
            console.log("lol")
            this.data.lastResult = 2
            if(this.data.didCheat == 1){
                this.data.isCheatRun = true;
            }
            if(this.data.isCheatRun){
                this.rushGameCompletedCheat();
                this.setCheatText();
            }
            else{
                this.rushGameCompleted();
            }
        }
        else if(this.data.lastResult == 0){
            $engine.audioFadeAll();
            this.data.rushGames = undefined;
            $engine.saveEngineGlobalData();
            this.moveToRegion(RushBreakController.REGION_LOSS)
            console.log("hi there")
        }

        if(this.data.isCheatRun){
            this.setCheatText();
        }
        this.setupFloatingObjects();
    }

    setCheatText() {
        var confirmText = new RushFloatingObject(75, 25);
        var style = $engine.getDefaultTextStyle();
        style.fontSize = 25;
        var spr = $engine.createRenderable(confirmText, new PIXI.Text("Cheat run!", style), true)
        spr.anchor.set(0.5);
    }

    setupFloatingObjects() {
        var confirmText = new RushFloatingObject($engine.getWindowSizeX() - 150, 25);
        var style = $engine.getDefaultTextStyle();
        style.fontSize = 25;
        if(this.data.currRunCheat == 1){
            var spr = $engine.createRenderable(confirmText, new PIXI.Text("Current run: " + this.data.currRunCheat + " minigame!",style),true)
        }
        else{
            var spr = $engine.createRenderable(confirmText, new PIXI.Text("Current run: " + this.data.currRunCheat + " minigames!",style),true)
        }
        spr.anchor.set(0.5);

        var lossText = new RushFloatingObject($engine.getWindowSizeX()*2.5, $engine.getWindowSizeY()/2);
        var lossText2 = new RushFloatingObject($engine.getWindowSizeX()*2.5, $engine.getWindowSizeY()/2);
        var lossText3 = new RushFloatingObject($engine.getWindowSizeX()*2.5, $engine.getWindowSizeY()/2);
        var haha = false;
        if(this.data.currRunCheat == 1){
            var spr = $engine.createRenderable(lossText, new PIXI.Text("You made it through " + this.data.currRunCheat + " minigame!",style),true)
        }
        else{
            var spr = $engine.createRenderable(lossText, new PIXI.Text("You made it through " + this.data.currRunCheat + " minigames!",style),true)
        }
        if(this.data.currRunNoCheat == this.data.bestRunNoCheat){
            var spr1 = $engine.createRenderable(lossText2, new PIXI.Text("That was your best run without cheating!",style),true)
            lossText.y -= 50;
            haha = true;
            spr1.anchor.set(0.5);
        }
        if(this.data.currRunCheat == this.data.bestRunCheat && haha){
            var spr2 = $engine.createRenderable(lossText3, new PIXI.Text("And also was your best run yet!",style),true)
            lossText.y -= 50;
            lossText2.y -= 50;
            spr2.anchor.set(0.5);
        }
        else if(this.data.currRunCheat == this.data.bestRunCheat){
            var spr2 = $engine.createRenderable(lossText3, new PIXI.Text("That was your best run yet!",style),true)
            lossText.y -= 50;
            spr2.anchor.set(0.5);
        }
        spr.anchor.set(0.5);
    }

    getGraphicFromMinigame(minigame) {
        switch(minigame.name) {
            case(ENGINE_MINIGAMES.TUTORIAL.name):
                return $engine.getTexture("mingames_sheet_0");
            case(ENGINE_MINIGAMES.SKYBUILD.name):
                return $engine.getTexture("mingames_sheet_1");
            case(ENGINE_MINIGAMES.WALL.name):
                return $engine.getTexture("mingames_sheet_2");
            case(ENGINE_MINIGAMES.DRAW_1.name):
                return $engine.getTexture("mingames_sheet_3");
            case(ENGINE_MINIGAMES.DRAW_2.name):
                return $engine.getTexture("mingames_sheet_4");
            case(ENGINE_MINIGAMES.CATCH.name):
                return $engine.getTexture("mingames_sheet_5");
            case(ENGINE_MINIGAMES.DRAIN.name):
                return $engine.getTexture("mingames_sheet_6");
            case(ENGINE_MINIGAMES.WORMS.name):
                return $engine.getTexture("mingames_sheet_7");
            case(ENGINE_MINIGAMES.CARDS.name):
                return $engine.getTexture("mingames_sheet_8");
            case(ENGINE_MINIGAMES.UMBRELLA.name):
                return $engine.getTexture("mingames_sheet_9");
            case(ENGINE_MINIGAMES.GRAFFITI.name):
                return $engine.getTexture("mingames_sheet_10");
            case(ENGINE_MINIGAMES.WATERING.name):
                return $engine.getTexture("mingames_sheet_11");
            case(ENGINE_MINIGAMES.BOXES.name):
                return $engine.getTexture("mingames_sheet_12");
            case(ENGINE_MINIGAMES.MAZE.name):
                return $engine.getTexture("mingames_sheet_13");
            case(ENGINE_MINIGAMES.WIRE.name):
                return $engine.getTexture("mingames_sheet_14");
            case(ENGINE_MINIGAMES.VIDEO_GAME.name):
                return $engine.getTexture("mingames_sheet_15");
            case(ENGINE_MINIGAMES.FINALE.name):
                return $engine.getTexture("mingames_sheet_16");
        }
    }

    registerBackButton(button) {
        this.backButton = button;
    }

    resetRush(){
        this.data.rushGames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    }

    selectRushGames(){
        var candidates = []
        var choices = []
        for(var i = 0; i < this.data.rushGames.length; i++){
            candidates.push(this.data.rushGames[i]);
        }
        for(var i = 0; i < 3; i++){
            if(candidates.length == 0){
                choices.push(null);
            }
            else{
                var selection = EngineUtils.irandomRange(0, candidates.length-1);
                choices.push(candidates[selection]);
                candidates.splice(selection, 1);
            }
        }
        return choices;
    }

    rushGameSelected(minigame){
        var index = this.data.rushGames.indexOf(minigame)
        this.data.rushGames.splice(index, 1)
    }

    rushGameCompleted(){
        this.data.currRunNoCheat++;
        this.data.currRunCheat++;

        if(this.data.currRunCheat===17){
            $engine.activateAchievement("MINIGAME_RUSH", function() { console.log("Success!")}, function(err) { console.log(err) })
        }
        if(this.data.currRunNoCheat===40){
            $engine.activateAchievement("MINIGAME_RUSH_MORE", function() { console.log("Success!")}, function(err) { console.log(err) })
        }

        if(this.data.currRunNoCheat > this.data.bestRunNoCheat){
            this.data.bestRunNoCheat = this.data.currRunNoCheat;
        }
        if(this.data.currRunCheat > this.data.bestRunCheat){
            this.data.bestRunCheat = this.data.currRunCheat;
        }
    }

    rushGameCompletedCheat(){
        this.data.currRunCheat++;

        if(this.data.currRunCheat > this.data.bestRunCheat){
            this.data.bestRunCheat = this.data.currRunCheat;
        }
    }

    rushGameLost(){
        this.data.currRunNoCheat = 1;
        this.data.currRunCheat = 1;
        this.data.isCheatRun = false;
        this.resetRush();
    }

    setupLossButtons() {
        this.buttons.loss.backButton.setOnPressed(function() {
            $engine.setRoom("MenuIntro");
            RushBreakController.getInstance().data.inRush = false;
            $engine.startFadeOut();
        })
    }

    setupMainMenuButtons() {
        // main 
        if(this.choices[0] == null){
            this.browser = new RushFloatingObject($engine.getWindowSizeX()*0.5, $engine.getWindowSizeY()/2);
            this.browser.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));

            this.currentMinigameGraphic = $engine.createRenderable(this.browser,new PIXI.Sprite(PIXI.Texture.EMPTY), true);
            this.currentMinigameGraphic.anchor.set(0.5)
            this.refreshMinigameBrowser(this.currentMinigameGraphic, this.minigameList[16]);

            this.buttons.playButton1.setOnPressed(function() {
                RushBreakController.getInstance().data.rushGames = [0];
                RushBreakController.getInstance().startSelectedMinigame(16)
            })
        }

        else if(this.choices[0] == 0){
            this.browser = new RushFloatingObject($engine.getWindowSizeX()*0.5, $engine.getWindowSizeY()/2);
            this.browser.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));

            this.currentMinigameGraphic = $engine.createRenderable(this.browser,new PIXI.Sprite(PIXI.Texture.EMPTY), true);
            this.currentMinigameGraphic.anchor.set(0.5)
            this.refreshMinigameBrowser(this.currentMinigameGraphic, this.minigameList[0]);

            this.buttons.playButton1.setOnPressed(function() {
                RushBreakController.getInstance().resetRush();
                RushBreakController.getInstance().startSelectedMinigame(0)
            })
        }

        else if(this.choices[1] == null){
            this.browser = new RushFloatingObject($engine.getWindowSizeX()*0.5, $engine.getWindowSizeY()/2);
            this.browser.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));

            this.currentMinigameGraphic = $engine.createRenderable(this.browser,new PIXI.Sprite(PIXI.Texture.EMPTY), true);
            this.currentMinigameGraphic.anchor.set(0.5)
            this.refreshMinigameBrowser(this.currentMinigameGraphic, this.minigameList[this.choices[0]]);

            this.buttons.playButton1.setOnPressed(function() {
                RushBreakController.getInstance().startSelectedMinigame(RushBreakController.getInstance().choices[0])
                RushBreakController.getInstance().rushGameSelected(RushBreakController.getInstance().choices[0])
            })
        }

        else if(this.choices[2] == null){
            this.browser = new RushFloatingObject($engine.getWindowSizeX()*0.5 - 200, $engine.getWindowSizeY()/2 - 60);
            this.browser.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));

            this.currentMinigameGraphic = $engine.createRenderable(this.browser,new PIXI.Sprite(PIXI.Texture.EMPTY), true);
            this.currentMinigameGraphic.anchor.set(0.5)
            this.refreshMinigameBrowser(this.currentMinigameGraphic, this.minigameList[this.choices[0]]);
            this.currentMinigameGraphic.scale.set(0.6,0.6)// = new PIXI.Point(0.5, 0.5);
            this.browser.xScale = 0.6;
            this.browser.yScale = 0.6;

            this.browser2 = new RushFloatingObject($engine.getWindowSizeX()*0.5 + 200, $engine.getWindowSizeY()/2 - 60);
            this.browser2.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));
            this.browser2.xScale = 0.6;
            this.browser2.yScale = 0.6;

            this.currentMinigameGraphic2 = $engine.createRenderable(this.browser2,new PIXI.Sprite(PIXI.Texture.EMPTY), true);
            this.currentMinigameGraphic2.anchor.set(0.5, 0.5)
            this.refreshMinigameBrowser(this.currentMinigameGraphic2, this.minigameList[this.choices[1]]);
            this.currentMinigameGraphic2.scale = new PIXI.Point(0.6, 0.6);

            this.buttons.playButton1.setOnPressed(function() {
                RushBreakController.getInstance().startSelectedMinigame(RushBreakController.getInstance().choices[0])
                RushBreakController.getInstance().rushGameSelected(RushBreakController.getInstance().choices[0])
            })

            this.buttons.playButton2.setOnPressed(function() {
                RushBreakController.getInstance().startSelectedMinigame(RushBreakController.getInstance().choices[1])
                RushBreakController.getInstance().rushGameSelected(RushBreakController.getInstance().choices[1])
            })
        }

        else{
            this.browser = new RushFloatingObject($engine.getWindowSizeX()*0.5 - 185, $engine.getWindowSizeY()/2-150);
            this.browser.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));

            this.currentMinigameGraphic = $engine.createRenderable(this.browser,new PIXI.Sprite(PIXI.Texture.EMPTY), true);
            this.currentMinigameGraphic.anchor.set(0.5)
            this.refreshMinigameBrowser(this.currentMinigameGraphic, this.minigameList[this.choices[0]]);
            this.currentMinigameGraphic.scale.set(0.5,0.5)// = new PIXI.Point(0.5, 0.5);
            this.browser.xScale = 0.5;
            this.browser.yScale = 0.5;

            this.browser2 = new RushFloatingObject($engine.getWindowSizeX()*0.5, $engine.getWindowSizeY()/2+100);
            this.browser2.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));
            this.browser2.xScale = 0.5;
            this.browser2.yScale = 0.5;

            this.currentMinigameGraphic2 = $engine.createRenderable(this.browser2,new PIXI.Sprite(PIXI.Texture.EMPTY), true);
            this.currentMinigameGraphic2.anchor.set(0.5, 0.5)
            this.refreshMinigameBrowser(this.currentMinigameGraphic2, this.minigameList[this.choices[1]]);
            this.currentMinigameGraphic2.scale = new PIXI.Point(0.5, 0.5);

            this.browser3 = new RushFloatingObject($engine.getWindowSizeX()*0.5 + 185, $engine.getWindowSizeY()/2-150);
            this.browser3.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));

            this.currentMinigameGraphic3 = $engine.createRenderable(this.browser3,new PIXI.Sprite(PIXI.Texture.EMPTY), true);
            this.currentMinigameGraphic3.anchor.set(0.5, 0.5)
            this.refreshMinigameBrowser(this.currentMinigameGraphic3, this.minigameList[this.choices[2]]);
            this.browser3.xScale = 0.5;
            this.browser3.yScale = 0.5;
            this.currentMinigameGraphic3.scale = new PIXI.Point(0.5, 0.5);

            this.buttons.playButton1.setOnPressed(function() {
                RushBreakController.getInstance().startSelectedMinigame(RushBreakController.getInstance().choices[0])
                RushBreakController.getInstance().rushGameSelected(RushBreakController.getInstance().choices[0])
            })

            this.buttons.playButton2.setOnPressed(function() {
                RushBreakController.getInstance().startSelectedMinigame(RushBreakController.getInstance().choices[1])
                RushBreakController.getInstance().rushGameSelected(RushBreakController.getInstance().choices[1])
            })

            this.buttons.playButton3.setOnPressed(function() {
                RushBreakController.getInstance().startSelectedMinigame(RushBreakController.getInstance().choices[2])
                RushBreakController.getInstance().rushGameSelected(RushBreakController.getInstance().choices[2])
            })
        }

        this.buttons.backButton.setOnPressed(function() {
            $engine.audioFadeAll();
            RushBreakController.getInstance().data.inRush = true;
            $engine.setRoom("MenuIntro");
            $engine.startFadeOut();
        })
    }

    startSelectedMinigame(minigame) {
        IM.with(RushMainMenuButton,function(button) {
            button.disable();
        })
        $engine.audioFadeAll();
        SET_ENGINE_RETURN(99, 100)
        $engine.setRoom(this.minigameList[minigame].room)
        $engine.overrideRoomChange("RushBreak")
        $engine.overrideReturn("RushBreak")
        $engine.startFadeOut();
    }

    getSelectedMingame() {
        return this.minigameList[this.selectedMinigameIndex];
    }

    nextMinigame(change) {
        this.selectedMinigameIndex+=change;
        this.selectedMinigameIndex = (this.selectedMinigameIndex + this.minigameList.length) % this.minigameList.length;
        this.selectedMinigameTimer=0;
        this.refreshMinigameBrowser();
    }

    refreshMinigameBrowser(graphic, minigame) {
        graphic.texture = this.getGraphicFromMinigame(minigame);
    }

    createButtons() {
        this.buttons = {};
        this.buttons.backButton = new RushMainMenuButton($engine.getWindowSizeX() - 100,$engine.getWindowSizeY() - 25);
        this.buttons.backButton.setTextures("back_button_0","back_button_0","back_button_1")
        if(this.choices[1] == null){
            this.buttons.playButton1 = new RushMainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 + 250);
            this.buttons.playButton1.setTextures("play_button_0","play_button_0","play_button_1")              
        }
        else if(this.choices[2] == null){
            this.buttons.playButton1 = new RushMainMenuButton($engine.getWindowSizeX()/2 - 200,$engine.getWindowSizeY()/2 + 120);
            this.buttons.playButton1.setTextures("play_button_0","play_button_0","play_button_1")
            this.buttons.playButton2 = new RushMainMenuButton($engine.getWindowSizeX()/2 + 200,$engine.getWindowSizeY()/2 + 120);
            this.buttons.playButton2.setTextures("play_button_0","play_button_0","play_button_1")               
        }
        else{
            this.buttons.playButton1 = new RushMainMenuButton($engine.getWindowSizeX()/2 - 285,$engine.getWindowSizeY()/2);
            this.buttons.playButton1.setTextures("play_button_0","play_button_0","play_button_1")
            this.buttons.playButton2 = new RushMainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2+250);
            this.buttons.playButton2.setTextures("play_button_0","play_button_0","play_button_1")
            this.buttons.playButton3 = new RushMainMenuButton($engine.getWindowSizeX()/2 + 285,$engine.getWindowSizeY()/2);
            this.buttons.playButton3.setTextures("play_button_0","play_button_0","play_button_1")               
        }
        this.setupMainMenuButtons();

        this.buttons.loss = {};
        this.buttons.loss.backButton = new RushMainMenuButton($engine.getWindowSizeX()*2.5,$engine.getWindowSizeY()/2 + 100);
        this.buttons.loss.backButton.setTextures("back_button_0","back_button_0","back_button_1")
        this.setupLossButtons();
    }

    startMinigameRush() {
        $engine.fadeOutAll(1);
        $engine.startFadeOut(60)
        $engine.audioFadeAll();
        IM.with(RushMainMenuButton,function(button) {
            button.disable();
        })
        AudioManager.playSe($engine.generateAudioReference("GameStart"))    
        $engine.audioFadeAll();
        $engine.setRoom(this.minigameList[0].room)
        $engine.overrideRoomChange("RushBreak")
        $engine.overrideReturn("RushBreak")
        $engine.startFadeOut();
    }

    handleFloatingObjects() {
        this.nextCloud--;
        if(this.nextCloud<=0) {
            let cloud = new RisingSprite(EngineUtils.randomRange(-$engine.getWindowSizeX(),$engine.getWindowSizeX()*3),$engine.getTexture("cloud_generic_"+EngineUtils.irandomRange(1,4)))
            this.nextCloud = EngineUtils.irandomRange(20,60);
            if(this.timer<this.endTime) {
                cloud.alpha = 0;
            }
        }
        this.nextLeaf--;
        if(this.nextLeaf<=0) {
            let leaf = new RisingSprite(EngineUtils.randomRange(-$engine.getWindowSizeX(),$engine.getWindowSizeX()*3),$engine.getRandomTextureFromSpritesheet("leaf_particles"))
            leaf.rotateFactor = 10;
            leaf.changeScale(0.5,0.5)
            leaf.flipHoriz = true;
            leaf.flipVert = true;
            leaf.speed*=EngineUtils.randomRange(1.6,3);
            this.nextLeaf = EngineUtils.irandomRange(3,6);
            if(this.timer<this.endTime) {
                leaf.alpha = 0;
            }
        }
    }

    handleLetters() {
        IM.with(RushRisingSprite, function(cloud){cloud.alpha = 1});
        IM.with(RushMainMenuButton, function(button){button.enable()})
        this.enableRegion(RushBreakController.REGION_MAIN);
    }

    handleCamera() {
        var camera = $engine.getCamera();
        var offX = this.cameraTargetX - camera.getX()
        var offY = this.cameraTargetY - camera.getY()
        camera.translate(offX/32,offY/32);
    }

    handleKeyboardNavigation() { // buttons are generally laid out top to bottom.
        if(IN.keyCheckPressed("RPGdown") || IN.keyCheckPressed("RPGright") || IN.keyCheckPressed("RPGtab"))
            this.cycleButtonBackward();
        if(IN.keyCheckPressed("RPGup") || IN.keyCheckPressed("RPGleft"))
            this.cycleButtonForward();

        if(IN.keyCheckPressed("RPGescape") && this.backButton) {
            this.backButton.setSelected();
            this.backButton.testPress();
        }
    }

    handleTooltips() {
        var obj = IM.instancePosition(IN.getMouseX(),IN.getMouseY(),RushFloatingObject);
        if(!obj || !IN.mouseInBounds()) {
            this.tooltip.text = "";
        } else {
            this.tooltip.text = obj.tooltip;
        }
        this.tooltip.x = IN.getMouseX();
        this.tooltip.y = IN.getMouseY();

        this.tooltip.rotation = Math.sin($engine.getGameTimer()/37)/16;
        this.tooltip.scale.x = Math.cos($engine.getGameTimer()/21)/16 + 1;
        this.tooltip.scale.y = Math.sin($engine.getGameTimer()/31)/16 + 1;
    }

    handleMingameBrowser() {
        this.selectedMinigameTimer++;
        this.currentMinigameGraphic.scale.y = EngineUtils.interpolate(this.selectedMinigameTimer/18,0.5,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this.currentMinigameGraphic.x = this.browser.x;
        this.currentMinigameGraphic.y = this.browser.y;
        this.currentMinigameGraphic.rotation = this.browser.angle;
    }

    step() {

        if(IN.anyKeyPressed() && this.timer < this.endTime) {
            this.endTime=this.timer;
        }

        this.handleFloatingObjects();
        this.handleCamera();
        this.handleKeyboardNavigation();
        this.handleTooltips();
        this.handleMingameBrowser();

        this.timer++;

        // wait for context, when we get context, start the music.
        if(this.audioRef && !this.musicStarted && IN.anyInputPressed() && !IN.keyCheck("Escape")) { // escape doesn't count?
            this.audioRef._source.context.resume();
            this.musicStarted = true;
        }

        var mouseOffset = $engine.getWindowSizeX()/2-IN.getMouseXGUI();
        var diff = (this.bg.x + 92 - (this.bg.x - mouseOffset)/16);

        this.bg.x -= diff/128

        if($__engineGlobalSaveData.__emergencyAutoSave && IN.keyCheckPressed("KeyL") && !$engine.isBusy()) { // emergencyAutoSave
            if (DataManager.loadGame(2)) {
                // reload map if updated -- taken from rpg_scenes.js line 1770
                if ($gameSystem.versionId() !== $dataSystem.versionId) {
                    $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
                    $gamePlayer.requestMapReload();
                }
                SoundManager.playLoad();
                $engine.fadeOutAll(1);
                $engine.audioFadeAll();
                $engine.disableAutoSave();
                IM.with(RushMainMenuButton,function(button) {
                    button.enabled = false;
                })
                SceneManager.goto(Scene_Map);
            } else {
                SoundManager.playBuzzer();
            }
        }
    }

    static startNewGame() {
        DataManager.setupNewGame();
        SceneManager.goto(Scene_Map);
        OwO.__addItemsToPlayer();
        OwO.__clearAreaName();
    }

    preDraw() {
        if(this.timer>this.endTime && this.timer <= this.endTime+36) {
            this.depth = -10000;
        }
    }

    draw(gui, camera) {
        this.graphics.clear();
        if(this.timer>this.endTime && this.timer <= this.endTime+36) {
            this.graphics.beginFill(0xffffff);
            if(this.timer-this.endTime<12) { // drawing of the while fade
                this.graphics.alpha=1;
            } else {
                this.graphics.alpha=1-this.interp((this.timer-this.endTime-12)/24,0,1)
            }
            this.graphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY())
            this.graphics.endFill()
        }
        if(this.timer<=this.endTime) {
            var fac = EngineUtils.clamp(this.timer/60,0,1);
            var r = Math.round(this.interp(fac,0,0x8));
            var g = Math.round(this.interp(fac,0,0x8));
            var b = Math.round(this.interp(fac,0,0x20));
            
            this.graphics.beginFill((r<<16) | (g<<8) | b);
            this.graphics.alpha=1;
            this.graphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY())
            this.graphics.endFill()
        }
        if(this.isFading) {
            this.graphics.beginFill(0);
            this.graphics.alpha=this.interp(this.fadeTimer/this.endFadeTime,0,1);
            this.graphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY())
            this.graphics.endFill()
        }
        if($__engineGlobalSaveData.__emergencyAutoSave)
            $engine.requestRenderOnGUI(this.loadText)
    }

    interp(val,min,max) {
        return (max-min)*((val-1)**3+1)+min;
    }

    cleanup() {
        $__engineGlobalSaveData.__emergencyAutoSave=false;
        $engine.saveEngineGlobalData();
    }

    moveToRegion(region) {
        this.enableRegion(region);
        console.log("ha,, there")
        this.currentRegion = region;
        switch(region) {
            case(RushBreakController.REGION_MAIN):
                this.cameraTargetX = 0;
                this.cameraTargetY = 0;
            break;
            case(RushBreakController.REGION_LOSS):
                this.cameraTargetX = $engine.getWindowSizeX()*2;
                this.cameraTargetY = 0;
            break;
        }
    }

    enableRegion(region) {
        IM.with(RushMainMenuButton, function(button) {
            button.disable();
        })
        this.activeButtons = [];
        switch(region) {
            case(RushBreakController.REGION_MAIN):
                this.buttons.backButton.setSelected();
                this.buttons.backButton.enable();
                this.buttons.playButton1.enable();
                this.activeButtons = [this.buttons.playButton1]
                if(this.buttons.playButton2 != undefined){
                    this.buttons.playButton2.enable();
                    this.activeButtons.push(this.buttons.playButton2)
                }
                if(this.buttons.playButton3 != undefined){
                    this.buttons.playButton3.enable();
                    this.activeButtons.push(this.buttons.playButton3)
                }
                this.activeButtons.push(this.buttons.backButton)
                this.registerBackButton(this.buttons.backButton)
            break;
            case(RushBreakController.REGION_LOSS):
                console.log("guru guru guru guru")
                this.buttons.loss.backButton.setSelected();
                this.buttons.loss.backButton.enable();
                this.activeButtons = [this.buttons.loss.backButton]
                this.registerBackButton(this.buttons.loss.backButton)
            break;
        }
    }

    cycleButtonForward() {
        var idx = this.activeButtons.indexOf(this.activeButton);
        if(idx===-1)
            return;
        var check = idx+1;
        while(check!==idx) {
            check%=this.activeButtons.length;
            if(this.activeButtons[check].canActivate()) {
                this.activeButtons[check].select();
                break;
            }
            check++;
        }
    }

    cycleButtonBackward() {
        var idx = this.activeButtons.indexOf(this.activeButton);
        if(idx===-1)
            return;
        var check = idx-1;
        while(check!==idx) {
            check=(check + this.activeButtons.length) % this.activeButtons.length;
            if(this.activeButtons[check].canActivate()) {
                this.activeButtons[check].select();
                break;
            }
            check--;
        }
    }

    notifyButtonFocused(button) {
        this.activeButton = button;
        console.log(this.activeButton)
    }

    static getInstance() {
        return RushBreakController.instance
    }
}
RushBreakController.REGION_MAIN = 0;
RushBreakController.REGION_LOSS = 1;
RushBreakController.instance = undefined;

class RushLetter extends EngineInstance {

    onEngineCreate() {

    }

    onCreate(ind,x,y) {
        this.setSprite(new PIXI.Sprite($engine.getTexture("t"+String(ind))))
        this.xScale=1/2;
        this.yScale=1/2;
        this.xStart = x;
        this.yStart = y;
        this.x = x;
        this.y = y;

        this.ox = 0;
        this.oy = 0;

        this.onEngineCreate();
        this.random1 = EngineUtils.irandom(360);
        this.random2 = EngineUtils.irandomRange(2,3);
    }

    step() {
        var diffX = (this.ox - (IN.getMouseX()-this.x)/8)
        var diffY = (this.oy - (IN.getMouseY()-this.y)/8)
        this.ox -= diffX/60;
        this.oy -= diffY/60;
        this.destX = this.xStart + this.random2 * Math.cos(($engine.getGameTimer()+this.x+this.random1)/64) + this.ox;
        this.destY = this.yStart + 10 * Math.sin(($engine.getGameTimer()+this.x)/64) + this.oy;
    }

    floatRandom() {
        this.x = this.destX
        this.y = this.destY
    }

}

class RushRisingSprite extends EngineInstance {
    onEngineCreate() {
    }

    onCreate(x, texture) {
        this.x = x;
        this.y = $engine.getWindowSizeY()*2+120;

        this.angle = this.baseAngle = EngineUtils.randomRange(-0.17,0.17)
        var dist = EngineUtils.irandomRange(-800,600);
        this.depth = dist;
        this.speed = 4 * (1-dist/650);

        var sc = (1-dist/800)*0.25
        this.xScale = EngineUtils.irandom(1) ? sc : -sc
        this.yScale = sc
        this.baseXScale = this.xScale;
        this.baseYScale = this.yScale;
        this.onEngineCreate();

        this.setSprite(new PIXI.Sprite(texture))

        this.randRot = EngineUtils.random(60)
        this.rotateFactor = 1;
        this.flipHoriz = false;
        this.flipVert = false;
        this.rand1 = EngineUtils.random(50);
        this.rand2 = EngineUtils.random(50);

        var f1 = new PIXI.filters.BlurFilter();
        f1.blur = EngineUtils.clamp(Math.abs(dist/600)*8,0,5);
        if(f1.blur < 3)
            f1.blur = 1;
        f1.blur*=4; // cache as bitmap ANNIHILATES this filter for no reason.
        this.getSprite().filters = [f1]
        this.getSprite().cacheAsBitmap = true; // you're welcome low spec.
    }

    changeScale(sx,sy) {
        this.xScale*=sx;
        this.yScale*=sy;
        this.baseXScale=this.xScale;
        this.baseYScale=this.yScale;
    }

    step() {
        var camera = $engine.getCamera()
        this.getSprite().visible = this.x > camera.getX()-120 && this.x < camera.getX() + $engine.getWindowSizeX() + 120;

        this.y-=this.speed;
        if(this.y<=-120 - $engine.getWindowSizeY())
            this.destroy();
        this.angle = this.baseAngle+Math.sin(this.randRot+$engine.getGameTimer()/32)/16 * this.rotateFactor;
        if(this.flipHoriz) {
            this.xScale = this.baseXScale * Math.cos(this.rand1 + $engine.getGameTimer()/43);
        }
        if(this.flipVert) {
            this.yScale = this.baseYScale * Math.cos(this.rand2 + $engine.getGameTimer()/31);
        }
    }
}

class RushFloatingObject extends EngineInstance {
    onCreate(x,y) {
        this.x = x;
        this.y = y;
        this.xStart = x;
        this.yStart = y;
        this.ox = 0;
        this.oy = 0;
        this.rand1 = EngineUtils.irandom(128);
        this.rand2 = EngineUtils.irandom(128);
        this.rand3 = EngineUtils.irandom(128);
        this.rand4 = EngineUtils.irandomRange(64,128);
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,0,0,0,0)))
        this.tooltip = "";
    }

    setTooltip(tooltip) {
        this.tooltip = tooltip;
    }
}

class RushMainMenuButton extends RushFloatingObject {
    onEngineCreate() {
        this.alpha = 0;
        this.enabled = false;
        this.onPressed = undefined;
        this.testPressed = undefined;
        this.onSelected = undefined;
        this.xScale = 0.25;
        this.yScale = 0.25;
        this.active = false;
        this.onlyOnce = false;
        this.canBePushed = true;
        this.clickSoundEnabled = true;
    }

    setTextures(def, armed, fire) {
        this.tex1 = $engine.getTexture(def);
        this.tex2 = $engine.getTexture(armed);
        this.tex3 = $engine.getTexture(fire);
        this.setSprite(new PIXI.Sprite(this.tex1))

        var spr = this.getSprite();

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-spr.width/2,-spr.height/2,spr.width/2,spr.height/2)))
    }

    onCreate(x,y) {
        super.onCreate(x,y);
        this.outlineFilter = new PIXI.filters.OutlineFilter(8,0xffffff);
        this.fitlers = [];
        this.framesSinceEnabled=0;
        this.onEngineCreate();
    }

    disableClickSound() {
        this.clickSoundEnabled=false;
    }

    setOneTime() {
        this.onlyOnce = true;
    }

    /**
     * Calls a function when the button is initally selected
     * @param {Function} func The function
     */
    setOnSelected(func) {
        this.onSelected = func;
    }

    /**
     * Sets a precondition
     * 
     * @param {Function} scr a precondition to test if the button should be pressed 
     */
    setTestPressed(scr) {
        this.testPressed = scr;
    }

    /**
     * The script to execute if the button is clicked
     * 
     * @param {Function} scr The script to be executed if the button is clicked and setTestPressed script returns true
     */
    setOnPressed(scr) {
        this.onPressed = scr;
    }

    outlineTick() {
        var strength = 6;
        var correction = Math.sin($engine.getGameTimer()/18)*0.25 + 0.75; // between 0.5 and 1
        this.outlineFilter.thickness = strength * correction;
    }

    setSelected() {
        IM.with(RushMainMenuButton, function(self) {
            self.active = false;
            self.getSprite().filters = [];
        })
        this.active=true;
        this.getSprite().filters = [this.outlineFilter];
        if(this.onSelected)
            this.onSelected.call(this);
        RushBreakController.getInstance().notifyButtonFocused(this);
    }

    select() {
        this.setSelected();
        SoundManager.playCursor();
    }

    step() {
        super.step();
        this.outlineTick();


        // this is the literal definition of spaghetti haha
        if(!this.canActivate())
            return;
        
        var mouseOnSelf = this.hitbox.containsPoint(IN.getMouseX(),IN.getMouseY());
        if(mouseOnSelf && !this.active) {
            this.select();
        }
        if(this.pressed) {
            this.getSprite().texture = this.tex3; // pressed
        } else if(mouseOnSelf) {
            this.getSprite().texture = this.tex2; // armed
            if(IN.mouseCheck(0)) {
                this.getSprite().texture = this.tex3; // pressed
            }
            if(IN.mouseCheckReleased(0)) {       // released
                this.getSprite().texture = this.tex3;
                this.testPress();
            }
        } else {
            this.getSprite().texture = this.tex1;
        }

        if(this.framesSinceEnabled>0 && this.active && (IN.keyCheckPressed("RPGok"))) {
            this.testPress();
        }
        this.framesSinceEnabled++;
    }

    testPress() {
        if(!this.testPressed || this.testPressed()) {
            if(this.onlyOnce)
                this.pressed = true;    
            if(this.clickSoundEnabled)
                SoundManager.playSystemSound(1)
            this.onPressed.call(this);
            this.getSprite().texture = this.tex3; // pressed
        }
    }

    lock() {
        this.canBePushed = false;
        this.getSprite().tint = 0x707070;
    }

    unlock() {
        this.canBePushed = true;
        this.getSprite().tint = 0xffffff;
    }

    canActivate() {
        return this.canBePushed && this.enabled;
    }

    disable() {
        this.enabled=false;
    }

    enable() {
        this.enabled=true;
        this.framesSinceEnabled = 0;
        this.alpha = 1;
    }
}