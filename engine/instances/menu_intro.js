class MenuIntroController extends EngineInstance {

    // important note: This class, by nature of having to deal with engine start, is allowed access to engine data.

    onEngineCreate() {

        // please never do this in actual minigame code -- hook into minigamecontroller
        MinigameController.controller = this;
        this.startTime = window.performance.now(); // overwritten later...

        this.perfTime = 0;

        this.renderedFrames = 0;

        this.sampling = false;
        UwU.addRenderListener(this.nextFrame);

        $__engineData.__readyOverride=false;

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

        // overwrite the mouse location, PIXI doesn't update immedaitely...
        IN.getMouseX()
        IN.__mouseX=410;
        IN.__mouseY=120;

        var startButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2);
        startButton.setTextures("button_new_game_1","button_new_game_1","button_new_game_2")
        startButton.setOnPressed(function(){
            $engine.audioFadeSound(MinigameController.getInstance().menuMusic,30);
            IM.with(MainMenuButton,function(button) {
                button.enabled = false;
            })
            AudioManager.playSe($engine.generateAudioReference("GameStart"))
            $engine.audioFadeAll();
            return true
        });
        startButton.setScript(function() {
            $engine.setRoom("IntroCutsceneRoom")
        });
        startButton.setSelected();
        
        var continueButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2+120);
        continueButton.setTextures("button_continue_1","button_continue_1","button_continue_2")
        continueButton.setOnPressed(function() {
            var time = window.performance.now();
            var ret = false;
            if (DataManager.loadGame(1)) {
                // reload map if updated -- taken from rpg_scenes.js line 1770
                if ($gameSystem.versionId() !== $dataSystem.versionId) {
                    $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
                    $gamePlayer.requestMapReload();
                }
                SoundManager.playLoad();
                $engine.fadeOutAll(1);
                $engine.audioFadeAll();
                $engine.audioFadeSound(MinigameController.getInstance().menuMusic,30);
                IM.with(MainMenuButton,function(button) {
                    button.enabled = false;
                })
                ret =  true;
            } else {
                SoundManager.playBuzzer();
                ret = false;
            }
            MinigameController.getInstance().timeCorrection+=window.performance.now()-time;
            return ret;
        });
        continueButton.setScript(function() {
            SceneManager.goto(Scene_Map);
            var oldFunc = $engine.terminate;
            $engine.terminate = function() { // hijack... myself?
                oldFunc.call(this);
                $gameSystem.onAfterLoad();
            }
        });

        this.menuMusic = $engine.audioPlaySound("title_music",1,true)
        $engine.audioSetLoopPoints(this.menuMusic,10,50);

        this.renderTexture = $engine.createManagedRenderable(this, PIXI.RenderTexture.create($engine.getWindowSizeX(),$engine.getWindowSizeY()));
        this.brush = $engine.createManagedRenderable(this,new PIXI.Container());
        for(var i =0;i<250;i++) {
            var child = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("intro_background")))
            child.x = EngineUtils.irandomRange(-2048,2048);
            child.y = EngineUtils.irandomRange(-2048,2048);
            child.rotation = EngineUtils.randomRange(-2048,2048);
            this.brush.addChild(child);
        }
        this.brush.filters = [new PIXI.filters.BlurFilter(),new PIXI.filters.ZoomBlurFilter()];
        this.sample(); // prepare for samples later.
    }

    // low perforance check. basically a couple sprites to the screen to make the GPU have a stroke.
    sample() {
        for(var k =0;k<10;k++) {
            $engine.getRenderer().render(this.brush,this.renderTexture,false,null,false);
        }
    }

    testPerformance() {
        this.perfTime = window.performance.now() - this.perfTime;
    }

    nextFrame() {
        var inst = MinigameController.getInstance()
        if(inst.sampling) {
            inst.renderedFrames++;
            if(inst.renderedFrames>15) {
                inst.sampling = false;
                inst.testPerformance();
            }
        }
    }

    step() {
        if(this.sampling) {
            this.simulatedFrames++;
        }

        if(IN.anyKeyPressed() && this.timer < this.endTime) {
            this.endTime=this.timer;
        }

        this.timer++;

        // wait for context, when we get context, start the music.
        if(this.audioRef && !this.musicStarted && IN.anyInputPressed() && !IN.keyCheck("Escape")) { // escape doesn't count?
            this.audioRef._source.context.resume();
            this.musicStarted = true;
        }

        /*if(!AudioManager._bgmBuffer.isReady() && !this.musicStarted) {
            console.log("started")
            AudioManager._bgmBuffer.play()
            this.musicStarted=true;
        }*/

        this.nextCloud--;
        if(this.nextCloud<=0) {
            let cloud = new RisingSprite(EngineUtils.random($engine.getWindowSizeX()),$engine.getTexture("cloud_generic_"+EngineUtils.irandomRange(1,4)))
            this.nextCloud = EngineUtils.irandomRange(60,120);
            if(this.timer<this.endTime) {
                cloud.alpha = 0;
            }
        }
        this.nextLeaf--;
        if(this.nextLeaf<=0) {
            let leaf = new RisingSprite(EngineUtils.random($engine.getWindowSizeX()),$engine.getRandomTextureFromSpritesheet("leaf_particles"))
            leaf.rotateFactor = 10;
            leaf.changeScale(0.5,0.5)
            leaf.flipHoriz = true;
            leaf.flipVert = true;
            leaf.speed*=EngineUtils.randomRange(1.6,3);
            this.nextLeaf = EngineUtils.irandomRange(12,24);
            if(this.timer<this.endTime) {
                leaf.alpha = 0;
            }
        }

        if(this.timer>this.endTime) {
            if(this.timer===this.endTime+1) {
                IM.with(RisingSprite, function(cloud){cloud.alpha = 1});
                IM.with(MainMenuButton, function(button){button.enable()})
                for(var i=0;i<8;i++) {
                    var letter = this.letters[i]
                    letter.y = letter.destY
                    letter.x = letter.destX
                    letter.angle = 0;
                }
            }
            for(var i =0;i<8;i++)
                this.letters[i].floatRandom();
        } else {
            for(var i=0;i<8;i++) {
                var letter = this.letters[i]
                if(this.timer>=letter.randomOffset) {
                    var val = (this.timer-letter.randomOffset)/(this.endTime-letter.randomOffset)
                    letter.y = this.interp(val,$engine.getWindowSizeY()+120,letter.destY)
                    letter.x = this.interp(val,letter.xRandStart,letter.destX)
                    letter.angle = this.interp(val,letter.randomOffsetAngle,0)
                }
            }
        }

        var mouseOffset = $engine.getWindowSizeX()/2-IN.getMouseX();
        var diff = (this.bg.x + 92 - (this.bg.x - mouseOffset)/16);

        this.bg.x -= diff/128

        if(this.isFading) {
            this.fadeTimer++;
            if(this.fadeTimer>=this.endFadeTime) {
                this.afterFade.apply(this.afterFadeArgs);
            }
        }

        if(this.timer===this.endTime+this.startTimeOffset) {
            this.startTime = window.performance.now();
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
            if(this.timer-this.endTime<12) { // drawing of the while fade, but also the performance sampling
                if(this.timer-this.endTime===1) {
                    this.perfTime=window.performance.now();
                    this.sampling = true; // we sample 15 frames from this point forward.
                }
                this.graphics.alpha=1;
                if((this.timer-this.endTime)%3 == 0) {
                    //this.sample();
                }
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
    }

    interp(val,min,max) {
        return (max-min)*((val-1)**3+1)+min;
    }

    beginFade(func, ...args) {
        this.isFading = true;
        this.fadeTimer = 0;
        this.endFadeTime = 60;
        this.afterFade=func;
        this.afterFadeArgs=args;
    }

    cleanup() {
        UwU.removeRenderListener(this.nextFrame);
        MinigameController.controller=undefined;
    }

    __notifyFramesSkipped(frames) {
        if(this.timer>this.endTime+this.startTimeOffset) // don't bother, we haven't started recording.
            this.timeCorrection+=frames*16.66666;
    }

    onRoomEnd() {
        if(this.perfTime > 550) {
            if(!$engine.isLow()) {
                console.warn("It looks like you're playing on a low spec system... The game will automatically lower render quality to account for this.")
                console.warn("Test render took "+String(this.perfTime)+" ms...");
            }
            //$engine.setLowPerformanceMode(true)
        }

    }
}

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
        this.y-=this.speed;
        this.getSprite().tint = 0xffffff
        if(this.y<=-120)
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
        this.script = undefined;
        this.onPressed = undefined;
        this.xScale = 0.25;
        this.yScale = 0.25;
        this.active = false;
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
        this.outlineFilter = new PIXI.filters.OutlineFilter(4,0xffffff);
        this.fitlers = [];
        this.onEngineCreate();
    }

    setOnPressed(scr) {
        this.onPressed = scr;
    }

    setScript(scr) {
        this.script = scr;
    }

    outlineTick() {
        var strength = 4;
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
        if(!this.enabled)
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
                this.testPressed();
            }
        } else {
            this.getSprite().texture = this.tex1;
        }

        // i hate this -- fix same frame skip and start...
        var controller = IM.find(MenuIntroController);
        if(controller.timer-1>controller.endTime && this.active && (IN.keyCheckPressed("Enter") || IN.keyCheckPressed("Space"))) {
            this.testPressed();
        }
    }

    testPressed() {
        if(this.onPressed()) {
            IM.find(MenuIntroController,0).beginFade(this.script);
            this.pressed = true;
            this.getSprite().texture = this.tex3; // pressed
        }
    }


    enable() {
        this.enabled=true;
        this.alpha = 1;
    }
}