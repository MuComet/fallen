class CutsceneController extends EngineInstance {
    onEngineCreate() {
        this.sheet = CutsceneController.cutsceneSheet;
        this.textures = $engine.getTexturesFromSpritesheet(this.sheet,0,$engine.getSpriteSheetLength(this.sheet));
        this.setSprite(new PIXI.Sprite(this.textures[0]));
        this.frames = this.textures.length;
        this.currentFrame = 0;
        this.frameLength = 3*60; // in frames
        this.timer = 0;

        this.transitionTime = 36;

        this.blurFilterStrength = 6; // making it a round number kinda messes with it
        this.blurFilter = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilter.blur = this.blurFilterStrength
        this.blurFilter.repeatEdgePixels=true;

        $engine.addFilter(this.blurFilter);

        this.bloomFilterStrength = 1.75;
        this.bloomFilter = new PIXI.filters.AdvancedBloomFilter(8,4,3,15);

        $engine.addFilter(this.bloomFilter);

        this.wipeTimer = -1;

        this.wipeStarted=false;
        this.out = false;
    }

    onCreate() {

    }

    updateImage() {
        this.getSprite().texture = this.textures[this.currentFrame];
    }

    step() {
        if(IN.keyCheckPressed("Space") && this.timer < this.frameLength-this.transitionTime && this.timer > this.transitionTime) {
            this.timer = this.frameLength-this.transitionTime;
        }
        // speedrun speedrun speedrun go go go go go
        if(IN.keyCheckPressed("Escape") && this.timer > this.transitionTime && !this.wipeStarted) {
            this.out = true;
            this.wipeTimer = 0;
            this.wipeStarted=true;
        }
        if(this.timer>this.frameLength) {
            if(this.currentFrame < this.frames-1) {
                this.currentFrame++;
                this.timer = 0;
                this.updateImage();
            }
        } else {
            if(this.timer <= this.transitionTime)
                this.blurFilter.blur = EngineUtils.interpolate(this.timer/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_IN);
                this.bloomFilter.brightness = EngineUtils.interpolate(this.timer/this.transitionTime,this.bloomFilterStrength,1,EngineUtils.INTERPOLATE_IN);
            if(this.frameLength-this.timer <= this.transitionTime) {
                this.blurFilter.blur = EngineUtils.interpolate((this.frameLength-this.timer)/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_OUT);
                this.bloomFilter.brightness = EngineUtils.interpolate((this.frameLength-this.timer)/this.transitionTime,this.bloomFilterStrength,1,EngineUtils.INTERPOLATE_OUT);
                if(this.currentFrame >= this.frames-1 && !this.wipeStarted) {
                    this.wipeStarted=true;
                    this.wipeTimer = -1;
                    this.out = true;
                }
            }
        }
        if(this.wipeTimer>this.transitionTime && this.wipeStarted) {
            CutsceneController.cutsceneComplete();
        }
        this.timer++;
        this.wipeTimer++;
    }

    draw(gui, camera) {
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