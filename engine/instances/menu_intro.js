class MenuIntroController extends EngineInstance {

    // important note: This class, by nature of having to deal with engine start, is allowed access to engine data.

    onEngineCreate() {

        $__engineData.__readyOverride=false;

        this.loadText = $engine.createManagedRenderable(this, new PIXI.Text("Press L to load crash autosave.", $engine.getDefaultTextStyle()));
        this.loadText.anchor.x = 0.5;
        this.loadText.anchor.y = 1;
        this.loadText.x = $engine.getWindowSizeX()/2;
        this.loadText.y = $engine.getWindowSizeY();

        this.activeButtons = [];
        this.activeButton = undefined;

        this.letters = [];
        //var locX = [37,159,308,451,522,671];
        var locX = [60, 160, 290, 418, 544, 660, 785, 900];
        var locY = [290, 281, 270, 250, 250, 260, 282, 300];
        var offsets = [42, 36, 27, 42, 20, 32,25,37]
        for(var i =1;i<=8;i++) {
            let letter = new Letter(i,locX[i-1]*0.6+115,locY[i-1]*0.6)
            letter.randomOffset = offsets[i-1]
            letter.randomOffsetAngle = EngineUtils.randomRange(-0.34,0.34)
            letter.xRandStart = letter.xStart+EngineUtils.randomRange(-24,24)
            this.letters.push(letter);
            letter.y = $engine.getWindowSizeY()+200;
        }
        this.timer = 0;
        $engine.setBackgroundColour(0x65ceeb)
        this.bg = new PIXI.Sprite($engine.getTexture("intro_background"))
        this.bg.x = -92;
        $engine.setBackground(this.bg)
        this.graphics = $engine.createRenderable(this,new PIXI.Graphics())
        this.endTime = 300;
        this.nextCloud = 0;
        this.nextLeaf = 0;

        this.isFading=false;
        $engine.startFadeIn();

        MenuIntroController.instance = this;

        // overwrite the mouse location, PIXI doesn't update immedaitely...
        /*IN.getMouseXGUI()
        IN.__mouseXGUI=410;
        IN.__mouseYGUI=120;*/

        this.cameraTargetX =0;
        this.cameraTargetY =0;

        this.menuMusic = $engine.audioPlaySound("title_music",1,true)
        $engine.audioSetLoopPoints(this.menuMusic,10,50);

        this.createButtons();
    }

    setupMainMenuButtons() {
        // main menu
        this.buttons.continueButton.setOnPressed(function() {
            SceneManager.goto(Scene_Map);
            var oldFunc = $engine.terminate;
            $engine.terminate = function() { // hijack... myself?
                oldFunc.call(this);
                $gameSystem.onAfterLoad();
            }
        })
        this.buttons.continueButton.setTestPressed(function() {
            if (DataManager.loadGame(1)) {
                // reload map if updated -- taken from rpg_scenes.js line 1770
                if ($gameSystem.versionId() !== $dataSystem.versionId) {
                    $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
                    $gamePlayer.requestMapReload();
                }
                SoundManager.playLoad();
                $engine.fadeOutAll(1);
                $engine.audioFadeAll();
                $engine.disableAutoSave();
                IM.with(MainMenuButton,function(button) {
                    button.disable();
                })
                return true;
            } else {
                SoundManager.playBuzzer();
                return false;
            }
        });
        
        this.buttons.startButton.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_DIFFICULTY);
        });
        this.buttons.startButton.setSelected();   
    }

    setupDifficultyButtons() {
        var commonSetTestPressedScript = function() {
            $engine.fadeOutAll(1);
            $engine.startFadeOut(60)
            $engine.audioFadeAll();
            IM.with(MainMenuButton,function(button) {
                button.disable();
            })
            AudioManager.playSe($engine.generateAudioReference("GameStart"))
            return true
        }

        var commonPressedScript = function() {
            $engine.setRoom("IntroCutsceneRoom")
        }

        var difficultyTextBox = new TextBox();
        difficultyTextBox.disableArrow();

        // easy
        this.buttons.difficultyEasy.setTestPressed(function() {
            return commonSetTestPressedScript.call(this);

        });
        this.buttons.difficultyEasy.setOnPressed(function() {
            commonPressedScript.call(this);
            $engine.getSaveData().difficulty = ENGINE_DIFFICULTY.EASY;
        });
        this.buttons.difficultyEasy.setOnSelected(function() {
            difficultyTextBox.setTextArray(["Easy mode halves stamina loss."]);
        })

        // normal
        this.buttons.difficultyNormal.setTestPressed(function() {
            return commonSetTestPressedScript.call(this);
        });
        this.buttons.difficultyNormal.setOnPressed(function() {
            commonPressedScript.call(this);
            $engine.getSaveData().difficulty = ENGINE_DIFFICULTY.MEDIUM;
        });
        this.buttons.difficultyNormal.setOnSelected(function() {
            difficultyTextBox.setTextArray(["The intended way to play Fallen."]);
        })

        // hard
        this.buttons.difficultyHard.setTestPressed(function() {
            return commonSetTestPressedScript.call(this);

        });
        this.buttons.difficultyHard.setOnPressed(function() {
            commonPressedScript.call(this);
            $engine.getSaveData().difficulty = ENGINE_DIFFICULTY.HARD;
        });
        this.buttons.difficultyHard.setOnSelected(function() {
            difficultyTextBox.setTextArray(["Doubles stamina loss."]);
        })

        this.buttons.difficultyBack.setOnSelected(function() {
            difficultyTextBox.showTextBox(false)
        })
        this.buttons.difficultyBack.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_MAIN);
        })
    }

    createButtons() {
        this.buttons = {};
        this.buttons.continueButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2+120);
        this.buttons.continueButton.setTextures("button_continue_1","button_continue_1","button_continue_2")
        this.buttons.startButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2);
        this.buttons.startButton.setTextures("button_new_game_1","button_new_game_1","button_new_game_2")
        
        var offsetDifficulty = $engine.getWindowSizeY();

        this.buttons.difficultyBack = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 - 200 + offsetDifficulty);
        this.buttons.difficultyBack.setTextures("back_button_0","back_button_0","back_button_1")
        this.buttons.difficultyEasy = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 - 80 + offsetDifficulty);
        this.buttons.difficultyEasy.setTextures("difficulty_buttons_0","difficulty_buttons_0","difficulty_buttons_1")
        this.buttons.difficultyNormal = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 + 40 + offsetDifficulty);
        this.buttons.difficultyNormal.setTextures("difficulty_buttons_2","difficulty_buttons_2","difficulty_buttons_3")
        this.buttons.difficultyHard = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 + 160 + offsetDifficulty);
        this.buttons.difficultyHard.setTextures("difficulty_buttons_4","difficulty_buttons_4","difficulty_buttons_5")

        this.setupMainMenuButtons();
        this.setupDifficultyButtons();
    }

    handleFloatingObjects() {
        this.nextCloud--;
        if(this.nextCloud<=0) {
            let cloud = new RisingSprite(EngineUtils.random($engine.getWindowSizeX()*3),$engine.getTexture("cloud_generic_"+EngineUtils.irandomRange(1,4)))
            this.nextCloud = EngineUtils.irandomRange(20,60);
            if(this.timer<this.endTime) {
                cloud.alpha = 0;
            }
        }
        this.nextLeaf--;
        if(this.nextLeaf<=0) {
            let leaf = new RisingSprite(EngineUtils.random($engine.getWindowSizeX()*3),$engine.getRandomTextureFromSpritesheet("leaf_particles"))
            leaf.rotateFactor = 10;
            leaf.changeScale(0.5,0.5)
            leaf.flipHoriz = true;
            leaf.flipVert = true;
            leaf.speed*=EngineUtils.randomRange(1.6,3);
            this.nextLeaf = EngineUtils.irandomRange(4,8);
            if(this.timer<this.endTime) {
                leaf.alpha = 0;
            }
        }
    }

    handleLetters() {
        if(this.timer>this.endTime) {
            if(this.timer===this.endTime+1) {
                IM.with(RisingSprite, function(cloud){cloud.alpha = 1});
                IM.with(MainMenuButton, function(button){button.enable()})
                this.enableRegion(MenuIntroController.REGION_MAIN);
                for(var i=0;i<8;i++) {
                    var letter = this.letters[i]
                    letter.angle = 0;
                }
            }
            for(var i =0;i<8;i++)
                this.letters[i].floatRandom();
        } else {
            for(var i=0;i<8;i++) {
                var letter = this.letters[i]
                if(this.timer>letter.randomOffset) {
                    var val = (this.timer-letter.randomOffset)/(this.endTime-letter.randomOffset)
                    letter.y = this.interp(val,$engine.getWindowSizeY()+120,letter.destY)
                    letter.x = this.interp(val,letter.xRandStart,letter.destX)
                    letter.angle = this.interp(val,letter.randomOffsetAngle,0)
                }
            }
        }
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
    }

    step() {

        if(IN.anyKeyPressed() && this.timer < this.endTime) {
            this.endTime=this.timer;
        }

        this.handleFloatingObjects();
        this.handleLetters();
        this.handleCamera();
        this.handleKeyboardNavigation();

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
                IM.with(MainMenuButton,function(button) {
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
        switch(region) {
            case(MenuIntroController.REGION_MAIN):
                this.cameraTargetX = 0;
                this.cameraTargetY = 0;
            break;
            case(MenuIntroController.REGION_DIFFICULTY):
                this.cameraTargetX = 0;
                this.cameraTargetY = $engine.getWindowSizeY();
            break;
            case(MenuIntroController.REGION_EXTRAS):
            break;
            case(MenuIntroController.REGION_ENDINGS):
            break;
            case(MenuIntroController.REGION_MINIGAME_BROWSER):
            break;
            case(MenuIntroController.REGION_EXTRAS_UNLOCKS):
            break;
        }
    }

    enableRegion(region) {
        IM.with(MainMenuButton, function(button) {
            button.disable();
        })
        this.activeButtons = [];
        switch(region) {
            case(MenuIntroController.REGION_MAIN):
                this.buttons.startButton.setSelected();
                this.buttons.startButton.enable();
                this.buttons.continueButton.enable();
                this.activeButtons = [this.buttons.continueButton, this.buttons.startButton]
            break;
            case(MenuIntroController.REGION_DIFFICULTY):
                this.buttons.difficultyBack.setSelected();
                this.buttons.difficultyEasy.enable();
                this.buttons.difficultyNormal.enable();
                this.buttons.difficultyHard.enable();
                this.buttons.difficultyBack.enable();
                this.activeButtons = [this.buttons.difficultyHard, this.buttons.difficultyNormal, this.buttons.difficultyEasy, this.buttons.difficultyBack]
            break;
            case(MenuIntroController.REGION_EXTRAS):
            break;
            case(MenuIntroController.REGION_ENDINGS):
            break;
            case(MenuIntroController.REGION_MINIGAME_BROWSER):
            break;
            case(MenuIntroController.REGION_EXTRAS_UNLOCKS):
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
            check++;
        }
    }

    notifyButtonFocused(button) {
        this.activeButton = button;
    }

    static getInstance() {
        return MenuIntroController.instance
    }
}
MenuIntroController.REGION_MAIN = 0;
MenuIntroController.REGION_DIFFICULTY = 1
MenuIntroController.REGION_EXTRAS = 2
MenuIntroController.REGION_ENDINGS = 3 // like main
MenuIntroController.REGION_MINIGAME_BROWSER = 4
MenuIntroController.REGION_EXTRAS_UNLOCKS = 5 // stories
MenuIntroController.instance = undefined;

class Letter extends EngineInstance {

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

class RisingSprite extends EngineInstance {
    onEngineCreate() {
    }

    onCreate(x, texture) {
        this.x = x;
        this.y = $engine.getWindowSizeY()+120;

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
        this.getSprite().filters = [f1]
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
        this.getSprite().tint = 0xffffff
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

class MainMenuButton extends EngineInstance {
    onEngineCreate() {
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-368,-125,368,125));
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
    }

    setTextures(def, armed, fire) {
        this.tex1 = $engine.getTexture(def);
        this.tex2 = $engine.getTexture(armed);
        this.tex3 = $engine.getTexture(fire);
        this.setSprite(new PIXI.Sprite(this.tex1))
    }

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
        this.outlineFilter = new PIXI.filters.OutlineFilter(8,0xffffff);
        this.fitlers = [];
        this.framesSinceEnabled=0;
        this.onEngineCreate();
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
        IM.with(MainMenuButton, function(self) {
            self.active = false;
            self.getSprite().filters = [];
        })
        this.active=true;
        this.getSprite().filters = [this.outlineFilter];
        if(this.onSelected)
            this.onSelected.call(this);
        MenuIntroController.getInstance().notifyButtonFocused(this);
    }

    select() {
        this.setSelected();
        SoundManager.playCursor();
    }

    step() {
        this.angle = Math.sin(($engine.getGameTimer()+this.rand3)/this.rand4)/16
        var diffX = (this.ox - (IN.getMouseX()-this.x)/8)
        var diffY = (this.oy - (IN.getMouseY()-this.y)/8)
        this.ox -= diffX/60;
        this.oy -= diffY/60;
        this.x = this.xStart + 10 * Math.sin(($engine.getGameTimer()+this.x+this.rand2)/64) + this.ox;
        this.y = this.yStart + 10 *  Math.cos(($engine.getGameTimer()+this.y+this.rand1)/64) + this.oy;
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
            SoundManager.playSystemSound(1)
            this.onPressed.call(this);
            this.getSprite().texture = this.tex3; // pressed
        }
    }

    lock() {
        this.canBePushed = false;
        this.getSprite().tint = 707070;
    }

    unlock() {
        this.canBePushed = true;
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