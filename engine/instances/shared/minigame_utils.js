class BufferedKeyInput extends EngineInstance {
    onEngineCreate() {}

    onCreate(keyToBuffer, bufferLength) {
        this.timer=bufferLength + 1;
        this.bufferLength = bufferLength;
        this.keyToBuffer = keyToBuffer;
        this.shouldConsume = false;
    }

    step() {
        this.timer++;
        if(this.shouldConsume) {
            this.timer = this.bufferLength+1;
            this.shouldConsume=false;
        }
        if(IN.keyCheckPressed(this.keyToBuffer)) {
            this.timer = 0;
        }
    }

    check() {
        return this.timer<=this.bufferLength;
    }

    consume() {
        var value = this.timer<=this.bufferLength
        this.shouldConsume = true;
        return value;
    }

    consumeImmedaitely() {
        var value = this.timer<=this.bufferLength
        this.timer = this.bufferLength+1;
        this.shouldConsume=false;
        return value;
    }


}
class BufferedMouseInput extends BufferedKeyInput {
    step() {
        this.timer++;
        if(IN.mouseCheckPressed(this.keyToBuffer)) {
            this.timer = 0;
        }
    }
}


BufferedKeyInput.__ENGINE_ORDER_FIRST = true;
BufferedMouseInput.__ENGINE_ORDER_FIRST = true;

class EngineButton extends EngineInstance {
    onEngineCreate() {
        this.drawOnGUI=false;
        this.usingTint = false;

        this.textureDefault = undefined;
        this.textureArmed = undefined;
        this.texturePressed = undefined;

        this.tintDefault = 0xffffff;
        this.tintArmed = 0xffffff;
        this.tintPressed = 0xffffff;
        this.locked = false;
        this.onClicked = undefined;
    }

    onCreate(x,y,drawOnGUI) {
        this.onEngineCreate();
        this.x = x;
        this.y = y;
        this.drawOnGUI = drawOnGUI;
    }

    setTexture(tex) {
        return this;
    }

    setArmedTexture(tex) {
        return this;
    }

    setPressedTexutre(tex) {

        return this;
    }

    useTint(tint) {
        this.usingTint=tint;
    }

    setDefaultTint(tint) {
        
    }

    lock() {
        this.locked = true;
    }

    unlock() {
        this.locked = false;
    }

    setOnClick() {

    }

    setDrawOnGui(draw) {
        this.drawOnGUI=draw;
    }
}