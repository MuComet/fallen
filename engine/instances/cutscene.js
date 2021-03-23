class CutsceneController extends EngineInstance {
    onEngineCreate() {
        this.sheet = RoomManager.currentRoom().getExtern("sheet")[0];
        this.cutsceneComplete = eval(RoomManager.currentRoom().getExtern("onComplete")[0]);
        this.textures = $engine.getTexturesFromSpritesheet(this.sheet,0,$engine.getSpritesheetLength(this.sheet));
        this.setSprite(new PIXI.Sprite(this.textures[0]));
        this.frames = this.textures.length;
        this.currentFrame = 0;

        this.transition = true;
        
        this.biases = RoomManager.currentRoom().getExtern("biases");
        for(var i =0;i<this.biases.length;i++)
            this.biases[i] = parseFloat(this.biases[i]);

        this.text = RoomManager.currentRoom().getExtern("text");
        var length = this.text.length;
        for(var i =length;i<this.frames;i++)
            this.text.push([]);
        for(var i =0;i<this.text.length;i++) {
            if(this.text[i]===1 || this.text[i]==="<none>") {
                this.text[i]=[];
                continue;
            }
            this.text[i] = this.text[i].split("\\0");
        }

        this.timer = 0;
        this.numTexts = this.text[0].length;
        this.textIndex = 0;
        this.textCharacterDelay = 0;
        this.textAdvanceTimer = 0;
        this.textWaitTimer = 0;

        this.currentText="";
        this.walkingTextIndex=0;

        this.transitionTime = 36;

        this.portraitTimer = 0;
        this.portraitTime = 30;
        this.nextPortraitTexture = undefined;
        this.portraitTransitionMode = 1;
        this.showingPortrait = false;

        this.noShift = false; // prevents text shift on profile change.

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

        this.showTextBoxTimer = 0;
        this.showingTextBox = false;
        this.showTextBoxTime = 38;

        this.firstCharacter=true;

        this.maskBias = this.biases[0]; // if maskMode === 0, then this is how much to move the *image*.

        this.textBoxHeight=167;

        this.textBoxFactor=0;

        this.textBox = $engine.createRenderable(this,new PIXI.Sprite($engine.getTexture("text_box")));
        this.textBox.y = $engine.getWindowSizeY();

        this.portraitImage = $engine.createRenderable(this, new PIXI.Sprite(PIXI.Texture.Empty));
        this.portraitImage.x = 90;
        this.portraitImage.y = $engine.getWindowSizeY() - 40;
        this.portraitImage.scale.x = 0
        this.portraitImage.anchor.set(0.5,1);

        this.basePortraitY = this.portraitImage.y;

        this.baseTextLocation = 25;
        this.textOffset = 0;

        this.hasPlayedPageFlip = false;

        var style = $engine.getDefaultTextStyle();
        style.align = 'left'
        style.wordWrap = true;
        style.fill = 0;
        style.strokeThickness=0;
        style.wordWrapWidth = $engine.getWindowSizeX()-50
        style.fontSize = 25;
        style.breakWords=true;
        this.textImage = $engine.createRenderable(this, new PIXI.Text("",style))
        this.textImage.x = this.baseTextLocation;
        this.textImage.y = $engine.getWindowSizeY()-this.textBoxHeight+24;

        this.renderTexture = $engine.createManagedRenderable(this, PIXI.RenderTexture.create($engine.getWindowSizeX(),$engine.getWindowSizeY()));
        this.renderTextureSprite = $engine.createRenderable(this, new PIXI.Sprite(this.renderTexture))

        this.textBox.mask = this.renderTextureSprite;

        this.renderTextureGraphics = $engine.createManagedRenderable(this, new PIXI.Graphics());

        var maskGraphics = new PIXI.Graphics();
        maskGraphics.beginFill(0xffffff);
        maskGraphics.drawRect(0,0,$engine.getWindowSizeX(),$engine.getWindowSizeY());
        maskGraphics.endFill();

        // PIXIJS please
        for(var i=0;i<=this.textBoxHeight/2;i++) {
            maskGraphics.beginFill(0xffffff,1-(i/(this.textBoxHeight/2)));
            maskGraphics.drawRect(0,$engine.getWindowSizeY()+i,$engine.getWindowSizeX(),1);
            maskGraphics.endFill();
        }
        var tex = $engine.getRenderer().generateTexture(maskGraphics);
        $engine.createManagedRenderable(this,tex);
        $engine.freeRenderable(maskGraphics);

        this.baseImageMask = $engine.createRenderable(this, new PIXI.Sprite(tex));
        this.getSprite().mask = this.baseImageMask;

        this.locations = [];
        for(var i =0;i<=this.showTextBoxTime;i++) {
            var xFac = Math.sin(-i/1.25)*94;
            var xCorrection = 100 * ((i/this.showTextBoxTime)-0.5)
            this.locations.push(new EngineLightweightPoint(i/(this.showTextBoxTime)*$engine.getWindowSizeX()+xFac+xCorrection,
                                    $engine.getWindowSizeY()-this.textBoxHeight/2 +  Math.sin(i/1.25) * this.textBoxHeight/2))
        }
        this.xc = this.locations[0].x;
        this.yc = this.locations[0].y;
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

    textBoxTick() { // this violates the draw contract, but honestly it's a render texture it's tied to step anyway.
        if(this.showingTextBox) {
            if(!this.textBoxReady())
                this.prepareTextBox();
            else 
                this.textBoxReadyTick();
        } else {
            if(this.showTextBoxTimer>0) 
                this.hideTextBox();
        }
        this.portraitTick();
        var newY = -this.textBoxFactor*this.textBoxHeight/2
        var imgMove = newY*(this.maskBias); // img
        var maskCorrection = newY * (1-this.maskBias)
        var maskMove = imgMove + maskCorrection;
        this.y=imgMove;
        this.baseImageMask.y = maskMove*2;
    }

    portraitTick() {
        if(this.showingPortrait) {
            if(!this.portraitReady())
                this.preparePortrait();
        } else {
            if(this.portraitTimer>0) 
                this.hidePortrait();
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

    preparePortrait() {
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
            if(Math.floor(this.portraitTime/2) === this.portraitTimer)
                this.portraitImage.texture = this.nextPortraitTexture
        }
        this.setTextOffset(Math.abs(this.portraitImage.texture.width/2+portraitFactor*this.portraitImage.texture.width/2))
    }

    hidePortrait() {
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
            this.clearRenderTextureMask();
            this.textBox.alpha = 1;
            this.xc = this.locations[0].x;
            this.yc = this.locations[0].y;
            this.showTextBoxTimer=0;
        } else {
            this.textInterrupted= ! this.textBoxReady();
        }
    }

    clearRenderTextureMask() {
        this.renderTextureGraphics.beginFill(0);
        this.renderTextureGraphics.drawRect(-this.x,-this.y+$engine.getWindowSizeY()-this.textBoxHeight*2,$engine.getWindowSizeX()+128,this.textBoxHeight*4);
        this.renderTextureGraphics.endFill();
        $engine.getRenderer().render(this.renderTextureGraphics,this.renderTexture,false,null,false);
    }

    prepareTextBox() {
        this.textBoxFactor = EngineUtils.interpolate(++this.showTextBoxTimer/this.showTextBoxTime,0,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this.renderMask();
    }

    renderMask() {
        var stage = this.showTextBoxTimer;
        var lastPoint = this.locations[stage-1];
        var currentPoint = this.locations[stage];
        this.renderTextureGraphics.clear();
        this.renderTextureGraphics.lineStyle(140,0xffffff);
        this.renderTextureGraphics.moveTo(this.xc,this.yc);
        this.xc = (lastPoint.x + currentPoint.x) / 2;
        this.yc = (lastPoint.y + currentPoint.y) / 2;
        this.renderTextureGraphics.quadraticCurveTo(currentPoint.x, currentPoint.y, this.xc, this.yc);
        $engine.getRenderer().render(this.renderTextureGraphics,this.renderTexture,false,null,false);
    }

    forceMaskAllTextBox() {
        this.renderTextureGraphics.beginFill(0xffffff);
        this.renderTextureGraphics.drawRect(-this.x,-this.y+$engine.getWindowSizeY()-this.textBoxHeight*2,$engine.getWindowSizeX()+128,this.textBoxHeight*4);
        this.renderTextureGraphics.endFill();
        $engine.getRenderer().render(this.renderTextureGraphics,this.renderTexture,false,null,false);
    }

    textBoxReadyTick() {
        this.textAdvanceTimer++;
        if(this.textAdvanceTimer>this.textCharacterDelay && (this.textWaitTimer--)<=0 && this.portraitImageCorrect()) {
            this.textAdvanceTimer=0;
            this.renderNextCharacter();
        }
    }

    hideTextBox() {
        if(!this.textInterrupted) {
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

    // called to advance the current text to the next in the list
    advance() {
        if(this.isTransitioning()) {
            if(this.timer<this.transitionTime)
                this.timer = this.transitionTime;
            else {
                this.timer = this.frameLength[this.currentFrame]-1;
                this.playPageFlip();
            }
        } else if(this.textIndex>=this.numTexts && this.textComplete()) {
            this.currentText="";
            this.clearText();
            this.noShift=false;
            this.showTextBox(false);
            this.setPortrait(undefined);
            this.timer++;
        } else if(this.walkingTextIndex<this.currentText.length) { // jump to end of text
            this.forcePortraitCorrect();
            while(this.renderNextCharacter());
            this.forceMaskAllTextBox();
        } else {
            this.clearText();
            this.currentText = this.text[this.currentFrame][this.textIndex];
            if(this.currentText===undefined) // no text associated with this
                this.currentText="";
            this.textCharacterDelay=0;
            this.walkingTextIndex = 0;
            this.textIndex++;
            if(!this.preProcessText())
                this.showTextBox(true);
        }
    }

    // returns true if all characters have been rendered
    renderNextCharacter() {
        this.textWaitTimer=0; // force the timer to 0.
        if(this.textComplete())
            return false;
        if(this.firstCharacter) { // PIXI replces empty strings with " "
            this.textImage.text=this.parseText();
            this.firstCharacter=false;
        } else
            this.textImage.text+=this.parseText();
        return true;
    }

    forcePortraitCorrect() {
        this.portraitTimer = this.portraitTime;
        if(this.nextPortraitTexture!==undefined)
            this.portraitImage.texture = this.nextPortraitTexture
        this.preparePortrait();
    }

    textComplete() {
        return this.walkingTextIndex>=this.currentText.length;
    }

    parseText() {
        while(this.tryParseCommand());
        if(this.textWaitTimer>0) // command changed the state of the text.
            return "";
        return this.currentText[this.walkingTextIndex++];
    }

    // returns true if all text was parsed.
    preProcessText()  {
        while(this.tryParseCommand());
        if(this.textComplete())
            return true;
        return false;
    }

    tryParseCommand() {
        if(this.currentText[this.walkingTextIndex]!=='_')
            return false;
        var txt = this.currentText.substring(this.walkingTextIndex);
        if(txt.startsWith("__speed")) {
            var data = this.extractCommand(txt);
            this.walkingTextIndex+=data.length;
            this.textCharacterDelay=parseInt(data.argument);
        } else if(txt.startsWith("__wait")) {
            var data = this.extractCommand(txt);
            this.walkingTextIndex+=data.length;
            this.textWaitTimer=parseInt(data.argument);
        } else if(txt.startsWith("__italic")) {
            var data = this.extractCommand(txt);
            this.walkingTextIndex+=data.length;
            var italic = parseInt(data.argument);
            if(italic)
                this.textImage.style.fontStyle='italic'
            else
                this.textImage.style.fontStyle='normal'
        } else if(txt.startsWith("__portrait")) {
            var data = this.extractCommand(txt);
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
            var data = this.extractCommand(txt);
            this.walkingTextIndex+=data.length;
            this.noShift = data.argument==="1" || data.argument.toLowerCase()==="true"
        } else if(txt.startsWith("__playSound")) {
            var data = this.extractCommand(txt);
            this.walkingTextIndex+=data.length;
            var data2 = data.argument.split(",");
            var snd = data2[0];
            var volume = parseFloat(data2[1]);
            var loop = data2[2]==="1" || data2[2].toLowerCase()==="true"
            $engine.audioPlaySound(snd,volume,loop);
        } else if(txt.startsWith("__stopSound")) {
            var data = this.extractCommand(txt);
            this.walkingTextIndex+=data.length;
            $engine.audioStopSound(data.argument);
        }
        else {
            return false;
        }
        return true; 
    }

    extractCommand(txt) {
        var start = txt.indexOf("[");
        var end = txt.indexOf("]");
        var sub = txt.substring(start+1,end);
        return {argument:sub, length:end+1};
    }

    clearText() {
        this.textImage.text = "";
        this.walkingTextIndex=0;
        this.firstCharacter=true;
    }

    isTransitioning() {
        return this.transition;
    }

    step() {
        if(IN.anyStandardInputPressed() && !IN.keyCheckPressed("Escape") && this.timer < this.frameLength[this.currentFrame]-this.transitionTime/4 && this.timer > this.transitionTime/4) {
            this.advance();
        }

        if(this.text[this.currentFrame].length!==0 && !this.isTransitioning() && this.textIndex===0) {
            this.advance()
        }

        // speedrun speedrun speedrun go go go go go
        if(IN.keyCheckPressed("Escape") && !this.wipeStarted && !(this.currentFrame===0 && this.wipeTimer<this.transitionTime)) {
            this.out = true;
            this.wipeTimer = 0;
            this.wipeStarted=true;
        }
        this.textBoxTick();
        if(this.timer>this.frameLength[this.currentFrame]) {
            if(this.currentFrame < this.frames-1) {
                this.currentFrame++;
                this.timer = 0;
                this.textIndex = 0;
                this.numTexts = this.text[this.currentFrame].length;
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
            } else if(this.frameLength[this.currentFrame]-this.timer <= this.transitionTime) {
                this.clearText();
                this.blurFilter.enabled = true;
                this.blurFilter.blur = EngineUtils.interpolate((this.frameLength[this.currentFrame]-this.timer)/this.transitionTime,this.blurFilterStrength,0,EngineUtils.INTERPOLATE_OUT);
                this.adjustmentFilter.brightness = EngineUtils.interpolate((this.frameLength[this.currentFrame]-this.timer)/this.transitionTime,this.adjustmentFilterStrength,1,EngineUtils.INTERPOLATE_OUT);
                this.timer++;
                this.transition=true;
                if(this.currentFrame >= this.frames-1 && !this.wipeStarted) {
                    this.wipeStarted=true;
                    this.wipeTimer = -1;
                    this.out = true;
                }
            } else {
                this.blurFilter.enabled = false;
                this.transition=false;
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

        $engine.requestRenderOnGUI(this.renderTextureSprite)
    }
}