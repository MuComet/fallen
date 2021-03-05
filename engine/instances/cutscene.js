class CutsceneController extends EngineInstance {
    onEngineCreate() {
        this.sheet = CutsceneController.cutsceneSheet;
        this.textures = $engine.getTexturesFromSpritesheet(this.sheet,0,$engine.getSpriteSheetLength(this.sheet));
        this.setSprite(new PIXI.Sprite(this.textures[0]));
        this.frames = this.textures.length;
        this.currentFrame = 0;
        this.frameLength = [3*60,4*60,6*60,7*60,4*60,3*60,4*60,4*60,6*60,5*60,6*60,7*60,3*60,4*60]
        this.timer = 0;

        this.transitionTime = 36;

        this.blurFilterStrength = 6; // making it a round number kinda messes with it
        this.blurFilter = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilter.blur = this.blurFilterStrength
        this.blurFilter.repeatEdgePixels=true;

        $engine.setBackgroundColour(0)

        if(!$engine.isLow())
            $engine.addFilter(this.blurFilter);

        this.bloomFilterStrength = 3;
        this.bloomFilter = new PIXI.filters.AdvancedBloomFilter(8,4,3,15);

        if(!$engine.isLow())
            $engine.addFilter(this.bloomFilter);

        this.wipeTimer = -1;

        this.wipeStarted=false;
        this.out = false;

        this.musicIndices = [0,3,6,10];
        this.musicIndex = 0;

        this.sounds = ["audio/bgm/Intro1.ogg","audio/bgm/Intro2.ogg","audio/bgm/Intro3.ogg","audio/bgm/Intro4.ogg"];
        this.music = undefined;
        this.getNextMusic();
    }

    getNextMusic() {
        if(this.music)
            $engine.audioFadeSound(this.music);
        this.music = $engine.audioGetSound(this.sounds[this.musicIndex],"BGM",0.5);
        $engine.audioPlaySound(this.music,true);
        $engine.audioFadeInSound(this.music);
        this.musicIndex++;
    }

    onCreate() {

    }

    updateImage() {
        this.getSprite().texture = this.textures[this.currentFrame];
        if(this.currentFrame===this.musicIndices[this.musicIndex]) {
            this.getNextMusic();
        }
    }

    step() {
        if(IN.anyInputPressed() && !IN.keyCheckPressed("Escape") && this.timer < this.frameLength[this.currentFrame]-this.transitionTime && this.timer > this.transitionTime/2) {
            this.timer = this.frameLength[this.currentFrame]-this.transitionTime;
        }
        // speedrun speedrun speedrun go go go go go
        if(IN.keyCheckPressed("Escape") && this.timer > this.transitionTime && !this.wipeStarted) {
            this.out = true;
            this.wipeTimer = 0;
            this.wipeStarted=true;
        }
        if(this.timer>this.frameLength[this.currentFrame]) {
            if(this.currentFrame < this.frames-1) {
                this.currentFrame++;
                this.timer = 0;
                this.updateImage();
            } else {
                $engine.audioFadeAll(15);
            }
            if(this.currentFrame===12) {
                $engine.audioPlaySound("audio/se/Snap.ogg");
            }
        } else {
            if(this.timer <= this.transitionTime)
                this.blurFilter.blur = EngineUtils.interpolate(this.timer/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_OUT);
                this.bloomFilter.brightness = EngineUtils.interpolate(this.timer/this.transitionTime,this.bloomFilterStrength,1,EngineUtils.INTERPOLATE_OUT);
            if(this.frameLength[this.currentFrame]-this.timer <= this.transitionTime) {
                this.blurFilter.blur = EngineUtils.interpolate((this.frameLength[this.currentFrame]-this.timer)/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_OUT);
                this.bloomFilter.brightness = EngineUtils.interpolate((this.frameLength[this.currentFrame]-this.timer)/this.transitionTime,this.bloomFilterStrength,1,EngineUtils.INTERPOLATE_OUT);
                if(this.currentFrame >= this.frames-1 && !this.wipeStarted) {
                    this.wipeStarted=true;
                    this.wipeTimer = -1;
                    this.out = true;
                }
            }
            if(this.frameLength[this.currentFrame]-this.timer===this.transitionTime/2 && this.currentFrame < this.frames-1) {
                var snd = $engine.audioGetSound("audio/se/Paper.ogg","SE",3);
                snd.speed = EngineUtils.randomRange(0.9,1.1);
                $engine.audioPlaySound(snd)
            }
        }
        if(this.wipeTimer>this.transitionTime && this.wipeStarted) {
            CutsceneController.cutsceneComplete();
        }
        this.timer++;
        this.wipeTimer++;
    }

    draw(gui, camera) {

        if($engine.isLow()) {
            var fac = 0;
            if(this.timer <= this.transitionTime)
                fac = EngineUtils.interpolate(this.timer/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_OUT);
            else if(this.frameLength-this.timer <= this.transitionTime)
                fac = EngineUtils.interpolate((this.frameLength-this.timer)/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_OUT);
            if(fac!==0) {
                gui.beginFill(0xffffff,fac);
                gui.drawRect(-64,-64,$engine.getWindowSizeX()+64,$engine.getWindowSizeY()+64)
                gui.endFill();
            }
        }

        gui.beginFill(0);
        if(this.out) {
            gui.drawRect(-64,$engine.getWindowSizeY() + EngineUtils.interpolate(this.wipeTimer/this.transitionTime,0,-$engine.getWindowSizeY()-16,EngineUtils.INTERPOLATE_OUT),
                        $engine.getWindowSizeX()+64,$engine.getWindowSizeY()+16)
        } else {
            gui.drawRect(-64,EngineUtils.interpolate(this.wipeTimer/this.transitionTime,0,-$engine.getWindowSizeY()-64,EngineUtils.INTERPOLATE_IN)-16,
                        $engine.getWindowSizeX()+64,$engine.getWindowSizeY()+16)
        }
        gui.endFill();
    }
}