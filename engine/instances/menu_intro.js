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

        this.backButton = undefined;

        this.totalUnlockedEndings = 0;

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

        this.tooltip = $engine.createRenderable(this, new PIXI.Text("",$engine.getDefaultTextStyle()))
        this.tooltip.anchor.x = 0.5;
        this.tooltip.anchor.y = 1;

        MenuIntroController.instance = this;

        this.minigameList = [];
        for(const val in ENGINE_MINIGAMES) {
            this.minigameList.push(ENGINE_MINIGAMES[String(val)]);
        }

        this.selectedMinigameIndex = 0;
        this.selectedMinigameTimer = 0;

        // overwrite the mouse location, PIXI doesn't update immedaitely...
        /*IN.getMouseXGUI()
        IN.__mouseXGUI=410;
        IN.__mouseYGUI=120;*/

        this.cameraTargetX =0;
        this.cameraTargetY =0;

        this.menuMusic = $engine.audioPlaySound("title_music",1,true)
        $engine.audioSetLoopPoints(this.menuMusic,10,50);

        this.setupEndings();
        this.createButtons();
        this.setupBrowser();
    }

    setupEndings() {
        var endingValues = [];
        endingValues.push($engine.getEnding(ENGINE_ENDINGS.BEST));
        endingValues.push($engine.getEnding(ENGINE_ENDINGS.GOOD));
        endingValues.push($engine.getEnding(ENGINE_ENDINGS.BAD));
        endingValues.push($engine.getEnding(ENGINE_ENDINGS.EVIL));
        var offsetX = $engine.getWindowSizeX()*1.5;
        var offsetY = $engine.getWindowSizeY()*1.5
        var tooltips = ["Best Ending\nWin the game without cheating once",
            "Good Ending\nWin the game cheating\n a normal amount of times",
            "Bad Ending\nLose on the final minigame",
            "Evil Ending\nWin the game after cheating at\n least 8 people",
        ]
        for(var i=0;i<4;i++) {
            var floatingObject = new FloatingObject(offsetX + (i-1.5)*128,offsetY);
            floatingObject.setHitbox(new Hitbox(floatingObject,new RectangleHitbox(floatingObject,-48,-48,48,48)))
            var sprite = $engine.createRenderable(floatingObject, new PIXI.Sprite(PIXI.Texture.EMPTY),true);

            floatingObject.setTooltip(tooltips[i])

            if(endingValues[i]===0) {
                sprite.addChild($engine.createManagedRenderable(floatingObject, new PIXI.Sprite($engine.getTexture("ending_badges_0"))))
            } else {
                this.totalUnlockedEndings++;
            }
            if(endingValues[i] > 0) { // normal badge
                sprite.addChild($engine.createManagedRenderable(floatingObject, new PIXI.Sprite($engine.getTexture("ending_badges_"+String(i+1)))));
            }
            if(endingValues[i] > 1) { // hard mode bade
                sprite.addChild($engine.createManagedRenderable(floatingObject, new PIXI.Sprite($engine.getTexture("end_hard_badge"))));
            }
        }
    }

    setupBrowser() {
        this.browser = new FloatingObject($engine.getWindowSizeX()*2.5, $engine.getWindowSizeY()/2-96);
        this.browser.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));
        this.currentMinigameGraphic = $engine.createRenderable(this.browser,new PIXI.Sprite(PIXI.Texture.EMPTY));
        this.currentMinigameGraphic.anchor.set(0.5)
        this.refreshMinigameBrowser();
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

    setupMainMenuButtons() {
        // main menu

        this.buttons.extrasButton.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS);
        })

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
                OwO.__addItemsToPlayer(); // re-add items
                OwO.__clearAreaName();
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
            difficultyTextBox.setTextArray(["Easy mode halves stamina loss.\nCannot buy new items."]);
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
            difficultyTextBox.setTextArray(["Doubles stamina loss.\nSave deleted on loss.\nSpecial border unlocked when getting an ending"]);
        })

        this.buttons.difficultyBack.setOnSelected(function() {
            difficultyTextBox.showTextBox(false)
        })
        this.buttons.difficultyBack.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_MAIN);
        })

        this.buttons.difficultyEasy.disableClickSound();
        this.buttons.difficultyNormal.disableClickSound();
        this.buttons.difficultyHard.disableClickSound();
    }

    setupExtraButtons() {
        this.buttons.extras.buttonBack.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_MAIN);
        })

        this.buttons.extras.buttonBrowse.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_MINIGAME_BROWSER);
        })

        this.buttons.extras.buttonEndings.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_ENDINGS);
        })

        this.buttons.extras.buttonBonus.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS_UNLOCKS);
        })

        if(this.totalUnlockedEndings<4) {
            this.buttons.extras.buttonBonus.lock();
            this.buttons.extras.buttonBonus.setTooltip("Unlock every ending to view\n concept art and developer stories!");
        }

        /*this.buttons.extras.buttonMinigameRush.setOnPressed(function() {
            MenuIntroController.getInstance().startMinigameRush();
        })*/
    }

    setupBrowseButtons() {

        this.buttons.browse.buttonRight.setOnPressed(function() {
            MenuIntroController.getInstance().nextMinigame(1);
        });

        this.buttons.browse.buttonLeft.setOnPressed(function() {
            MenuIntroController.getInstance().nextMinigame(-1);
        });

        this.buttons.browse.buttonPlay.setTestPressed(function() {
            var canPlay = $engine.hasMinigame(MenuIntroController.getInstance().getSelectedMingame());
            if(!canPlay)
                SoundManager.playBuzzer();
            return canPlay
        });

        this.buttons.browse.buttonPlay.setOnPressed(function() {
            MenuIntroController.getInstance().startSelectedMinigame();
        });

        this.buttons.browse.buttonBack.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS);
        });
    }

    startSelectedMinigame() {
        $engine.audioFadeAll();
        $engine.setRoom(this.getSelectedMingame().room)
        $engine.overrideRoomChange("MenuIntro")
        $engine.overrideReturn("MenuIntro")
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

    refreshMinigameBrowser() {
        var minigame = this.getSelectedMingame();
        if($engine.hasMinigame(minigame)) {
            this.currentMinigameGraphic.texture = this.getGraphicFromMinigame(minigame);
        } else {
            this.currentMinigameGraphic.texture = $engine.getTexture("mingames_sheet_17");
        }
    }

    setupEndingButtons() {
        this.buttons.endings.buttonBack.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS);
        })
    }

    createButtons() {
        this.buttons = {};
        this.buttons.extrasButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2+170);
        this.buttons.extrasButton.setTextures("buttons_main_0","buttons_main_0","buttons_main_1")
        this.buttons.continueButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2+70);
        this.buttons.continueButton.setTextures("buttons_main_2","buttons_main_2","buttons_main_3")
        this.buttons.startButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2-30);
        this.buttons.startButton.setTextures("buttons_main_4","buttons_main_4","buttons_main_5")
        
        var offsetDifficulty = $engine.getWindowSizeY();

        this.buttons.difficultyBack = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 - 200 + offsetDifficulty);
        this.buttons.difficultyBack.setTextures("back_button_0","back_button_0","back_button_1")
        this.buttons.difficultyEasy = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 - 100 + offsetDifficulty);
        this.buttons.difficultyEasy.setTextures("difficulty_buttons_0","difficulty_buttons_0","difficulty_buttons_1")
        this.buttons.difficultyNormal = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 + offsetDifficulty);
        this.buttons.difficultyNormal.setTextures("difficulty_buttons_2","difficulty_buttons_2","difficulty_buttons_3")
        this.buttons.difficultyHard = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2 + 100 + offsetDifficulty);
        this.buttons.difficultyHard.setTextures("difficulty_buttons_4","difficulty_buttons_4","difficulty_buttons_5")

        var offsetExtras = $engine.getWindowSizeX()+50;

        this.buttons.extras = {};

        this.buttons.extras.buttonBonus = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras,$engine.getWindowSizeY()/2-100);
        this.buttons.extras.buttonBonus.setTextures("buttons_extra_0","buttons_extra_0","buttons_extra_1")
        //this.buttons.extras.buttonMinigameRush = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras,$engine.getWindowSizeY()/2-50);
        //this.buttons.extras.buttonMinigameRush.setTextures("buttons_extra_2","buttons_extra_2","buttons_extra_3")
        this.buttons.extras.buttonBrowse = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras,$engine.getWindowSizeY()/2);
        this.buttons.extras.buttonBrowse.setTextures("buttons_extra_6","buttons_extra_6","buttons_extra_7")
        this.buttons.extras.buttonEndings = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras,$engine.getWindowSizeY()/2+100);
        this.buttons.extras.buttonEndings.setTextures("buttons_extra_4","buttons_extra_4","buttons_extra_5")
        this.buttons.extras.buttonBack = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras - 250,$engine.getWindowSizeY()/2);
        this.buttons.extras.buttonBack.setTextures("back_button_0","back_button_0","back_button_1")

        this.buttons.endings = {};
        this.buttons.endings.buttonBack = new MainMenuButton($engine.getWindowSizeX()/2 + $engine.getWindowSizeX(),$engine.getWindowSizeY()/2 + $engine.getWindowSizeY() - 200);
        this.buttons.endings.buttonBack.setTextures("back_button_0","back_button_0","back_button_1")

        this.buttons.browse = {};
        this.buttons.browse.buttonBack = new MainMenuButton($engine.getWindowSizeX()/2 + $engine.getWindowSizeX() * 2,$engine.getWindowSizeY() - 25);
        this.buttons.browse.buttonBack.setTextures("back_button_0","back_button_0","back_button_1")
        this.buttons.browse.buttonPlay = new MainMenuButton($engine.getWindowSizeX()/2 + $engine.getWindowSizeX() * 2,$engine.getWindowSizeY() - 125);
        this.buttons.browse.buttonPlay.setTextures("play_button_0","play_button_0","play_button_1")
        this.buttons.browse.buttonLeft = new MainMenuButton($engine.getWindowSizeX()/2 + $engine.getWindowSizeX() * 2 - 150,$engine.getWindowSizeY() - 125);
        this.buttons.browse.buttonLeft.setTextures("arrow_button_0","arrow_button_0","arrow_button_1")
        this.buttons.browse.buttonRight = new MainMenuButton($engine.getWindowSizeX()/2 + $engine.getWindowSizeX() * 2 + 150,$engine.getWindowSizeY() - 125);
        this.buttons.browse.buttonRight.setTextures("arrow_button_0","arrow_button_0","arrow_button_1")

        this.buttons.browse.buttonLeft.xScale *= -1;

        var button = this.buttons.browse.buttonLeft;
        button.setHitbox(new Hitbox(button, new RectangleHitbox(button, -315/2,-125,315/2,125)));
        var button = this.buttons.browse.buttonRight;
        button.setHitbox(new Hitbox(button, new RectangleHitbox(button, -315/2,-125,315/2,125)));
        

        this.setupMainMenuButtons();
        this.setupDifficultyButtons();
        this.setupExtraButtons();
        this.setupEndingButtons();
        this.setupBrowseButtons();
    }

    startMinigameRush() {
        $engine.fadeOutAll(1);
        $engine.startFadeOut(60)
        $engine.audioFadeAll();
        IM.with(MainMenuButton,function(button) {
            button.disable();
        })
        AudioManager.playSe($engine.generateAudioReference("GameStart"))
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

        if(IN.keyCheckPressed("RPGescape") && this.backButton) {
            this.backButton.setSelected();
            this.backButton.testPress();
        }
    }

    handleTooltips() {
        var obj = IM.instancePosition(IN.getMouseX(),IN.getMouseY(),FloatingObject);
        if(!obj) {
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
        this.handleLetters();
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
                this.cameraTargetX = $engine.getWindowSizeX();
                this.cameraTargetY = 0;
            break;
            case(MenuIntroController.REGION_ENDINGS):
                this.cameraTargetX = $engine.getWindowSizeX();
                this.cameraTargetY = $engine.getWindowSizeY();
            break;
            case(MenuIntroController.REGION_MINIGAME_BROWSER):
                this.cameraTargetX = $engine.getWindowSizeX()*2;
                this.cameraTargetY = 0;
            break;
            case(MenuIntroController.REGION_EXTRAS_UNLOCKS):
                this.cameraTargetX = $engine.getWindowSizeX();
                this.cameraTargetY = -$engine.getWindowSizeY();
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
                this.buttons.extrasButton.enable();
                this.activeButtons = [this.buttons.continueButton, this.buttons.startButton,this.buttons.extrasButton]
                this.registerBackButton(undefined)
            break;
            case(MenuIntroController.REGION_DIFFICULTY):
                this.buttons.difficultyBack.setSelected();
                this.buttons.difficultyEasy.enable();
                this.buttons.difficultyNormal.enable();
                this.buttons.difficultyHard.enable();
                this.buttons.difficultyBack.enable();
                this.activeButtons = [this.buttons.difficultyHard, this.buttons.difficultyNormal, this.buttons.difficultyEasy, this.buttons.difficultyBack]
                this.registerBackButton(this.buttons.difficultyBack);
            break;
            case(MenuIntroController.REGION_EXTRAS):
                this.buttons.extras.buttonBack.setSelected();
                this.buttons.extras.buttonBack.enable();
                this.buttons.extras.buttonBonus.enable();
                //this.buttons.extras.buttonMinigameRush.enable();
                this.buttons.extras.buttonBrowse.enable();
                this.buttons.extras.buttonEndings.enable();
                this.activeButtons = [this.buttons.extras.buttonBack,this.buttons.extras.buttonEndings,this.buttons.extras.buttonBrowse,
                            /*this.buttons.extras.buttonMinigameRush,*/this.buttons.extras.buttonBonus]
                this.registerBackButton(this.buttons.extras.buttonBack);
            break;
            case(MenuIntroController.REGION_ENDINGS):
                this.buttons.endings.buttonBack.setSelected();
                this.buttons.endings.buttonBack.enable();
                this.activeButtons = [this.buttons.endings.buttonBack]
                this.registerBackButton(this.buttons.endings.buttonBack);
            break;
            case(MenuIntroController.REGION_MINIGAME_BROWSER):
                this.buttons.browse.buttonBack.setSelected();
                this.buttons.browse.buttonBack.enable();
                this.buttons.browse.buttonLeft.enable();
                this.buttons.browse.buttonPlay.enable();
                this.buttons.browse.buttonRight.enable();
                this.activeButtons = [this.buttons.browse.buttonBack,this.buttons.browse.buttonLeft,this.buttons.browse.buttonPlay,this.buttons.browse.buttonRight]
                this.registerBackButton(this.buttons.browse.buttonBack);
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
            check--;
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

class FloatingObject extends EngineInstance {
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

    step() {
        this.angle = Math.sin(($engine.getGameTimer()+this.rand3)/this.rand4)/16
        var diffX = (this.ox - (IN.getMouseX()-this.x)/8)
        var diffY = (this.oy - (IN.getMouseY()-this.y)/8)
        this.ox -= diffX/60;
        this.oy -= diffY/60;
        this.x = this.xStart + 10 * Math.sin(($engine.getGameTimer()+this.x+this.rand2)/64) + this.ox;
        this.y = this.yStart + 10 *  Math.cos(($engine.getGameTimer()+this.y+this.rand1)/64) + this.oy;
    }
}

class MainMenuButton extends FloatingObject {
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
        this.clickSoundEnabled = true;
    }

    setTextures(def, armed, fire) {
        this.tex1 = $engine.getTexture(def);
        this.tex2 = $engine.getTexture(armed);
        this.tex3 = $engine.getTexture(fire);
        this.setSprite(new PIXI.Sprite(this.tex1))
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