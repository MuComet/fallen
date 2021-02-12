class IN {

    // keyboard
    static __heldKeys = [];
    static __releasedKeys = [];
    static __pressedKeys = [];
    
    // mouse
    static __heldButtons = [];
    static __releasedButtons = [];
    static __pressedButtons = [];

    // carry variables will hold all the data collected through the frame before being pushed to the normal variables.
    static __heldKeysCarry = [];
    static __releasedKeysCarry = [];
    static __pressedKeysCarry = [];


    static __heldButtonsCarry = [];
    static __releasedButtonsCarry = [];
    static __pressedButtonsCarry = [];

    static __mouseX = 0;
    static __mouseY = 0;

    static __wheel=0;
    static __wheelCarry = 0;

    static __anyKeyPressedCarry=false;
    static __lastKeyCarry="";

    static __anyKeyPressed = false;
    static __lastKey = "";

    static __mouseValid = false;

    static __debugRecordKeyPress = false;
    static __debugRecordMousePress = false;

    static __register() {
        // code by adeneo, https://stackoverflow.com/users/965051/adeneo
        // source: https://stackoverflow.com/a/17015116
        document.addEventListener('keydown', (e) => {
            if(!e.repeat && IN.__heldKeys.indexOf(e.code)===-1 && IN.__pressedKeysCarry.indexOf(e.code)===-1) {
                IN.__lastKeyCarry=e.code;
                IN.__anyKeyPressedCarry=true;
                IN.__pressedKeysCarry.push(e.code);
                if(IN.__debugRecordKeyPress) 
                    console.log(e.code);

                //DEBUG, REMOVE BEFORE RELEASE!
                if(e.ctrlKey && e.code==="Enter" && $__engineData.__ready) {
                    SceneManager.push(Scene_Engine)
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            IN.__releasedKeysCarry.push(e.code);
        });

        // for an unknown reason, PIXI.JS mouse down does not register. So we access the document directly.
        document.addEventListener('mousedown',IN.__onMouseEvent)
        document.addEventListener('pointerdown',IN.__onMouseEvent)
        document.addEventListener('touchstart',IN.__onMouseEvent)

        document.addEventListener('mouseup',IN.__onMouseEvent)
        document.addEventListener('pointerup',IN.__onMouseEvent)
        document.addEventListener('touchend',IN.__onMouseEvent)

        document.addEventListener('mousemove',IN.__mouseMoved)
        document.addEventListener('pointermove',IN.__mouseMoved)
        document.addEventListener('touchmove',IN.__mouseMoved)

        document.addEventListener('wheel',IN.__onMouseScrollEvent)
    }

    static __onMouseEvent(event) {
        IN.__validMouse=false; // for sanity reasons, all mouse events invalidate the mouse location and force a refresh.
        var type = event.type;
        if(type === "pointerdown" || type === "mousedown" || type === "touchstart") {
            if(IN.__heldButtons.indexOf(event.button)===-1 && IN.__pressedButtonsCarry.indexOf(event.button)===-1) {
                IN.__pressedButtonsCarry.push(event.button)
            }
        } else if(type === "pointerup" || type === "mouseup" || type === "touchend") {
            IN.__releasedButtonsCarry.push(event.button);
        }
        if(IN.__debugRecordKeyPress) 
            console.log(type + " :: " + event.button);
    }

    static __onMouseScrollEvent(event) {
        IN.__validMouse=false;
        IN.__wheelCarry += event.wheelDelta;
    }

    static __mouseMoved(event) {
        IN.__validMouse=false;
    }

    static __update() {
        IN.__releasedKeys = IN.__releasedKeysCarry;
        IN.__pressedKeys = IN.__pressedKeysCarry;
        for(const key of IN.__releasedKeys) {
            IN.__heldKeys.splice(IN.__heldKeys.indexOf(key),1);
        }

        for(const key of IN.__pressedKeys) {
            IN.__heldKeys.push(key);
        }

        IN.__releasedKeysCarry = [];
        IN.__pressedKeysCarry = [];

        // mouse

        IN.__releasedButtons = IN.__releasedButtonsCarry;
        IN.__pressedButtons = IN.__pressedButtonsCarry;
        for(const key in IN.__releasedButtons) {
            IN.__heldButtons.splice(IN.__heldButtons.indexOf(key),1);
        }

        for(const key of IN.__pressedButtons) {
            IN.__heldButtons.push(key);
        }

        IN.__releasedButtonsCarry = [];
        IN.__pressedButtonsCarry = [];

        IN.__wheel = IN.__wheelCarry;
        IN.__wheelCarry = 0;

        var mGUI = Graphics._renderer.plugins.interaction.mouse.getLocalPosition($engine)
        IN.__mouseXGUI = mGUI.x;
        IN.__mouseYGUI = mGUI.y;

        IN.__anyKeyPressed=IN.__anyKeyPressedCarry;
        IN.__anyKeyPressedCarry=false;

        IN.__lastKey=IN.__lastKeyCarry;
    }

    static __invalidateMouseLocation() {
        IN.__validMouse = false;
    }

    static __forceClear() { // forces IN to clear it's known keys. useful for when the game starts
        IN.__heldKeys = []
        IN.__releasedKeysCarry = [];
        IN.__pressedKeysCarry = [];

        IN.__heldButtons = [];
        IN.__releasedButtonsCarry = [];
        IN.__pressedButtonsCarry = [];
    }

    static debugDisplayKeyPress(b) {
        IN.__debugRecordKeyPress = b;
    }

    static debugDisplayMousePress(b) {
        IN.__debugRecordMousePress = b;
    }

    static keyCheck(code) {
        return IN.__heldKeys.indexOf(code)!==-1; // cast to bool
    }

    static keyCheckPressed(code) {
        return IN.__pressedKeys.indexOf(code)!==-1;
    }

    static keyCheckReleased(code) {
        return IN.__releasedKeys.indexOf(code)!==-1
    }

    static getLastKey() {
        return IN.__lastKey;
    }

    static mouseCheck(button) {
        return IN.__heldButtons.indexOf(button)!==-1; // cast to bool
    }

    static mouseCheckPressed(button) {
        return IN.__pressedButtons.indexOf(button)!==-1;
    }

    static mouseCheckReleased(button) {
        return IN.__releasedButtons.indexOf(button)!==-1;
    }

    static getMouseX() {
        IN.__requireMouseValid();
        return IN.__mouseX;
    }

    static getMouseY() {
        IN.__requireMouseValid();
        return IN.__mouseY;
    }

    static getMouseXGUI() {
        return IN.__mouseXGUI;
    }

    static getMouseYGUI() {
        return IN.__mouseYGUI;
    }

    static wheelDown() {
        return IN.__wheel<0;
    }

    static wheelUp() {
        return IN.__wheel>0;
    }

    static getWheel() {
        return IN.__wheel;
    }

    static mouseInBounds() {
        var mx = this.__mouseXGUI;
        var my = this.__mouseXGUI;
        return mx>=0 && mx<=816 && my>=0 && my<=624
    }

    static __requireMouseValid() {
        if(!IN.__validMouse) {
            var mouse = $engine.getCamera().__reportMouse();
            IN.__mouseX = mouse.x;
            IN.__mouseY =  mouse.y;
            IN.__validMouse=true;
        }
    }
}

IN.__register();