/** @type {Scene_Engine} */
var $engine;

/** @type {Object} */
var $__engineData = {}
$__engineData.__textureCache = {};
$__engineData.__spritesheets = {};
$__engineData.__haltAndReturn = false;
$__engineData.__ready = false;
$__engineData.__outcomeWriteBackValue = -1
$__engineData.outcomeWriteBackIndex = -1;
$__engineData.__cheatWriteBackValue = -1
$__engineData.cheatWriteBackIndex = -1;
$__engineData.autoSetWriteBackIndex = -1;
$__engineData.loadRoom = "MenuIntro";


// reserve data slots 100 to 200 for engine use.
$__engineData.__maxRPGVariables = 100;
$__engineData.__RPGVariableStart = 101;

$__engineData.__debugRequireTextures = false;
$__engineData.__debugPreventReturn = false;
$__engineData.__debugLogFrameTime = false;
$__engineData.__debugRequireAllTextures = false;

const ENGINE_RETURN = {};
ENGINE_RETURN.LOSS = 0;
ENGINE_RETURN.WIN = 1;
ENGINE_RETURN.NO_CHEAT = 0;
ENGINE_RETURN.CHEAT = 1;

const SET_ENGINE_ROOM = function(room) {
    $__engineData.loadRoom = room;
}

const SET_ENGINE_RETURN = function(indexOutcome, indexCheat, indexWriteAutoSet = -1) {
    $__engineData.outcomeWriteBackIndex = indexOutcome;
    $__engineData.cheatWriteBackIndex = indexCheat;
    $__engineData.autoSetWriteBackIndex = indexWriteAutoSet;
}

const ENGINE_START = function() {
    SceneManager.push(Scene_Engine);
}

//PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST; // set PIXI to render as nearest neighbour

/*DEBUG CODE MANIFEST (REMOVE ALL BEFORE LAUNCH):
IN: keydown listener will put you into engine on "ctrl + enter" press
IN: log key press code
Scene_Engine - debug_log_frame_time (create, doSimTick)
*/

class Scene_Engine extends Scene_Base {

    create() {
        super.create();
        this.__initEngine();
    }

    __initEngine() {
        $engine = this;
        this.__gamePaused = false;
        this.__filters = [];
        this.filters = []; // PIXI
        this.__enabledCameras = [true,false];
        this.__cameras=[new Camera(0,0,Graphics.boxWidth,Graphics.boxHeight,0)];
        this.__GUIgraphics = new PIXI.Graphics();
        this.__shouldChangeRooms=false;
        this.__nextRoom="";
        this.__currentRoom = undefined;
        this.__globalTimer = 0;
        this.__gameTimer = 0;
        this.__instanceCreationSpecial = {}; // it doesn't matter what this is so long as it's an object.

        this.__RPGVariableTags = [];

        this.__background = undefined;
        this.__backgroundColour = 0;
        this.__usingSolidColourBackground = true;
        this.__autoDestroyBackground = false;
        this.__backgroundContainer = new PIXI.Container();
        this.setBackground(new PIXI.Graphics(), true)

        this.addChild(this.__backgroundContainer);
        this.addChild(this.__cameras[0]);
        this.addChild(this.__GUIgraphics)
        IM.__initializeVariables();
    }

    start() {
        super.start();
        this.__saveAudio();
        this.__startEngine();
    }

    __saveAudio() {
        this.prevBgm = AudioManager.saveBgm();
        this.prevBgs = AudioManager.saveBgs();
        AudioManager.fadeOutBgm(1);
    }

    __startEngine() {
        this.__setRoom($__engineData.loadRoom);
        IN.__forceClear();
    }

    update() {
        // RPG MAKER
        super.update();
        if($__engineData.__haltAndReturn && !this.isBusy())
            this.__endAndReturn()

        // ENGINE
        if(this.__shouldChangeRooms)
            this.__setRoom(this.__nextRoom);

        IN.__update();
        this.__doSimTick();
        
        if(!this.__gamePaused)
            this.__gameTimer++;
        this.__globalTimer++;
    }

    /**
     * Creates and returns an AudioReference for use in AudioManager.
     * @param {String} audioName the name of the file, excluding the extension.
     */
    generateAudioReference(audioName) {
        var ref = {
            name: audioName,
            pan: 0,
            pitch: 100,
            volume: 100,
            pos: 0,
        }
        return ref;
    }

    setRoom(newRoom) {
        if(!RoomManager.roomExists(newRoom))
            throw new Error("Attemping to change to non existent room "+newRoom);
        if(this.shouldChangeRooms)
            return;
        this.__shouldChangeRooms=true;
        this.__nextRoom = newRoom;
    }

    __setRoom(roomName) {
        IM.__endRoom();
        for(var i = this.__filters.length-1;i>=0;i--) {
            if(this.__filters[i].remove) {
                this.removeFilter(this.__filters[i].filter);
            }
        }
        this.__currentRoom = RoomManager.loadRoom(roomName);
        IM.__startRoom();
        this.__shouldChangeRooms=false;
    }

    /** @returns {Camera} The camera */
    getCamera() {
        return this.__cameras[0];
    }

    getRenderer() { // for low level PIXI operations
        return Graphics._renderer;
    }

    endGame() {
        $__engineData.__haltAndReturn=true;
    }

    setOutcomeWriteBackValue(value) {
        $__engineData.__outcomeWriteBackValue=value;
    }

    setCheatWriteBackValue(value) {
        $__engineData.__cheatWriteBackValue=value;
    }

    pauseGame() {
        this.__gamePaused = true;
    }

    unpauseGame() {
        this.__gamePaused = false;
    }

    isGamePaused() {
        return this.__gamePaused;
    }


    __endAndReturn() {
        // for testing minigames.
        if($__engineData.__debugPreventReturn) {
            this.__cleanup();
            this.removeChildren();
            this.__initEngine();
            this.__startEngine();
            $__engineData.__haltAndReturn=false;
            return;
        }
        $__engineData.__haltAndReturn=false;
        SceneManager.pop();
    }

    // called exclusively by terminate, which is called from RPG maker.
    __cleanup() {
        IM.__endGame() // frees all renderables associated with instances
        for(const camera of this.__cameras) {
            this.freeRenderable(camera);
            this.freeRenderable(camera.getCameraGraphics());
        }
        if(this.__autoDestroyBackground) {
            for(const child of this.__backgroundContainer.children)
                this.freeRenderable(child);
        }
        this.__GUIgraphics.removeChildren(); // prevent bug if you rendered to the GUI
        this.getCamera().getCameraGraphics().removeChildren(); // prevent bug if you rendered to the Camera
        this.freeRenderable(this.__GUIgraphics)
        this.freeRenderable(this.__backgroundContainer);
    }

    __writeBack() {
        if($__engineData.outcomeWriteBackIndex!==-1) {
            if($__engineData.__outcomeWriteBackValue<0)
                throw new Error("Engine expects a non negative outcome write back value");
            $gameVariables.setValue($__engineData.outcomeWriteBackIndex,$__engineData.__outcomeWriteBackValue);
            $__engineData.outcomeWriteBackIndex=-1; // reset for next time
            $__engineData.__outcomeWriteBackValue=-1;
        }
        if($__engineData.cheatWriteBackIndex!==-1) { 
            if($__engineData.cheatWriteBackIndex<0)
                throw new Error("Engine expects a non negative cheat write back value");
            $gameVariables.setValue($__engineData.cheatWriteBackIndex,$__engineData.__cheatWriteBackValue);
            $__engineData.cheatWriteBackIndex=-1;
            $__engineData.__cheatWriteBackValue=-1;
        }
        // this is a special write back that the engine will always write 1 back to. This is useful
        // to indicate whether or not the engine ran
        if($__engineData.autoSetWriteBackIndex!==-1) { 
            $gameVariables.setValue($__engineData.autoSetWriteBackIndex,1);
            $__engineData.autoSetWriteBackIndex=-1;
        }
    }

    getRPGVariable(index, tag=null) {
        this.__ensureTag(index,tag);
        return $gameVariables.value(this.__correctRange(index));
    }

    setRPGVariable(index, value, tag=null) {
        this.__ensureTag(index,tag);
        $gameVariables.setValue(this.__correctRange(index),value);
    }

    __ensureTag(index, tag) {
        if(tag===null) {
            throw new Error("Must supply tag.");
        }
        var val = this.__RPGVariableTags[index]

        if(val===undefined) { // take ownership of this tag.
            this.__RPGVariableTags[index] = tag;
            return true;
        }
        
        if(val!==tag) {
            throw new Error("Error: Tag mismatch when attemting to access RPG variable at "+String(this.__correctRange(index)) 
                            + "(source: "+String(val)+", provided: "+String(tag)+")");
        }
    }

    resetAllRPGVariables() {
        for(var i = $__engineData.__RPGVariableStart;i<$__engineData.__RPGVariableStart+$__engineData.__maxRPGVariables;i++)
            $gameVariables.setValue(i,-1);
    }

    __correctRange(index) {
        if(index<0 || index > $__engineData.__maxRPGVariables)
            throw new Error("Access to variable at "+index+" is not in engine range of [0 - "+String($__engineData.__maxRPGVariables-1)+"].");
        return index + $__engineData.__RPGVariableStart;
    }

    terminate() {
        super.terminate()
        this.__cleanup();
        this.__writeBack();
        this.__resumeAudio();
    }

    __resumeAudio() {
        if (this.prevBgm !== null) {
            AudioManager.replayBgm(this.prevBgm);
        }
        if (this.prevBgs !== null) {
            AudioManager.replayBgs(this.prevBgs);
        }
    }


    __doSimTick() {
        var start = window.performance.now();

        this.__clearGraphics();
        IM.__doSimTick();
        this.__updateBackground();
        this.__prepareRenderToCameras();

        var time = window.performance.now()-start;
        if($__engineData.__debugLogFrameTime)
            console.log("Time taken for this frame: "+(time)+" ms")
    }

    /**
     * Adds a filter to the game which applies in screen space
     * @param {PIXI.filter} screenFilter The filter to add
     * @param {Boolean | true} [removeOnRoomChange=true] Whether or not to automatically remove this filter when the engine changes rooms
     * @param {String} name A unique identifier for this filter, which may be used later to find it.
     */
    addFilter(screenFilter, removeOnRoomChange = true, name = "ENGINE_DEFAULT_FILTER_NAME") {
        this.__filters.push({filter:screenFilter,remove:removeOnRoomChange,filterName: name});
        var filters = this.filters // PIXI requires reassignment
        filters.push(screenFilter);
        this.filters = filters;
    }

    /**
     * Removes the specified filter from the screen.
     * @param {PIXI.filter | String} filter The filter or string id of filter to remove
     */
    removeFilter(filter) {
        var index = -1;
        for(var i = 0;i<this.__filters.length;i++) {
            if(filter===this.__filters[i].filter || filter === this.__filters[i].filterName) {
                index = i;
                break;
            }
        }
        if(index===-1) {
            console.error("Cannot find filter "+filter);
            return;
        }
        var filterObj = this.__filters[i]

        var filters = this.filters; // PIXI requirments.
        filters.splice(this.filters.indexOf(filterObj.filter),1);
        this.filters = filters;

        this.__filters.splice(index,1);
    }

    /**
     * Finds and returns the texture with the specified name from the texture cache. To access individual frames of a spritesheet directly
     * use the name in textures manifest followed by _n where n is the 0 based index of the frame you want.
     * @param {String} name The name of the texture as defined in textures_manifest.txt
     */
    getTexture(name) {
        var tex = $__engineData.__textureCache[name];
        if(!tex) {
            var str = "Unable to find texture for name: "+String(name)+". Did you remember to include the texture in the manifest?"
            if($__engineData.__debugRequireTextures)
                throw new Error(str);
            console.error(str)
        }
        return tex;
    }

    /**
     * Returns a random texture from a spritesheet that was loaded using the spritesheet command
     * in textures_manifest
     * @param {String} name The name of the spritesheet
     */
    getRandomTextureFromSpritesheet(name) {
        var sheetData = $__engineData.__spritesheets[name];
        if(!sheetData) {
            var str = "Unable to find spritesheet for name: "+String(name)+". Was this texture initalized as a spritesheet?"
            if($__engineData.__debugRequireTextures)
                throw new Error(str);
            console.error(str)
            return undefined;
        }
        var idx = EngineUtils.irandomRange(0,sheetData-1);
        return this.getTexture(name+"_"+String(idx));
    }

    /**
     * Returns the number of textures stored in this spritesheet. For this function to work, 'name' must refer
     * to a texture loaded using the spritesheet command in textures_manifest
     * 
     * @param {String} name The name of the spritesheet
     */
    getSpriteSheetLength(name) {
        var sheetData = $__engineData.__spritesheets[name];
        if(!sheetData) {
            var str = "Unable to find texture for name: "+String(name)+". Did you remember to include the texture in the manifest?"
            if($__engineData.__debugRequireTextures)
                throw new Error(str);
            console.error(str)
            return -1;
        }
        return sheetData;
    }

    /**
     * Returns an array of textures from a spritesheet. For this function to work, you must
     * load the texture using the spritesheet command in textures_manifest.
     * @param {String} name The name of the spritesheet
     * @param {Number} startIdx The first index, inclusive
     * @param {Number} endIdx The last index, exclusive
     */
    getTexturesFromSpritesheet(name, startIdx, endIdx) {
        var textures = [];
        for(var i =startIdx;i<endIdx;i++) {
            textures.push(this.getTexture(name+"_"+String(i)));
        }
        return textures;
    }

    /**
     * @returns {Number} The amount of frames the engine has been running, excluding time paused.
     */
    getGameTimer() {
        return this.__gameTimer;
    }

    /**
     * @returns {Number} The amount of frames the engine has been running, including time paused.
     */
    getGlobalTimer() {
        return this.__globalTimer;
    }

    getWindowSizeX() {
        return Graphics.boxWidth
    }

    getWindowSizeY() {
        return Graphics.boxHeight
    }

    isFading() {
        return this._fadeDuration > 0;
    }

    /**
     * Creates and returns a new Object which may be passed in to a PIXI.Text as the style.
     * 
     * @returns {Object} Default text settings
     */
    getDefaultSubTextStyle() {
        return { fontFamily: 'GameFont', fontSize: 20, fontVariant: 'bold italic', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 };
    }

    setCameraEnabled(index, enable) {
        this.__enabledCameras[index] = enable;
    }

    /**
     * Attaches a renderable to an instance and automatically renders it every frame. When the instance is destroyed, the engine will
     * also destroy the renderable along with it.
     * 
     * This function also applies the default anchor of the texture as defined in the manifest.
     * 
     * The major difference between this and createRenderable is that createRenderable will also cause the engine to automatically render it, while
     * this function will only tell the engine to keep track of it for you.
     * @param {EngineInstance} parent The parent to attach the renderable to
     * @param {PIXI.DisplayObject} renderable The renderable to auto dispose of
     * @param {Boolean | false} [align=false] Whether or not to automatically move the renderable to match the parent instance's x, y, scale, and rotation (default false)
     */
    createRenderable(parent, renderable, align = false) {
        renderable.__depth = parent.depth
        renderable.__parent = parent;
        renderable.__align = align;
        renderable.dx=0;
        renderable.dy=0;
        this.applyRenderableSettings(renderable);
        parent.__renderables.push(renderable);
        return renderable;
    }

    /**
     * Applies settings to a renderable object if available. Some texture settings may be defined in the manifest such as the anchor of the sprite.
     * @param {PIXI.DisplayObject} renderable The renderable
     * @returns {PIXI.DisplayObject} The input, useful for chaining.
     */
    applyRenderableSettings(renderable) {
        if(renderable.texture && renderable.texture.defaultAnchor)
            renderable.anchor.set(renderable.texture.defaultAnchor.x,renderable.texture.defaultAnchor.y)
        return renderable;
    }

    /**
     * Attaches the lifetime of the specified renderable to the instance in question. When the instance is destroyed, the engine will
     * also destroy the renderable along with it.
     * 
     * This function does NOT apply the default origin of the texture as defined in the textures manifest. For that you should call applyRenderableSettings()
     * 
     * The major difference between this and createRenderable is that createRenderable will also cause the engine to automatically render it, while
     * this function will only tell the engine to keep track of it for you.
     * @param {EngineInstance} parent The parent to attach the renderable to
     * @param {PIXI.DisplayObject} renderable The renderable to auto dispose of
     */
    createManagedRenderable(parent, renderable) {
        parent.__pixiDestructables.push(renderable);
    }

    
    /**
     * Frees the resources associated with the specified renderable. If you registered the renderble using createRenderable
     * or createManagedRenderable this will be called automicatcally by the engine when the parent instance is destroyed
     * 
     * Use this method only if you want to destroy a renderable that was not registered with the engine.
     * @param {PIXI.DisplayObject} renderable The renderable to destroy
     */
    freeRenderable(renderable) {
        if(!renderable._destroyed)
            renderable.destroy();
    }

    /**
     * Removes a renderable that was previsouly created with createRenderable() from it's parent and then destroys it.
     * @param {PIXI.DisplayObject} renderable The renderable to remove
     */
    removeRenderable(renderable) {
        renderable.__parent.__renderables.splice(renderable.__parent.__renderables.indexOf(renderable),1); // remove from parent
        renderable.__parent=null; // leave it to be cleaned up eventually
        this.freeRenderable(renderable)
    }

    /** 
     * Requests that on this frame, the renderable be rendered to the GUI layer.
     * 
     * Renderables added to the GUI will render in the order they are added. As such, it recommended
     * to only call this in draw since it is sorted.
     * @param {PIXI.Container} renderable 
     */
    requestRenderOnGUI(renderable) {
        this.__GUIgraphics.addChild(renderable);
    }

    /** 
     * Requests that on this frame, the renderable be rendered to the Camera layer.
     * 
     * This is useful because if the camera has a special renderer like a 2d projection renderer on it,
     * you may still render in camera space as usual using this method.
     * 
     * Renderables added to the GUI will render in the order they are added. As such, it recommended
     * to only call this in draw since it is sorted.
     * @param {PIXI.Container} renderable 
     */
    requestRenderOnCamera(renderable) {
        this.getCamera().getCameraGraphics().addChild(renderable);
    }
    

    //TODO: leave as deprecated until it's done
    /**@deprecated */
    addGlobalObject(obj, name) { // TODO: global objects should run step and draw events...
        this.__globalObjects[name] = (obj);
    }

    /**@deprecated */
    getGlobalObject(name) {
        return this.__globalObjects[name];
    }

    /**@deprecated */
    removeGlobalObject(name) {
        delete this.__globalObjects[name]
    }

    getBackground() {
        return this.__background;
    }

    setBackground(background, autoDestroy) { // expects any PIXI renderable. renders first.
        if(this.__autoDestroyBackground) {
            for(const child of this.__backgroundContainer.children)
                this.freeRenderable(child);
        }
        this.__usingSolidColourBackground = false;
        this.__background = background;
        this.__backgroundContainer.removeChildren();
        this.__backgroundContainer.addChild(background)
        this.__autoDestroyBackground = autoDestroy;
    }
    
    setBackgroundColour(col) {
        if(!(this.__background instanceof PIXI.Graphics)) {
            throw new Error("Cannot set background colour of non graphics background. current type = " +  typeof(this.__background));
            //this.setBackgroud(new PIXI.Graphics());
        }
        this.__backgroundColour = col;
        this.__usingSolidColourBackground = true;
    }

    getBackgroundColour() {
        if(!this.__usingSolidColourBackground)
            throw new Error("Background is not a colour");
        return this.__backgroundColour;
    }

    __updateBackground() {
        if(!this.__usingSolidColourBackground)
            return;
        this.__background.clear();
        this.__background.beginFill(this.__backgroundColour);
        this.__background.drawRect(-128,-128,this.getWindowSizeX()+128,this.getWindowSizeY()+128)
        this.__background.endFill()
    }

    __prepareRenderToCameras() {
        for(var i =0;i<1;i++) { // this is probably ultra slow
            if(!this.__enabledCameras[i])
                continue;
            var camera = this.__cameras[i];
            camera.removeChildren();

            var container = camera.__getRenderContainer()
            var arr = this.__collectAllRenderables();
            if(arr.length!==0) // prevent null call
                container.addChild(...arr)

            camera.addChild(container);
            camera.addChild(camera.getCameraGraphics());
        }
    }

    __collectAllRenderables() {
        var array = [];
        for(const inst of IM.__objectsSorted) {
            // https://stackoverflow.com/questions/1374126/how-to-extend-an-existing-javascript-array-with-another-array-without-creating
            array.push(...inst.__renderables);
        }
        return array;
    }

    __clearGraphics() {
        this.__GUIgraphics.clear();
        this.__GUIgraphics.removeChildren();

        this.getCamera().getCameraGraphics().clear();
        this.getCamera().getCameraGraphics().removeChildren();
    }

    __disposeHandles(instance) { //TODO: disposes of any resources associated with the object. This should remove any objects (renderables) associated with the instance.
        for(const renderable of instance.__renderables) {
            this.freeRenderable(renderable)
        }
        for(const renderable of instance.__pixiDestructables) {
            this.freeRenderable(renderable)
        }
    }
}

$engine = new Scene_Engine(); // create the engine at least once so that we have access to all engine functions.

////////////////////////////////single time setup of engine///////////////////////

IN.__register();
// calling of this is defered until window.onLoad() is called in main.js
// this is so that the engine won't delay the starting of RPG maker while it loads.
__initalize = function() {
    var obj = {
        count : 0,
        scripts : 0,
        textures : 0,
        rooms : 0,
        instances : 0,
        elements : 0,
        time : window.performance.now(),
        total : 0,
        valid : false, // don't let the engine falsely think it's ready
        onNextLoaded : function() {
            this.count++;
            this.testComplete();
        },
        testComplete : function() {
            if(this.count===this.total && this.valid && this.elements===4) // all loaded
                this.onComplete();
        },
        onComplete : function() {
            __initalizeDone(this)
        },
        validate : function() {
            this.valid=true;
            if(this.count===this.total && this.elements===4) // already loaded everything, proceed. 4 = (scripts, rooms, textures, instances)
                this.onComplete();
        }
    }
    __prepareScripts("engine/scripts_manifest.txt",obj);
    __inst = __readInstances("engine/instances_manifest.txt",obj);
    __readTextures("engine/textures_manifest.txt",obj);
    __readRooms("engine/rooms_manifest.txt",obj);
    obj.validate()
}

__initalizeDone = function(obj) {
    IM.__init(this.__inst);
    RoomManager.__init();
    var msg = "("+String(obj.scripts)+(obj.scripts!==1 ? " scripts, " : " script, ")+String(obj.textures)+(obj.textures!==1 ? " textures, " : " texture, ") +
                String(obj.rooms)+(obj.rooms!==1 ? " rooms, " : " room, ")+String(obj.instances)+(obj.instances!==1 ? " instances) ->" : " instance) ->")
    console.log("Loaded all the files we need!",msg, window.performance.now() - obj.time," ms")
    $__engineData.__ready=true;
}

__prepareScripts = function(script_file,obj) {
    // code by Matt Ball, https://stackoverflow.com/users/139010/matt-ball
    // Source: https://stackoverflow.com/a/4634669
    const callback = function(fileData) {
        var data = EngineUtils.strToArrNewline(fileData);
        for (const x of data) {
            obj.total++;
            obj.scripts++;
            EngineUtils.attachScript(x,obj.onNextLoaded)
        }
        obj.elements++;
        obj.testComplete(); // update the obj
    }
    EngineUtils.readLocalFileAsync(script_file,callback);
}

__readRooms = function(room_file,obj) {
    const callback = function(fileData) {
        var data = EngineUtils.strToArrNewline(fileData);
        for(const x of data) {
            const arr = EngineUtils.strToArrWhitespace(x); // 0 = name, 1 = file
            const name = arr[0];
            obj.rooms++;
            obj.total++;
            const callback_room = function(text) {
                const roomData = EngineUtils.strToArrNewline(text);
                RoomManager.__addRoom(name, Room.__roomFromData(name,roomData));
                obj.onNextLoaded();
            }
            EngineUtils.readLocalFileAsync(arr[1],callback_room)
        }
        obj.elements++;
        obj.testComplete(); // update the obj
    }
    EngineUtils.readLocalFileAsync(room_file,callback);
}

__readInstances = function(instance_file,obj) {
    var inst = [];
    var callback = function(fileData) {
        const data = EngineUtils.strToArrNewline(fileData);
    
        for (const x of data) {
            const arr = EngineUtils.strToArrWhitespace(x);
            const scripts = arr.length-1;
            obj.total+=arr.length;
            obj.scripts++;
            obj.instances+=scripts;
            obj.onNextLoaded(); // count the script
            var c = function() {
                for(let i = 0;i<scripts;i++) {
                    inst.push(eval(arr[i]));
                    obj.onNextLoaded();
                }
            }
            EngineUtils.attachScript(arr[scripts],c);
        }

        obj.elements++;
        obj.testComplete(); // update the obj
    }
    EngineUtils.readLocalFileAsync(instance_file,callback);
    return inst;
}

__readTextures = function(texture_file,obj) { // already sync
    const callback = function(fileData) {
        var data = EngineUtils.strToArrNewline(fileData);
        var texData = [];
        // parse raw data into objects
        for (const d of data) {
            const arr = EngineUtils.strToArrWhitespace(d);

            const type = arr[0];
            let len = arr.length;
            let name = undefined;
            let path = undefined;
            let dx = undefined;
            let dy = undefined;
            if(type.toLowerCase()==="animate") {
                name = arr[len-1];
            } else {
                name = arr[len-4];
                path = arr[len-3]
                dx = parseFloat(arr[len-2])
                dy = parseFloat(arr[len-1])
                arr.length = arr.length - 4 // remove the last 4 elements from the array
            }

            var texObj = {
                texArgs: arr,
                texName: name,
                texPath: path,
                texOrigX: dx,
                texOrigY: dy
            }

            texData.push(texObj);
        }

        // parse the textObjs
        var required = [];
        var other = [];
        for(const texObj of texData) {
            __parseTextureObject(texObj)
            if(__queryTextureObject(texObj,"require") || $__engineData.__debugRequireAllTextures)
                required.push(texObj);
            else
                other.push(texObj);
        }
        for(const texObj of required) {
            __loadTexture(obj, texObj, () => {
                obj.onNextLoaded();
            });
        }
        for(const texObj of other) {
            __loadTexture(obj, texObj, () => {});
            obj.total--; // don't count the texture...
        }

        obj.elements++;
        obj.testComplete(); // update the obj
    }
    EngineUtils.readLocalFileAsync(texture_file,callback);
}

__setAnchor = function(tex, x,y) {
    if(x===-1)
        x = 0.5;
    if(y===-1)
        y=0.5;
    if(x>1)
        x = x/tex.width;
    if(y>1)
        y = y/tex.height;
    tex.defaultAnchor = new PIXI.Point(x,y);
}

__loadTexture = function(obj, texObj, update) {
    var spritesheet = __queryTextureObject(texObj,"spritesheet");
    var animate = __queryTextureObject(texObj,"animate");
    if(spritesheet) {
        obj.textures++;
        obj.total++;
        const tex = PIXI.Texture.from(texObj.texPath);
        tex.on('update',() => {
            __generateTexturesFromSheet(tex, texObj, spritesheet);
            update();
        });

    } else if(animate) {
        var frames = [];
        for(const tex of animate.textures) {
            var frameTexture = $__engineData.__textureCache[tex]
            if(!frameTexture)
                throw new Error("Texture "+tex+" cannot be found! make sure the texture is referenced before the animation")
            frames.push(frameTexture);
        }

        const anim = new PIXI.AnimatedSprite(frames); // loaded immediately.
        $__engineData.__textureCache[texObj.texName]=anim;

    } else {
        obj.textures++;
        obj.total++;
        const tex = PIXI.Texture.from(texObj.texPath);
        tex.on('update',() =>{
            __setAnchor(tex,texObj.texOrigX,texObj.texOrigY)
            update();
        });
        $__engineData.__textureCache[texObj.texName]=tex;
    }
    
}

__generateTexturesFromSheet = function(texture, texObj, spritesheet) { // replaces PIXI's internal spritesheet generator, which does more or less the same thing
    // note: texture is guaranteed to have been loaded when this is called.
    var cols = spritesheet.numColumns;
    var rows = spritesheet.numRows;
    var dx = spritesheet.xSize/spritesheet.numColumns; // normalized
    var dy = spritesheet.ySize/spritesheet.numRows;
    var baseName = texObj.texName + "_";
    var idx = 0;
    for(var y = 0;y<rows;y++) {
        for(var x = 0;x<cols;x++) {
            if(spritesheet.frameLimit[y]!==undefined && x >= spritesheet.frameLimit[y]) {
                break;
            }
            let rect = new PIXI.Rectangle(dx*x,dy*y,dx,dy);
            let tex = new PIXI.Texture(texture,rect);
            __setAnchor(tex,texObj.texOrigX,texObj.texOrigY)
            $__engineData.__textureCache[baseName+String(idx++)]=tex;
            
        }
    }
    $__engineData.__spritesheets[texObj.texName] = idx; // store the amount fo frames on a spritesheet
}

__parseTextureObject = function(texObj) {
    var argsParsed = [];
    var args = texObj.texArgs;
    for(var i = 0;i<args.length;i++) {
        var arg = args[i].toLowerCase();
        if(arg==="require") {
            argsParsed.push({key:"require",value:true});
        } else if(arg==="animate") {
            i=__parseAnimation(argsParsed, args, i);
        } else if(arg==="spritesheet") {
            i=__parseSpritesheet(argsParsed,args,i)
        }
    }
    texObj.texArgs = argsParsed;

}

__parseAnimation = function(argsParsed, args, i) {
    var texNames = [];
    i++;
    for(;i<args.length;i++) {
        texNames.push(args[i]);
    }
    argsParsed.push({
        key:"animate",
        value:{
            textures:texNames,
        }
    });
    return i;
}

__parseSpritesheet = function(argsParsed, args, i) {
    var dimensionX = -1;
    var dimensionY = -1;
    var columns = -1;
    var rows = -1;
    var limit = [];
    var animations = [];
    i++;
    for(;i<args.length;i++) {
        var arg = args[i].toLowerCase();
        if(arg==="dimensions") {
            dimensionX = parseInt(args[++i]);
            dimensionY = parseInt(args[++i]);
            columns = parseInt(args[++i]);
            rows = parseInt(args[++i]);
        } else if(arg==="limit") {
            if(rows===-1) throw new Error("Cannot limit before supplying dimensions");
            for(var k =0;k<rows;k++) {
                limit.push(parseInt(args[++i]));
            }
        } else if(arg==="animate") {
            var numAnimations = parseInt(args[++i]);
            for(var k =0;k<numAnimations;k++) {
                const animationName = args[++i];
                const animationLength = parseInt(args[++i]);
                const animationFrames = [];
                for(var j =0;j<animationLength;j++) {
                    animationFrames.push(parseInt(args[++i]));
                }
                animations.push({
                    animName: animationName,
                    animFrames: animationFrames,
                });
            }
        }
    }
    argsParsed.push( {
        key:"spritesheet",
        value: {
            xSize: dimensionX,
            ySize: dimensionY,
            numColumns: columns,
            numRows: rows,
            frameLimit: limit,
            anims: animations,
        }

    })
    return i;
}

__queryTextureObject = function(texObj, key) {
    for(var i =0;i<texObj.texArgs.length;i++) {
        if(texObj.texArgs[i].key===key)
            return texObj.texArgs[i].value;
    }
    return undefined;
}

////////////////// begin overriding RPG maker /////////////////
Scene_Boot.prototype.start = function() { // hijack the boot routine
    Scene_Base.prototype.start.call(this);
    SoundManager.preloadImportantSounds();
    if (DataManager.isBattleTest()) {
        DataManager.setupBattleTest();
        SceneManager.goto(Scene_Battle);
    } else if (DataManager.isEventTest()) {
        DataManager.setupEventTest();
        SceneManager.goto(Scene_Map);
    } else {
        this.checkPlayerLocation();
        DataManager.setupNewGame();
        SceneManager.goto(Scene_Engine);
        Window_TitleCommand.initCommandPosition();
    }
    this.updateDocumentTitle();
};

Scene_Boot.prototype.isReady = function() {
    if (Scene_Base.prototype.isReady.call(this)) {
        return DataManager.isDatabaseLoaded() && this.isGameFontLoaded() && $__engineData.__ready;
    } else {
        return false;
    }
};

// you get one.
DataManager.maxSavefiles = function() {
    return 1;
};

// take over menu
Scene_GameEnd.prototype.commandToTitle = function() {
    this.fadeOutAll();
    $__engineData.loadRoom = "MenuIntro";
    SceneManager.goto(Scene_Engine);
};


// 10 frames is 10 frames too many.
Window_Message.prototype.startPause = function() {
    this.startWait(0); // this.startWait(10);
    this.pause = true;
};

// hook a in a global update.
SceneManager.updateManagers = function() {
    ImageManager.update();
    OwO.tick();
}

// Unwrap Utilities
// A utility class that provides access to and hooks into low level RPG maker functions.
// it "unwraps" RPG maker's internals. (also I wanted an excuse to have UwU after I made OwO i'm sorry.)
class UwU {
    constructor() {
        throw new Error("Unwrap Utilities cannot be instantiated")
    }

    static onSceneStart(previousClass, scene) {
        UwU.__lastMapId=UwU.__currentMapId;
        UwU.__currentMapId = $gameMap.mapId();
        UwU.__notifyListenersOfSceneChange(previousClass, scene);
    }

    static mapIdChanged() {
        return UwU.__lastMapId !== UwU.__currentMapId;
    }

    static __notifyListenersOfSceneChange(previousClass, scene) {
        for(const func of UwU.__onSceneChangeListeners)
            func(previousClass,scene);
    }

    static lastSceneWasMenu() {
        // .prototype returns the object from the constructor (_previousClass).
        if(!SceneManager._previousClass)
            return false;
        return SceneManager._previousClass.prototype instanceof Scene_MenuBase;
    }

    static addSceneChangeListener(func) {
        UwU.__onSceneChangeListeners.push(func);
    }

    static removeSceneChangeListener(func) {
        UwU.__onSceneChangeListeners = UwU.__onSceneChangeListeners.filter(x=> x!==func);
    }

    static sceneIsMenu() {
        return SceneManager._scene instanceof Scene_MenuBase;
    }

    static sceneIsEngine() {
        return SceneManager._scene.constructor === Scene_Engine; 
    }

    static sceneIsOverworld() {
        return SceneManager._scene.constructor === Scene_Map; 
    }
}

var sceneManagerOnSceneStart = SceneManager.onSceneStart;
SceneManager.onSceneStart = function() {
    sceneManagerOnSceneStart.call(this);
    UwU.onSceneStart(SceneManager._previousClass,SceneManager._scene)
}

UwU.__onSceneChangeListeners = [];
UwU.__lastMapId = 0;
UwU.__currentMapId = 0;

// Overworld Organizer
// I hate myself too.
class OwO {
    constructor() {
        throw new Error("Overworld Organizer cannot be instantiated")
    }

    static __init() {
        UwU.addSceneChangeListener(function(lastClass, newScene) {
            // these are stupidly verbose but i don't know what RPG maker might throw at me, so i'd rather write extra code here than assume.
            OwO.__spriteMapValid=false;
            if(UwU.lastSceneWasMenu() && UwU.sceneIsOverworld()) { // transition out of menu to overworld.
                if(OwO.__renderLayer)
                    OwO.__rebindRenderLayer();
                OwO.applyConditionalFilters();
            }
            if(UwU.sceneIsOverworld()) { // any transition into overworld, from any other scene.
                OwO.__applyAllFilters(OwO.__gameFilters);
                if(UwU.mapIdChanged()) // changed to a new map level
                    OwO.__deallocateRenderLayer();
            }
            if(!UwU.lastSceneWasMenu() && !UwU.sceneIsMenu()) { // if true, the last change had nothing to do with menu (could be overworld to engine)
                OwO.__resetAutorunSwitch();
            }
            if(OwO.__renderLayer) {
                OwO.__syncRenderLayer();
            }
        })
    }

    // in every room there exists an autorun script. this autorun will only run if variable #4 is set to 0 and it will set #4 back to 1
    // every room change, we must reset this variable so that the autorun is prepared to run. This prevents the need to constantly reset the
    // variable via RPG maker every time the room changes
    static __resetAutorunSwitch() {
        $gameSwitches.setValue(4,true);
    }

    // continually calls func with data as the arg until it returns true, then removes it from it's list
    // mapOnly will cause it to be removed on map change if it wasn't resolved in time.
    static applyUntil(func, data, mapOnly = true) {

    }

    static __getWorldSprites() {
        // this is an array of PIXI objects containing all of the rendered sprites on the world.
        var worldSprites = OwO.getSpriteset().children[0].children[2].children
        return worldSprites;
    }

    static getSpriteset() {
        return SceneManager._scene._spriteset;
    }

    // filterUpdate takes in 3 paramaeters, which are the variable to check against, the filter, and then by the update event
    static addConditionalFilter(evId, rpgVar = -1, shader = OwO.__getDefaultOutlineShader(), filterUpdate = OwO.__defaultUpdateFunc) {
        var map = $gameMap._mapId;
        OwO.__sceneShaderMap[map] = OwO.__sceneShaderMap[map] || [];
        var arr = OwO.__sceneShaderMap[map];
        var data = {
            eventId: evId,
            RPGVariable: rpgVar, // the corresponding GameVaraible is set to 1, do not apply the filter... if this var is -1, apply always.
            filter:shader,
            filterUpdateFunc: filterUpdate,
        };
        arr.push(data);
    }

    static removeConditionalFilters() {
        var map = $gameMap._mapId;
        OwO.__sceneShaderMap[map] = [];
    }

    static __getCurrentMapFilters() {
        var map = $gameMap._mapId;
        return OwO.__sceneShaderMap[map] || [];
    }

    static applyConditionalFilters() { // called from RPG maker.
        OwO.__clearUpdateFunctions();
        var spriteMap = OwO.__buildSpriteMap();
        for(const filterData of OwO.__getCurrentMapFilters()) {
            var RPGVariable = filterData.RPGVariable;
            // check fail, do not apply filter.
            if(RPGVariable!==-1 && $gameVariables.value(RPGVariable)===1)
                continue;
            var filter = filterData.filter;
            var filterUpdate = filterData.filterUpdateFunc;

            var eventId = filterData.eventId;
            var pixiObj = spriteMap[eventId];
            if(pixiObj===undefined)
                throw new Error("event ID "+String(eventId)+" did not match back to a valid Character.")

            var newFilters = [filter];
            if(pixiObj.filters && pixiObj.filters.length!==0) {
                newFilters.push(...pixiObj.filters);
            }
            pixiObj.filters = newFilters;

            OwO.__addUpdateFunction(filterUpdate,filter,OwO.getEvent(eventId));
        }
    }

    static discardConditionalFilters() { // discards ALL filters associated with a sprite. Assumed that only conditional filters were applied...
        OwO.__clearUpdateFunctions();
        var spriteMap = OwO.__buildSpriteMap();
        for(const filterData of OwO.__getCurrentMapFilters()) {
            var eventId = filterData.eventId;
            var pixiObj = spriteMap[eventId];
            if(pixiObj===undefined)
                throw new Error("event ID "+String(eventId)+" did not match back to a valid Character.")
            pixiObj.filters = [];
        }
    }

    static reApplyConditionalFilters() {
        OwO.discardConditionalFilters();
        OwO.applyConditionalFilters();
    }

    static getMapContainer() {
        return SceneManager._scene.children[0];
    }

    static __applyAllFilters(filters) {
        OwO.__applyMapFilters(filters);
        OwO.__applyPortraitFilters(filters);
    }

    static __disableAllFilters() {
        OwO.__disableyMapFilters();
        OwO.__disablePortraitFilters();
    }

    static __applyMapFilters(filters) {
        OwO.getMapContainer().filters = filters;
    }

    static __disableMapFilters() {
        OwO.getMapContainer().filters = [];
    }
    /**
     * @deprecated 
    * doesn't work because HUD loads in late.
    */
    static __applyPortraitFilters(filters) {
        OwO.getPortrait().filters = [filters]
    }

    static __disablePortraitFilters() {
        OwO.getMapContainer().filters = [];
    }

    static setSaturation(value) {
        OwO.__colourFilter.saturation = value;
    }

    static getHud() {
        return SceneManager._scene._hud;
    }

    // WARN: THIS IS DETERMINED BY HUDMAKER.
    static getPortrait() {
        return OwO.getHud().children[6];
    }

    static __addUpdateFunction(_func, _filter, _event) {
        OwO.__updateFunctions.push({func: _func, filter: _filter, event:_event});
    }

    static __clearUpdateFunctions() {
        OwO.__updateFunctions = [];
    }

    static __buildSpriteMap() { // returns an object where an eventId will map to a character.
        if(OwO.__spriteMapValid)
            return OwO.__spriteMap;
        // reset event map
        OwO.__spriteMap = {};
        var worldSprites = OwO.__getWorldSprites();
        for(const child of worldSprites) {
            let character = child._character
            if(character===undefined)
                continue; // no event attached
            //if(character._eventId===undefined)
            //    throw new Error("No such event ID");
            OwO.__spriteMap[character._eventId] = child;
        }
        OwO.__spriteMapValid = true;
        return OwO.__spriteMap;

    }

    static debugDumpEvents() {
        console.log(OwO.__buildSpriteMap())
    }

    static initializeRenderLayer() {
        OwO.__renderLayerIndex = 0;
        OwO.__deallocateRenderLayer();
        OwO.__renderLayer = new PIXI.Container();
        OwO.getSpriteset().children[0].addChild(OwO.__renderLayer);
        OwO.__syncRenderLayer();
    }

    static __deallocateRenderLayer() {
        if(OwO.__renderLayer) {
            OwO.__destroyRenderLayer();
            if(OwO.getSpriteset().children[0].children[3])
                OwO.getSpriteset().children[0].removeChildAt(3);
        }
        OwO.__renderLayer=undefined;
    }

    static __rebindRenderLayer() {
        OwO.getSpriteset().children[0].addChild(OwO.__renderLayer);
    }

    static __renderLayerTick() {
        if(!OwO.__renderLayer || UwU.sceneIsMenu())
            return;

        if(OwO.__renderLayerController)
            OwO.__renderLayerController();

        for(const child of OwO.__renderLayer.children) {
            child.__updateFunction(child);
        }
        var children = [];
        for(const child of OwO.__renderLayer.children)
            children.push(child);

        OwO.__renderLayer.removeChildren();
        children = children.filter(child => !child._destroyed);
        if(children.length!==0) {
            children.sort( (x,y) => {
                var d = (y.depth - x.depth);
                if(d===0)
                    return (x.__id-y.__id)
                return d
            });
            OwO.__renderLayer.addChild(...children)
        }
        OwO.__syncRenderLayer()
    }

    static __syncRenderLayer() {
        OwO.__renderLayer.x = -$gameMap.displayX()*48;
        OwO.__renderLayer.y = -$gameMap.displayY()*48;
    }

    static addToRenderLayer(pixiObj, updateFunc = function(){}) {
        pixiObj.__updateFunction = updateFunc;
        OwO.__renderLayer.addChild(pixiObj);
        pixiObj.depth = 0;
        pixiObj.__id = OwO.__renderLayerIndex++;
        return pixiObj;
    }

    static setRenderLayerController(func) {
        OwO.__renderLayerController=func;
    }

    static leafParticleInit() {
        var createLeaf = function(xx,yy) {
            var obj = OwO.addToRenderLayer(new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("leaf_particles_small")),function(spr) {
                spr.x+=spr.randX;
                spr.y+=spr.randY;
                spr.randY+=spr.dy;
                spr.rotation = Math.sin(spr.randOffset+OwO.getGameTimer()/spr.randRotSpeed)+spr.randRotOffset;
                spr.scale.y = Math.sin(spr.randFlipOffset+OwO.getGameTimer()/spr.randFlipSpeed)*spr.origScaleY;
                if(Math.abs(spr.scale.y) < 0.1)
                    spr.scale.y = 0.1*Math.sign(spr.scale.y);
                if(spr.x>=OwO.getRenderLayerRight()+512)
                    OwO.destroyObject(spr);
            })
            obj.scale.x = EngineUtils.randomRange(0.5,1);
            obj.origScaleY = EngineUtils.randomRange(0.5,1);
            obj.randX = EngineUtils.randomRange(3,7);
            obj.randY = EngineUtils.randomRange(-2,2);
            obj.randOffset = EngineUtils.random(Math.PI);
            obj.randRotSpeed = EngineUtils.randomRange(20,64);
            obj.randRotOffset = EngineUtils.random(Math.PI*2);
            obj.randFlipSpeed = EngineUtils.randomRange(10,24);
            obj.randFlipOffset = EngineUtils.random(Math.PI*2);
            obj.dy = EngineUtils.randomRange(-0.02,0.02);
            obj.x = xx;
            obj.y = yy;
        }
        var controller = function() {
            if(OwO.getGameTimer()%3===0) {
                var xx = OwO.getRenderLayerLeft()-128;
                var yy = EngineUtils.randomRange(OwO.getRenderLayerTop()-512, OwO.getRenderLayerBottom()+512)
                createLeaf(xx,yy);
                
            }
        }
        for(var i =0;i<100;i++) {
                var xx = EngineUtils.randomRange(OwO.getRenderLayerLeft()-128, OwO.getRenderLayerRight()+512);
                var yy = EngineUtils.randomRange(OwO.getRenderLayerTop()-512, OwO.getRenderLayerBottom()+512)
                createLeaf(xx,yy);
        }
        OwO.setRenderLayerController(controller);
    }

    static destroyObject(obj) {
        obj.destroy();
        obj._destroyed=true;
    }

    static __destroyRenderLayer() {
        OwO.__renderLayer.destroy({children:true}); // free the entire layer
    }

    static getBoxWidth() {
        return Graphics.boxWidth;
    }

    static getRenderLayerLeft() {
        return -OwO.__renderLayer.x;
    }

    static getRenderLayerTop() {
        return -OwO.__renderLayer.y;
    }

    static getRenderLayerRight() {
        return -OwO.__renderLayer.x+OwO.getBoxWidth();
    }

    static getRenderLayerBottom() {
        return -OwO.__renderLayer.y+OwO.getBoxHeight();
    }


    static getBoxHeight() {
        return Graphics.boxWidth;
    }

    static __applyUpdateFunctions() {
        for(const obj of OwO.__updateFunctions) {
            obj.func(obj.filter,obj.event);
        }
    }

    static getGameTimer() {
        return OwO.__RPGgameTimer;
    }

    // alias.
    static getPlayer() {
        return $gamePlayer;
    }

    // gets an event.
    static getEvent(id) {
        var event = OwO.__buildSpriteMap()[id]._character;
        if(!event)
            throw new Error("Attempting to find non existent event "+String(id));
        return event;
    }

    static distanceToPlayer(event) {
        var player = OwO.getPlayer(); // TODO: what does _realX / Y do?
        return V2D.distance(event._x,event._y,player._x,player._y);
    }


    // this method runs once per frame no matter what
    static tick() {
        OwO.__applyUpdateFunctions();
        OwO.__renderLayerTick();
        if(!UwU.sceneIsMenu())
            OwO.__RPGgameTimer++;
    }

    static __defaultUpdateFunc(filter, event) {
        var dist = 4;
        var strength = 4;
        var newStrength = EngineUtils.interpolate((dist-EngineUtils.clamp(OwO.distanceToPlayer(event),0,dist))/dist,0,strength,EngineUtils.INTERPOLATE_OUT);
        var correction = Math.sin(OwO.getGameTimer()/18)*0.25 + 0.75; // between 0.5 and 1
        filter.thickness = newStrength * correction;
    }

    static __getDefaultOutlineShader() {
        return new PIXI.filters.OutlineFilter(4,0xffffff);
    }


}
OwO.__init();
OwO.__renderLayerIndex = 0;
OwO.__renderLayer = undefined;
OwO.__renderLayerController = undefined;
OwO.__spriteMapValid = false;
OwO.__spriteMap = {};
OwO.__updateFunctions = [];
OwO.__sceneShaderMap = {};
OwO.__RPGgameTimer = 0;
OwO.__colourFilter = new PIXI.filters.AdjustmentFilter()
OwO.__gameFilters = [OwO.__colourFilter];