/** @type {Scene_Engine} */
var $engine;

/** @type {Object} */
var $__engineData = {}
$__engineData.__textureCache = {};
$__engineData.__textureAnimationCache = {};
$__engineData.__soundCache = {};
$__engineData.__spritesheets = {};
$__engineData.__haltAndReturn = false;
$__engineData.__ready = false;
$__engineData.__fullyReady = false;
$__engineData.__outcomeWriteBackValue = -1
$__engineData.outcomeWriteBackIndex = -1;
$__engineData.__cheatWriteBackValue = -1
$__engineData.cheatWriteBackIndex = -1;
$__engineData.autoSetWriteBackIndex = -1;
$__engineData.loadRoom = "MenuIntro";
$__engineData.__lowPerformanceMode = false;
$__engineData.__overrideRoom = undefined;
$__engineData.__readyOverride = true;


// things to unbork:
// re-comment out YEP speech core at 645
// re-enable custom cursor

$__engineData.__advanceGameInterpreter=false

$__engineData.__debugRequireTextures = false;
$__engineData.__debugRequireSounds = false;
$__engineData.__debugPreventReturn = false;
$__engineData.__debugLogFrameTime = false;
$__engineData.__debugRequireAllTextures = false;
$__engineData.__debugRequireAllSounds = false;

/** @type {Object} */
var $__engineSaveData = {}; // this data is automatically read and written by RPG maker when you load a save.

$__engineSaveData.__mapData={};

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
    OwO.incrementTimeOfDay();
}

//PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST; // set PIXI to render as nearest neighbour

/*DEBUG CODE MANIFEST (REMOVE ALL BEFORE LAUNCH):
IN: keydown listener will put you into engine on "ctrl + enter" press [ REMOVED ]
IN: log key press code
Scene_Engine - debug_log_frame_time (create, doSimTick)
*/

class Scene_Engine extends Scene_Base {

    create() {
        super.create();
        if($__engineData.__overworldMode) {
            $__engineData.__overworldMode=false;
            $engine.endOverworld(); // still refers to old engine at this point
        }
        this.__initEngine();
    }

    __initEngine() {
        $engine = this;
        this.__pauseMode = 0; // 0 = not paused, 1 = paused, 2 = pause special.
        this.__pauseSpecialInstance = undefined;
        this.__filters = [];
        this.__gameCanvas = new PIXI.Container();
        this.__gameCanvas.filters = []; // PIXI
        this.__enabledCameras = [true]; // Multi cameras don't work like this, but can still be done
        this.__cameras=[new Camera(0,0,Graphics.boxWidth,Graphics.boxHeight,0)]; // with render textures!
        this.__GUIgraphics = new PIXI.Graphics();
        this.__shouldChangeRooms=false;
        this.__nextRoom="";
        this.__currentRoom = undefined;
        this.__globalTimer = 0;
        this.__gameTimer = 0;
        this.__lastKnownTime = -1;
        this.__instanceCreationSpecial = {}; // it doesn't matter what this is so long as it's an object.
        this.__timescale = 1;
        this.__timescaleFraction = 0;
        this.__sounds = [];

        this.__RPGVariableTags = [];

        this.__background = undefined;
        this.__backgroundColour = 0;
        this.__usingSolidColourBackground = true;
        this.__autoDestroyBackground = false;
        this.__backgroundContainer = new PIXI.Container();
        this.setBackground(new PIXI.Graphics(), true)

        this.__physicsEngine = undefined;

        // place everything into a container so that the GUIScreen is not effected by game effects.
        this.addChild(this.__gameCanvas);
        this.__gameCanvas.addChild(this.__backgroundContainer);
        this.__gameCanvas.addChild(this.__cameras[0]);
        this.__gameCanvas.addChild(this.__GUIgraphics)
        IM.__initializeVariables();
    }

    startOverworld() { // interestingly enough, RPG maker sprites and scenes share a common "update" method
        // so if you add a scene as a child of another scene, it runs like normal.
        $__engineData.__overworldMode = true;
        $engine.alpha = 1;
        this.removeChildren();
        this.__initEngine();
        this.__startEngine();
        this.__bindEngine();
        this.__sceneChangeListener = function() { // undeclared in create.
            if(UwU.sceneIsOverworld())
                $engine.__bindEngine();
        }
        UwU.addSceneChangeListener(this.__sceneChangeListener)
    }

    __bindEngine() {
        if($__engineData.__overworldMode)
            SceneManager._scene.addChildAt(this,1);
    }

    endOverworld() {
        $__engineData.__overworldMode = false;
        this.__cleanup();
        this.setBackgroundColour(0);
        SceneManager._scene.removeChild(this);
        UwU.removeSceneChangeListener(this.__sceneChangeListener)
    }

    advanceGameInterpreter() {
        $__engineData.__advanceGameInterpreter = true;
    }

    isOverworld() {
        return $__engineData.__overworldMode; // true if the engine is in overworld mode *and* running.
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

    /**
     * Enables matter.js physics engine. After calling this method, all EnginePhysicsInstances will be physically simulated.
     */
    physicsEnable() {
        if(!this.__physicsEngine)
            this.__physicsEngine = new Matter.Engine.create();
    }

    physicsAddBodyToWorld(...bodies) {
        Matter.World.add(this.__physicsEngine.world,bodies)
    }

    physicsRemoveBodyFromWorld(body) {
        Matter.World.remove(this.__physicsEngine.world,body)
    }

    physicsDestroy() {
        if(!this.__physicsEngine)
            return;
        Matter.World.clear(this.__physicsEngine.world);
        Matter.Engine.clear(this.__physicsEngine);
        this.__physicsEngine=undefined;
    }

    setTimescale(scale) {
        this.__timescale=scale;
        if(scale===1)
            this.resetTimescale();
    }

    resetTimescale() {
        this.__timescale = 1;
        this.__timescaleFraction = 0;
    }

    isTimeScaled() {
        return this.__timescale!==1;
    }

    getTimescaleFraction() {
        return this.__timescaleFraction%1;
    }

    getTimescale() {
        return this.__timescale;
    }

    update() {
        // RPG MAKER
        super.update();
        if($__engineData.__haltAndReturn && !this.isBusy())
            this.__endAndReturn()

        // ENGINE
        if(this.__shouldChangeRooms)
            this.__setRoom(this.__nextRoom);

        this.__timescaleFraction+=this.__timescale;

        this.__doSimTick();

        this.__globalTimer++;
    }

    /**
     * RPG MAKER FUNCTION! Does not work with engine!
     * 
     * Creates and returns an AudioReference for use in AudioManager.
     * 
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

    /**
     * Plays the specified sound with arguments. snd can either be a PIXI.Sound from audioGetSound() or it
     * may be a String with the alias of the sound to play. 
     * 
     * If loop is specified, then the sound will never stop playing. You
     * must manually stop the sound when you are done with it using audioStopSound() or audioFadeSound()
     * 
     * Note that by specifying the loop points here, the sound will start at 'start'.
     * If you want to loop only part of a sound, use audioSetLoopPoints() after starting the sound using this method.
     * 
     * @param {PIXI.Sound | String} snd The sound instance to play or a string alias to reference.
     * @param {Number} [volume=1] The source volume to set
     * @param {Boolean} [loop=false] Whether or not to loop
     * @param {Number} start The start loop point
     * @param {Number} end The end loop point
     * @returns The IMediaInstance generated by PIXI.Sound
     */
    audioPlaySound(snd, volume=1, loop=false, start = 0, end = 0) {
        if(typeof(snd)==="string")
            snd = this.audioGetSound(snd);
        if(snd===undefined)
            return;
        var retSnd = undefined;
        if(end) {
            retSnd = snd.play({
                loop: loop,
                start: start,
                end: end,
                volume: volume,
            });
        } else {
            retSnd = snd.play({
                loop: loop,
                volume: volume,
            });
        }
        this.__audioSetupSound(snd, retSnd);
        return retSnd;
    }

    /**
     * Directly plays a sound given the specified arguments. For advanced options that audioPlaySound
     * cannot account for directly.
     * 
     * @param {PIXI.Sound | String} snd The sound instance to play or a string alias to reference.
     * @param {Object} args The arguments to pass to the sound constructor.
     * @returns The IMediaInstance generated by PIXI.Sound
     */
    audioPlaySoundDirect(snd, args) {
        if(typeof(snd)==="string")
            snd = this.audioGetSound(snd);
        if(snd===undefined)
            return;
        var retSnd = snd.play(args);
        this.__audioSetupSound(snd,retSnd);
        return retSnd;
    }

    __audioSetupSound(snd, audio) {
        var volume = audio.volume
        audio.__srcVolume = volume * this.audioGetTypeVolume(snd.__type); // this is wrong because PIXI will let you batch change
        this.audioSetVolume(audio, volume); // volume for a sound, but because you can't change volume in engine i don't have to improve this.
        audio.__tick = function(self){}; // nothing for now
        this.__sounds.push(audio);
        audio.__sourceSound = snd;
        audio.__destroyed=false;
    }

    /**
     * Finds and returns a PIXI.Sound object for playback.
     * 
     * Note that the returned PIXI sound object should ***ALWAYS*** be
     * played using either audioPlaySound() or audioPlaySoundDirect().
     * 
     * This method exists mainly for the purpose of filters. Getting a sound resets the filters applied to it.
     * 
     * @param {String} alias The name of the sound as specified in sounds_manifest.txt
     * @returns The PIXI.Sound instance
     */
    audioGetSound(alias) {
        var sound = $__engineData.__soundCache[alias];
        if(!sound) {
            var str = "Unable to find sound for name: "+String(alias)+". Did you remember to include the sound in the manifest?"
            if($__engineData.__debugRequireSounds)
                throw new Error(str);
            console.error(str)
            return undefined;
        }
        sound.filters = []; // reset the filters.
        return sound;
    }

    /**
     * Stops the specified sound or all instances of the sound if snd is a PIXI.Sound object
     * @param {IMediaInstance | PIXI.Sound} snd The sound to stop
     */
    audioStopSound(snd) {
        for(const sound of this.__lookupSounds(snd)) {
            $engine.__audioDestroy(sound)
        }
    }

    /**
     * Sets the volume of the sound, taking into account the original volume of the sound when created.
     * 
     * It is highly recommended to only use this method to set sounds, as it is repsective of RPG maker's volume settings.
     * 
     * @param {IMediaInstance} snd The sound
     * @param {Number} volume The new volume
     */
    audioSetVolume(snd, volume) {
        snd.volume = snd.__srcVolume*volume;
    }

    /**
     * Sets the loop points of ths specified sound. The start time does not need to be
     * before the current time of playback of the sound.
     * 
     * The sound must have been initialized with loop=true in audioPlaySound()
     * 
     * If end is < start, the sound will not loop.
     * 
     * 
     * @param {IMediaInstance} snd The sound to set the loop points for
     * @param {Number} start The start time
     * @param {Number} end The end time
     */
    audioSetLoopPoints(snd, start, end) {
        snd._source.loopStart = start
        snd._source.loopEnd = end
    }

    /**
     * Immediately stops all currently playing sounds.
     */
    audioStopAll() {
        this.__audioCleanup();
    }

    /**
     * Queries the internal list of sounds and stops all that match the type
     * 
     * Type can be one of BGM, BGS, ME, or SE (case sensitive)
     * 
     * @param {String} type The type of sound to stop
     */
    audioStopType(type) {
        for(const sound of this.__sounds) {
            if(sound.__sourceSound.__type === type) {
                $engine.__audioDestroy(sound)
            }
        }
    }

    __lookupSounds(snd) {
        var sounds = [];
        if(snd.__sourceSound) { // IMediaInstance
            return [snd];
        }
        var target = snd.__engineAlias || snd; // String alias
        for(const sound of this.__sounds) { // Sound Instances
            if(sound.__sourceSound.__engineAlias === target)
                sounds.push(sound);
        }
        return sounds;
    }

    /**
     * Finds and returns all sounds of that specific type
     * 
     * Type can be one of BGM, BGS, ME, or SE (case sensitive)
     * 
     * @param {String} type The type of sound to get
     * @returns A non null array of all sounds matching that type
     */
    audioGetSoundsOfType(type) {
        var sounds = [];
        for(const sound of this.__sounds) {
            if(sound.__sourceSound.__type === type)
                sounds.push(sound);
        }
        return sounds;
    }

    /**
     * Pauses the specified sound or all instances of that specific sound if it is a PIXI.Sound
     * 
     * @param {IMediaInstance | PIXI.Sound} snd The sound to pause
     */
    audioPauseSound(snd) {
        for(const sound of this.__lookupSounds(snd)) {
            if(sound._source) { // remember our loop points, they get erased when you pause
                sound.__loopStart = sound._source.loopStart;
                sound.__loopEnd = sound._source.loopEnd;
            } else {
                sound.__loopStart=undefined;
                sound.__loopEnd=undefined;
            }
            sound.paused = true
        }
    }

    /**
     * Resumes a previously paused sound or all instances of that specific sound if it is a PIXI.Sound
     * 
     * @param {IMediaInstance | PIXI.Sound} snd The sound to pause
     */
    audioResumeSound(snd) {
        for(const sound of this.__lookupSounds(snd)) {
            sound.paused = false;
            if(sound.__loopStart!==undefined) {
                sound._source.loopStart = sound.__loopStart;
                sound._source.loopEnd = sound.__loopEnd;
            }
        }
    }

    /**
     * Checks whether or not the specified sound, or any instance of that sound if it is a PIXI.Sound is
     * currently playing
     * 
     * Note that 'playing' does not mean it is unpaused, only that it is registered as a sound currently.
     * 
     * @param {IMediaInstance | PIXI.Sound} snd The sound to check
     * @returns True if any instance of the Sound is registered, false otherwise
     */
    audioIsSoundPlaying(snd) {
        return this.__lookupSounds(snd).length!==0;
    }

    /**
     * Fades out the specified sound across the specified number of frames.
     * 
     * The volume is faded from the current volume down to zero.
     * 
     * @param {IMediaInstance} snd The sound to fade out
     * @param {Number | 30} [time=30] The amount of frames to fade over
     */
    audioFadeSound(snd, time=30) {
        snd.__timeToFade = time;
        snd.__timer = 0;
        snd.__vol = snd.volume;
        snd.__tick = function(self) {
            self.volume = (1-(self.__timer/ self.__timeToFade))*self.__vol
            if(self.__timer>=self.__timeToFade)
                $engine.__audioDestroy(self);
            self.__timer++;
        }
    }

    /**
     * Fades in the specified sound across the specified number of frames.
     * 
     * The volume is faded from the current volume up to the sound's max
     * as specified in audioPlaySound()
     * 
     * @param {IMediaInstance} snd The sound to fade in
     * @param {Number | 30} [time=30] The amount of frames to fade over
     */
    audioFadeInSound(snd, time=30) {
        snd.__timeToFade = time;
        snd.__timer = 0;
        snd.__vol = snd.volume;
        snd.volume = 0;
        snd.__tick = function(self) {
            if(self.__timer>self.__timeToFade)
                return;
            self.volume = (self.__timer/ self.__timeToFade)*self.__vol
            self.__timer++;
        }
    }

    __audioDestroy(audio) {
        audio.stop();
        audio.__destroyed = true;
    }

    /**
     * Fades out all sounds across the specified number of frames.
     * @param {Number | 30} [time=30] The amount of frames to fade over   
     */
    audioFadeAll(time=30) {
        for(const sound of this.__sounds) {
            this.audioFadeSound(sound,time)
        }
    }
    /**
     * Fades out all sounds of the specified type across the specified number of frames.
     * 
     * Type can be one of BGM, BGS, ME, or SE (case sensitive)
     * 
     * @param {String | "SE"} [type=SE] The type of sound to fade
     * @param {Number | 30} [time=30] The amount of frames to fade over   
     */
    audioFadeAllOfType(type = "SE",time=30) {
        for(const sound of this.__sounds) {
            if(sound.__sourceSound.__type === type)
                this.audioFadeSound(audio,time)
        }
    }

    /**
     * Queries RPG maker and reutrns the volume of sound that RPG maker's settings specify.
     * 
     * Type can be one of BGM, BGS, ME, or SE (case sensitive)
     * 
     * @param {String} type The type of sound to get the volume of
     * @returns The volume as specified by RPG maker
     */
    audioGetTypeVolume(type) {
        var masterVolume = AudioManager.masterVolume;
        switch(type) {
            case "BGM":
                return AudioManager.bgmVolume/100 * masterVolume;
            case "BGS":
                return AudioManager.bgsVolume/100 * masterVolume;
            case "ME":
                return AudioManager.meVolume/100 * masterVolume;
            case "SE":
                return AudioManager.seVolume/100 * masterVolume;
        }
        console.error("Audio type "+type+" is not defined, please use one of: BGM, BGS, ME, SE");
        return 1;
    }

    __audioTick() {
        for(const sound of this.__sounds) {
            sound.__tick(sound);
            if(sound.progress>=1) {
                this.__audioDestroy(sound)
            }
        }
        this.__sounds = this.__sounds.filter( x=> !x.__destroyed);
    }

    __audioCleanup() { // at the end of the game, delete all sounds.
        for(const sound of this.__sounds) {
            sound.stop();
        }
        this.__sounds = [];
    }

    /**
     * The next time the engine tries to return, override the request and instead go to the specified room.
     * 
     * This does not effect a room change request. Only a return to overworld request.
     * 
     * The engine will completely restart itself in this situation, 
     * and it will act as if the engine terminated and then immediately started in the new room.
     * @param {String} newRoom The room to go to instead
     */
    overrideReturn(newRoom) {
        $__engineData.__overrideRoom = newRoom;
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
        RoomManager.loadRoom(roomName); // also sets current room
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
        this.__pauseMode = 1;
    }

    /**
     * Unpauses the game after it has been set to pause mode.
     */
    unpauseGame() {
        this.__pauseMode = 0;
    }

    /**
     * Pauses the game for every single instance except for the specified instance.
     * @param {EngineInstance} instance The immune instance
     */
    pauseGameSpecial(instance) {
        if(!instance) {
            throw new Error("PauseGameSpecial requires a target instance to keep running");
        }
        this.__pauseSpecialInstance = instance;
        this.__pauseMode = 1;
    }

    /**
     * Unpauses the game after it has been set to pause special mode.
     */
    unpauseGameSpecial() {
        this.__pauseMode = 0;
    }

    isGamePaused() {
        return this.__pauseMode===1;
    }

    isGamePausedSpecial() {
        return this.__pauseMode===2;
    }

    setLowPerformanceMode(bool) {
        $__engineData.__lowPerformanceMode = bool;
    }

    isLow() {
        return $__engineData.__lowPerformanceMode;
    }

    __getPauseMode() {
        return this.__pauseMode;
    }

    __endAndReturn() {

        if($__engineData.__overrideRoom) { // completely restart the engine if we override room.
            this.__cleanup(); // after all the intention of the programmer at this point is that the engine is to be terminated.
            this.removeChildren();
            this.__initEngine();
            $__engineData.loadRoom = $__engineData.__overrideRoom
            this.__startEngine();
            $__engineData.__overrideRoom=undefined;
            $__engineData.__haltAndReturn=false;
            this.startFadeIn();
            return;
        }

        // for testing minigames.
        if($__engineData.__debugPreventReturn) {
            this.__cleanup();
            this.removeChildren();
            this.__initEngine();
            this.__startEngine();
            $__engineData.__haltAndReturn=false;
            return;
        }

        SceneManager.pop(); // calls terminate
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
        this.freeRenderable(this.__gameCanvas)
        this.__audioCleanup();
        this.physicsDestroy();
        if(this._fadeSprite) {
            this.freeRenderable(this._fadeSprite);
            this._fadeSprite=undefined;
        }
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
    
    /**
     * RPG maker functions, do not call. if you want to end the game, use endGame().
     */
    terminate() {
        super.terminate()
        this.__cleanup();
        this.__writeBack();
        this.__resumeAudio();
        this.setBackgroundColour(0);
        $__engineData.__haltAndReturn=false;
    }

    /**
     * RPG maker functions, do not call.
     * Allows for the engine to wait until fully ready to prevent errors from early start.
     * 
     * @returns True if the engine is fully ready to start, or if early start is enabled and is early ready
     */
    isReady() {
        return super.isReady() && ($__engineData.__fullyReady || $__engineData.__readyOverride);
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

        var renderedOnce = this.__timescaleFraction-1>=0;

        while(this.__timescaleFraction-1>=0) {
            this.__timescaleFraction--;

            var lastFrame = this.__timescaleFraction-1 < 0;

            if(lastFrame) {
                IN.__update();
            }

            IM.__timescaleImplicit();

            this.__clearGraphics();
            this.__doPhysicsTick();
            IM.__doSimTick(lastFrame);

            if(this.__pauseMode !==1)
                this.__gameTimer++;
        }

        if(this.isTimeScaled()) {
            IM.__timescaleImmuneStep();
        }

        if(!renderedOnce) {
            IM.__draw();
        }

        this.__prepareRenderToCameras();
        this.__audioTick();
       
        
        var time = window.performance.now()-start;
        if($__engineData.__debugLogFrameTime)
            console.log("Time taken for this frame: "+(time)+" ms")
    }

    __doPhysicsTick() {
        if(this.__physicsEngine === undefined || this.__pauseMode!==0)
            return;
        Matter.Engine.update(this.__physicsEngine);
    }

    /**
     * Adds a filter to the game which applies in screen space
     * @param {PIXI.filter} screenFilter The filter to add
     * @param {Boolean | true} [removeOnRoomChange=true] Whether or not to automatically remove this filter when the engine changes rooms
     * @param {String} name A unique identifier for this filter, which may be used later to find it.
     */
    addFilter(screenFilter, removeOnRoomChange = true, name = "ENGINE_DEFAULT_FILTER_NAME") {
        this.__filters.push({filter:screenFilter,remove:removeOnRoomChange,filterName: name});
        var filters = this.__gameCanvas.filters // PIXI requires reassignment
        filters.push(screenFilter);
        this.__gameCanvas.filters = filters;
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

        var filters = this.__gameCanvas.filters; // PIXI requirments.
        filters.splice(this.__gameCanvas.filters.indexOf(filterObj.filter),1);
        this.__gameCanvas.filters = filters;

        this.__filters.splice(index,1);
    }

    /**
     * Finds and returns the texture with the specified name from the texture cache. If you want an image from a spritesheet,
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
     * Finds and returns an array of textures with the specified name from the texture animation cache.
     * @param {String} name The name of the animation as defined in textures_manifest.txt
     */
    getAnimation(name) {
        var anim = $__engineData.__textureAnimationCache[name];
        if(!anim) {
            var str = "Unable to find animation for name: "+String(name)+". Did you remember to include the animation in the manifest?"
            if($__engineData.__debugRequireTextures)
                throw new Error(str);
            console.error(str)
        }
        return anim;
    }

    /**
     * Returns a random texture from a spritesheet that was loaded using the spritesheet command
     * in textures_manifest
     * @param {String} name The name of the spritesheet
     */
    getRandomTextureFromSpritesheet(name) {
        var sheetData = $__engineData.__spritesheets[name];
        if(!sheetData) {
            var str = "Unable to find spritesheet for name: "+String(name)+". Was this texture initialized as a spritesheet?"
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
    getSpritesheetLength(name) {
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
     * @returns {Number} The amount of frames the game has executed (timescale aware), excluding time paused, and including special time paused.
     */
    getGameTimer() {
        return this.__gameTimer;
    }

    /**
     * @returns {Number} The amount of frames the engine has been running.
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
        return { fontFamily: 'GameFont', fontSize: 20, fontVariant: 'bold', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 };
    }

    /**
     * Creates and returns a new Object which may be passed in to a PIXI.Text as the style.
     * 
     * @returns {Object} Default text settings
     */
    getDefaultTextStyle() {
        return { fontFamily: 'GameFont', fontSize: 30, fontVariant: 'bold', fill: '#FFFFFF', align: 'center', stroke: '#363636', strokeThickness: 5 };
    }

    /**
     * Attaches a renderable to an instance and automatically renders it every frame. When the instance is destroyed, the engine will
     * also destroy the renderable along with it.
     * 
     * This function also applies the default anchor of the texture as defined in the manifest.
     * 
     * The major difference between this and createManagedRenderable is that this will also cause the engine to automatically render it, createManagedRenderable
     * will only tell the engine to keep track of it for you.
     * @param {EngineInstance} parent The parent to attach the renderable to
     * @param {PIXI.DisplayObject} renderable The renderable to auto dispose of
     * @param {Boolean | false} [align=false] Whether or not to automatically move the renderable to match the parent instance's x, y, scale, and rotation (default false)
     * @returns {PIXI.DisplayObject} The passed in renderable
     */
    createRenderable(parent, renderable, align = false) {
        renderable.__depth = parent.depth
        renderable.__parent = parent;
        renderable.__align = align;
        renderable.dx=0;
        renderable.dy=0;
        renderable.__idx = parent.__renderables.length;
        parent.__renderables.push(renderable);
        this.getCamera().__getRenderContainer().addChild(renderable);
        return renderable;
    }

    /**
     * Attaches the lifetime of the specified renderable to the instance in question. When the instance is destroyed, the engine will
     * also destroy the renderable along with it.
     * 
     * The major difference between this and createRenderable is that createRenderable will also cause the engine to automatically render it, while
     * this function will only tell the engine to keep track of it for you.
     * @param {EngineInstance} parent The parent to attach the renderable to
     * @param {PIXI.DisplayObject} renderable The renderable to auto dispose of
     * @returns {PIXI.DisplayObject} The passed in renderable
     */
    createManagedRenderable(parent, renderable) {
        parent.__pixiDestructables.push(renderable);
        return renderable;
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
        this.getCamera().__getRenderContainer().removeChild(renderable);
        this.freeRenderable(renderable)
    }

    /** 
     * Requests that on this frame, the renderable be rendered to the GUI layer.
     * 
     * Renderables added to the GUI will render in the order they are added.
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
     * Renderables added to the Camera will render in the order they are added.
     * @param {PIXI.Container} renderable 
     */
    requestRenderOnCamera(renderable) {
        this.getCamera().getCameraGraphics().addChild(renderable);
    }

    /** 
     * Requests that on this frame, the renderable be rendered to the Camera layer in GUI space. Use this if you want
     * to get the same effect as the GUI, but also want the renderable to exist in the camera's scope (for stuff like filters).
     * 
     * Renderables added to the Camera will render in the order they are added.
     * @param {PIXI.Container} renderable 
     */
    requestRenderOnCameraGUI(renderable) {
        this.getCamera().__cameraGUI.addChild(renderable);
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

    /**
     * Sets a renderable to be rendered in the background.
     * @param {PIXI.DisplayObject} background The background to use
     * @param {Boolean | true} autoDestroy Whether or not to auto destroy this background when the game ends or a new background is set.
     */
    setBackground(background, autoDestroy=true) { // expects any PIXI renderable. renders first.
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
        this.getRenderer().backgroundColor = col;
    }

    getBackgroundColour() {
        return this.getRenderer().backgroundColor
    }

    __prepareRenderToCameras() {
        for(var i =0;i<1;i++) { // a relic from a time long gone. more than one camera wouldn't work like this, you'd have to call the renderer directly.
            if(!this.__enabledCameras[i])
                continue;
            var camera = this.__cameras[i];
            camera.removeChildren(); // old code, can clean up


            // STOP: The following code ONLY works because it was checked against PIXIJS containers.
            // There are no guarantees it will work with other container types such as Graphics.
            var renderContainer = camera.__getRenderContainer()
            var children = renderContainer.children;

            // remove destroyed graphics.
            for(var k = children.length-1;k>=0;k--) {
                var child = children[k];
                if(child._destroyed)
                    renderContainer.removeChildAt(k);
            }

            // sort our array.
            children.sort((a,b) => {
                const x = a.__parent;
                const y = b.__parent;
                var d = (y.depth - x.depth); // first, try depth
                if(d===0) {
                    var d2 = (x.id-y.id); // next, try instance creation order
                    if(d2===0) {
                        return a.__idx - b.__idx; // finally, the renderable creation order
                    }
                    return d2;
                }
                return d
            })

            camera.addChild(renderContainer);
            camera.addChild(camera.getCameraGraphics());
            camera.addChild(camera.__cameraGUI);
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

        this.getCamera().__cameraGUI.removeChildren();
    }

    __disposeHandles(instance) { //TODO: disposes of any resources associated with the object. This should remove any objects (renderables) associated with the instance.
        for(const renderable of instance.__renderables) {
            this.freeRenderable(renderable)
        }
        for(const renderable of instance.__pixiDestructables) {
            this.freeRenderable(renderable)
        }
    }

    __notifyVisibilityChanged(event) {
        if(document.visibilityState==="visible") {
            if(this.__lastKnownTime===-1) // we don't have a record... ignore.
                return;
            var frames = Math.floor((event.timeStamp - this.__lastKnownTime)/16.666666)
            var controller = MinigameController.getInstance();
            if(controller!==undefined) {
                controller.__notifyFramesSkipped(frames);
            }
        } else { // user hid the game
            this.__lastKnownTime=event.timeStamp;
        }
    }
}

$engine = new Scene_Engine(); // create the engine at least once so that we have access to all engine functions.

////////////////////////////////single time setup of engine///////////////////////

IN.__register();
// calling of this is defered until scene boot. If we call it any earlier,
// the engine early start won't work because it has to wait for RPG maker
__initialize = function() {
    var obj = {
        deferredTextures: [],
        deferredSounds: [],
        count : 0,
        scripts : 0,
        textures : 0,
        rooms : 0,
        instances : 0,
        sounds : 0,
        elements : 0,
        time : window.performance.now(),
        total : 0,
        deferredAssets : 0,
        valid : false, // don't let the engine falsely think it's ready
        onNextLoaded : function() {
            this.count++;
            this.testComplete();
        },
        testComplete : function() {
            if(this.count===this.total && this.valid && this.elements===5) // all loaded
                this.onComplete();
        },
        onComplete : function() {
            __initializeDone(this)
        },
        validate : function() {
            this.valid=true;
            if(this.count===this.total && this.elements===5) // already loaded everything, proceed. 4 = (scripts, rooms, textures, instances, sounds)
                this.onComplete();
        }
    }
    __prepareScripts("engine/scripts_manifest.txt",obj);
    __inst = __readInstances("engine/instances_manifest.txt",obj);
    __readRooms("engine/rooms_manifest.txt",obj);
    __readTextures("engine/textures_manifest.txt",obj);
    __readSounds("engine/sounds_manifest.txt",obj);
    obj.validate()
}

__initializeDone = function(obj) {
    IM.__init(this.__inst);
    RoomManager.__init();
    console.log("Loaded all required assets! ->",window.performance.now() - obj.time,"ms");
    $__engineData.__ready=true;
    __finishReading(obj);
    __addListener();
}

__finishReading = function(obj) {
    var total = 0;
    var loaded = 0;

    const isDone = function() {
        if(++loaded===total) {
            var msg = "("+String(obj.scripts)+(obj.scripts!==1 ? " scripts, " : " script, ")+String(obj.textures)+(obj.textures!==1 ? " textures, " : " texture, ") 
                    + String(obj.rooms)+(obj.rooms!==1 ? " rooms, " : " room, ") + String(obj.sounds)+(obj.sounds!==1 ? " sounds, " : " sound, ")
                    + String(obj.instances)+(obj.instances!==1 ? " instances) ->" : " instance) ->");
            console.log("Loaded remaining "+String(obj.deferredAssets)+" assets! Asset summary:",msg,window.performance.now() - obj.time," ms");
            $__engineData.__fullyReady = true;
        }
    }

    for(const soundObj of obj.deferredSounds) {
        total++;
        __loadSound(obj, soundObj, () => {
            isDone();
        });
    }
    for(const texObj of obj.deferredTextures) {
        total++;
        __loadTexture(obj, texObj, () => {
            isDone();
        });
    }
}

__addListener = function() {
    document.addEventListener("visibilitychange", function(event) {
        $engine.__notifyVisibilityChanged(event);
    })
}

__prepareScripts = function(script_file,obj) {
    // code by Matt Ball, https://stackoverflow.com/users/139010/matt-ball
    // Source: https://stackoverflow.com/a/4634669
    const callback = function(fileData) {
        var data = EngineUtils.strToArrNewline(fileData);
        for (const x of data) {
            obj.total++;
            obj.scripts++;
            obj.assetCount++;
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
            obj.assetCount++;
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

__readSounds = function(sound_file,obj) {
    var callback = function(fileData) {
        const data = EngineUtils.strToArrNewline(fileData);

        var required = [];
    
        for (const x of data) {
            const arr = EngineUtils.strToArrWhitespace(x);
            obj.sounds++;
            obj.assetCount++;
            var soundObj = {
                alias: arr[arr.length-3],
                path: arr[arr.length-2],
                type: arr[arr.length-1],
            }

            if((arr.length > 3 && arr[0] === "require") || $__engineData.__debugRequireAllSounds) {
                required.push(soundObj);
            } else {
                obj.deferredSounds.push(soundObj)
                obj.deferredAssets++;
            }
        }

        for(const soundObj of required) {
            obj.total++;
            __loadSound(obj, soundObj, () => {
                obj.onNextLoaded();
            });
        }

        obj.elements++;
        obj.testComplete(); // update the obj
    }
    EngineUtils.readLocalFileAsync(sound_file,callback);
}

__loadSound = function(obj, soundObj, callback) {
    var options = {
        url: soundObj.path,
        preload: true,
        autoPlay: false,
        loaded: callback,
        volume: $engine.audioGetTypeVolume(soundObj.type),
    }
    const sound = PIXI.sound.Sound.from(options);
    sound.__type = soundObj.type;
    $__engineData.__soundCache[soundObj.alias] = sound;
    sound.__engineAlias = soundObj.alias;
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
            if(__queryTextureObject(texObj,"require") || $__engineData.__debugRequireAllTextures) {
                required.push(texObj);
            } else {
                obj.deferredTextures.push(texObj);
                obj.deferredAssets++;
            }
        }
        for(const texObj of required) {
            __loadTexture(obj, texObj, () => {
                obj.onNextLoaded();
            });
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
            __generateAnimationsFromSheet(texObj, spritesheet);
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

        $__engineData.__textureAnimationCache[texObj.texName]=frames;

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

__generateAnimationsFromSheet = function(texObj, spritesheet) {
    var baseName = texObj.texName + "_";
    for(const anim of spritesheet.anims) {
        var frames = [];
        var name = anim.animName;
        for(const idx of anim.animFrames)
            frames.push($engine.getTexture(baseName+String(idx)));
        $__engineData.__textureAnimationCache[name] = frames;
    }
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
    for(;i<args.length-1;i++) {
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
            if(rows===-1) 
                throw new Error("Cannot limit before supplying dimensions");
            for(var k =0;k<rows;k++) {
                limit.push(parseInt(args[++i]));
            }
        } else if(arg==="animate") {
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

Scene_Boot.prototype.create = function() { // defer loading of the engine until as late as possible so that RPG maker calls are evaluated first.
    Scene_Base.prototype.create.call(this);
    DataManager.loadDatabase();
    ConfigManager.load();
    this.loadSystemWindowImage();
    __initialize();
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

// NOTE: RS_GraphicsMenu was modified to make these work again.
Scene_Menu.prototype.commandSave = function() {
    Scene_File.prototype.onSavefileOk.call(this);
    $gameSystem.onBeforeSave();
    if (DataManager.saveGame(1)) {
        this.onSaveSuccess();
    } else {
        this.onSaveFailure();
    }
    
};

Scene_Menu.prototype.onSaveSuccess = function() {
    SoundManager.playSave();
	StorageManager.cleanBackup(1);
    SceneManager.pop();
};

Scene_Menu.prototype.onSaveFailure = function() {
    SoundManager.playBuzzer();
};

SceneManager.snap = function() {
    UwU.onBeforeSnap(this._scene);
    var snap = Bitmap.snap(this._scene);
    UwU.onAfterSnap(this._scene);
    return snap;
}


// hook a in a global update.
SceneManager.updateManagers = function() {
    ImageManager.update();
    UwU.tick();
}

// place in block so that the local variables don't pollute the global namespace
{
    let oldFunc = SceneManager.renderScene;
    SceneManager.renderScene = function() {
        UwU.onBeforeRenderScene();
        oldFunc.call(this);
    }

    /*
    // Some info about GameInterpreter:
    // found in RPG objects, line 8765
    // will constantly execute commands, between each command it must wait for "updateWaitMode" to return true
    let giUpdateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === "engine") {
            if($__engineData.__advanceGameInterpreter) {
                $__engineData.__advanceGameInterpreter=false;
            } else {
                return true; // true = waiting
            }
        }
        return giUpdateWaitMode.call(this);
    };

    Game_Interpreter.prototype.command101 = function() {
        if(!$engine.isOverworld()) { // start engine!
            $__engineData.loadRoom = "OverworldTextRoom"
            $engine.startOverworld();
        }
        var msg = [];
        while (this.nextEventCode() === 401) {  // Text data
            this._index++;
            msg.push(this.currentCommand().parameters[0]);
        }
        OverworldTextController.instance.setTextArray(msg);
        OverworldTextController.instance.setMode(OverworldTextController.MODE_TEXT);
        this._index++;

        this.setWaitMode("engine")
        return false;

        // REF:
        if (!$gameMessage.isBusy()) {
            $gameMessage.setFaceImage(this._params[0], this._params[1]);
            $gameMessage.setBackground(this._params[2]);
            $gameMessage.setPositionType(this._params[3]);
            while (this.nextEventCode() === 401) {  // Text data
                this._index++;
                $gameMessage.add(this.currentCommand().parameters[0]);
            }
            switch (this.nextEventCode()) {
            case 102:  // Show Choices
                this._index++;
                this.setupChoices(this.currentCommand().parameters);
                break;
            case 103:  // Input Number
                this._index++;
                this.setupNumInput(this.currentCommand().parameters);
                break;
            case 104:  // Select Item
                this._index++;
                this.setupItemChoice(this.currentCommand().parameters);
                break;
            }
            this._index++;
            this.setWaitMode('message');
        }
        return false;
        // END REF
    };

    /*let giTerminate = Game_Interpreter.prototype.terminate;
    Game_Interpreter.prototype.terminate = function() {
        giTerminate.call(this);
        $engine.endOverworld();
    }*/
}

// jank support for 1x1 spritesheet characters.
// Doesn't work with anims. Must select top left of sprite. (prefix with @):
ImageManager.isObjectCharacter = function(filename) {
    var sign = filename.match(/^[\!\$\@]+/);
    return sign && sign[0].contains('!');
};

ImageManager.isBigCharacter = function(filename) {
    var sign = filename.match(/^[\!\$\@]+/);
    return sign && sign[0].contains('$');
};

ImageManager.isReallyBigCharacter = function(filename) {
    var sign = filename.match(/^[\!\$\@]+/);
    return sign && sign[0].contains('@');
};

Sprite_Character.prototype.patternWidth = function() {
    if (this._tileId > 0) {
        return $gameMap.tileWidth();
    } else if(this._isReallyBigCharacter) {
		return this.bitmap.width
	} else if (this._isBigCharacter) {
        return this.bitmap.width / 3;
    } else {
        return this.bitmap.width / 12;
    }
};

Sprite_Character.prototype.patternHeight = function() {
    if (this._tileId > 0) {
        return $gameMap.tileHeight();
    } else if (this._isReallyBigCharacter) {
		return this.bitmap.height
	} else if (this._isBigCharacter) {
        return this.bitmap.height / 4;
    } else {
        return this.bitmap.height / 8;
    }
};

Sprite_Character.prototype.setCharacterBitmap = function() {
    this.bitmap = ImageManager.loadCharacter(this._characterName);
    this._isBigCharacter = ImageManager.isBigCharacter(this._characterName);
    this._isReallyBigCharacter = ImageManager.isReallyBigCharacter(this._characterName);
};

// set the max HP to 100 for all entities.
Object.defineProperties(Game_BattlerBase.prototype, {
    mhp: {get: function(){ return 100 }, configurable:true}
})

// let the player hit 0 HP
Game_BattlerBase.prototype.paramMin = function(paramId) {
    return 0;
};

// append to the save system.
{
    let func1 = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        var result = func1.call(this);
        result.engineSave = $__engineSaveData;
        return result;
    }

    let func2 = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        func2.call(this,contents);
        $__engineSaveData = contents.engineSave;
    }
}

// make shop more streamlined.
{
    Window_ShopCommand.prototype.makeCommandList = function() {
        //this.addCommand(TextManager.buy,    'buy');
        //this.addCommand(TextManager.sell,   'sell',   !this._purchaseOnly);
        this.addCommand("Close", 'cancel'); // TextManager.cancel, 'cancel'
    };

    let func1 = Scene_Shop.prototype.create;
    Scene_Shop.prototype.create = function() {
        func1.call(this);
        this._commandWindow.isOkEnabled = function() {
            return false;
        }
        this._commandWindow.isTouchOkEnabled = function() {
            return true;
        }
        this.commandBuy();
    };

    Window_ShopCommand.prototype.maxCols = function() {
        return 1;
    };

    Scene_Shop.prototype.onBuyOk = function() {
        this._item = this._buyWindow.item();
        this.doBuy(1)
        SoundManager.playShop();
        this._goldWindow.refresh();
        this._statusWindow.refresh();
        this.activateBuyWindow();
    }

    let func2 = Scene_Shop.prototype.update
    Scene_Shop.prototype.update = function() {
        func2.call(this);
        if(!this._buyWindow.active)
            SceneManager.pop();
    }

}


// notes and overrides:
// YEP_CoreEngine 2475 commented out to prevent showing level
// AltimitMovement 1508 modified to become less precise
// YEP_MessageCore line 731 -> choice text.
// YEP_FootstepSounds line 442 -> random pitch
// CaeX_FootstepTime line 59 -> account for dashing

////////////////// end overriding RPG maker /////////////////

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
        return SceneManager._scene instanceof Scene_Engine; 
    }

    static sceneIsOverworld() {
        return SceneManager._scene instanceof Scene_Map; 
    }

    static onBeforeSnap(scene) {
        GUIScreen.onBeforeSnap(scene);
    }

    static onAfterSnap(scene) {
        GUIScreen.onAfterSnap(scene);
    }

    static onBeforeRenderScene() {
        for(const listener of UwU.__onBeforeRenderListeners)
            listener()
    }

    static addRenderListener(func) {
        UwU.__onBeforeRenderListeners.push(func)
    }

    static removeRenderListener(func) {
        var idx = UwU.__onBeforeRenderListeners.indexOf(func);
        if(idx===-1)
            throw new Error("Cannot remove listener that was not added.")
        UwU.__onBeforeRenderListeners.splice(idx,1);
    }

    static tick() {
        OwO.tick();
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
UwU.__onBeforeRenderListeners = [];

// Overworld Organizer
// I hate myself too.
class OwO {
    constructor() {
        throw new Error("Overworld Organizer cannot be instantiated")
    }

    static __init() {
        UwU.addSceneChangeListener(function(lastClass, newScene) {
            OwO.__spriteMapValid=false;
            if(UwU.mapIdChanged()) {
                OwO.__applyUntilMapChanged();
            }
            if(UwU.sceneIsOverworld()) { // any transition into overworld, from any other scene.
                if(UwU.mapIdChanged()) { // changed to a new map level
                    OwO.__deallocateRenderLayer();
                    $gamePlayer._touchTarget = null // reset the target why doesn't altimit do this like really.
                }
                if(OwO.__renderLayer)
                    OwO.__rebindRenderLayer();
                OwO.__doOverworldSetup();

                OwO.__applyAllFilters();
                OwO.__applyTimeOfDayFilter();
                OwO.__rebindSpecialRenderLayer();

                OwO.__listenForHP();
                OwO.__updateHP();
            }
            if(OwO.__renderLayer) {
                OwO.__syncRenderLayer();
            }
        })

        UwU.addRenderListener(function() {
            if(UwU.sceneIsOverworld() && OwO.__renderLayer)
                OwO.__syncRenderLayer();
        })

        OwO.__specialRenderLayer = new PIXI.Container();
    }

    static __listenForHP() {
        $gameParty.leader().setHp = function(hp) {
            this._hp = hp;
            this.refresh();
            OwO.__updateHP();
        };
    }

    // re-evaluates the current HP and firest the HP changed listener.
    static __updateHP() {
        OwO.__notifyHPChanged($gameParty.leader().hp);
    }

    static __notifyHPChanged(newHealth) {
        var colFilter = OwO.getColourFilter()
        var zoomFilter = OwO.getZoomBlurFilter()
        if(newHealth<50) {
            colFilter.brightness = EngineUtils.interpolate(newHealth/50,0.75,1,EngineUtils.INTERPOLATE_OUT)
            colFilter.green = EngineUtils.interpolate(newHealth/50,0.85,1,EngineUtils.INTERPOLATE_OUT)
            colFilter.blue = EngineUtils.interpolate(newHealth/50,0.85,1,EngineUtils.INTERPOLATE_OUT)
            zoomFilter.strength = EngineUtils.interpolate(newHealth/50,0.05,0,EngineUtils.INTERPOLATE_OUT)
        } else {
            colFilter.brightness = 1;
            colFilter.green = 1;
            colFilter.blue = 1;
            zoomFilter.strength = 0;
        }
        colFilter.saturation = EngineUtils.interpolate(newHealth/100,0,1,EngineUtils.INTERPOLATE_OUT_QUAD)
    }

    static __getPlayerHP() {
        return $gameParty.leader().hp;
    }

    static __applyUntilTick() {
        for(const obj of OwO.__applyFunctions){
            obj.resolved = obj.func(obj.data);
        }
        OwO.__applyFunctions = OwO.__applyFunctions.filter(x => !x.resolved);
    }

    static __applyUntilMapChanged() {
        OwO.__applyFunctions = OwO.__applyFunctions.filter(x => !x.mapOnly);
    }

    // contract with overworld... if an event exists reading switch, it will reset it to false once run.
    static __setAutorunSwitch() {
        $gameSwitches.setValue(4,true);
    }

    static __unsetAutorunSwitch() {
        $gameSwitches.setValue(4,false);
    }

    static __isAutorunSwitchSet() {
        return $gameSwitches.value(4);
    }

    static incrementTimeOfDay() {
        $gameVariables.setValue(OwO.__timeOfDayIndex,$gameVariables.value(OwO.__timeOfDayIndex)+1); // variable 11 is reserved for engine use
    }

    static getTimeOfDay() {
        return $gameVariables.value(OwO.__timeOfDayIndex);
    }

    static __applyTimeOfDayFilter() {
        var time = OwO.getTimeOfDay();
    }

    // continually calls func with data as the arg until it returns true, then removes it from it's list
    // mapOnly will cause it to be removed on map change if it wasn't resolved in time.
    static applyUntil(func, data, mapOnly = true) {
        var obj = {
            func:func,
            data:data,
            mapOnly:mapOnly,
            resolved: false,
        }
        OwO.__applyFunctions.push(obj);
    }

    static __getWorldSprites() {
        // this is an array of PIXI objects containing all of the rendered sprites on the world.
        var worldSprites = OwO.getSpriteset().children[0].children[2].children
        return worldSprites;
    }

    static getSpriteset() {
        return SceneManager._scene._spriteset;
    }

    static forwardInterpreter(eventId) {
        $gameMap._interpreter.setup(OwO.getEvent(eventId).list(),eventId);
    }

    static activateEvent(eventId) {
        OwO.getEvent(eventId)._starting = true;
    }

    static addConditionalFilter(evId, rpgVar = -1,) {
        var map = $gameMap._mapId;
        var arr = OwO.__getConditionalFilters(map);
        var data = {
            eventId: evId,
            RPGVariable: rpgVar, // the corresponding GameVaraible is set to 1, do not apply the filter... if this var is -1, apply always.
            //filter:shader, // never really used and unsupported by save data :(
            //filterUpdateFunc: filterUpdate,
        };
        arr.push(data);
        if(!OwO.__isAutorunSwitchSet()) { // convenience.
            OwO.refreshConditionalFilters();
        }
    }

    static removeConditionalFilter(eventId) {
        var map = $gameMap._mapId;
        var data = OwO.__getMapData(map);

        if(!OwO.__isAutorunSwitchSet()) {
            OwO.discardConditionalFilters();
        }

        data.filterList = data.filterList.filter(x => x.eventId !== eventId);

        if(!OwO.__isAutorunSwitchSet()) { // convenience.
            OwO.applyConditionalFilters();
        }
    }

    static removeConditionalFilters() { // removes from engine list AND game
        OwO.discardConditionalFilters();
        var map = $gameMap._mapId;
        var data = OwO.__getMapData(map);
        data.filterList = [];
    }

    static __getCurrentMapFilters() {
        return OwO.__getConditionalFilters($gameMap._mapId);
    }

    static __getMapData(mapId) {
        var data = $__engineSaveData.__mapData;
        if(!data[mapId]) {
            data[mapId] = {};
            data[mapId].filterList =  [];
            data[mapId].particleInit = -1;
            data[mapId].initialized = false;
        }
        return data[mapId];
    }

    static __getConditionalFilters(mapId) {
        return OwO.__getMapData(mapId).filterList;
    }

    static applyConditionalFilters() { // called from RPG maker.
        OwO.__clearUpdateFunctions();
        var spriteMap = OwO.__buildSpriteMap();
        for(const filterData of OwO.__getCurrentMapFilters()) {
            var RPGVariable = filterData.RPGVariable;
            // check fail, do not apply filter.
            if(RPGVariable!==-1 && $gameVariables.value(RPGVariable)===1)
                continue;
            var filter = OwO.__getDefaultOutlineShader(); //filterData.filter;
            var filterUpdate = OwO.__defaultUpdateFunc; //filterData.filterUpdateFunc;

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

    static refreshConditionalFilters() {
        OwO.discardConditionalFilters();
        OwO.applyConditionalFilters();
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

    static __doOverworldSetup() {
        var data = OwO.__getMapData($gameMap._mapId);
        if(!data.initialized) { // no filters, either this map has none or we're awaiting the data.
            OwO.__setAutorunSwitch();
            data.initialized = true;
            return;
        } else {
            OwO.__unsetAutorunSwitch();
        }
        // if data exists, exectue.
        OwO.applyConditionalFilters();
        OwO.__applyParticleInit();
    }

    static getMapContainer() {
        return SceneManager._scene.children[0];
    }

    static getMap() {
        return SceneManager._scene;
    }

    static __applyAllFilters() {
        OwO.__applyMapFilters();
        OwO.__applyHudFilters();
    }

    static __disableAllFilters() {
        OwO.__disableMapFilters();
        OwO.__disablePortraitFilters();
    }

    static __applyMapFilters() {
        if(!$engine.isLow())
            OwO.getMapContainer().filters = OwO.__gameFilters; // includes blur.
        else {
            OwO.getMapContainer().filters = [OwO.__colourFilter];
        }
    }

    static __disableMapFilters() {
        OwO.getMapContainer().filters = [];
    }

    static __applyHudFilters() {
        OwO.applyUntil(function(data) {
            var hungerBar = OwO.getHungerBar();
            if(!hungerBar)
                return false;
            hungerBar.filters = [OwO.__hudRedGlowFilter];
            return true;
        },undefined,true);
    }

    static __disablePortraitFilters() {
        OwO.getMapContainer().filters = [];
    }

    static getColourFilter() {
        return OwO.__colourFilter;
    }

    static getZoomBlurFilter() {
        return OwO.__zoomBlurFilter;
    }

    static getHud() {
        return SceneManager._scene._hud;
    }

    // HARD CODED
    static getPortrait() {
        var hud = OwO.getHud();
        if(!hud)
            return undefined;
        return hud.children[6];
    }

    // HARD CODED
    static getHungerBar() {
        var hud = OwO.getHud();
        if(!hud)
            return undefined;
        return hud.children[3];
    }

    static __addUpdateFunction(_func, _filter, _event) {
        OwO.__updateFunctions.push({func: _func, filter: _filter, event:_event});
    }

    static __clearUpdateFunctions() {
        OwO.__updateFunctions = [];
    }

    static __buildSpriteMap() { // returns an object where an eventId will map to a sprite.
        if(OwO.__spriteMapValid) // furthermore, _character will give access to the event that owns the sprite.
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
        OwO.__rebindRenderLayer();
        OwO.__syncRenderLayer();
    }

    static __deallocateRenderLayer() {
        if(OwO.__renderLayer) {
            OwO.__destroyRenderLayer();
            OwO.getSpriteset().children[0].removeChild(OwO.__renderLayer);
        }
        OwO.__renderLayer=undefined;
    }

    static __rebindRenderLayer() {
        if(!$engine.isLow())
            OwO.getSpriteset().children[0].addChild(OwO.__renderLayer);
    }

    static __rebindSpecialRenderLayer() {
        SceneManager._scene.addChild(OwO.__specialRenderLayer);
    }

    static __applyParticleInit() {
        var init = OwO.__getMapData($gameMap._mapId).particleInit;
        if(init === 1) {
            OwO.initializeRenderLayer();
            OwO.leafParticleInit();
        }
    }

    static __renderLayerTick() {
        if(!OwO.__renderLayer || !UwU.sceneIsOverworld())
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
    }

    static __specialRenderLayerTick() {
        if(!UwU.sceneIsOverworld())
            return;
        for(const child of OwO.__specialRenderLayer.children)
            child.__update(child);
        for(var i = OwO.__specialRenderLayer.children.length-1;i>=0;i--) {
            if(OwO.__specialRenderLayer.children._destroyed)
                OwO.__specialRenderLayer.removeChildAt(i);
        }
    }

    static __hudTick() {
        if(!UwU.sceneIsOverworld())
            return;
        var fac = OwO.__getPlayerHP();
        fac = EngineUtils.interpolate(fac/20,1,0,EngineUtils.INTERPOLATE_IN_QUAD); // note: inverted so it's actually out
        var fac2 = 2*fac*Math.abs(Math.sin(OwO.getGameTimer()/32))
        OwO.__hudRedGlowFilter.innerStrength = fac2/2
        OwO.__hudRedGlowFilter.outerStrength = fac2
    }

    static addTooltip(tip, time = 400) {
        var style = $engine.getDefaultTextStyle();
        var text = new PIXI.Text(tip,style);
        text.x = $engine.getWindowSizeX()/2;
        text.y = 0-text.height;
        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
        text.__timer = 0;
        text.__lifetime = time;
        text.__y1 = -50;
        var last = OwO.__specialRenderLayer.children[OwO.__specialRenderLayer.children.length-1];
        if(last && last.__y2!==undefined)
            last = last.__y2;
        else
            last = 0;
        text.__y2 = 30 + last;
        text.__update = function(self) {
            var sinFac1 = Math.sin(OwO.getGameTimer()/26);
            var sinFac2 = Math.sin((OwO.getGameTimer()+9)/23);

            self.scale.x = 1+sinFac1/32;
            self.scale.y = 1+sinFac2/32;
            self.rotation = 0;

            if(self.__timer<=75) {
                var fac = self.__timer/75;
                fac = EngineUtils.interpolate(fac,self.__y1,self.__y2,EngineUtils.INTERPOLATE_IN_ELASTIC);
                self.y = fac;
                self.rotation = (1-fac/self.__y2)/16
            }

            var num = self.__lifetime-40
            if(self.__timer>=num) {
                var fac = (self.__timer-num)/(self.__lifetime-num);
                fac = EngineUtils.interpolate(fac,self.__y2,self.__y1,EngineUtils.INTERPOLATE_IN_QUAD);
                self.y = fac;
                self.alpha = fac/self.height;
                self.rotation = -(1-fac/self.__y2)/16
            }

            self.rotation+=sinFac2/64;

            if(self.__timer>self.__lifetime)
                $engine.freeRenderable(self);
            self.__timer++;
        }
        OwO.__specialRenderLayer.addChild(text)
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
        OwO.__getMapData($gameMap._mapId).particleInit = 1;
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
        if(!$engine.isLow())
            OwO.__renderLayerTick();
        OwO.__specialRenderLayerTick();
        if(!UwU.sceneIsMenu())
            OwO.__RPGgameTimer++;
        OwO.__applyUntilTick();
        OwO.__hudTick();
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
OwO.__renderLayerIndex = 0;
OwO.__renderLayer = undefined;
OwO.__specialRenderLayer = undefined;
OwO.__renderLayerController = undefined;
OwO.__spriteMapValid = false;
OwO.__spriteMap = {};
OwO.__updateFunctions = [];
OwO.__applyFunctions = [];
OwO.__RPGgameTimer = 0;
OwO.__colourFilter = new PIXI.filters.AdjustmentFilter();
OwO.__zoomBlurFilter = new PIXI.filters.ZoomBlurFilter();
OwO.__hudRedGlowFilter = new PIXI.filters.GlowFilter();
OwO.__zoomBlurFilter.center = new PIXI.Point(816/2,624/2);
OwO.__zoomBlurFilter.strength = 0;
OwO.__zoomBlurFilter.innerRadius = 300;
OwO.__gameFilters = [OwO.__colourFilter,OwO.__zoomBlurFilter];
OwO.__timeOfDayIndex = 11;
OwO.__init();

OwO.__hudRedGlowFilter.color = 0xff0000;

class GUIScreen { // static class for stuff like the custom cursor. always running.

    static onBeforeRenderScene() {
        GUIScreen.__updateMouseLocation();
        GUIScreen.__renderMouse();
    }

    static __sceneChanged(previousClass, scene) {
        //GUIScreen.__bindContainer();
    }

    static __bindContainer() {
        SceneManager._scene.addChild(GUIScreen.__graphics); // bind directly to the scene
        GUIScreen.__graphics.filters = [GUIScreen.__filter]
        /*if($engine.isLow()) {
            GUIScreen.__graphics.filters = []
        } else {
            GUIScreen.__graphics.filters = [GUIScreen.__filter]
        }*/
    }

    static __initGraphics() {
        GUIScreen.__filter = new PIXI.filters.OutlineFilter(1,0xffffff)
        GUIScreen.__graphics.filters = [GUIScreen.__filter]
    }

    static __renderMouse() {
        var graphics = GUIScreen.__graphics
        var locations = GUIScreen.__mousePoints;
        var length = GUIScreen.__mousePoints.length;
        if(length===0)
            return;
        //graphics.cursor = undefined
        graphics.clear();
        graphics.moveTo(locations[0].x,locations[0].y)
        var size = length;
        var points = [];
        // code by Homan, https://stackoverflow.com/users/793454/homan
        // source: https://stackoverflow.com/a/7058606
        for(var i =0;i<length-1;i++) {
            graphics.lineStyle(size - i,0);
            var xc = (locations[i].x + locations[i + 1].x) / 2;
            var yc = (locations[i].y + locations[i + 1].y) / 2;
            points.push(new EngineLightweightPoint(xc,yc))
            graphics.quadraticCurveTo(locations[i].x, locations[i].y, xc, yc);
        }
        graphics.lineStyle(0);
        graphics.beginFill(0);
        graphics.drawCircle(locations[0].x,locations[0].y,(size-1)/2)
        for(var i =0;i<length-1;i++) {
            graphics.drawCircle(points[i].x,points[i].y,(size - i)/2)
        }
        graphics.endFill()

    }

    static __mouseMoveHandler(event) {
        GUIScreen.__mouseDirect = new EngineLightweightPoint(event.clientX,event.clientY)
    }

    static __updateMouseLocation() {
        if(!GUIScreen.__mouseDirect)
            return;
        if(!Graphics._renderer)
            return;
        var locCorrected = Graphics._renderer.plugins.interaction.mouse.getLocalPosition(GUIScreen.__graphics,GUIScreen.__mouseDirect);
        GUIScreen.__mouse = locCorrected;

        GUIScreen.__mousePoints.unshift(new EngineLightweightPoint(GUIScreen.__mouse.x,GUIScreen.__mouse.y))
        if(GUIScreen.__mousePoints.length > GUIScreen.__maxMousePoints)
            GUIScreen.__mousePoints.pop();
    }

    static onBeforeSnap(scene) {
        scene.removeChild(GUIScreen.__graphics);
    }

    static onAfterSnap(scene) {
        GUIScreen.__bindContainer();
    }
}

GUIScreen.__graphics = new PIXI.Graphics();
GUIScreen.__mouse = undefined;
GUIScreen.__updateMouseLocation();
GUIScreen.__mousePoints = [];
GUIScreen.__maxMousePoints = 10;
GUIScreen.__maxMouseTrailLength = 10;
GUIScreen.__initGraphics();
UwU.addRenderListener(GUIScreen.onBeforeRenderScene);
document.addEventListener("pointerrawupdate", GUIScreen.__mouseMoveHandler); // fix one frame lag.
UwU.addSceneChangeListener(GUIScreen.__sceneChanged);