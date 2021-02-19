class MinigameTimer extends EngineInstance {
    onEngineCreate() {
        throw new Error("Do not instantiate the MinigameTimer with rooms.")
    }

    onCreate(frames, style = { fontFamily: 'Helvetica', fontSize: 30, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 2 }) {
        this.timer = frames;

        this.timerText = new PIXI.Text('TIME REMAINING:', style);
        this.timerText.anchor.x=0.5
        this.timerText.x = $engine.getWindowSizeX()/2;
        this.timerText.y = 40;

        this.timerDone = false;
        this.isPaused = false;
        this.visible=true;

        this.onTimerUp = [];

        this.gameOverText = "GAME OVER";
        this.gameCompleteText = "GAME COMPLETE";

        this.timerTextPrepend = "TIME REMAINING: ";

        this._updateText();
    }

    /**
     * 
     * @param {EngineInstance} par 
     * @param {Function} f 
     */
    addOnTimerStopped(par, f) {
        this.onTimerUp.push({parent:par, func:f});
    }

    step() {
        if(!this.timerDone && !this.isPaused) {
            this._updateText();
            this._checkIsTimeUp();
            this.timer--;
        }
    }

    setGameOverText(text) {
        this.gameOverText = text;
    }

    setGameCompleteText(text) {
        this.gameCompleteText = text;
    }

    updateStyle(key, value) {
        this.timerText.style[key]=value;
        this.timerText.dirty = true;
    }

    setStyle(style) {
        this.timerText.style = style;
        this.timerText.dirty = true;
    }

    _updateText() {
        var strEnd = String(EngineUtils.roundMultiple((this.timer%60)/60,0.01))+"000"
        this.timerText.text = this.timerTextPrepend + String(Math.floor(this.timer/60) +":"+strEnd.substring(2,4))
    }

    _checkIsTimeUp() {
        if(this.timer<0) {
            for(const f of this.onTimerUp)
                f.func(f.parent,true);
            this.timerDone = true;
            this.timerText.text = this.gameOverText;
        }
    }

    getTimeRemaining() {
        return this.timer;
    }

    setTimeRemaining(frames) {
        this.timer = frames;
    }

    setGameComplete() {
        for(const f of this.onTimerUp)
            f.func(f.parent,false);
        this.timerText.text = this.gameCompleteText;
        this.timerDone=true;
    }

    isDone() {
        return this.timerDone;
    }

    pauseTimer() {
        this.isPaused = true;
    }

    unpauseTimer() {
        this.isPaused=false;
    }

    hideTimer() {
        this.visible = false;
    }

    unhideTimer() {
        this.visible=true;
    }

    setLocation(x,y) {
        this.timerText.x = x;
        this.timerText.y = y;
    }

    setAnchor(x,y) {
        this.timerText.anchor.set(x,y);
    }

    draw(gui, camera) {
        if(this.visible)
            $engine.requestRenderOnGUI(this.timerText);
    }

    cleanup() {
        $engine.freeRenderable(this.timerText);
    }

}

class MinigameController extends EngineInstance { // TODO: startMinigame, pauseMinigame, showInstructions, setInstructionImage
    onEngineCreate() {
        if(this.__initalized)
            return;
        if(MinigameController.controller !== undefined)
            throw new Error("Only one MinigameController may exist at a time.");
        this.__initalized = true;
        this.minigamePaused = false;

        this.instructionTimer = 0;
        this.instructionTimerLength = 60*5; // 5 seconds
        this.showingInstructions = true;

        this.cheated = false;
        this.cheatTimer = 0;
        this.cheatTimerLength = 60*2;
        this.showingCheat = false;

        this.onCheatCallbacks  = [];
        this.onGameStartCallbacks = [];

        this.cheatKey = "Enter"
        this.cheatButton = undefined; // TODO: make into engineButton later

        this.cheatKeyActive = true;
        this.cheatButtonActive = false;

        this.blurFadeTime = 60;
        this.blurFilterStrength = 9.6666; // making it a round number kinda messes with it
        this.blurFilter = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilter.blur = this.blurFilterStrength
        this.blurFilter.repeatEdgePixels=true;
        this.blurFilterInstruction = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilterInstruction.blur = 0
        this.blurFilterInstruction.repeatEdgePixels=true;

        $engine.getCamera().addFilter(this.blurFilter);


        this.cheatImage = undefined
        this.setCheatRenderable(new PIXI.Sprite($engine.getTexture("gui_cheat_graphic")))
        this.instructionImage = undefined;
        this.setInstructionRenderable(new PIXI.Sprite($engine.getTexture("title_card")));

        MinigameController.controller = this;

        $engine.pauseGame();
    }

    onCreate() {
        this.onEngineCreate();
    }

    step() {
        if(!this.showingInstructions && this.cheatKeyActive && IN.keyCheckPressed(this.cheatKey)) {
            this.cheat();
        }
        this._handleInstructionImage();
        this._handleCheatImage();
    }

    pause() {
        this.step(); // hehe
    }

    draw(gui, camera) {
        if(this.showingInstructions) {
            $engine.requestRenderOnGUI(this.instructionImage);
        }

        if(this.showingCheat) {
            $engine.requestRenderOnGUI(this.cheatImage)
        }
    }

    cleanup() {
        MinigameController.controller = undefined;
    }

    setCheatButtonActive(bool) {
        this.cheatButtonActive = bool;
    }

    setCheatKeyActive(bool) {
        this.cheatKeyActive = bool;
    }

    cheat() {
        if(this.cheated) {
            return;
        }
        for(const callback of this.onCheatCallbacks) {
            callback.func(callback.caller);
        }
        this._startCheat();
        this.blurFilter.blur = this.blurFilterStrength;
        $engine.getCamera().addFilter(this.blurFilter);
        this.cheated = true;
        this.showingCheat = true;
    }

    _startCheat() {
        $engine.pauseGame();
        $engine.setCheatWriteBackValue(ENGINE_RETURN.CHEAT);
        // TODO: implement
    }

    hasCheated() {
        return this.cheated;
    }

    addCheatCallback(callback, parent) {
        this.onCheatCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    addOnGameStartCallback(callback, parent) {
        this.onGameStartCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    _handleInstructionImage() {
        this.instructionTimer++;
        if(this.instructionTimer<this.instructionTimerLength) {
            if(IN.keyCheckPressed("Space") && this.instructionTimer < this.instructionTimerLength-this.blurFadeTime) {
                this.instructionTimer = this.instructionTimerLength-this.blurFadeTime; // skip;
            }
            if(this.instructionTimer>=this.instructionTimerLength-this.blurFadeTime) {
                var stren = EngineUtils.interpolate((this.instructionTimer-this.instructionTimerLength+this.blurFadeTime)/this.blurFadeTime,
                                                    this.blurFilterStrength,0,EngineUtils.INTERPOLATE_SMOOTH)
                this.blurFilter.blur = stren
                this.instructionImage.alpha = stren/this.blurFilterStrength
                this.blurFilterInstruction.blur = (1-(stren/this.blurFilterStrength))*40;
            }
        }
        if(this.instructionTimer===this.instructionTimerLength) {
            this.showingInstructions=false;
            $engine.getCamera().removeFilter(this.blurFilter);
            this._onGameStart();
            $engine.unpauseGame();
        }
    }

    _handleCheatImage() {
        if(!this.cheated) {
            return;
        }
        this.cheatTimer++;
        if(this.cheatTimer===this.cheatTimerLength) {
            this.showingCheat=false;
            $engine.getCamera().removeFilter(this.blurFilter);
            $engine.unpauseGame();
        }
    }

    _onGameStart() {
        for(const callback of this.onGameStartCallbacks) {
            callback.func(callback.caller);
        }
    }

    /**
     * Makes this MinigameController display this renderable object as instructions.
     * 
     * The renderable will be automatically destroyed by the MinigameController.
     * @param {PIXI.DisplayObject} renderable The object to render
     */
    setInstructionRenderable(renderable) {
        if(this.instructionImage) {
            this.instructionImage.filters = [];
        }
        this.instructionImage = renderable;
        this.instructionImage.filters = [this.blurFilterInstruction];
        this.instructionImage.x = $engine.getWindowSizeX()/2;
        this.instructionImage.y = $engine.getWindowSizeY()/2;
        this.instructionImage.anchor.x = 0.5;
        this.instructionImage.anchor.y = 0.5;
        $engine.createManagedRenderable(this,renderable);
    }

    /**
     * Makes this MinigameController display this renderable object as the cheat graphic.
     * 
     * The renderable will be automatically destroyed by the MinigameController.
     * @param {PIXI.DisplayObject} renderable The object to render
     */
    setCheatRenderable(renderable) {
        this.cheatImage = renderable;
        this.cheatImage.x = $engine.getWindowSizeX()/2;
        this.cheatImage.y = $engine.getWindowSizeY()/2;
        this.cheatImage.anchor.x = 0.5;
        this.cheatImage.anchor.y = 0.5;
        $engine.createManagedRenderable(this,renderable);
    }

    /**
     * Static method to get the current instance of MinigameController.
     * @returns {MinigameController} The controller
     */
    static getInstance() {
        return MinigameController.controller;
    }
}
MinigameController.controller = undefined;

class ParallaxingBackground extends EngineInstance {

    onEngineCreate() {
        this.parallaxFactorX = 0.25;
        this.parallaxFactorY = 0.25;
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/2;
        this.sprites = $engine.getTexturesFromSpritesheet("background_sheet",0,$engine.getSpriteSheetLength("background_sheet"));
        for(var i =0;i<this.sprites.length;i++) {
            this.sprites[i] = $engine.createRenderable(this,new PIXI.Sprite(this.sprites[i]),false);
            this.sprites[i].x = this.x;
            this.sprites[i].y = this.y;
        }
        this.depth = 9999999999;
        $engine.setBackground(new PIXI.Graphics())
        $engine.setBackgroundColour(0xe2d6b3);
    }

    onCreate() {
        this.onEngineCreate()
    }

    draw() {
        var dx = $engine.getCamera().getX()
        var dy = $engine.getCamera().getY()
        var cx = $engine.getWindowSizeX()/2 + dx;
        var cy = $engine.getWindowSizeY()/2 + dy;
        var facX = this.parallaxFactorX;
        var facY = this.parallaxFactorY;
        for(var i = this.sprites.length-1;i>=0;i--) {
            this.sprites[i].x = cx+(-dx*facX);
            this.sprites[i].y = cy+(-dy*facY);
            facX/=2;
            facY/=2;
        }
    }

}