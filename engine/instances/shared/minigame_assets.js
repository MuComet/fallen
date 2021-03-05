/**
 * Creates a new minigame timer which will count down to zero. When it reaches zero it will call onTimerStopped.
 * 
 * 
 */
class MinigameTimer extends EngineInstance {
    onEngineCreate() {
        throw new Error("Do not instantiate the MinigameTimer with rooms.")
    }

    onCreate(frames, graphicIndex = 0) {
        this.timerGraphic = undefined;
        var textures = ["bar_standard_top","bar_standard_top","bar_standard_top", "bar_standard","bar_health","bar_time"]
        this.timerGraphic = new PIXI.Sprite(); // container
        this.timerBar = $engine.createManagedRenderable(this,new PIXI.Sprite($engine.getTexture(textures[graphicIndex])))
        this.fillGraphics = $engine.createManagedRenderable(this,new PIXI.Graphics());
        this.fillGraphics.beginFill(0xff0000);
        this.fillGraphics.drawRect(-16,-16,32,32)
        this.fillGraphics.endFill();

        this.timerGraphic.addChild(this.fillGraphics);
        this.timerGraphic.addChild(this.timerBar)
        this.timerGraphic.x = $engine.getWindowSizeX()/2;
        if(graphicIndex <=2) {
            this.timerGraphic.y = 0;
        }else{
            this.timerGraphic.y = $engine.getWindowSizeY();
        }

        this.timerDone = false;
        this.isPaused = false;
        this.visible = true;

        this.onTimerUp = [];

        this.gameOverText = "GAME OVER";
        this.gameCompleteText = "GAME COMPLETE";

        this.timerTextPrepend = "TIME REMAINING: ";

        this.survivalMode = false;

        this.canExpire = true;

        this.textMode = false;

        this.creationTimer = 0;
        this.creationTime = 30;

        this.maxFrames = undefined;

        this.restartTimer(frames);
    }

    setTextMode() {
        if(!this.textMode) {
            this.timerText = $engine.createManagedRenderable(this,new PIXI.Text('TIME REMAINING:', $engine.getDefaultTextStyle()));
            this.timerText.anchor.x=0.5
            this.timerText.x = $engine.getWindowSizeX()/2;
            this.timerText.y = 40;
            this.timerGraphic = this.timerText
            this._updateText();
        }
        this.textMode = true;
    }

    /**
     * Registers a function with this timer that will be called when the timer is stopped for any reason.
     * 
     * @param {EngineInstance} par The parent instance for variable access reasons
     * @param {Function} f The function to call, with the first argument being par and the second being whether or not the timer expired (true) or if it was forced to stop by stopTimer() (false)
     */
    addOnTimerStopped(par, f) {
        this.onTimerUp.push({parent:par, func:f});
    }

    removeAllOnTimerStopped() {
        this.onTimerUp = [];
    }

    /**
     * Prevents the timer from stopping. This means the timer will continue to tick down below zero.
     */
    preventExpire() {
        this.canExpire = false;
    }

    step() {
        if(!this.timerDone && !this.isPaused) {
            this._updateGraphic();
            this._checkIsTimeUp();
            this.timer--;
        }
        this.timerGraphic.alpha = this.alpha
        this._handleCreationAnimation();
    }

    _handleCreationAnimation() {
        if(this.creationTimer<=this.creationTime) {

        }
        this.creationTimer++;
    }

    setGameOverText(text) {
        this.gameOverText = text;
    }

    setGameCompleteText(text) {
        this.gameCompleteText = text;
    }

    getGameOverText() {
        return this.gameOverText;
    }

    getGameCompleteText() {
        return this.gameCompleteText;
    }

    // inverts the timer's behaviours. now when the timer expires, it is counted as a win.
    setSurvivalMode() {
        this.survivalMode = true;
    }

    isSurvivalMode() {
        return this.survivalMode
    }

    updateStyle(key, value) {
        this.timerText.style[key]=value;
        this.timerText.dirty = true;
    }

    setStyle(style) {
        this.timerText.style = style;
        this.timerText.dirty = true;
    }

    restartTimer(newTime) {
        this.timerDone = false;
        this.timer = newTime;
        this.maxFrames = newTime;
        this._updateGraphic();
    }

    _updateGraphic() {
        if(this.textMode)
            this._updateText();
        else
            this._updateSprite();
    }

    _updateSprite() {

    }

    _updateText() {
        var strEnd = String(EngineUtils.roundMultiple((this.timer%60)/60,0.01))+"000"
        this.timerText.text = this.timerTextPrepend + String(Math.floor(this.timer/60) +":"+strEnd.substring(2,4))
    }

    _checkIsTimeUp() {
        if(this.timer<0) {
            this.expire();
        }
    }

    getTimeRemaining() {
        return this.timer;
    }

    setTimeRemaining(frames) {
        if(this.timerDone) {
            throw new Error("Timer must be running to set the time remaining");
        }
        this.timer = frames;
    }

    /**
     * Skips the specified number of frames on the timer.
     * @param {Number} frames The amount of frames to skip
     */
    tickDown(frames) {
        this.timer -= frames;
        if(this.timer-frames<0)
            this.timer = 0;
    }

    /**
     * Causes the timer to stop immediately and display either the gameComplete or gameOver text based on whether
     * or not it is in survival mode. The timer will consider this a loss in survival mode.
     * 
     * This will fire all onTimerStopped methods and input an argument of 'false'
     */
    stopTimer() {
        for(const f of this.onTimerUp)
            f.func(f.parent,false);
        this.timerDone=true;

        if(this.textMode) {
            if(this.survivalMode)
                this.timerText.text = this.gameOverText;
            else
                this.timerText.text = this.gameCompleteText;
        }
    }

    /**
     * Expires the timer immediately. this is the same as setting the remaining time to zero.
     * This will cause the timer to display either the gameComplete or gameOver text based on whether
     * or not it is in survival mode. The timer will consider this a win survival mode
     * 
     * This will fire all onTimerStopped methods and input an argument of 'true'
     */
    expire() {
        if(!this.canExpire || this.timerDone)
            return;
        for(const f of this.onTimerUp)
                f.func(f.parent,true);
        this.timerDone = true;
        if(this.textMode) {
            if(this.survivalMode)
                this.timerText.text = this.gameCompleteText;
            else
                this.timerText.text = this.gameOverText;
        }
    }

    isTimerDone() {
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
        if(this.visible) {
            $engine.requestRenderOnGUI(this.timerGraphic);
        }
    }

}
MinigameTimer.GRAPHIC_STANDARD_TOP = 0;
MinigameTimer.GRAPHIC_HEALTH_TOP = 1;
MinigameTimer.GRAPHIC_TIME_TOP = 2;
MinigameTimer.GRAPHIC_STANDARD = 3;
MinigameTimer.GRAPHIC_HEALTH = 4;
MinigameTimer.GRAPHIC_TIME = 5;

/**
 * Overwrites:
 * 
 * **onEngineCreate** / onCreate
 * 
 * step
 * 
 * pause
 * 
 * draw
 * 
 * cleanup
 * 
 * timescaleImmuneStep
 * 
 * This class automatically handles the start and cheating with minigames. Simply tell it what to render using setInstructionRenderable and
 * setCheatRenderable and it does the rest.
 * 
 * Additionally, when the game over is several methods will be automatically called. One of which is onMinigameComplete(frames), which will be called once
 * per frame with the argument being how many frames the minigame has been over. Use this method for summaries.
 * 
 * Can call hasCheated() to know if the user has cheated. or can can use addCheatCallback to get a function callback when cheat is pressed.
 * Additionally addOnGameStartCallback will call the specified function when the instructions go away.
 */
class MinigameController extends EngineInstance {
    onEngineCreate() {
        if(this.__initalized)
            return;
        if(MinigameController.controller !== undefined)
            throw new Error("Only one MinigameController may exist at a time.");
        this.__initalized = true;
        this.minigamePaused = false;

        this.failedMinigame = false;
        this.gameStopped = false;
        this.stopTimer = 0;
        this.stopTime = 75;
        this.gameStoppedFrameTimer = 0;
        this.winLossTimer = 0;

        this._timer = undefined;

        this.wonMinigame = false;

        this.instructionTimer = 0;
        this.instructionTimerLength = 60*30; // 30 seconds at most
        this.showingInstructions = true;

        this.cheated = false;
        this.cheatTimer = 0;
        this.cheatTimerLength = 60*4;
        this.showingCheat = false;

        this.resultGraphicWon = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("minigame_win_graphic")));
        this.resultGraphicLoss = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("minigame_loss_graphic")));
        this.resultGraphicWon.x = $engine.getWindowSizeX()/2;
        this.resultGraphicWon.y = $engine.getWindowSizeY()/2;
        this.resultGraphicLoss.x = $engine.getWindowSizeX()/2;
        this.resultGraphicLoss.y = $engine.getWindowSizeY()/2;

        this.pressAnyKeyToContinue = $engine.createManagedRenderable(this, new PIXI.Text("Press any key to continue",$engine.getDefaultTextStyle()));
        this.pressAnyKeyToContinue.x = $engine.getWindowSizeX()/2;
        this.pressAnyKeyToContinue.anchor.x = 0.5;
        this.pressAnyKeyToContinue.anchor.y = 1;



        this.KeyIcon = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("minigame_key_icon")));
        this.MouseIcon = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("minigame_mouse_icon")));
        this.KeyIcon.x = $engine.getWindowSizeX()/2 + 275;
        this.KeyIcon.y = 400;
        this.MouseIcon.x = $engine.getWindowSizeX()/2 + 275;
        this.MouseIcon.y = 400;

        this.onCheatCallbacks  = [];
        this.onGameStartCallbacks = [];
        this.onGameEndCallbacks = [];

        this.cheatKey = "Enter"
        this.cheatButton = undefined; // TODO: make into engineButton later

        this.cheatKeyActive = true;
        this.cheatButtonActive = false;

        this.allowActivateCheat = true;

        this.musicStandard = undefined;
        this.musicStandardReference = undefined;

        this.musicCheat = undefined;
        this.musicCheatReference = undefined;

        this.blurFadeTime = 60;
        this.blurFilterStrength = 9.6666; // making it a round number kinda messes with it
        this.blurFilter = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilter.blur = this.blurFilterStrength
        this.blurFilter.repeatEdgePixels=true;
        this.blurFilterInstruction = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilterInstruction.blur = 0
        this.blurFilterInstruction.repeatEdgePixels=true;
        this.blurFilterCheat = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilterCheat.blur = 0
        this.blurFilterCheat.repeatEdgePixels=true;

        if(!$engine.isLow()) {
            $engine.getCamera().addFilter(this.blurFilter);

        }
        this.adjustmentFilter = new PIXI.filters.AdjustmentFilter();
        $engine.getCamera().addFilter(this.adjustmentFilter);

        $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS);
        $engine.setCheatWriteBackValue(ENGINE_RETURN.NO_CHEAT);

        this.cheatImage = undefined
        this.setCheatRenderable(new PIXI.Sprite($engine.getTexture("gui_cheat_graphic")))
        this.instructionImage = undefined;
        this.setInstructionRenderable(new PIXI.Sprite($engine.getTexture("title_card")));

        this._initMusic();

        this.addCheatCallback(this,function(self) {
            $engine.audioPlaySound("audio/se/Cheat.ogg")
        })

        MinigameController.controller = this;

        $engine.pauseGame();
    }

    onCreate() {
        this.onEngineCreate();
    }

    step() {
        this._minigameControllerTick();
    }

    disableCheating() {
        this.allowActivateCheat=false;
    }

    _initMusic() {
        this.musicStandard = $engine.audioGetSound("audio/bgm/Minigame.ogg","BGM",1)
        $engine.audioPlaySound(this.musicStandard,true).then(result => {
            if(!result)
                return;
            this.musicStandardReference=result;
            result._source.loopStart = 8
            result._source.loopEnd = 56
            $engine.audioPauseSound(this.musicStandard)
        })

        this.musicCheat = $engine.audioGetSound("audio/bgm/MinigameCheat.ogg","BGM",0)
        $engine.audioPlaySound(this.musicCheat,true).then(result => {
            if(!result)
                return;
            this.musicCheatReference=result;
            result._source.loopStart = 8
            result._source.loopEnd = 56
            $engine.audioPauseSound(this.musicCheat)
        })
    }

    _startMusic() {
        $engine.audioResumeSound(this.musicStandard)
        $engine.audioResumeSound(this.musicCheat)
        if(this.musicStandardReference) { // TODO: move to engine function ApplyUntil
            this.musicStandardReference._source.loopStart = 8
            this.musicStandardReference._source.loopEnd = 56
        }
        if(this.musicCheatReference) {
            this.musicCheatReference._source.loopStart = 8
            this.musicCheatReference._source.loopEnd = 56
        }
    }

    /**
     * @returns Whether or not the minigame is over
     */
    minigameOver() {
        return this.wonMinigame || this.failedMinigame;
    }

    /**
     * Creates and starts a new MinigameTimer. This timer becomes accessible via getTimer()
     * @param {Number} frames The amount of frames
     */
    startTimer(frames, graphic = 0) {
        if(this._timer)
            throw new Error("Timer already exists, use getTimer() to adjust the timer!");
        this._timer = new MinigameTimer(frames,graphic);
        this._timer.addOnTimerStopped(this,this._onMinigameEnd)
        this._timer.setTextMode();
    }

    _onMinigameEnd(self, expired) {
        if((expired && self._timer.isSurvivalMode()) || (!expired && !self._timer.isSurvivalMode())) {
            self._onMinigameEndNoTimer(true);
        } else {
            self._onMinigameEndNoTimer(false);
        }
        
    }

    _onMinigameEndNoTimer(won) {
        if(won) {
            this.gameWin();
            $engine.setOutcomeWriteBackValue(ENGINE_RETURN.WIN)
        } else {
            this.gameLoss();
            $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS)
        }

        if(this.hasCheated()) {
            $engine.audioPlaySound("audio/se/GameEndCheat.ogg")
            $engine.setCheatWriteBackValue(ENGINE_RETURN.CHEAT)
        } else {
            $engine.audioPlaySound("audio/se/GameEnd.ogg")
            $engine.setCheatWriteBackValue(ENGINE_RETURN.NO_CHEAT)
        }
        
        $engine.getCamera().addFilter(this.blurFilter)
    }

    /**
     * Ends this minigame immediately.
     * @param {Boolean} won Whether or not to count this as a victory (true) or a loss (false)
     */
    endMinigame(won) {
        if(this.failedMinigame || this.wonMinigame)
            return;
        this._onMinigameEndNoTimer(won);
        if(this._timer) {
            this._timer.pause();
        }
        this._onGameEnd();
    }

    getTimer() {
        return this._timer;
    }

    /**
     * Fires if the window loses visibility and causes the game to stop.
     * 
     * When the user returns to the game, this event will fire with how many frames would have passed had they not hidden the game.
     * @param {Number} frames The amount of frames that were missed
     */
    notifyFramesSkipped(frames) {
        console.error("Notify Frames Skipped should always be implemented! -- "+String(frames)+" frames skipped...")
    }

    __notifyFramesSkipped(frames) {
        if($engine.isGamePaused() || $engine.isGamePausedSpecial())
            return;
        this.notifyFramesSkipped(frames);
    }

    _minigameControllerTick() {
        if(!this.failedMinigame && ! this.wonMinigame && !this.showingInstructions && this.cheatKeyActive && this.allowActivateCheat && IN.keyCheckPressed(this.cheatKey)) {
            this.cheat();
        }
        this._handleInstruction();
        this._handleCheat();
        if(this.wonMinigame || this.failedMinigame && ! $engine.isTimeScaled())
            this._winLossTick();
    }

    gameWin() {
        if(this.failedMinigame || this.wonMinigame)
            return;
        this.wonMinigame = true;
    }

    gameLoss() {
        if(this.failedMinigame || this.wonMinigame)
            return;
        this.failedMinigame = true;
        $engine.setTimescale(0.9999);
    }

    _winLossTick() {
        if(!this.failedMinigame && !this.wonMinigame) {
            return;
        }

        if(!this.gameStopped) {
            var fac = EngineUtils.interpolate(this.stopTimer/this.stopTime,0.9999,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            if(this.failedMinigame) {
                this.adjustmentFilter.saturation = fac;
                $engine.setTimescale(fac)
            }
            if(this._timer)
                this._timer.timerGraphic.alpha = fac // set directly because timescale.
            this.stopTimer++;
            this.setMusicVolume(fac);
            if(this.stopTimer>this.stopTime)
                this.gameStopped=true;
        } else {
            this.onMinigameComplete(this.gameStoppedFrameTimer)

            var fac = EngineUtils.interpolate(this.gameStoppedFrameTimer/this.blurFadeTime,0,1,EngineUtils.INTERPOLATE_SMOOTH)
            this.blurFilter.blur = fac*this.blurFilterStrength

            if(this.gameStoppedFrameTimer >= 90) {
                this.prepareResultGraphic(this.gameStoppedFrameTimer-90)
            }

            if(this.gameStoppedFrameTimer===90) {
                var snd = undefined;

                this.showingResult = true;

                if(this.wonMinigame) {
                    if(this.hasCheated())
                        snd = $engine.audioGetSound("audio/bgm/VictoryAtaCost.ogg","BGM")
                    else
                        snd = $engine.audioGetSound("audio/bgm/Victory.ogg","BGM")
                } else {
                    if(this.hasCheated())
                        snd = $engine.audioGetSound("audio/bgm/LossCheat.ogg","BGM")
                    else
                        snd = $engine.audioGetSound("audio/bgm/Loss.ogg","BGM")
                }
                    
                $engine.audioPlaySound(snd,true).then(result=> {
                    if(!result)
                        return;
                    result._source.loopStart = 6;
                    result._source.loopEnd = 22;
                })
            }
            this.gameStoppedFrameTimer++;
        }
    }

    prepareResultGraphic(frame) {
        var fac = frame/45;
        var graphic = this.getResultRenderable();
        var facX = EngineUtils.interpolate(fac,0,1,EngineUtils.INTERPOLATE_OUT_BACK);
        var facY = EngineUtils.interpolate(fac/2,0,1,EngineUtils.INTERPOLATE_IN_ELASTIC);
        graphic.scale.x = facX;
        graphic.scale.y = facY;

        this.pressAnyKeyToContinue.y = -120;

        if(frame > 90) {
            var fac2 = EngineUtils.interpolate((frame-90)/60,0,1,EngineUtils.INTERPOLATE_OUT_BACK);
            this.pressAnyKeyToContinue.y = -120 + fac2*160;
            this.pressAnyKeyToContinue.rotation = Math.sin($engine.getGlobalTimer()/16)/64
        }

        if((frame > 90 && !$engine.isBusy() && IN.anyInputPressed())) {
            $engine.audioFadeAll();
            $engine.fadeOutAll();
            $engine.endGame();
        }
    }

    setMusicVolume(volume) {
        if(this.hasCheated())
            this.musicCheat.volume=volume;
        else
            this.musicStandard.volume=volume;
    }

    onMinigameComplete(frames) {};

    timescaleImmuneStep() {
        this._winLossTick();
    }

    pause() {
        this._minigameControllerTick();
    }

    controllsUseKeyBoard(bool) {
        this.usingKey = bool;
    }

    draw(gui, camera) {
        if(this.showingInstructions) {
            $engine.requestRenderOnGUI(this.instructionImage);
            if(this.usingKey){
                $engine.requestRenderOnGUI(this.KeyIcon);
            }else{
                $engine.requestRenderOnGUI(this.MouseIcon);
            }
        }

        if(this.showingCheat) {
            $engine.requestRenderOnGUI(this.cheatImage)
        }

        if(this.showingResult) {
            $engine.requestRenderOnGUI(this.getResultRenderable())
            $engine.requestRenderOnGUI(this.pressAnyKeyToContinue)
        }
    }

    getResultRenderable() {
        return this.wonMinigame ? this.resultGraphicWon : this.resultGraphicLoss;
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
        $engine.pauseGame();
        $engine.setCheatWriteBackValue(ENGINE_RETURN.CHEAT);
        this.blurFilter.blur = this.blurFilterStrength;
        this.disableCheating();
        if(!$engine.isLow())
            $engine.getCamera().addFilter(this.blurFilter);
        this.cheated = true;
        this.showingCheat = true;
    }

    hasCheated() {
        return this.cheated;
    }

    addCheatCallback(parent,callback) {
        this.onCheatCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    addOnGameStartCallback(parent,callback) {
        this.onGameStartCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    addOnGameEndCallback(parent,callback) {
        this.onGameEndCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    _handleInstruction() {
        this.instructionTimer++;
        if(this.instructionTimer<this.instructionTimerLength) {
            if(((IN.anyInputPressed() && this.instructionTimer>18) || IN.keyCheckPressed("Space") || IN.keyCheckPressed("Enter")) 
                            && this.instructionTimer < this.instructionTimerLength-this.blurFadeTime) {
                this.instructionTimer = this.instructionTimerLength-this.blurFadeTime; // skip;
            }
            if(this.instructionTimer>=this.instructionTimerLength-this.blurFadeTime) {
                var stren = EngineUtils.interpolate((this.instructionTimer-this.instructionTimerLength+this.blurFadeTime)/this.blurFadeTime,
                                                    this.blurFilterStrength,0,EngineUtils.INTERPOLATE_SMOOTH)
                this.blurFilter.blur = stren
                this.instructionImage.alpha = stren/this.blurFilterStrength
                this.blurFilterInstruction.blur = (1-(stren/this.blurFilterStrength))*40;
                this._startMusic();
                var musicFac = EngineUtils.interpolate((this.instructionTimer-this.instructionTimerLength+this.blurFadeTime)/this.blurFadeTime,
                        0,1,EngineUtils.INTERPOLATE_OUT)
                this.setMusicVolume(musicFac)
            }
        }
        if(this.instructionTimer===this.instructionTimerLength) {
            this.showingInstructions=false;
            if(!$engine.isLow())
                $engine.getCamera().removeFilter(this.blurFilter);
            this._onGameStart();
            $engine.unpauseGame();
        }
    }

    _handleCheat() {
        if(!this.cheated || (this._timer && this._timer.isTimerDone())) {
            return;
        }
        this.cheatTimer++;
        var fadeTime = this.blurFadeTime/3;
        var f1 = EngineUtils.interpolate(this.cheatTimer / fadeTime,1,0, EngineUtils.INTERPOLATE_OUT)
        var f2 = EngineUtils.interpolate((this.cheatTimer-(this.cheatTimerLength-fadeTime))/fadeTime,0,1, EngineUtils.INTERPOLATE_IN)
        var fac = Math.max(f1,f2)

        this.blurFilter.blur = (1-fac) * this.blurFilterStrength

        if(this.cheatTimer < this.cheatTimerLength-fadeTime) {
            this.blurFilterCheat.blur = 0
            var scaleFac = EngineUtils.interpolate(this.cheatTimer/fadeTime,0,1,EngineUtils.INTERPOLATE_OUT_BACK);
            var scaleFac2 = EngineUtils.interpolate(this.cheatTimer/(fadeTime+24),0,1,EngineUtils.INTERPOLATE_IN_ELASTIC);
            this.cheatImage.scale.y = scaleFac;
            this.cheatImage.scale.x = scaleFac2;
            this.cheatImage.y = scaleFac*$engine.getWindowSizeY()/2
        } else {
            this.cheatImage.alpha = 1-fac
            var scaleFac = EngineUtils.interpolate((this.cheatTimer-(this.cheatTimerLength-fadeTime))/fadeTime,0,1,EngineUtils.INTERPOLATE_IN_BACK);
            this.cheatImage.scale.x = 1+scaleFac*5
            this.cheatImage.scale.y = 1-scaleFac*2
            this.blurFilterCheat.blur = fac * this.blurFilterStrength
        }
        this.cheatImage.rotation = Math.sin($engine.getGlobalTimer()/16)/48
        if(this.cheatTimer===this.cheatTimerLength) {
            this.showingCheat=false;
            if(!$engine.isLow())
                $engine.getCamera().removeFilter(this.blurFilter);
            $engine.unpauseGame();
        }
        var len = (this.cheatTimerLength+60)
        var fac2 = EngineUtils.interpolate(Math.abs((this.cheatTimer / (len/2))-1),0.075,1,EngineUtils.INTERPOLATE_IN)
        var fac = EngineUtils.interpolate(this.cheatTimer / len,0,1,EngineUtils.INTERPOLATE_SMOOTH);
        this.musicCheat.volume = fac*fac2;
        this.musicStandard.volume = (1-fac)*fac2;
        
    }

    _onGameStart() {
        for(const callback of this.onGameStartCallbacks) {
            callback.func(callback.caller);
        }
    }

    _onGameEnd() {
        for(const callback of this.onGameEndCallbacks) {
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
        //this.instructionImage.addChild(this.KeyIcon, this.MouseIcon);
        $engine.createManagedRenderable(this,renderable);
        this.KeyIcon.filters = [this.blurFilterInstruction];
        this.MouseIcon.filters = [this.blurFilterInstruction];
    }

    /**
     * Makes this MinigameController display this renderable object as the cheat graphic.
     * 
     * The renderable will be automatically destroyed by the MinigameController.
     * @param {PIXI.DisplayObject} renderable The object to render
     */
    setCheatRenderable(renderable) {
        this.cheatImage = renderable;
        this.cheatImage.filters = [this.blurFilterCheat];
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