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
     * @param {Function} f The function to call, with the first argument being par and the second being whether or not the timer 
     *                      expired (true) or if it was forced to stop by stopTimer() (false)
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

    _updateText() {
        var strEnd = String(EngineUtils.roundMultiple((this.timer%60)/60,0.01))+"000"
        this.timerText.text = this.timerTextPrepend + String(Math.floor(this.timer/60) +":"+strEnd.substring(2,4))
    }

    _updateSprite() {

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
            $engine.requestRenderOnCameraGUI(this.timerGraphic);
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

        this.continueGameOverSequence = false;

        this.usingPreGameAmbience = true;

        this._timer = undefined;

        this.wonMinigame = false;

        this.instructionTimer = 0;
        this.instructionTimerLength = 60*60*60; // one hour at most
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

        this.cheatTooltipGraphicsMask = $engine.createManagedRenderable(this,new PIXI.Graphics());
        this.cheatTooltipGraphicsMask.y = $engine.getWindowSizeY()*3/4;

        this.cheatTooltip = $engine.createManagedRenderable(this, new PIXI.Text("",$engine.getDefaultTextStyle()));
        this.cheatTooltip.anchor.x = 0.5;
        this.cheatTooltip.anchor.y = 0.5;
        this.cheatTooltip.x = $engine.getWindowSizeX()/2;
        this.cheatTooltip.y = $engine.getWindowSizeY()*3/4;

        this.setCheatTooltip("PLEASE SET THE CHEAT TOOLTIP!")

        this.cheatTooltip.mask = this.cheatTooltipGraphicsMask

        this.lossReason = $engine.createManagedRenderable(this, new PIXI.Text("PLEASE SET LOSS REASON",$engine.getDefaultTextStyle()));
        this.lossReason.anchor.x = 0.5;
        this.lossReason.x = $engine.getWindowSizeX()/2;
        this.lossReason.y = -128;

        this.pressAnyKeyToContinueTimer = 0;

        this.keyIcon = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("minigame_key_icon")));
        this.mouseIcon = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("minigame_mouse_icon")));
        this.keyIcon.x = $engine.getWindowSizeX()/2 + 275;
        this.keyIcon.y = 64;
        this.mouseIcon.x = $engine.getWindowSizeX()/2 + 275;
        this.mouseIcon.y = 64;

        this.onCheatCallbacks  = [];
        this.onGameStartCallbacks = [];
        this.onGameEndCallbacks = [];

        this.cheatKey = "Enter"
        this.cheatButton = undefined; // TODO: make into engineButton later

        this.cheatKeyActive = true;
        this.cheatButtonActive = false;

        this.allowActivateCheat = true;

        this.usingPreGameAmbience = true;

        this.ambience = undefined
        this.musicStandard = undefined;
        this.musicCheat = undefined;

        this.preventEndOnTimerExpire = false;
        this.roundMode = 0;
        this.currentRound = 0;
        this.maxRounds = 0;

        this.onRoundOverCallbacks = [];
        this.onAllRoundsOverCallbacks = [];

        this.blurFadeTime = 60;
        this.blurFilterStrength = 9.6666; // making it a round number kinda messes with it
        this.blurFilter = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilter.blur = this.blurFilterStrength
        this.blurFilter.repeatEdgePixels=true;
        this.blurFilterInstruction = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilterInstruction.blur = 0
        this.blurFilterInstruction.repeatEdgePixels=true;
        this.blurFilterInstruction.quality = 4
        this.blurFilterCheat = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilterCheat.blur = 0
        this.blurFilterCheat.repeatEdgePixels=true;
        this.blurFilterCheat.quality = 4

        this.instructionContainter = $engine.createManagedRenderable(this,new PIXI.Container());
        this.cheatContainer = $engine.createManagedRenderable(this,new PIXI.Container());

        this.instructionContainter.filters = [this.blurFilterInstruction];
        this.cheatContainer.filters = [this.blurFilterCheat];

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

        this.setControls(false,false);

        this._initMusic();

        this.addOnCheatCallback(this,function(self) {
            $engine.audioPlaySound("minigame_cheat")
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

    disablePreGameAmbience() {
        this.usingPreGameAmbience = false;
    }

    _initMusic() {
        this.musicStandard = $engine.audioPlaySound("minigame_music",1,true)
        $engine.audioSetLoopPoints(this.musicStandard,8,56)
        $engine.audioPauseSound(this.musicStandard)

        this.musicCheat = $engine.audioPlaySound("minigame_music_cheat",1,true)
        $engine.audioSetVolume(this.musicCheat,0); // this call is because the engine uses the input volume for future calculations.
        $engine.audioSetLoopPoints(this.musicCheat,8,56)
        $engine.audioPauseSound(this.musicCheat)

        this.ambience = $engine.audioPlaySound("minigame_ambience",1,true,EngineUtils.random(111),111)
        $engine.audioSetLoopPoints(this.ambience,0,111)
        $engine.audioSetVolume(this.ambience,0);
    }

    _startMusic() {
        $engine.audioResumeSound(this.musicStandard)
        $engine.audioResumeSound(this.musicCheat)
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

    /**
     * Starts the game end sequence if applicable. This method does nothing in terms of actually setting off
     * listeners, it is only a way for the timer to communicate with the controller.
     * 
     * @param {MinigameController} self The minigameController
     * @param {Boolean} expired Whether or not the timer expiered naturally
     */
    _onMinigameEnd(self, expired) {
        if(this.roundMode) {
            if(this.rounds < this.maxRounds) {
                this._onRoundOver();
            } else {
                this._onAllRoundsOver();
            }
        }
        if(this.preventEndOnTimerExpire)
            return;
        if((expired && self._timer.isSurvivalMode()) || (!expired && !self._timer.isSurvivalMode())) {
            self._onMinigameEndNoTimer(true);
        } else {
            self._onMinigameEndNoTimer(false);
        }
        
    }

    /**
     * Executes the minigame over sequence. Sets write back values, starts music, and fires listeners.
     * @param {Boolean} won Whether or not you won the minigame
     */
    _onMinigameEndNoTimer(won) {
        if(this.failedMinigame || this.wonMinigame)
            return;
        if(won) {
            this._gameWin();
            $engine.setOutcomeWriteBackValue(ENGINE_RETURN.WIN)
        } else {
            this._gameLoss();
            $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS)
        }

        if(this.hasCheated()) {
            $engine.audioPlaySound("minigame_end_cheat")
            $engine.setCheatWriteBackValue(ENGINE_RETURN.CHEAT)
        } else {
            $engine.audioPlaySound("minigame_end")
            $engine.setCheatWriteBackValue(ENGINE_RETURN.NO_CHEAT)
        }
        if(!$engine.isLow())
            $engine.getCamera().addFilter(this.blurFilter)
        this._onGameEnd();
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
    }

    getTimer() {
        return this._timer;
    }

    setCheatTooltip(tooltip) {
        this.cheatTooltip.text = tooltip;
        this.cheatTooltipGraphicsMask.clear();
        this.cheatTooltipGraphicsMask.beginFill(0xffffff);
        this.cheatTooltipGraphicsMask.drawRect(-this.cheatTooltip.width,-64,this.cheatTooltip.width,128)
        this.cheatTooltipGraphicsMask.endFill();
    }

    setLossReason(reason) {
        this.lossReason.text = reason;
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
        this._pressAnyKeyTick();
    }

    _gameWin() {
        this.wonMinigame = true;
    }

    _gameLoss() {
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
                if(this._timer)
                    this._timer.timerGraphic.alpha = fac // set directly because timescale.
            } else {
                if(this._timer)
                    this._timer.alpha = fac;
            }
            
            this.stopTimer++;
            this._setMusicVolume(fac);
            if(this.stopTimer>this.stopTime)
                this.gameStopped=true;
        } else {
            if(!this.continueGameOverSequence) {
                this.onMinigameComplete(this.winLossTimer)
                this.winLossTimer++;
                return;
            }

            var fac = EngineUtils.interpolate(this.gameStoppedFrameTimer/this.blurFadeTime,0,1,EngineUtils.INTERPOLATE_SMOOTH)
            this.blurFilter.blur = fac*this.blurFilterStrength

            if(this.gameStoppedFrameTimer >= 90) {
                this.handleResults(this.gameStoppedFrameTimer-90)
            }

            if(this.gameStoppedFrameTimer===90) {
                var snd = undefined;

                this.showingResult = true;

                if(this.wonMinigame) {
                    if(this.hasCheated())
                        snd = $engine.audioPlaySound("minigame_win_cheat",1,true)
                    else
                        snd = $engine.audioPlaySound("minigame_win",1,true)
                } else {
                    if(this.hasCheated())
                        snd = $engine.audioPlaySound("minigame_loss_cheat",1,true)
                    else
                        snd = $engine.audioPlaySound("minigame_loss",1,true)
                }
                
                // we have to specify this afterwards so the sound will start at 0
                $engine.audioSetLoopPoints(snd,6,22);
            }
            this.gameStoppedFrameTimer++;
        }
    }

    handleResults(frame) {
        var fac = frame/45;
        var graphic = this._getResultRenderable();
        var facX = EngineUtils.interpolate(fac,0,1,EngineUtils.INTERPOLATE_OUT_BACK);
        var facY = EngineUtils.interpolate(fac/2,0,1,EngineUtils.INTERPOLATE_IN_ELASTIC);
        graphic.scale.x = facX;
        graphic.scale.y = facY;

        if(!this.wonMinigame) {
            var fac2 = (frame-45)/45;
            var lossReasonY = EngineUtils.interpolate(fac2,$engine.getWindowSizeY(),$engine.getWindowSizeY()*3/4,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.lossReason.y = lossReasonY;
        }

        
        if(frame === 90) {
            this.showPressAnyKey();
        }

        if(frame > 90 && !$engine.isBusy() && IN.anyStandardInputPressed()) {
            $engine.audioFadeAll();
            $engine.fadeOutAll();
            $engine.endGame();
        }
    }

    showPressAnyKey() {
        this.pressAnyKeyToContinue.y = -120;
        this.showingPressAnykey = true;
        if(this.pressAnyKeyToContinueTimer<0)
            this.pressAnyKeyToContinueTimer = 0;
    }

    hidePressAnyKey() {
        this.showingPressAnykey = false;
        if(this.pressAnyKeyToContinueTimer>45)
            this.pressAnyKeyToContinueTimer = (this.pressAnyKeyToContinueTimer%16)+45;
    }

    _pressAnyKeyTick() {
        if(this.showingPressAnykey)
            this.pressAnyKeyToContinueTimer++;
        else 
            this.pressAnyKeyToContinueTimer--;
        var fac = this.pressAnyKeyToContinueTimer/45
        var fac2 = EngineUtils.interpolate(fac,0,1,EngineUtils.INTERPOLATE_OUT_BACK);
        this.pressAnyKeyToContinue.y = -20 + fac2*60;
        this.pressAnyKeyToContinue.rotation = Math.sin($engine.getGlobalTimer()/16)/64

        if(this.pressAnyKeyToContinueTimer <= 30) {
            var fac3 = this.pressAnyKeyToContinueTimer/48;
            this.pressAnyKeyToContinue.rotation += EngineUtils.interpolate(fac3,-0.075,0,EngineUtils.INTERPOLATE_SMOOTH_BACK);
        } else if(this.pressAnyKeyToContinueTimer<=45) {
            var fac3 = Math.abs((this.pressAnyKeyToContinueTimer-37.5)/7.5); // 1 -> 0 -> 1
            this.pressAnyKeyToContinue.rotation += EngineUtils.interpolate(fac3,0.0075,0,EngineUtils.INTERPOLATE_SMOOTH);
        }
    }

    _setMusicVolume(volume) {
        if(this.hasCheated())
            $engine.audioSetVolume(this.musicCheat,volume)
        else
            $engine.audioSetVolume(this.musicStandard,volume)
    }

    advanceGameOver() {
        this.continueGameOverSequence = true;
    }

    /**
     * Overridable:
     * 
     * Called once per frame starting when the minigame has fully ended and control is handed to the controller.
     * 
     * @param {Number} frames The amount of frames since the minigame has ended.
     */
    onMinigameComplete(frames) {
        this.advanceGameOver();
    };

    timescaleImmuneStep() {
        this._winLossTick();
        this._pressAnyKeyTick();
    }

    pause() {
        this._minigameControllerTick();
    }

    setControls(keyboard, mouse) {
        if(keyboard && mouse) {
            this.keyIcon.x = $engine.getWindowSizeX()/2-64;
            this.mouseIcon.x = $engine.getWindowSizeX()/2+64;
        } else if(keyboard) {
            this.keyIcon.x = $engine.getWindowSizeX()/2;
        } else if(mouse) {
            this.mouseIcon.x = $engine.getWindowSizeX()/2;
        }


        this.keyIcon.visible = keyboard;
        this.mouseIcon.visible = mouse;
    }

    draw(gui, camera) {
        if(this.showingInstructions) {
            $engine.requestRenderOnGUI(this.instructionContainter);
        }

        if(this.showingCheat) {
            $engine.requestRenderOnGUI(this.cheatContainer)
        }

        if(this.showingResult) {
            $engine.requestRenderOnGUI(this._getResultRenderable())
            $engine.requestRenderOnGUI(this.lossReason);
        }
        if(this.showingResult || this.pressAnyKeyToContinueTimer>0) {
            $engine.requestRenderOnGUI(this.pressAnyKeyToContinue)
        }
    }

    _getResultRenderable() {
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

    /**
     * If set to true, prevents the Controller from automatically starting the
     * game end sequence on timer up and all round completed if applicable.
     * 
     * The game end sequence must be manually called using minigameEnd(<won>)
     */
    setPreventEndOnTimerExpire(b) {
        this.preventEndOnTimerExpire=b;
    }

    /**
     * If set to true, causes the Controller to ignore timer up unless the round is > maxRound
     */
    setRoundMode(b) {
        this.roundMode=b;
    }

    setMaxRounds(max) {
        this.maxRounds=max;
    } 

    _onRoundOver() {
        this.currentRound++;
        for(const callback of this.onRoundOverCallbacks) {
            callback.func(callback.caller);
        }
    }

    _onAllRoundsOver() {
        for(const callback of this.onAllRoundsOverCallbacks) {
            callback.func(callback.caller);
        }
    }

    getCurrentRound() {
        return this.currentRound;
    }

    addOnCheatCallback(parent,callback) {
        this.onCheatCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    /**
     * Adds a listener to be called when the minigame starts. The start point of the minigame is when
     * the user closes the instructions dialog and it completely fades out.
     * 
     * @param {EngineInstance} parent The calling instance
     * @param {Function} callback The callback to exectue
     */
    addOnGameStartCallback(parent,callback) {
        this.onGameStartCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    /**
     * Adds a listener to be called when the minigame is ended for any reason. This includes a timer up
     * and a manual call to end the minigame
     * 
     * @param {EngineInstance} parent The calling instance
     * @param {Function} callback The callback to exectue
     */
    addOnGameEndCallback(parent,callback) {
        this.onGameEndCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    addOnRoundOverCallback(parent, callback) {
        this.onRoundOverCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    addOnAllRoundsOverCallback(parent, callback) {
        this.onAllRoundsOverCallbacks.push({
            func:callback,
            caller:parent
        });
    }

    _handleInstruction() {
        this.instructionTimer++;
        // showing instruction tick
        if(this.instructionTimer<this.instructionTimerLength) {
            if(((IN.anyStandardInputPressed() && this.instructionTimer>18) || IN.keyCheckPressed("Space") || IN.keyCheckPressed("Enter")) 
                            && this.instructionTimer < this.instructionTimerLength-this.blurFadeTime) {
                this.instructionTimer = this.instructionTimerLength-this.blurFadeTime; // skip;
            }
            // fade out the instruction graphic
            if(this.instructionTimer>=this.instructionTimerLength-this.blurFadeTime) {
                var stren = EngineUtils.interpolate((this.instructionTimer-this.instructionTimerLength+this.blurFadeTime)/this.blurFadeTime,
                                                    this.blurFilterStrength,0,EngineUtils.INTERPOLATE_SMOOTH)
                this.blurFilter.blur = stren
                this.instructionContainter.alpha = stren/this.blurFilterStrength
                this.blurFilterInstruction.blur = (1-(stren/this.blurFilterStrength))*40;
                
                var volumeFac = EngineUtils.interpolate((this.instructionTimer-this.instructionTimerLength+this.blurFadeTime)/this.blurFadeTime,
                        0,1,EngineUtils.INTERPOLATE_OUT)
                //this._setMusicVolume(musicFac)
                $engine.audioSetVolume(this.ambience,1-volumeFac)
            }
            // play start sound when moving to next sequence
            if(this.instructionTimer===this.instructionTimerLength-this.blurFadeTime)
                $engine.audioPlaySound("minigame_start",0.75)
        } else if (this.instructionTimer-this.blurFadeTime <= this.instructionTimerLength) {
            // fade in music AFTER the game starts
            this._startMusic();
            var musicFac = EngineUtils.interpolate((this.instructionTimer-this.instructionTimerLength)/this.blurFadeTime,0,1,EngineUtils.INTERPOLATE_OUT_QUAD)
            this._setMusicVolume(musicFac)
        }
        if(this.instructionTimer===this.instructionTimerLength) {
            this.showingInstructions=false;
            if(!$engine.isLow())
                $engine.getCamera().removeFilter(this.blurFilter);
            this._onGameStart();
            $engine.unpauseGame();
            this._startMusic();
        }

        this._preGameAmbience();

        var time = 30;
        var bobTime = 90;
        if(this.instructionTimer<bobTime) {
            var check =this.instructionTimer%time<time/2
            if(check) {
                this.keyIcon.tint = 0xcfcfcf;
                this.mouseIcon.tint = 0xcfcfcf;
            } else {
                this.keyIcon.tint = 0xffffff;
                this.mouseIcon.tint = 0xffffff;
            }
            var fac= EngineUtils.interpolate(Math.abs((this.instructionTimer%time)-time/2)/(time/2),0,0.04,EngineUtils.INTERPOLATE_OUT_QUAD)
            var fac2 = EngineUtils.interpolate((this.instructionTimer-(bobTime-time))/time,1,0,EngineUtils.INTERPOLATE_SMOOTH);
            fac*=fac2
            this.keyIcon.scale.y = 1+fac;
            this.mouseIcon.scale.y = 1+fac;
            this.keyIcon.scale.x = 1-fac;
            this.mouseIcon.scale.x = 1-fac;
            this.keyIcon.y = 64 - fac*128;
            this.mouseIcon.y = 64 - fac*128;
            this.keyIcon.rotation = (fac*-0.02*fac2)*25;
            this.mouseIcon.rotation = (fac*-0.02*fac2)*25;
        }
    }

    _preGameAmbience() {
        if(this.instructionTimer>60)
            return;
        var fac = EngineUtils.interpolate(this.instructionTimer/60,0,1,EngineUtils.INTERPOLATE_SMOOTH);

        $engine.audioSetVolume(this.ambience,fac);
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

        // handle scale / rotation / blur of cheat
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
        this.cheatTooltip.rotation = Math.sin($engine.getGlobalTimer()/16)/48

        // draw the tooltip;
        if(this.cheatTimer > 20) {
            var width = this.cheatTooltip.width;
            var xStart = $engine.getWindowSizeX()/2-width/2;
            var xEnd = xStart + width;
            var textFac = EngineUtils.interpolate((this.cheatTimer-20)/60,xStart,xEnd,EngineUtils.INTERPOLATE_SMOOTH_EXPONENTIAL);
            this.cheatTooltipGraphicsMask.x = textFac
        }
        this.cheatTooltip.scale.y = Math.cos($engine.getGlobalTimer()/13)/32+1
        this.cheatTooltip.scale.x = Math.sin($engine.getGlobalTimer()/11)/32+1-1/32

        if(this.cheatTimer===this.cheatTimerLength) {
            this.showingCheat=false;
            if(!$engine.isLow())
                $engine.getCamera().removeFilter(this.blurFilter);
            $engine.unpauseGame();
        }


        // handle volume
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
        $engine.createManagedRenderable(this,renderable);
        this.instructionContainter.removeChildren();
        this.instructionContainter.addChild(renderable);
        this.instructionContainter.addChild(this.keyIcon)
        this.instructionContainter.addChild(this.mouseIcon)
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
        this.cheatContainer.removeChildren();
        this.cheatContainer.addChild(renderable);
        this.cheatContainer.addChild(this.cheatTooltip);
        this.cheatContainer.addChild(this.cheatTooltipGraphicsMask);
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

    onCreate(sheet = "background_sheet_1") {
        this.parallaxFactorX = 0.25;
        this.parallaxFactorY = 0.25;
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/2;
        var textures = $engine.getTexturesFromSpritesheet(sheet,0,$engine.getSpritesheetLength(sheet));
        this.sprites = [];
        for(var i =0;i<textures.length;i++) {
            var sprite = $engine.createRenderable(this,new PIXI.Sprite(textures[textures.length-1-i]),false)
            this.sprites.push(sprite)
            sprite.x = this.x;
            sprite.y = this.y;
        }
        this.depth = 9999999999;
        this.invertParallax = false;
        $engine.setBackground(new PIXI.Graphics())
        $engine.setBackgroundColour(0xe2d6b3);
    }

    /**
     * Removes the specified sprite at index from the ParallaxingBackground.
     * @param {Number} idx The index of the sprite to delete
     */
    removeIndex(idx) {
        $engine.removeRenderable(this.sprites.splice(idx,1)[0])
    }

    /**
     * Sets how sensitive the front image is to parallax. 1 means it moves in unison with the camera
     * and 0 means it is static.
     * 
     * Note that elements beyond the first image will still move if the factor is 1.
     * If you can't have them move with the camera then you should not be using a ParallaxingBackground.
     * 
     * @param {Number} px The amount to move in the x direction
     * @param {Number} py The amount to move in the y direction
     */
    setParallaxFactors(px, py) {
        this.parallaxFactorX=px;
        this.parallaxFactorY=py;
    }

    /**
     * Applies the function to all elements of this ParallaxingBackground
     * @param {Function} func The function to apply
     */
    applyToAll(func) {
        for(const spr of this.sprites)
            func(spr);
    }

    setInvertParallax(invert) {
        this.invertParallax=invert;
    }

    getDx() {
        return $engine.getCamera().getX();
    }

    getDy() {
        return $engine.getCamera().getY();
    }

    draw(gui, camera) {
        var dx = this.getDx();
        var dy = this.getDy();
        var cx = $engine.getWindowSizeX()/2 + $engine.getCamera().getX();
        var cy = $engine.getWindowSizeY()/2 + $engine.getCamera().getY();
        var facX = this.parallaxFactorX;
        var facY = this.parallaxFactorY;
        if(this.invertParallax) {
            for(var i = 0;i<this.sprites.length;i++) {
                this.sprites[i].x = cx+(-dx*facX);
                this.sprites[i].y = cy+(-dy*facY);
                facX/=2;
                facY/=2;
            }
            
        } else {
            for(var i = this.sprites.length-1;i>=0;i--) {
                this.sprites[i].x = cx+(-dx*facX);
                this.sprites[i].y = cy+(-dy*facY);
                facX/=2;
                facY/=2;
            }
        }
    }

}