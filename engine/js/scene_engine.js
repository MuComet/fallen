/** @type {Scene_Engine} */
var $engine;

var $__engineData = {}
$__engineData.__textureCache = {};
$__engineData.__haltAndReturn = false;
$__engineData.__ready = false;
$__engineData.__outcomeWriteBackValue = -1
$__engineData.outcomeWriteBackIndex = -1;
$__engineData.__cheatWriteBackValue = -1
$__engineData.cheatWriteBackIndex = -1;
$__engineData.loadRoom = "MenuIntro";

const ENGINE_RETURN = {};
ENGINE_RETURN.LOSS = 0;
ENGINE_RETURN.WIN = 1;
ENGINE_RETURN.NO_CHEAT = 0;
ENGINE_RETURN.CHEAT = 1;

const SET_ENGINE_ROOM = function(room) {
    $__engineData.loadRoom = room;
}

const SET_ENGINE_RETURN = function(indexOutcome, indexCheat) {
    $__engineData.outcomeWriteBackIndex = indexOutcome;
    $__engineData.cheatWriteBackIndex = indexCheat;
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
        $engine = this;
        this.paused = false;
        this.__filters = [];
        this.filters = []; // PIXI
        this.__enabledCameras = [true,false];
        this.__cameras=[new Camera(0,0,Graphics.boxWidth,Graphics.boxHeight,0)];
        this.__GUIgraphics = new PIXI.Graphics();
        this.__shouldChangeRooms=false;
        this.__nextRoom="";
        this.__currentRoom = undefined;
        this.__timer = 0;
        this.__instanceCreationSpecial = {}; // it doesn't matter what this is so long as it's an object.
        this.__renderableDestroyOptions = {children:true};

        this.debugLogFrameTime = false;

        this.__background = undefined;
        this.__backgroundColour = 0;
        this.__usingSolidColourBackground = true;
        this.__backgroundContainer = new PIXI.Container();
        this.setBackground(new PIXI.Graphics())

        this.addChild(this.__backgroundContainer);
        this.addChild(this.__cameras[0]);
        this.addChild(this.__GUIgraphics)
        IM.__initializeVariables();
        IN.__register();
    }

    start() {
        this.__setRoom($__engineData.loadRoom);
        IN.__forceClear();
    }

    update() {
        super.update();
        if(this.isBusy() || SceneManager.isSceneChanging()) // fix for one frame SceneManager bug
            return;
        if(this.__shouldChangeRooms)
            this.__setRoom(this.__nextRoom);

        IN.__update();
        this.__doSimTick();

        if($__engineData.__haltAndReturn)
            this.__endAndReturn()
        
        this.__timer++;
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

    endGame() {
        $__engineData.__haltAndReturn=true;
    }

    setOutcomeWriteBackValue(value) {
        $__engineData.__outcomeWriteBackValue=value;
    }

    setCheatWriteBackValue(value) {
        $__engineData.__cheatWriteBackValue=value;
    }

    __endAndReturn() {
        $__engineData.__haltAndReturn=false;
        SceneManager.pop();
    }

    // called exclusively by terminate, which is called from RPG maker.
    __cleanup() {
        this.freeRenderable(this.__GUIgraphics)
        IM.__endGame()
        for(const camera of this.__cameras)
            this.freeRenderable(camera);
    }

    __writeBack() {
        if($__engineData.outcomeWriteBackIndex!==-1) {
            if($__engineData.__outcomeWriteBackValue<0)
                throw new Error("Engine expects a non negative write back value");
            $gameVariables.setValue($__engineData.outcomeWriteBackIndex,$__engineData.__outcomeWriteBackValue);
            $__engineData.outcomeWriteBackIndex=-1; // reset for next time
            $__engineData.__outcomeWriteBackValue=-1;
        }
        if($__engineData.cheatWriteBackIndex!==-1) {
            if($__engineData.cheatWriteBackIndex<0)
                throw new Error("Engine expects a non negative write back value");
            $gameVariables.setValue($__engineData.cheatWriteBackIndex,$__engineData.__cheatWriteBackValue);
            $__engineData.cheatWriteBackIndex=-1;
            $__engineData.__cheatWriteBackValue=-1;
        }
    }

    terminate() {
        super.terminate()
        this.__cleanup();
        this.__writeBack();
    }


    __doSimTick() {
        var start = window.performance.now();

        this.__clearGraphics();
        IM.__doSimTick();
        this.__updateBackground();
        this.__prepareRenderToCameras();

        var time = window.performance.now()-start;
        if(this.debugLogFrameTime)
            console.log("Time taken for this frame: "+(time)+" ms")
    }

    addFilter(screenFilter, removeOnRoomChange = true, name = "ENGINE_DEFAULT_FILTER_NAME") {
        this.__filters.push({filter:screenFilter,remove:removeOnRoomChange,filterName: name});
        var filters = this.filters // PIXI requires reassignment
        filters.push(screenFilter);
        this.filters = filters;
    }

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

    getTexture(name) {
        var tex = $__engineData.__textureCache[name];
        if(!tex) console.error("Unable to find texture for name: "+String(name)+". Did you remember to include the texture in the manifest?")
        return tex;
    }

    getGlobalTimer() {
        return this.__timer;
    }

    getWindowSizeX() {
        return Graphics.boxWidth
    }

    getWindowSizeY() {
        return Graphics.boxHeight
    }

    setCameraEnabled(index, enable) {
        this.__enabledCameras[index] = enable;
    }

    createRenderable(parent, renderable, align = false) {
        renderable.__depth = parent.depth
        renderable.__parent = parent;
        renderable.__align = align;
        renderable.dx=0;
        renderable.dy=0;
        if(renderable.texture && renderable.texture.defaultAnchor)
            renderable.anchor.set(renderable.texture.defaultAnchor.x,renderable.texture.defaultAnchor.y)
        parent.__renderables.push(renderable);
        return renderable;
    }

    // if you want to manage the renderable yourself, you may still use this function to free it in the same way a manged one would be freed.
    freeRenderable(renderable) {
        renderable.destroy(this.__renderableDestroyOptions);
    }

    removeRenderable(renderable) {
        renderable.__parent.__renderables.splice(renderable.__parent.__renderables.indexOf(renderable),1); // remove from parent
        renderable.__parent=null; // leave it to be cleaned up eventually
        this.freeRenderable(renderable)
    }

    /**
     * Requests that on this frame, the renderable be rendered to the GUI layer.
     * @param {PIXI.Container} renderable 
     */
    requestRenderOnGUI(renderable) {
        this.__GUIgraphics.addChild(renderable);
    }
    
    /**
     * Requests that on this frame, the renderable be rendered to the Camera layer.
     * @param {PIXI.Container} renderable 
     */
    requestRenderOnCamera(renderable) {
        this.getCamera().addChild(renderable);
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

    setBackground(background) { // expects any PIXI renderable. renders first.
        this.__usingSolidColourBackground = false;
        this.__background = background;
        this.__backgroundContainer.removeChildren();
        this.__backgroundContainer.addChild(background)
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
            
            var arr = this.__collectAllRenderables();
            if(arr.length!==0) // prevent null call
                camera.addChild(...arr)
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
    }
}

////////////////////////////////single time setup of engine///////////////////////

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
        for (const d of data) {
            const arr = EngineUtils.strToArrWhitespace(d);
            const name = arr[0];
            let tdx = parseFloat(arr[2])
            let tdy = parseFloat(arr[3])
            const dx = tdx!==undefined ? tdx : 0.5;
            const dy = tdy!==undefined ? tdy : 0.5;
            obj.textures++;
            obj.total++;
            const tex = PIXI.Texture.from(arr[1]);
            tex.on('update',()=> { // the texture is loaded!
                // support for centering and px measurements
                let tdx = dx;
                let tdy = dy;
                if(tdx===-1)
                    tdx = 0.5;
                if(tdy===-1)
                    tdy=0.5;
                if(tdx>1)
                    tdx = tdx/tex.width;
                if(tdy>1)
                    tdy = dy/tex.height;
                tex.defaultAnchor = new PIXI.Point(dx,dy);
                obj.onNextLoaded();
            })
            $__engineData.__textureCache[name]=tex;
        }

        obj.elements++;
        obj.testComplete(); // update the obj
    }
    EngineUtils.readLocalFileAsync(texture_file,callback);
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

__initalize();