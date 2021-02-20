class IN {

    static __register() {
        // code by adeneo, https://stackoverflow.com/users/965051/adeneo
        // source: https://stackoverflow.com/a/17015116
        document.addEventListener('keydown', (e) => {
            if(e.__handled)
                return;
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
            e.__handled = true;
        });

        document.addEventListener('keyup', (e) => {
            // prevent weird double event register
            if(e.__handled)
                return;
            IN.__releasedKeysCarry.push(e.code);
            e.__handled = true;
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
        if(event.__handled)
            return;
        IN.__validMouse=false; // for sanity reasons, all mouse events invalidate the mouse location and force a refresh.
        var type = event.type;
        if(type === "pointerdown" || type === "mousedown" || type === "touchstart") {
            IN.__anyButtonPressedCarry=true;
            if(IN.__heldButtons.indexOf(event.button)===-1 && IN.__pressedButtonsCarry.indexOf(event.button)===-1) {
                IN.__pressedButtonsCarry.push(event.button)
            }
        } else if(type === "pointerup" || type === "mouseup" || type === "touchend") {
            IN.__releasedButtonsCarry.push(event.button);
        }
        if(IN.__debugRecordMousePress) 
            console.log(type + " :: " + event.button);
        event.__handled = true;
    }

    static __onMouseScrollEvent(event) {
        if(event.__handled)
            return;
        IN.__validMouse = false;
        IN.__wheelCarry += event.wheelDelta;
        event.__handled = true;
    }

    static __mouseMoved(event) {
        IN.__validMouse=false;
    }

    static __update() {
        IN.__releasedKeys = IN.__releasedKeysCarry;
        IN.__pressedKeys = IN.__pressedKeysCarry;
        for(const key of IN.__releasedKeys) {
            var ind = IN.__heldKeys.indexOf(key)
            if(ind===-1)
                continue;
            IN.__heldKeys.splice(ind,1);
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
        // when until the first mouse move, PIXI reports the mouse as -999999
        IN.__mouseXGUI = mGUI.x === -999999 ? 0 : mGUI.x;
        IN.__mouseYGUI = mGUI.y === -999999 ? 0 : mGUI.y;

        IN.__anyKeyPressed=IN.__anyKeyPressedCarry;
        IN.__anyKeyPressedCarry=false;

        IN.__anyButtonPressed=IN.__anyButtonPressedCarry;
        IN.__anyButtonPressedCarry=false;

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

        IN.__anyKeyPressedCarry=false;
        IN.__anyButtonPressedCarry=false;
        IN.__lastKeyCarry="";
        IN.__mouseValid=false;
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

    static anyKeyPressed() {
        return IN.__anyKeyPressed;
    }

    static anyButtonPressed() {
        return IN.__anyButtonPressed;
    }

    static anyInputPressed() {
        return IN.__anyKeyPressed || IN.__anyButtonPressed;
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
            IN.__mouseX = mouse.x === -999999 ? 0 : mouse.x;
            IN.__mouseY =  mouse.y === -999999 ? 0 : mouse.y;
            IN.__validMouse=true;
        }
    }
}

// keyboard
IN.__heldKeys = [];
IN.__releasedKeys = [];
IN.__pressedKeys = [];

// mouse
IN.__heldButtons = [];
IN.__releasedButtons = [];
IN.__pressedButtons = [];

// carry variables will hold all the data collected through the frame before being pushed to the normal variables.
IN.__heldKeysCarry = [];
IN.__releasedKeysCarry = [];
IN.__pressedKeysCarry = [];


IN.__heldButtonsCarry = [];
IN.__releasedButtonsCarry = [];
IN.__pressedButtonsCarry = [];

IN.__mouseX = 0;
IN.__mouseY = 0;

IN.__wheel=0;
IN.__wheelCarry = 0;

IN.__lastKeyCarry="";
IN.__lastKey = "";

IN.__anyKeyPressedCarry=false;
IN.__anyKeyPressed = false;

IN.__anyButtonPressedCarry=false;
IN.__anyButtonPressed = false;


IN.__mouseValid = false;

IN.__debugRecordKeyPress = false;
IN.__debugRecordMousePress = false;

IN.__register();