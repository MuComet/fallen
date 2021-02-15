class BufferedKeyInput extends EngineInstance {
    onEngineCreate() {}

    onCreate(keyToBuffer, bufferLength) {
        this.timer=bufferLength+1;
        this.bufferLength = bufferLength;
        this.keyToBuffer=keyToBuffer;
    }

    step() {
        this.timer++;
        if(IN.keyCheckPressed(this.keyToBuffer)) {
            this.timer = 0;
        }
    }

    check() {
        return this.timer<=this.bufferLength;
    }

    consume() {
        if(this.timer<=this.bufferLength) {
            this.timer = this.bufferLength+1;
            return true;
        }
        return false;
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