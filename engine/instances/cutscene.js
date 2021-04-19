class CutsceneController extends EngineInstance {
    onEngineCreate() {
        this.sheet = RoomManager.currentRoom().getExtern("sheet")[0];
        this.cutsceneComplete = eval(RoomManager.currentRoom().getExtern("onComplete")[0]);
        this.textures = $engine.getTexturesFromSpritesheet(this.sheet,0,$engine.getSpritesheetLength(this.sheet));
        this.setSprite(new PIXI.Sprite(this.textures[0]));
        this.frames = this.textures.length;
        this.currentFrame = 0;
        $engine.startFadeIn();

        this.timer = 0;

        this.transition = true;
        this.transitionTime = 36;
        
        this.biases = RoomManager.currentRoom().getExtern("biases");
        for(var i =0;i<this.biases.length;i++)
            this.biases[i] = parseFloat(this.biases[i]);

        this.text = RoomManager.currentRoom().getExtern("text");
        var length = this.text.length;
        for(var i =length;i<this.frames;i++)
            this.text.push([]);
        for(var i =0;i<this.text.length;i++) {
            if(this.text[i]==="<none>") {
                this.text[i]=[];
                continue;
            }
            this.text[i] = this.text[i].split("\\0");
        }

        this.textBox = new TextBox(this.text[0],false);


        this.frameLength = []
        for(var i =0;i<this.frames;i++)
            this.frameLength[i] = this.transitionTime*2+2;

        
        this.musicIndex = 0;
        this.music = undefined;
        this.musicInfo = RoomManager.currentRoom().getExtern("music");
        for(var i =0;i<this.musicInfo.length;i++) {
            var data = this.musicInfo[i].split(" ");
            this.musicInfo[i] =  {
                frame:parseFloat(data[0]),
                music:data[1],
            }
        }
        this.testUpdateMusic();


        this.blurFilterStrength = 6; // making it a round number kinda messes with it
        this.blurFilter = new PIXI.filters.BlurFilter();
        this.blurFilter.blur = this.blurFilterStrength
        this.blurFilter.repeatEdgePixels=true;

        $engine.setBackgroundColour(0)

        if(!$engine.isLow())
            $engine.addFilter(this.blurFilter);

        this.adjustmentFilterStrength = 3;
        this.adjustmentFilter = new PIXI.filters.AdjustmentFilter();

        if(!$engine.isLow())
            $engine.addFilter(this.adjustmentFilter);

        this.wipeTimer = -1;

        this.wipeStarted=false;
        this.out = false;

        this.maskBias = this.biases[0]; // if maskMode === 0, then this is how much to move the *image*.

        this.hasPlayedPageFlip = false;

        var maskGraphics = new PIXI.Graphics();
        maskGraphics.beginFill(0xffffff);
        maskGraphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY());
        maskGraphics.endFill();

        // PIXIJS please
        for(var i=0;i<=this.textBox.textBoxHeight/2;i++) {
            maskGraphics.beginFill(0xffffff,1-(i/(this.textBox.textBoxHeight/2)));
            maskGraphics.drawRect(0,$engine.getWindowSizeY()+i,$engine.getWindowSizeX(),1);
            maskGraphics.endFill();
        }

        var tex = $engine.getRenderer().generateTexture(maskGraphics);
        $engine.createManagedRenderable(this,tex);
        $engine.freeRenderable(maskGraphics);

        this.baseImageMask = $engine.createRenderable(this, new PIXI.Sprite(tex));
        this.getSprite().mask = this.baseImageMask;
    }

    testUpdateMusic() {
        if(this.musicIndex < this.musicInfo.length && this.currentFrame===this.musicInfo[this.musicIndex].frame) {
            this.getNextMusic();
        }
    }

    getNextMusic() {
        if(this.music)
            $engine.audioFadeSound(this.music);
        var ref = this.musicInfo[this.musicIndex].music;
        if(ref!=="<none>")
            this.music = $engine.audioPlaySound(ref,0.5,true);
        else
            this.music=undefined;
        if(this.musicIndex!==0)
            $engine.audioFadeInSound(this.music,30);
        this.musicIndex++;
    }

    updateImage() {
        this.getSprite().texture = this.textures[this.currentFrame];
        this.maskBias=this.biases[this.currentFrame];
        this.testUpdateMusic();
        this.hasPlayedPageFlip = false;
    }


    isReady() {
        return !this.isTransitioning() && this.textBox.isReady();
    }

    textBoxTick() {
        var newY = -this.textBox.textBoxFactor*this.textBox.textBoxHeight/2
        var imgMove = newY*(this.maskBias); // img
        var maskCorrection = newY * (1-this.maskBias)
        var maskMove = imgMove + maskCorrection;
        this.y=imgMove;
        this.baseImageMask.y = maskMove*2;
    }
    

    isTransitioning() {
        return this.transition;
    }

    arrowTick() {
        this.textBox.arrowTick();
    }

    advance() {
        if(this.isTransitioning()) {
            if(this.timer<this.transitionTime)
                this.timer = this.transitionTime;
            else {
                this.timer = this.frameLength[this.currentFrame]-1;
                this.playPageFlip();
            }
        }
        this.textBox.advance();
        if(!this.textBox.hasMoreText()) // next frame
            this.timer++;
    }

    step() {
        if(IN.anyStandardInputPressed() && !IN.keyCheckPressed("Escape") && !IN.keyCheckPressed("Control") 
                    && this.timer < this.frameLength[this.currentFrame]-this.transitionTime/4 && this.timer > this.transitionTime/4) {
            this.advance();
        }

        if(this.text[this.currentFrame].length!==0 && !this.isTransitioning() && this.textBox.textIndex===0) { // initalize text box for new frame.
            this.advance()
        }

        // speedrun speedrun speedrun go go go go go
        if((IN.keyCheckPressed("Escape")|| IN.keyCheckPressed("Control") ) && !this.wipeStarted && !(this.currentFrame===0 && this.wipeTimer<this.transitionTime)) {
            this.endCutscene();
            
        }
        this.textBoxTick();
        if(this.timer>this.frameLength[this.currentFrame]) {
            if(this.currentFrame < this.frames-1) {
                this.currentFrame++;
                this.timer = 0;
                this.textBox.textIndex = 0;
                this.textBox.setTextArray(this.text[this.currentFrame],false)
                this.updateImage();
            } else {
                $engine.audioFadeAll(15);
            }
        } else {
            if(this.timer <= this.transitionTime) {
                this.blurFilter.enabled = true; // weird bug if moving the image with filter enabled...
                this.blurFilter.blur = EngineUtils.interpolate(this.timer/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_OUT);
                this.adjustmentFilter.brightness = EngineUtils.interpolate(this.timer/this.transitionTime,this.adjustmentFilterStrength,1,EngineUtils.INTERPOLATE_OUT);
                this.timer++;
                this.transition=true;
                this.textBox.setWaiting(true)
            } else if(this.frameLength[this.currentFrame]-this.timer <= this.transitionTime) {
                this.textBox._clearText();
                this.blurFilter.enabled = true;
                this.blurFilter.blur = EngineUtils.interpolate((this.frameLength[this.currentFrame]-this.timer)/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_OUT);
                this.adjustmentFilter.brightness = EngineUtils.interpolate((this.frameLength[this.currentFrame]-this.timer)/this.transitionTime,this.adjustmentFilterStrength,1,EngineUtils.INTERPOLATE_OUT);
                this.timer++;
                this.transition=true;
                this.textBox.setWaiting(true)
                if(this.currentFrame >= this.frames-1 && !this.wipeStarted) {
                    this.endCutscene();
                }
            } else {
                this.blurFilter.enabled = false;
                this.transition=false;
                this.textBox.setWaiting(false)
            }
            
            if(this.frameLength[this.currentFrame]-this.timer===Math.floor(this.transitionTime/2)) {
                this.playPageFlip()
            }
        }
        if(this.wipeTimer>this.transitionTime && this.wipeStarted) {
            this.cutsceneComplete();
        }
        //this.timer++;
        this.wipeTimer++;
    }

    endCutscene() {
        this.out = true;
        this.wipeTimer = 0;
        this.wipeStarted=true;
        $engine.audioFadeAll();
    }

    playPageFlip() {
        if(this.currentFrame >= this.frames-1 || this.hasPlayedPageFlip)
            return;
        var snd = $engine.audioPlaySound("cutscene_paper",3);
        snd.speed = EngineUtils.randomRange(0.9,1.1);
        this.hasPlayedPageFlip = true;
    }

    draw(gui, camera) {

        if($engine.isLow()) {
            var fac = 0;
            if(this.timer <= this.transitionTime)
                fac = EngineUtils.interpolate(this.timer/this.transitionTime,1,0,EngineUtils.INTERPOLATE_OUT);
            else if(this.frameLength[this.currentFrame]-this.timer <= this.transitionTime)
                fac = EngineUtils.interpolate((this.frameLength[this.currentFrame]-this.timer)/this.transitionTime,1,0,EngineUtils.INTERPOLATE_OUT);
            if(fac!==0) {
                gui.beginFill(0xffffff,fac);
                gui.drawRect(-64,-64,$engine.getWindowSizeX()+196,$engine.getWindowSizeY()+64)
                gui.endFill();
            }
        }

        gui.beginFill(0);
        if(this.out) {
            gui.drawRect(-64,$engine.getWindowSizeY() + EngineUtils.interpolate(this.wipeTimer/this.transitionTime,0,-$engine.getWindowSizeY()-16,EngineUtils.INTERPOLATE_OUT),
                        $engine.getWindowSizeX()+196,$engine.getWindowSizeY()+16)
        } else {
            gui.drawRect(-64,EngineUtils.interpolate(this.wipeTimer/this.transitionTime,0,-$engine.getWindowSizeY()-64,EngineUtils.INTERPOLATE_IN)-16,
                        $engine.getWindowSizeX()+196,$engine.getWindowSizeY()+16)
        }
        gui.endFill();
    }
}

class TextBox extends EngineInstance {
    onCreate(text, autoCreate=true) {
        if(text===undefined) {
            text = [];
        }

        this.depth = -999999999999999 // in front of everything EXCEPT for UI

        this.container = $engine.createRenderable(this, new PIXI.Container(),true); // the container that acutally renders

        this.numTexts = 0;
        this.textIndex = 0;
        this.textCharacterDelay = 0;
        this.textAdvanceTimer = 0;
        this.textWaitTimer = 0;

        this.currentText="";
        this.walkingTextIndex=0;

        this.portraitTimer = 0;
        this.portraitTime = 30;
        this.nextPortraitTexture = undefined;
        this.portraitTransitionMode = 1;
        this.showingPortrait = false;

        this.textSound = undefined;
        this.textSoundTimer = 0;
        this.textSoundMinDelay = 4;

        this.isDone = false; // whether or not the end of the text has been reached.

        this.noShift = false; // prevents text shift on profile change.

        this.waiting=false;

        this.arrowEnabled = true;

        this.locationFunction = undefined;

        this.showTextBoxTimer = 0;
        this.showingTextBox = false;
        this.showTextBoxTime = 38;

        this.firstCharacter=true;

        this.textBoxHeight=167;

        this.textBoxFactor=0;

        this.textBox = $engine.createManagedRenderable(this,new PIXI.Sprite($engine.getTexture("text_box")));
        this.textBox.y = $engine.getWindowSizeY();

        this.portraitImage = $engine.createManagedRenderable(this, new PIXI.Sprite(PIXI.Texture.Empty));
        this.portraitImage.x = 90;
        this.portraitImage.y = $engine.getWindowSizeY() - 40;
        this.portraitImage.scale.x = 0
        this.portraitImage.anchor.set(0.5,1);

        this.basePortraitY = this.portraitImage.y;

        this.baseTextLocation = 25;
        this.textOffset = 0;

        this.continueArrow = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("arrow")))
        this.continueArrow.anchor.x = 0.5;
        this.continueArrow.scale.set(0.25,0.25);
        this.continueArrowBaseXScale = 0.25;
        this.continueArrowBaseYScale = 0.25;

        this.continueArrow.y = $engine.getWindowSizeY()+64;
        this.continueArrow.x = $engine.getWindowSizeX()/2;

        this.continueArrowBaseX = this.continueArrow.x;
        this.continueArrowBaseY = this.continueArrow.y;

        this.advanceCondition = undefined;
        this.advanceListeners = [];

        this.continueArrowTimer = 0;
        this.continueArrowTime = 30;

        var style = $engine.getDefaultTextStyle();
        style.align = 'left'
        style.wordWrap = true;
        style.fill = 0;
        style.strokeThickness=0;
        style.wordWrapWidth = $engine.getWindowSizeX()-50
        style.fontSize = 25;
        style.breakWords=true;
        this.textImage = $engine.createManagedRenderable(this, new PIXI.Text("",style))
        this.textImage.x = this.baseTextLocation;
        this.textImage.y = $engine.getWindowSizeY()-this.textBoxHeight+24;

        this.textBoxRenderTexture = $engine.createManagedRenderable(this, PIXI.RenderTexture.create($engine.getWindowSizeX(),$engine.getWindowSizeY()));
        this.textBoxRenderTextureSprite = $engine.createManagedRenderable(this, new PIXI.Sprite(this.textBoxRenderTexture))

        this.textBox.mask = this.textBoxRenderTextureSprite;

        this.renderTextureGraphics = $engine.createManagedRenderable(this, new PIXI.Graphics());

        // for draw in
        this.locations = [];
        for(var i =0;i<=this.showTextBoxTime;i++) {
            var xFac = Math.sin(-i/1.25)*94;
            var xCorrection = 100 * ((i/this.showTextBoxTime)-0.5)
            this.locations.push(new EngineLightweightPoint(i/(this.showTextBoxTime)*$engine.getWindowSizeX()+xFac+xCorrection,
                                    $engine.getWindowSizeY()-this.textBoxHeight/2 +  Math.sin(i/1.25) * this.textBoxHeight/2))
        }
        this.xc = this.locations[0].x;
        this.yc = this.locations[0].y;

        this.container.addChild(this.textBox, this.textImage, this.portraitImage, this.continueArrow, this.textBoxRenderTextureSprite)

        this.setTextArray(text, autoCreate);
    }

    step() {
        this.alphaTick();
        this.textBoxTick();
        this.arrowTick();
        this.testAdvanceFunction();
        this.textTimerTick();
    }

    textTimerTick() {
        this.textSoundTimer--;
    }

    alphaTick() {
        if(!this.locationFunction) {
            return;
        }
        var locations = this.locationFunction.func(this.locationFunction.parent);
        if(!Array.isArray(locations))
            locations = [locations];
        
        var alpha = 1;
        var start =  $engine.getWindowSizeY()/2;
        var end = $engine.getWindowSizeY()-this.textBoxHeight;
        var diff = end-start;
        for(const point of locations) {
            var fac = EngineUtils.interpolate((point.y-start)/diff,1,0.33333,EngineUtils.INTERPOLATE_IN);
            alpha = Math.min(alpha,fac);
        }
        this.alpha = alpha;
        
    }

    /**
     * Sets a function to be called to sample the location of any major obstruction.
     * 
     * The function must return a single Point or an array of points representing any points that the
     * user may be looking at. If any point obscures the text box, it will be faded out.
     * 
     * The points are expected to be in GUI space.
     * 
     * @param {Object} parent The parent object
     * @param {Function} func The function to call
     */
    setSampleLocationFunction(parent,func) {
        this.locationFunction = {
            parent:parent,
            func:func
        }
    }

    testAdvanceFunction() {
        if(!this.advanceCondition)
            return;
        if(this.advanceCondition.func.apply(this.advanceCondition.parent, this.advanceCondition.args)) {
            this.advanceNow();
            this.advanceCondition=undefined;
            for(const listener of this.advanceListeners) {
                listener.func(listener.parent);
            }
        }
    }

    /**
     * Sets a condition to automatically advance the text box
     * When the function returns true, the text box will advance, fire listeners, and
     * remove the condition
     * 
     * 'this' in the method refers to the parent.
     * 
     * @param {Function} func The advance condition
     * @param {...Object} args The arguments to pass to the function
     */
    setAdvanceCondition(parent, func, args=undefined) {
        this.advanceCondition = {
            parent:parent,
            func:func,
            args:args
        };
    }

    /**
     * Registers a listener to be run when the text box is advanced
     * by the advance condition.
     * 
     * 
     * @param {Object} parent The argument to pass to func
     * @param {Function} func The listener
     */
    addAdvanceConditionListener(parent, func) {
        this.advanceListeners.push( {
            parent:parent,
            func:func,
        })
    }

    /**
     * Sets the array that this text box uses.
     * 
     * @param {...String} array The text to display
     * @param {Boolean | True} autoCreate Whether or not to automatically show the text when created
     */
    setTextArray(array, autoCreate = true) {
        this.numTexts = array.length;
        this.text = array;
        this.isDone = array.length===0;
        this.currentText = "";
        this.textIndex = 0;
        this.textSound=undefined;
        this._clearText()
        if(autoCreate)
            this.advance();
    }

    isReady() {
        return (this.currentText === "" || this.textComplete()) && this.portraitImageCorrect() && !this.isWaiting();
    }

    disableArrow() {
        this.arrowEnabled = false;
    }

    isWaiting() { // for external inputs to force the text to wait.
        return this.waiting;
    }

    setWaiting(bool) {
        this.waiting = bool;
    }

    /**
     * 
     * @returns True if there is more text to read
     */
    hasMoreText() {
        return !this.isDone;
    }

    arrowTick() {
        if(!this.arrowEnabled) {
            this.continueArrow.y = this.continueArrowBaseY;
            return;
        }
        if(this.isReady()) {
            if(this.continueArrowTimer<this.continueArrowTime)
                this.continueArrowTimer++;
        } else {
            if(this.continueArrowTimer>0)
                this.continueArrowTimer--;
        }
        var fac = EngineUtils.interpolate(this.continueArrowTimer/this.continueArrowTime,0,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL)
        this.continueArrow.y = this.continueArrowBaseY-72*fac;
        this.continueArrow.alpha = fac;

        var fac2 = Math.abs(Math.sin($engine.getGameTimer()/16));
        var fac3 = fac2/10+1;
        this.continueArrow.x = this.continueArrowBaseX+fac2*4;
        this.continueArrow.scale.x = fac3*this.continueArrowBaseXScale
        this.continueArrow.scale.y = fac3*(1-fac2/3)*this.continueArrowBaseYScale
    }

    textBoxTick() { // this violates the draw contract, but honestly it's a render texture it's tied to step anyway.
        if(this.showingTextBox) {
            if(!this.textBoxReady())
                this._prepareTextBox();
            else 
                this._textBoxReadyTick();
        } else {
            if(this.showTextBoxTimer>0) 
                this._hideTextBox();
            else {
                this._setVisisble(false);
            }
        }
        this._portraitTick();
    }

    _setVisisble(bool) { // save GPU
        this.textBoxRenderTextureSprite.visible=bool;
        this.textBox.visible=bool;
    }

    _portraitTick() {
        if(this.showingPortrait) {
            if(!this.portraitReady())
                this._preparePortrait();
        } else {
            if(this.portraitTimer>0) 
                this._hidePortrait();
            else
                this.nextPortraitTexture = undefined;
        }
    }

    portraitReady() {
        return this.portraitTimer >= this.portraitTime && this.portraitImageCorrect();
    }

    portraitImageCorrect() {
        return !this.showingPortrait || this.portraitImage.texture === this.nextPortraitTexture
    }

    _preparePortrait() {
        var portraitFactor = 0; // i know i don't need to do this.
        this.portraitImage.alpha = 1;
        if(this.portraitTransitionMode === 1) {
            if(this.portraitTimer===0)
                this.portraitImage.texture = this.nextPortraitTexture
            var portraitFactor = EngineUtils.interpolate(++this.portraitTimer/this.portraitTime,0,1,EngineUtils.INTERPOLATE_IN_ELASTIC);
            this.portraitImage.scale.x = portraitFactor;
            var fac2 = EngineUtils.interpolate(this.portraitTimer/this.portraitTime,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.portraitImage.y = this.basePortraitY+80*fac2
        } else { // transition
            var portraitFactor = EngineUtils.interpolate(Math.abs((++this.portraitTimer-this.portraitTime/2)/(this.portraitTime/2)),0,1,EngineUtils.INTERPOLATE_OUT_BACK);
            this.portraitImage.scale.x = portraitFactor;
            this.portraitImage.y = this.basePortraitY // force into correct position
            if(Math.floor(this.portraitTime/2) === this.portraitTimer)
                this.portraitImage.texture = this.nextPortraitTexture
        }
        this.setTextOffset(Math.abs(this.portraitImage.texture.width/2+portraitFactor*this.portraitImage.texture.width/2))
    }

    _hidePortrait() {
        var portraitFactor = EngineUtils.interpolate(--this.portraitTimer/this.portraitTime,0,1,EngineUtils.INTERPOLATE_OUT_BACK);
        this.portraitImage.scale.x = portraitFactor;
        this.setTextOffset(portraitFactor*this.portraitImage.texture.width)
        var fac2 = EngineUtils.interpolate(this.portraitTimer/this.portraitTime,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this.portraitImage.y = this.basePortraitY+80*fac2

        if(this.portraitTimer===0) {
            this.portraitImage.texture = this.nextPortraitTexture
        }
    }

    setPortrait(newTex) {
        if(newTex) {
            if(newTex!==this.portraitImage.texture) {
                this.portraitTimer = 0;
                this.portraitTransitionMode = !this.showingPortrait ? 1 : 0; // 1 if show, 0 if transition
            }
            this.nextPortraitTexture = newTex;
            this.showingPortrait = true;
        } else {
            this.showingPortrait = false;
            this.nextPortraitTexture = PIXI.Texture.Empty
        }
    }

    setTextOffset(newOffset) {
        if(this.noShift)
            return;
        this.textOffset = newOffset;
        this.textImage.x = this.baseTextLocation+this.textOffset;
        this.textImage.style.wordWrapWidth = $engine.getWindowSizeX() - 50 - this.textOffset;
    }

    showTextBox(bool) {
        if(bool === this.showingTextBox)
            return;

        this.showingTextBox=bool;
        if(bool) {
            this._clearRenderTextureMask();
            this.textBox.alpha = 1;
            this.xc = this.locations[0].x;
            this.yc = this.locations[0].y;
            this.showTextBoxTimer=0;
        } else {
            this._clearText();
            this.showInterrupted= ! this.textBoxReady();
        }
    }

    _clearRenderTextureMask() {
        var camera = $engine.getCamera();
        var offX = camera.getX();
        var offY = camera.getY();
        this.renderTextureGraphics.beginFill(0);
        this.renderTextureGraphics.drawRect(-128 + offX,-this.y+$engine.getWindowSizeY()-this.textBoxHeight*2 + offY,$engine.getWindowSizeX()+256,this.textBoxHeight*4);
        this.renderTextureGraphics.endFill();
        $engine.getRenderer().render(this.renderTextureGraphics,this.textBoxRenderTexture,false,null,false);
    }

    _prepareTextBox() {
        this._setVisisble(true);
        if(this.textWaitTimer>0) {
            this.textWaitTimer--;
            if(this.textWaitTimer===0)
                while(this._preProcessText()); // account for break
            return;
        }
        this.textBoxFactor = EngineUtils.interpolate(++this.showTextBoxTimer/this.showTextBoxTime,0,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this._renderMask();
    }

    _renderMask() {
        var stage = this.showTextBoxTimer;
        var lastPoint = this.locations[stage-1];
        var currentPoint = this.locations[stage];
        this.renderTextureGraphics.clear();
        this.renderTextureGraphics.lineStyle(148,0xffffff);
        this.renderTextureGraphics.moveTo(this.xc,this.yc);
        this.xc = (lastPoint.x + currentPoint.x) / 2;
        this.yc = (lastPoint.y + currentPoint.y) / 2;
        this.renderTextureGraphics.quadraticCurveTo(currentPoint.x, currentPoint.y, this.xc, this.yc);
        $engine.getRenderer().render(this.renderTextureGraphics,this.textBoxRenderTexture,false,null,false);
    }

    _forceMaskAllTextBox() {
        var camera = $engine.getCamera();
        var offX = camera.getX();
        var offY = camera.getY();
        this.renderTextureGraphics.beginFill(0xffffff);
        this.renderTextureGraphics.drawRect(-this.x + offX,-this.y+$engine.getWindowSizeY()-this.textBoxHeight*2 + offY,$engine.getWindowSizeX()+128,this.textBoxHeight*4);
        this.renderTextureGraphics.endFill();
        $engine.getRenderer().render(this.renderTextureGraphics,this.textBoxRenderTexture,false,null,false);
    }

    _textBoxReadyTick() {
        this.textAdvanceTimer++;
        if(this.textAdvanceTimer>this.textCharacterDelay && (this.textWaitTimer--)<=0 && this.portraitImageCorrect()) {
            this.textAdvanceTimer=0;
            this._renderNextCharacter();
        }
    }

    _hideTextBox() {
        if(!this.showInterrupted) {
            this.textBoxFactor = EngineUtils.interpolate(--this.showTextBoxTimer/this.showTextBoxTime,0,1,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            this.textBox.alpha = this.textBoxFactor;
        } else {
            this.textBoxFactor = EngineUtils.interpolate(--this.showTextBoxTimer/this.showTextBoxTime,0,1,EngineUtils.INTERPOLATE_OUT);
            this.textBox.alpha = this.textBoxFactor;
        }
    }

    textBoxReady() {
        return this.showTextBoxTimer>=this.showTextBoxTime;
    }

    /**
     * Advances the text box's state.
     * 
     * Advance will do one of the following 3 things depending on it's current state:
     * 
     * -Move to the next text in the array.
     * 
     * -Skip to the end of the current text.
     * 
     * -Close the text box.
     */
    advance() {
        if(this.textIndex>=this.numTexts && this.textComplete()) { // all text done
            this.currentText="";
            this._clearText();
            this.noShift=false;
            this.showTextBox(false);
            this.setPortrait(undefined);
            this.isDone = true;
            return 0;
        } else if(!(this.walkingTextIndex>=this.currentText.length)) { // jump to end of text
            this._forcePortraitCorrect(); // the ! prevents a *very* specific bug where sometimes the text box will write a NaN into index
            while(this._renderNextCharacter()); // causing AdvanceNow to run infinite. The cause is unknown and it is extremely rare.
            this._forceMaskAllTextBox();
            return 1;
        } else { // get next text
            this._clearText();
            this.currentText = this._getNextText();
            if(this.currentText===undefined) // no text associated with this
                this.currentText="";
            this.textCharacterDelay=0;
            this.walkingTextIndex = 0;
            this.textIndex++;
            if(!this._preProcessText())
                this.showTextBox(true);
            return 2;
        }
    }

    /**
     * Forces the text box to move to the next text or close immediately, finishing the current text if applicable.
     */
    advanceNow() {
        while(this.advance()===1);
    }

    _getNextText() {
        return this.text[this.textIndex];
    }

    // returns true if all characters have been rendered
    _renderNextCharacter() {
        this.textWaitTimer=0; // force the timer to 0.
        if(this.textComplete())
            return false;
        if(this.firstCharacter) { // PIXI replces empty strings with " "
            this.textImage.text=this._parseText();
            this.firstCharacter=false;
        } else
            this.textImage.text+=this._parseText();
        this._playTextSound();
        return true;
    }

    _playTextSound() {
        if(this.textSound!==undefined && this.textSoundTimer<=0) {
            $engine.audioPlaySound(this.textSound);
            this.textSoundTimer=this.textSoundMinDelay;
        }
    }

    _forcePortraitCorrect() {
        this.portraitTimer = this.portraitTime;
        if(this.nextPortraitTexture!==undefined)
            this.portraitImage.texture = this.nextPortraitTexture
        this._preparePortrait();
    }

    textComplete() { // whether or not the CURRENT text is done
        return this.walkingTextIndex>=this.currentText.length;
    }

    _parseText() {
        while(this._tryParseCommand());
        if(this.textWaitTimer>0) // command changed the state of the text.
            return "";
        return this.currentText[this.walkingTextIndex++];
    }

    // returns true if all text was parsed.
    _preProcessText()  {
        while(this._tryParseCommand());
        if(this.textComplete())
            return true;
        return false;
    }

    _tryParseCommand() { // returns true if there was a command
        if(this.currentText[this.walkingTextIndex]!=='_')
            return false;
        var txt = this.currentText.substring(this.walkingTextIndex);
        if(txt.startsWith("__speed")) {
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            this.textCharacterDelay=parseInt(data.argument);
        } else if(txt.startsWith("__wait")) {
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            this.textWaitTimer=parseInt(data.argument);
        } else if(txt.startsWith("__choice")) {
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            var data2 = data.argument.split("~");
            var str = EngineUtils.randomFromArray(data2);
            // insert the string into the base text.
            this.currentText = this.currentText.substring(0,this.walkingTextIndex) + str + this.currentText.substring(this.walkingTextIndex);
        } else if(txt.startsWith("__italic")) {
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            var italic = parseInt(data.argument);
            if(italic)
                this.textImage.style.fontStyle='italic'
            else
                this.textImage.style.fontStyle='normal'
        } else if(txt.startsWith("__portrait")) {
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            if(data.argument==="<none>") {
                this.setPortrait(undefined);
            } else {
                var tex = $engine.getTexture(data.argument);
                this.setPortrait(tex);
            }
            if(this.textWaitTimer<=0)
                this.textWaitTimer=1;
        } else if(txt.startsWith("__noShift")) {
            this.setTextOffset(this.portraitImage.texture.width);
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            this.noShift = data.argument==="1" || data.argument.toLowerCase()==="true"
        } else if(txt.startsWith("__break")) { // break command processing.
            this.setTextOffset(this.portraitImage.texture.width);
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            return false;
        } else if(txt.startsWith("__playSound")) { // [snd,volume,loop]
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            var data2 = data.argument.split(",");
            var snd = data2[0];
            var volume = parseFloat(data2[1]);
            var loop = data2[2]==="1" || data2[2].toLowerCase()==="true"
            $engine.audioPlaySound(snd,volume,loop);
        } else if(txt.startsWith("__stopSound")) {
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            $engine.audioStopSound(data.argument);
        } else if(txt.startsWith("__voice")) {
            var data = this._extractCommand(txt);
            this.walkingTextIndex+=data.length;
            if(data.argument==="<none>" || data.argument.length===0) {
                this.textSound=undefined;
            } else {
                this.textSound=data.argument;
            }
            
        } 
        
        else {
            return false;
        }
        return true; 
    }

    _extractCommand(txt) {
        var start = txt.indexOf("[");
        var end = txt.indexOf("]");
        var sub = txt.substring(start+1,end);
        return {argument:sub, length:end+1};
    }

    _clearText() {
        this.textImage.text = "";
        this.walkingTextIndex=0;
        this.firstCharacter=true;
    }

    draw(gui, camera) {
        this.x = $engine.getCamera().getX();
        this.y = $engine.getCamera().getY();
    }
}


class DailyRecapCutsceneController extends CutsceneController {

    onEngineCreate() {
        super.onEngineCreate();

        var day = $__engineSaveData.day++;
        var data = $engine.getMinigameOutcomeData();
        var wins = data.winDaily;
        var losses = data.lossDaily;
        this.text = [[],[]];
        var arr = this.text[1];
        if(day===0) { // We need fine control over this cutscene, so it is generated using code.
            arr.push("__voice[voice_deep]__portrait[gods_profiles_7]Eson!__wait[12] Remember me? The __speed[2]__noShift[1]__portrait[gods_profiles_6]\"cranky old man\"__speed[0] that kicked you out of the Heavens?");
            arr.push("__voice[voice_deep]__noShift[0]__portrait[gods_profiles_7]That's right,__wait[12] I heard what you said about me earlier. __wait[20]__noShift[1]__portrait[gods_profiles_7]I've got ears everywhere!");

            if(wins>1) { // won at least one.
                arr.push("__voice[voice_deep]__portrait[gods_profiles_4]Anyways,__wait[9] I've come to let you know that you're doing a great job!__wait[24] Keep this up and you'll have your wings back in no time.")
                arr.push("__voice[voice_deep]__choice[Believe it or not, but~You may not believe it, but] I truly am rooting for you.");
                arr.push("__voice[voice_deep]__portrait[gods_profiles_5]I have to go now, __wait[20]__noShift[1]__portrait[gods_profiles_4]but keep up the good work!");
            } else {
                var str ="__voice[voice_deep]__portrait[gods_profiles_7]I must say,__wait[9] I am very disappointed in you.__wait[24]__noShift[1]__portrait[gods_profiles_6] "
                    + (wins===0 ? "__voice[voice_deep]You didn't manage to help a single person today." : "__voice[voice_deep]You hardly managed to help anyone today.")
                    + "__voice[voice_deep]__wait[20]__portrait[gods_profiles_6] Do you really want your wings back?__wait[12] Because time is ticking!";
                arr.push(str);
                arr.push("__noShift[0]__portrait[gods_profiles_7]Anyways, I have to go.");
            }
        } else { // day 2
            if(wins>1) {
                arr.push("__voice[voice_deep]__portrait[gods_profiles_4]Hey __choice[kid~son]!__wait[12] I just got a report from the big guys and it turns out you're doing really good.__wait[24] Great job!__wait[20] You're making me look really good.");
                arr.push("__voice[voice_deep]__portrait[gods_profiles_5]I have to go now, __wait[20]__noShift[1]__portrait[gods_profiles_4]but keep up the great work!");
                arr.push("__voice[voice_deep]__noShift[1]__portrait[<none>]__wait[45]O__portrait[gods_profiles_7]h!__wait[12] Almost forgot,__wait[12]__noShift[1]__portrait[gods_profiles_5] your final judgement is tomorrow night.__wait[12]__portrait[gods_profiles_4] I'll see you at the south forest tomorrow. I'm sure you'll do just fine.");
            } else {
                arr.push("__voice[voice_deep]__portrait[gods_profiles_7]Hey Eson!__wait[24] Listen kid,__wait[9] I just got a report from the big guys and__portrait[gods_profiles_6]__noShift[1] things are not looking good.");
                arr.push("__voice[voice_deep]You're making me look really bad here.__wait[24] Do you not want to become an angel again or something?!");
                arr.push("__voice[voice_deep]__noShift[0]__portrait[gods_profiles_7]My disappointment is immeasurable,__wait[12] Eson!__wait[12]__speed[3] IMMEASURABLE!");
                arr.push("__voice[voice_deep]__portrait[gods_profiles_5]__italic[1]Sigh");
                arr.push("__voice[voice_deep]__portrait[gods_profiles_7]__italic[0]And now my day is ruined. __noShift[1]__wait[24]__portrait[gods_profiles_6] Do better next time.__wait[24] Goodbye!");
                arr.push("__voice[voice_deep]__noShift[1]__portrait[<none>]__wait[45]W__portrait[gods_profiles_7]ait!__wait[12] Don't forget your final judgement is tomorrow night.__noShift[1]__wait[24]__portrait[gods_profiles_6] Meet me at the south forest and don't be late.");
            }
        }
    }

    onGameEnd() {
        $__engineSaveData.day++;
        $engine.onDayEnd();
    }
}

class EndingSummary extends EngineInstance {
    onEngineCreate() {

    }

    onCreate() {
        this.onEngineCreate();
    }
}

CutsceneController.returnToMenu = function() {
    $engine.setRoom("MenuIntro")
}