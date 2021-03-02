class OverworldTextController extends EngineInstance {
    onEngineCreate() {
        OverworldTextController.instance=this;

        this.textArray = [];
        this.mode = -1;
        this.timer = 0;
        this.fadeTimer = 0;
        this.fadeTime = 60;
        this.isActive = true;
        this.fadingIn = true;

        var style = $engine.getDefaultTextStyle()
        style.align = "left";
        style.wordWrap = true;
        style.wordWrapWidth = $engine.getWindowSizeX()-128;
        this.textGraphic = $engine.createRenderable(this,new PIXI.Text("",style));
        this.textGraphic.x = 128;
        this.textGraphic.y = $engine.getWindowSizeY()-128;

        this.text = "";
        this.walking = false;
        this.textLocation = 0;
        this.walkSpeed = 3;

        this.name = "";
        this.showingName = false;
    }

    setMode(mode) {
        this.mode = mode;
    }

    setTextArray(array) {
        this.textArray = array;
        var msg = array.join("\n");
        this.timer = 0;
        this.text = this.parseText(msg);
        this._setText(this.text);
    }

    _setText(text) {
        this.walking = true;
        this.textLocation = 0;
        this.walkSpeed=1;
        this.textGraphic.text = text;
    }

    parseText(text) {
        this.showingName=false;
        var obj = this._getContents(text,0,"\\n<",">");
        if(obj!==undefined) {
            this.showingName=true;
            this.name = obj.content;
            text = this._replaceSectionOfText(text,obj.startIdx,obj.endIdx,"");
        }

        var idx = 0;
        while((obj = this._getContents(text,idx,"\\V[","]"))!==undefined) {
            idx = obj.startIdx;
            var num = $gameVariables.value(Number(obj.content));
            text = this._replaceSectionOfText(text,obj.startIdx,obj.endIdx,String(num));
        }
        return text;
    }
    
    _getContents(string, startIndex, startString, endString) {
        var idx = string.indexOf(startString,startIndex);
        if(idx===-1)
            return undefined;
        var idx2 = string.indexOf(endString,idx);
        var obj = {}
        obj.content = string.substring(idx+startString.length,idx2);
        obj.startIdx = idx;
        obj.endIdx = idx2;
        return obj;
    }

    _replaceSectionOfText(text, start, end, replace) { // both exclusive
        return text.substring(0,start) + replace + text.substring(end+1,text.length);
    }

    step() {
        if(!this.isActive) {
            this.transition();
            return;
        }
        switch(this.mode) {
            case(OverworldTextController.MODE_TEXT):
                this.displayText();
            break;
        }
    }

    transition() {
        if(this.fadingIn) {

        } else {

        }
        this.fadeTimer++;
    }

    displayText() {
        var anyPressed = IN.anyInputPressed();
        if(this.walking) {
            this.textLocation++;
            if(this.textLocation>this.text.length) {
                this.walking=false;
                this.textLocation = this.text.length
            }
            if(anyPressed) {
                this.textLocation=this.text.length;
            }
            this.textGraphic.text = this.text.substring(0,this.textLocation)
        } else {
            if(anyPressed) {
                $engine.advanceGameInterpreter();
            }
        }
    }
}
/** @type {OverworldTextController} */
OverworldTextController.instance = undefined;
OverworldTextController.MODE_TEXT = 0;