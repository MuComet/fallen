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

        this.data = $engine.getEngineGlobalData();
        this.data.inRush = false;

        this.skipIntro = $engine.minigameHack !== undefined;

        this.backButton = undefined;

        this.totalUnlockedEndings = 0;
        this.totalUnlockedMinigames = 0;

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

        for(var i = 0; i < this.minigameList.length; i++){
            if($engine.hasMinigame(this.minigameList[i])){
                this.totalUnlockedMinigames++;
            }
        }
        console.log(this.totalUnlockedMinigames);

        this.selectedMinigameIndex = 0;
        this.selectedArtIndex = 0;
        this.selectedMinigameTimer = 0;
        this.selectedArtTimer = 0;

        // overwrite the mouse location, PIXI doesn't update immedaitely...
        /*IN.getMouseXGUI()
        IN.__mouseXGUI=410;
        IN.__mouseYGUI=120;*/

        this.cameraTargetX =0;
        this.cameraTargetY =0;

        var musicVolume = $engine.minigameHack !== undefined ? 0 : 1

        this.menuMusic = $engine.audioPlaySound("title_music",1,true)
        $engine.audioSetLoopPoints(this.menuMusic,10,50);
        $engine.audioSetVolume(this.menuMusic, musicVolume);

        this.extrasMusic = $engine.audioPlaySound("extras",1,true);
        $engine.audioSetLoopPoints(this.extrasMusic,16,48);
        $engine.audioSetVolume(this.extrasMusic,1-musicVolume);

        this.extrasMusicTimer = $engine.minigameHack !== undefined ? 60 : 0;

        this.currentRegion = -1;

        this.setupEndings();
        this.createButtons();
        this.setupBrowser();
        this.setupBonus();
        this.setupFloatingObjects();

        if($engine.minigameHack !== undefined) {
            this.moveToRegion(MenuIntroController.REGION_MINIGAME_BROWSER, true)
            this.selectedMinigameIndex = $engine.minigameHack
            this.refreshMinigameBrowser();
        }

        $engine.minigameHack = undefined;
    }

    setupFloatingObjects() {
        var confirmText = new FloatingObject(-$engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2);
        var style = $engine.getDefaultTextStyle();
        style.fontSize = 25;
        var spr = $engine.createRenderable(confirmText, new PIXI.Text("Are you sure you want to delete your save data?"
        + "\n Deleting save data will remove items and your current save.\nDeleting save data will NOT delete unlocked minigames.",style),true)
        spr.anchor.set(0.5);
        var rushConfirmText = new FloatingObject($engine.getWindowSizeX()*2.5, -$engine.getWindowSizeY()/2)
        var rushSpr = $engine.createRenderable(rushConfirmText, new PIXI.Text("Suspended Minigame Rush data found!\nWould you like to continue where you last left off?",style),true)
        rushSpr.anchor.set(0.5);
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

    setupBonus() {
        this.bonus = new FloatingObject($engine.getWindowSizeX()*1.5-200, -$engine.getWindowSizeY()/2-96);
        //this.bonus.setSprite(new PIXI.Sprite($engine.getTexture("minigame_browser_board")));
        this.currentBonusGraphic = $engine.createRenderable(this.bonus,new PIXI.Sprite(PIXI.Texture.EMPTY));
        this.currentBonusGraphic.anchor.set(0.5);
        var textLocation = new FloatingObject($engine.getWindowSizeX()*1.5+150, -$engine.getWindowSizeY()/2-96);
        this.bonusText = $engine.createRenderable(textLocation, new PIXI.Text(this.getArtText(), $engine.getDefaultTextStyle()));
        this.bonusText.anchor.set(0.5);
        this.bonusText.scale.set(0.6);
        this.refreshArtBrowser();
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
            return true;
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
            $__engineData.__difficulty = ENGINE_DIFFICULTY.EASY;
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
            $__engineData.__difficulty = ENGINE_DIFFICULTY.MEDIUM;
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
            $__engineData.__difficulty = ENGINE_DIFFICULTY.HARD;
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

        this.buttons.extras.buttonDelete.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_DELETE_SAVE);
        })

        this.buttons.extras.buttonBonus.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS_UNLOCKS);
        })

        if(this.totalUnlockedEndings<4) {
            this.buttons.extras.buttonBonus.lock();
            this.buttons.extras.buttonBonus.setTooltip("Unlock every ending to view\n concept art and developer stories!");
        }

        this.buttons.extras.buttonMinigameRush.setOnPressed(function() {
            if(MenuIntroController.getInstance().data.rushGames === undefined){
                MenuIntroController.getInstance().startMinigameRush();
            }
            else{
                MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_RUSH_SAVE);
            }
        })

        if(this.totalUnlockedMinigames<17) {
            this.buttons.extras.buttonMinigameRush.lock();
            this.buttons.extras.buttonMinigameRush.setTooltip("Unlock every minigame\n and challenge yourself in one big rush\n of them all!");
        }

        else if(MenuIntroController.getInstance().data.bestRunNoCheat === undefined){
            this.buttons.extras.buttonMinigameRush.setTooltip("Try out the minigame gauntlet!");
        }

        else{
            this.buttons.extras.buttonMinigameRush.setTooltip("Best Run: " + MenuIntroController.getInstance().data.bestRunCheat + "\nBest Run without Cheats: " + MenuIntroController.getInstance().data.bestRunNoCheat);
        }
    }

    setupRushButtons() {
        this.buttons.progress.buttonBack.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS);
        });

        this.buttons.progress.buttonAccept.setOnPressed(function() {
            $engine.fadeOutAll(1);
            $engine.startFadeOut(60)
            $engine.audioFadeAll();
            IM.with(MainMenuButton,function(button) {
                button.disable();
            })
            AudioManager.playSe($engine.generateAudioReference("GameStart"))
            $engine.audioFadeAll();
            MenuIntroController.getInstance().data.inRush = true;
            $engine.setRoom("RushBreak")
            $engine.startFadeOut();
        });

        this.buttons.progress.buttonReject.setOnPressed(function() {
            MenuIntroController.getInstance().data.rushGames = undefined;
            MenuIntroController.getInstance().startMinigameRush();
        });
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

    setupBonusButtons() {
        this.buttons.bonus.buttonRight.setOnPressed(function() {
            MenuIntroController.getInstance().nextArt(1);
        });

        this.buttons.bonus.buttonLeft.setOnPressed(function() {
            MenuIntroController.getInstance().nextArt(-1);
        });

        this.buttons.bonus.buttonBack.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS);
        });
    }

    setupDeleteButtons() {

        this.buttons.delete.buttonAccept.setOnPressed(function() {
            $engine.purgeItems();
            $engine.deleteSave();
            SoundManager.playLoad(); // maybe change later
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS);
        });

        this.buttons.delete.buttonReject.setOnPressed(function() {
            MenuIntroController.getInstance().moveToRegion(MenuIntroController.REGION_EXTRAS);
        });
    }

    startSelectedMinigame() {
        IM.with(MainMenuButton,function(button) {
            button.disable();
        })
        $engine.audioFadeAll();
        $engine.setRoom(this.getSelectedMingame().room)
        $engine.overrideRoomChange("MenuIntro")
        $engine.overrideReturn("MenuIntro")
        $engine.minigameHack = this.selectedMinigameIndex;
        $engine.startFadeOut();
    }

    getSelectedMingame() {
        return this.minigameList[this.selectedMinigameIndex];
    }
    
    getArtText(){
        switch(this.selectedArtIndex){
            case(0):
                return "Hello everyone! Welcome to the bonus menu!\nCongrats on making it here. I was the\nlead designer and audio designer\nof Fallen and was the primary person\nworking on the Steam port.\nI thought I would share some fun\ninsider stories and concepts we had with you all.\nThank you very much for playing our game and\nmaking it far enough to get into this menu.\nI hope you enjoy everything you see here!"
            case(1):
                return "Here is the very first logo of Fallen.\nOriginally, the game was going\nto be called Fallen Angel,\nbut the design looked a lot better with just\nFallen, so we redesigned the logo.\nA lot of changes were made to the\ngame from conception to release.\nOriginally, Fallen was going to have many resource\nbars in addition to money and stamina,\nthe game was going to focus more on\nthe morality aspect than it does now,\nbut they were cut as they were found to\nbe too complex and not that fun."
            case(2):
                return "This is the very first concept of Eson.\nBeing the protagonist, they were\nthe first character designed.\nThe design is quite a bit different\nfrom what we ended up with. But it's\ncool looking back at where it all\nstarted. This design was sent to the\nteam on January 27th, 2020. This date is actually\nreferenced in Eson's ID in one of the\ncutscenes, we consider this day to be\ntheir birthday of sorts."
            case(3):
                return "Here is the sprite sheet of all the NPCs.\nOriginally, Fallen was planned\nto be a roguelike of sorts,\nwhere each run would have random\ncharacters from a predefined list. However\nwe decided to make more story characters\nand the game became more linear.\nThis means that all of the residents of Havoton\nhave so much personality in their\ndesigns and dialogue. Who are your favourites?"
            case(4):
                return "Here is a progress image for one of the\nframes in one of the cutscenes.\nEach frame in all the cutscenes\nwere drawn by hand by our wonderful artist.\nThey took a lot of effort, and\nthey turned out wonderful! A lot had to\ngo into making sure the cutscenes,\nminigames and rest of the game felt good,\nfrom a visual, audio and programming standpoint.\nI would like to thank our team for all\nthe work they put in!"
            case(5):
                return "This is an image of the Goddess of Balance we\nmade because of how many people\nreacted to her when\nwe released the Beta. Fun fact about the Gods,\nthe Sky God's name is Daeh, and\nthe Goddess of Balance's name is Seye!\nWe had a naming convention for\nall the heavenly beings. I wonder if you'd\nbe able to figure out what it is."
            case(6):
                return "Here is a beta image of the Video Game minigame.\nI made this game myself\nbecause I really wanted\nthis minigame idea to be in the final game,\nsince it's inspired by one of my\nfavourite games. All the minigames started\nwith lists of ideas and each of our\nminigame programmers picked some to work on.\nEach one had a lot of effort put because we needed\nsound effects, graphics and a\ncharacter to give the minigame.\nI'm pretty happy with the number of minigames we had."
            case(7):
                return "The treasure picture is actually a reference to\na different game that was\nmade at the same time\nas Fallen, called Sibling Story! We had a sort\nof rivalry with the members of\ntheir team because we originally\npicked the same team name\n(before we swapped to Main Street Games).\nAnother game we referenced is BreadHeist.\nFind both of those games on itch.io and give them a try!"
        }
    }

    getSelectedArt() {
        this.currentBonusGraphic.scale.set([0.3,0.5,0.4,0.45,0.3,0.3,0.75,0.75][this.selectedArtIndex])
        switch(this.selectedArtIndex) {
            case(0):
                return $engine.getTexture("bonus1");
            case(1):
                return $engine.getTexture("bonus5");
            case(2):
                return $engine.getTexture("bonus0");
            case(3):
                return $engine.getTexture("bonus2");
            case(4):
                return $engine.getTexture("bonus4");
            case(5):
                return $engine.getTexture("bonus3");
            case(6):
                return $engine.getTexture("bonus6");
            case(7):
                return $engine.getTexture("sibling");
        }
    }

    nextMinigame(change) {
        this.selectedMinigameIndex+=change;
        this.selectedMinigameIndex = (this.selectedMinigameIndex + this.minigameList.length) % this.minigameList.length;
        this.selectedMinigameTimer=0;
        this.refreshMinigameBrowser();
    }

    nextArt(change) {
        this.selectedArtIndex+=change;
        this.selectedArtIndex = (this.selectedArtIndex + 8) % 8; // 8 is the number of tabs we have, change if to be changed
        this.selectedArtTimer=0;
        this.refreshArtBrowser();
    }

    refreshMinigameBrowser() {
        var minigame = this.getSelectedMingame();
        if($engine.hasMinigame(minigame)) {
            this.currentMinigameGraphic.texture = this.getGraphicFromMinigame(minigame);
        } else {
            this.currentMinigameGraphic.texture = $engine.getTexture("mingames_sheet_17");
        }
    }

    refreshArtBrowser() {
        this.currentBonusGraphic.texture = this.getSelectedArt();
        this.bonusText.text = this.getArtText()
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

        this.buttons.extras.buttonBonus = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras,$engine.getWindowSizeY()/2-150);
        this.buttons.extras.buttonBonus.setTextures("buttons_extra_0","buttons_extra_0","buttons_extra_1")
        this.buttons.extras.buttonMinigameRush = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras,$engine.getWindowSizeY()/2+150);
        this.buttons.extras.buttonMinigameRush.setTextures("buttons_extra_2","buttons_extra_2","buttons_extra_3")
        this.buttons.extras.buttonBrowse = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras,$engine.getWindowSizeY()/2-50);
        this.buttons.extras.buttonBrowse.setTextures("buttons_extra_6","buttons_extra_6","buttons_extra_7")
        this.buttons.extras.buttonEndings = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras,$engine.getWindowSizeY()/2+50);
        this.buttons.extras.buttonEndings.setTextures("buttons_extra_4","buttons_extra_4","buttons_extra_5")
        this.buttons.extras.buttonBack = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras - 250,$engine.getWindowSizeY()/2);
        this.buttons.extras.buttonBack.setTextures("back_button_0","back_button_0","back_button_1")
        this.buttons.extras.buttonDelete = new MainMenuButton($engine.getWindowSizeX()/2 + offsetExtras + 150,$engine.getWindowSizeY()/2)
        this.buttons.extras.buttonDelete.setTextures("button_icons_0","button_icons_0","button_icons_1")
        

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

        this.buttons.bonus = {};
        this.buttons.bonus.buttonBack = new MainMenuButton($engine.getWindowSizeX()/2 + $engine.getWindowSizeX(), - 100);
        this.buttons.bonus.buttonBack.setTextures("back_button_0","back_button_0","back_button_1")
        this.buttons.bonus.buttonLeft = new MainMenuButton($engine.getWindowSizeX()/2 + $engine.getWindowSizeX() - 200, - 100);
        this.buttons.bonus.buttonLeft.setTextures("arrow_button_0","arrow_button_0","arrow_button_1")
        this.buttons.bonus.buttonRight = new MainMenuButton($engine.getWindowSizeX()/2 + $engine.getWindowSizeX() + 200, - 100);
        this.buttons.bonus.buttonRight.setTextures("arrow_button_0","arrow_button_0","arrow_button_1")

        this.buttons.browse.buttonLeft.xScale *= -1;
        this.buttons.bonus.buttonLeft.xScale *= -1;


        this.buttons.delete = {};
        this.buttons.delete.buttonAccept = new MainMenuButton(-$engine.getWindowSizeX()/2 - 150,$engine.getWindowSizeY()/2 + 125);
        this.buttons.delete.buttonAccept.setTextures("button_icons_4","button_icons_4","button_icons_5")
        this.buttons.delete.buttonReject = new MainMenuButton(-$engine.getWindowSizeX()/2 + 150,$engine.getWindowSizeY()/2 + 125);
        this.buttons.delete.buttonReject.setTextures("button_icons_2","button_icons_2","button_icons_3")

        this.buttons.progress = {};
        this.buttons.progress.buttonBack = new MainMenuButton($engine.getWindowSizeX()*2.5, -$engine.getWindowSizeY()/2 + 200);
        this.buttons.progress.buttonBack.setTextures("back_button_0","back_button_0","back_button_1")
        this.buttons.progress.buttonAccept = new MainMenuButton($engine.getWindowSizeX()*2.5 - 150,-$engine.getWindowSizeY()/2 + 125);
        this.buttons.progress.buttonAccept.setTextures("button_icons_4","button_icons_4","button_icons_5")
        this.buttons.progress.buttonReject = new MainMenuButton($engine.getWindowSizeX()*2.5 + 150,-$engine.getWindowSizeY()/2 + 125);
        this.buttons.progress.buttonReject.setTextures("button_icons_2","button_icons_2","button_icons_3")
        

        this.setupMainMenuButtons();
        this.setupDifficultyButtons();
        this.setupExtraButtons();
        this.setupEndingButtons();
        this.setupBrowseButtons();
        this.setupBonusButtons();
        this.setupDeleteButtons();
        this.setupRushButtons();
    }

    startMinigameRush() {
        $engine.fadeOutAll(1);
        $engine.startFadeOut(60)
        $engine.audioFadeAll();
        IM.with(MainMenuButton,function(button) {
            button.disable();
        })
        AudioManager.playSe($engine.generateAudioReference("GameStart"))
        this.data.inRush = true;
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
        if(this.timer>this.endTime) {
            if(this.timer===this.endTime+1) {
                IM.with(RisingSprite, function(cloud){cloud.alpha = 1});
                IM.with(MainMenuButton, function(button){button.enable()})
                if(!this.skipIntro) {
                    this.enableRegion(MenuIntroController.REGION_MAIN);
                }
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

    handleArtBrowser() {
        this.selectedArtTimer++;
        this.currentBonusGraphic.x = this.bonus.x;
        this.currentBonusGraphic.y = this.bonus.y;
        this.currentBonusGraphic.rotation = this.bonus.angle;
        this.bonusText.x = this.bonus.x+350;
        this.bonusText.y = this.bonus.y;
        this.bonusText.rotation = this.bonus.angle;
    }

    handleExtrasMusic() {
        if(this.currentRegion === MenuIntroController.REGION_MINIGAME_BROWSER) {
            this.extrasMusicTimer++;
            if(this.extrasMusicTimer > 60)
                this.extrasMusicTimer = 60;
        } else  {
            this.extrasMusicTimer--;
            if(this.extrasMusicTimer < 0)
                this.extrasMusicTimer = 0;
        }

        var fac = this.extrasMusicTimer/60;
        // $engine.audioSetVolume(this.menuMusic,1-fac)
        // $engine.audioSetVolume(this.extrasMusic,fac)
    }

    step() {

        if((IN.anyKeyPressed() || this.skipIntro) && this.timer < this.endTime) {
            this.endTime=this.timer;
        }

        this.handleFloatingObjects();
        this.handleLetters();
        this.handleCamera();
        this.handleKeyboardNavigation();
        this.handleTooltips();
        this.handleMingameBrowser();
        this.handleArtBrowser();
        this.handleExtrasMusic();

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

    moveToRegion(region, jump) {
        this.enableRegion(region);
        this.currentRegion = region;
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
            case(MenuIntroController.REGION_DELETE_SAVE):
                this.cameraTargetX = -$engine.getWindowSizeX();
                this.cameraTargetY = 0;
            break;
            case(MenuIntroController.REGION_RUSH_SAVE):
                this.cameraTargetX = $engine.getWindowSizeX()*2;
                this.cameraTargetY = -$engine.getWindowSizeY();
            break;
        }

        if(jump) {
            $engine.getCamera().setLocation(this.cameraTargetX, this.cameraTargetY)
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
                this.buttons.extras.buttonMinigameRush.enable();
                this.buttons.extras.buttonBrowse.enable();
                this.buttons.extras.buttonEndings.enable();
                this.buttons.extras.buttonDelete.enable();
                this.activeButtons = [this.buttons.extras.buttonBack, this.buttons.extras.buttonDelete, this.buttons.extras.buttonMinigameRush, this.buttons.extras.buttonEndings,this.buttons.extras.buttonBrowse,
                            this.buttons.extras.buttonBonus]
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
                this.activeButtons = [this.buttons.browse.buttonRight,this.buttons.browse.buttonPlay,this.buttons.browse.buttonLeft, this.buttons.browse.buttonBack]
                this.registerBackButton(this.buttons.browse.buttonBack);
            break;
            case(MenuIntroController.REGION_EXTRAS_UNLOCKS):
                this.buttons.bonus.buttonBack.setSelected();
                this.buttons.bonus.buttonBack.enable();
                this.buttons.bonus.buttonLeft.enable();
                this.buttons.bonus.buttonRight.enable();
                this.activeButtons = [this.buttons.bonus.buttonRight,this.buttons.bonus.buttonLeft, this.buttons.bonus.buttonBack]
                this.registerBackButton(this.buttons.bonus.buttonBack);
            break;
            case(MenuIntroController.REGION_DELETE_SAVE):
                this.buttons.delete.buttonReject.setSelected();
                this.buttons.delete.buttonReject.enable();
                this.buttons.delete.buttonAccept.enable();
                this.activeButtons = [this.buttons.delete.buttonAccept, this.buttons.delete.buttonReject]
                this.registerBackButton(this.buttons.delete.buttonReject);
            break;
            case(MenuIntroController.REGION_RUSH_SAVE):
                this.buttons.progress.buttonBack.setSelected();
                this.buttons.progress.buttonBack.enable();
                this.buttons.progress.buttonReject.enable();
                this.buttons.progress.buttonAccept.enable();
                this.activeButtons = [this.buttons.progress.buttonAccept, this.buttons.progress.buttonReject, this.buttons.progress.buttonBack]
                this.registerBackButton(this.buttons.progress.buttonBack);
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
MenuIntroController.REGION_DELETE_SAVE = 6 // deletion of save data
MenuIntroController.REGION_RUSH_SAVE = 7 // deletion of save data
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