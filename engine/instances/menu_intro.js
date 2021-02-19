class MenuIntroController extends EngineInstance {
    onEngineCreate() {
        this.letters = [];
        //var locX = [37,159,308,451,522,671];
        var locX = [25,142,306,453,532,685];
        var locY = [175,255,165,255,165,205];
        var offsets = [14, 36, 27, 42, 20, 55]
        for(var i =1;i<=6;i++) {
            let letter = new Letter(i,locX[i-1]*0.5+230,locY[i-1]*0.5)
            letter.randomOffset = offsets[i-1]
            letter.randomOffsetAngle = EngineUtils.randomRange(-0.34,0.34)
            letter.xRandStart = letter.xStart+EngineUtils.randomRange(-24,24)
            this.letters.push(letter);
            letter.y = $engine.getWindowSizeY()+200;
        }
        this.timer = 0;
        $engine.setBackgroundColour(0x65ceeb)
        this.graphics = $engine.createRenderable(this,new PIXI.Graphics(),false)
        this.endTime = 300;
        this.nextCloud = 0;
        this.nextLeaf = 0;

        this.isFading=false;

        // overwrite the mouse location, PIXI doesn't update immedaitely...
        IN.getMouseX()
        IN.__mouseX=410;
        IN.__mouseY=120;

        var startButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2);
        startButton.setTextures("button_new_game_1","button_new_game_1","button_new_game_2")
        startButton.setOnPressed(function(){
            AudioManager.fadeOutBgm(1);
            IM.with(MainMenuButton,function(button) {
                button.enabled = false;
            })
            return true
        });
        startButton.setScript(function() {
            CutsceneController.cutsceneSheet = "intro_cutscene_sheet";
            CutsceneController.cutsceneComplete =  MenuIntroController.startNewGame;
            $engine.setRoom("CutsceneRoom")
        });
        
        var continueButton = new MainMenuButton($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2+120);
        continueButton.setTextures("button_continue_1","button_continue_1","button_continue_2")
        continueButton.setOnPressed(function(){
            if (DataManager.loadGame(1)) {
                // reload map if applicable -- taken from rpg_scenes.js line 1770
                if ($gameSystem.versionId() !== $dataSystem.versionId) {
                    $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
                    $gamePlayer.requestMapReload();
                }
                AudioManager.fadeOutBgm(1);
                IM.with(MainMenuButton,function(button) {
                    button.enabled = false;
                })
                return true;
            } else {
                SoundManager.playBuzzer();
                return false;
            }
        });
        continueButton.setScript(function() {
            $gameSystem.onAfterLoad();
            SceneManager.goto(Scene_Map);
        });

        this.audioReference = $engine.generateAudioReference("prototype");
        this.musicStarted = false;
        AudioManager.playBgm(this.audioReference)
    }

    step() {
        if(IN.anyKeyPressed() && this.timer < this.endTime) {
            this.endTime=this.timer;
        }

        this.timer++;

        var src = AudioManager._bgmBuffer._sourceNode;
        // wait for context, when we get context, start the music.
        if(src!==null && !this.musicStarted && IN.anyInputPressed() && !IN.keyCheck("Escape")) { // escape doesn't count?
            AudioManager._bgmBuffer._sourceNode.context.resume();
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
            this.nextLeaf = EngineUtils.irandomRange(12,24);
            if(this.timer<this.endTime) {
                leaf.alpha = 0;
            }
        }

        if(this.timer>this.endTime) {
            if(this.timer===this.endTime+1) {
                IM.with(RisingSprite, function(cloud){cloud.alpha = 1});
                IM.with(MainMenuButton, function(button){button.enable()})
                for(var i=0;i<6;i++) {
                    var letter = this.letters[i]
                    letter.y = letter.destY
                    letter.x = letter.destX
                    letter.angle = 0;
                }
            }
            for(var i =0;i<6;i++)
                this.letters[i].floatRandom();
        } else {
            for(var i=0;i<6;i++) {
                var letter = this.letters[i]
                if(this.timer>=letter.randomOffset) {
                    var val = (this.timer-letter.randomOffset)/(this.endTime-letter.randomOffset)
                    letter.y = this.interp(val,$engine.getWindowSizeY()+120,letter.destY)
                    letter.x = this.interp(val,letter.xRandStart,letter.destX)
                    letter.angle = this.interp(val,letter.randomOffsetAngle,0)
                }
            }
        }

        if(this.isFading) {
            this.fadeTimer++;
            if(this.fadeTimer>=this.endFadeTime) {
                this.afterFade.apply(this.afterFadeArgs);
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
            if(this.timer-this.endTime<12)
                this.graphics.alpha=1;
            else
                this.graphics.alpha=1-this.interp((this.timer-this.endTime-12)/24,0,1)
            this.graphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY())
            this.graphics.endFill()
        }
        if(this.timer<=this.endTime) {
            var fac = EngineUtils.clamp(this.timer/60,0,1);
            var r = Math.round(this.interp(fac,0,0x8));
            var g = Math.round(this.interp(fac,0,0x8));;
            var b = Math.round(this.interp(fac,0,0x20));;
            
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
}

class Letter extends EngineInstance {

    onEngineCreate() {

    }

    onCreate(ind,x,y) {
        this.setSprite(new PIXI.Sprite($engine.getTexture("intro_"+String(ind))))
        this.xScale=0.5;
        this.yScale=0.5;
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
        this.onEngineCreate();

        this.setSprite(new PIXI.Sprite(texture))

        this.randRot = EngineUtils.random(60)

        var f1 = new PIXI.filters.BlurFilter();
        f1.blur = EngineUtils.clamp(Math.abs(dist/600)*8,0,5);
        if(f1.blur < 3)
            f1.blur = 1;
        this.getSprite().filters = [f1]
    }

    step() {
        this.y-=this.speed;
        this.getSprite().tint = 0xffffff
        if(this.y<=-120)
            this.destroy();
        this.angle = this.baseAngle+Math.sin(this.randRot+$engine.getGameTimer()/32)/16;
    }
}

class MainMenuButton extends EngineInstance {
    onEngineCreate() {
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-368,-125,368,125));
        this.alpha = 0;
        this.enabled = false;
        this.script = undefined;
        this.onPressed = undefined;
        this.xScale = 0.25;
        this.yScale = 0.25;
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
        this.onEngineCreate();
    }

    setOnPressed(scr) {
        this.onPressed = scr;
    }

    setScript(scr) {
        this.script = scr;
    }

    step() {
        this.angle = Math.sin(($engine.getGameTimer()+this.rand3)/this.rand4)/16
        var diffX = (this.ox - (IN.getMouseX()-this.x)/8)
        var diffY = (this.oy - (IN.getMouseY()-this.y)/8)
        this.ox -= diffX/60;
        this.oy -= diffY/60;
        this.x = this.xStart + 10 * Math.sin(($engine.getGameTimer()+this.x+this.rand2)/64) + this.ox;
        this.y = this.yStart + 10 *  Math.cos(($engine.getGameTimer()+this.y+this.rand1)/64) + this.oy;
        if(!this.enabled)
            return;
        //this.removeSprite();
        if(this.pressed) {
            this.getSprite().texture = this.tex3; // pressed
        } else if(this.hitbox.containsPoint(IN.getMouseX(),IN.getMouseY())) {
            this.getSprite().texture = this.tex2; // armed
            if(IN.mouseCheck(0)) {
                this.getSprite().texture = this.tex3; // pressed
            } else if(IN.mouseCheckReleased(0)) {
                this.getSprite().texture = this.tex3; // pressed
                if(this.onPressed()) {
                    IM.find(MenuIntroController,0).beginFade(this.script);
                    this.pressed = true;
                }
            }
        } else {
            this.getSprite().texture = this.tex1;
        }
    }


    enable() {
        this.enabled=true;
        this.alpha = 1;
    }
}