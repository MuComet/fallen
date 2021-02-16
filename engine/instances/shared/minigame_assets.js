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

    pause() {
        this.isPaused = true;
    }

    unpause() {
        this.isPaused=false;
    }

    hide() {
        this.visible = false;
    }

    unhide() {
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

    onDestroy() {
        $engine.freeRenderable(this.timerText);
    }

}