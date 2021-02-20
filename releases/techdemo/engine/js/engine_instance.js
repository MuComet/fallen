/**
 * Variables list:
 * x - The instance's x location in the room. Used for rendering and collisions
 * 
 * y - The instance's y location in the room. Used for rendering and collisions
 * 
 * xScale - The instance's x scale. Reflects on both the sprite and the hitbox.
 * 
 * yScale - The instance's y scale. Reflects on both the sprite and the hitbox.
 * 
 * alpha - The instance's alpha, reflects on the sprite.
 * 
 * angle - The instance's rotation in radians, reflects on the sprite and the hitbox.
 * 
 * depth - How far away the instance is from the camera. Larger numbers mean that the instance is farther away (and so gets rendered first).
 * If two instances have the same depth, then the one created later will always render later
 * 
 */
class EngineInstance {
    /**
     * Do not override this method. Use onCreate instead.
     * @param  {...any} args The arguments to pass to onCreate()
     * 
     * ---
     * onCreate():
     *
     * IMPORTANT: This method is only run automcatically when the engine DOES NOT create this instance via a room.
     * 
     * This method is called automatically whenever you create an instance using the 'new' syntax.
     * This method has access to all arguments passed into 'new' it despite not being a constructor.
     * 
     * This means that if you say new EngineInstance(50,50,100) and have onCreate(x,y,z), then x = 50, y = 50, and z = 100.
     */
    constructor(...args) {
        this.depth = 0;
        this.x=0;
        this.y=0;
        this.xScale = 1;
        this.yScale = 1;
        this.alpha = 1;
        this.angle = 0;
        this.__alive = true;
        this.__hasSprite = false;
        this.hitbox = undefined;
        this.oid = -1;
        this.id = -1;
        this.__renderables = [];
        this.__pixiDestructables = [];
        IM.__addToWorld(this);
        if(args[0]===$engine.__instanceCreationSpecial) {
            this.x = args[1];
            this.y = args[2];
            this.depth = args[3];
            this.angle = args[4];
            this.xScale = args[5];
            this.yScale = args[6];
            this.onEngineCreate(); // called when the instance is first created
        } else
            this.onCreate.apply(this,args); // calls on create of calling inst with args
    }

    /**
     * Sets the Sprite of this instance. Utility method to make your life a bit easier. The sprite will automatically follow
     * the instance as well as scale and rotate to match xScale, yScale, and angle.
     * @param {PIXI.Sprite} sprite The sprite to use
     */
    setSprite(sprite) {
        this.__hasSprite = true;
        this.__sprite = $engine.createRenderable(this,sprite,true);
    }

    /**
     * Removes the current sprite and disposes of it properly. This method is safe to call and will do nothing if you have no sprite.
     */
    removeSprite() {
        if(!this.__hasSprite) 
            return;
        $engine.removeRenderable(this.__sprite);
    }

    /**
     * Sets the hitbox of this instance. This is a pure syntactic sugar method and simply sets this.hitbox = hitbox.
     * 
     * The hitbox will automatically follow the instance as well as scale and rotate to match xScale, yScale, and angle.
     * 
     * By default, hitboxes are undefined. Attempting to collide with an instance with no hitbox will
     * cause a crash.
     * @param {Hitbox} hitbox The hitbox to use
     */
    setHitbox(hitbox) {
        this.hitbox=hitbox;
    }

    /**
     * Returns the instance's current hitbox. By default, hitboxes are undefined. Attempting to collide with an instance with no hitbox will
     * cause a crash.
     * @returns {Hitbox} The current hitbox, or undefined if not set.
     */
    getHitbox() {
        return this.hitbox;
    }

    /**
     * Return the current sprite of the instance. Can only be used after setSprite() is called.
     * @throws If the instance does not currently have a sprite.
     * @returns {PIXI.Sprite} The current sprite.
     */
    getSprite() {
        if(!this.__hasSprite)
            throw new Error("Object has no sprite");
        return this.__sprite;
    }

    /**
      * IMPORTANT: This method is only run automcatically when the engine DOES NOT create this instance via a room.
     * 
     * This method is called automatically whenever you create an instance using the 'new' syntax.
     * This method has access to all arguments passed into 'new' it despite not being a constructor.
     * 
     * This means that if you say new EngineInstance(50,50,100) and have onCreate(x,y,z), then x = 50, y = 50, and z = 100.
     */
    onCreate() {} // this is a very special function, every subclass that overrides this method will have it called with the args on creation

    /**
     * IMPORTANT: This method is only run automcatically when the engine creates this instance via a room.
     * 
     * This method is called by the engine immediately after the instance is created and added to the room.
     * It is highly recommended that all your generic creation code be placed in here and this method be called by onCreate().
     */
    onEngineCreate() {};

    /**
     * Step is a generic event that gets called once per frame (60 times per second). Use this event to run the main logic of your object (movement, collision, etc).
     * Note that the order in which this event gets called is the same order as instances were created. The first instance to be created in the room will always run first
     * and the last instance to be created will always run last.
     * 
     * This event is the first event to run per frame.
     */
    step() {}

    /**
     * preDraw is called once per frame (60 times per second) and may be used to set up variables for draw(). Becuase of the draw contract,
     * this method must exist so that you can reliably set up your data.
     * 
     * This event is NOT sorted, so the order that it is called in may not be representative of the draw order.
     * 
     * This event runs right after step(), and right before draw()
     */
    preDraw() {}

    /**
     * Draw contract: Do not edit any variables in this method, only read them.
     * 
     * This event is sorted, unlike other events, it will be called in the same order that objects will be rendered in.
     * 
     * Draw is the method that you can use to render more advanced objects to the screen. It is called once per frame (60 times per second) reguardless of
     * whether or not the game is currently paused. Note that anything created using $engine.createRenderable() is
     * automaitcally rendered to the screen without any intervention. This method exists if you need to modify your renderable such as telling
     * a Graphics to draw a line.
     * 
     * If you wish to draw to the GUI layer, you may call $engine.requestRenderToGUI() which will cause the specified
     * renderable to be rendered on the GUI layer on this specific frame. The GUI layer renders 1:1 with the canvas. i.e.
     * 0,0 is the top left and $engine.getWindowSizeX(), $engine.getWindowSizeY() is the bottom right.
     * 
     * Note that because sorting happens before this event is run, attempting to change the depth of this instance during
     * this event will not change the depth until next frame
     * 
     * This event is the last event to run.
     * 
     * @param {PIXI.Graphics} gui A graphics object which is drawn independently of the camera. All elements here are drawn 1:1
     * with the screen raguardless of camera position.
     * @param {PIXI.Graphics} camera A shared graphics object to use for convenience. Aligned in room space.
     */
    draw(gui, camera) {}

    /**
     * Event that gets called once per frame (60 times a second) if the game is currently paused.
     * This can be used to continue to update some visual functions while the game is paused in the background.
     * DO NOT use this function to alter anything gameplay wise. This includes the depth of an instance. If the game is paused, the player should not
     * be able to interact in any meaningful way.
     */
    pause() {}

    /**
     * onDestroy is at the end of the frame called when this instance is destroyed for any using destroy().
     */
    onDestroy() {}

    /**
     * cleanup is always called before an isntance is removed from existence.
     * This includes:
     * The game ending, the room ending, or the instance being destroyed manually
     * Always clean up anything you have created here if applicable.
     */
    cleanup() {}

    /**
     * Called as the first method when the room finishes loading
     */
    onRoomStart() {}

    /**
     * Called as the last method once a room ends. The only other function to be called later than this is onGameEnd()
     */
    onRoomEnd() {}

    /**
     * Called as the very last function when the engine is told to shut down.
     */
    onGameEnd() {}

    /**
     * Mark this instance for destruction at the end of the frame.
     */
    destroy() {
        IM.destroy(this);
    }
}

EngineInstance.__ENGINE_ORDER_FIRST = false;