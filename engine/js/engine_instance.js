class EngineInstance {
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
        this.oid = -1;
        this.id = -1;
        this.__renderables = [];
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

    setSprite(sprite) {
        this.__hasSprite = true;
        this.__sprite = $engine.createRenderable(this,sprite,true);
    }

    removeSprite() {
        if(!this.__hasSprite) 
            return;
        $engine.removeRenderable(this.__sprite);
    }

    getSprite() {
        if(!this.__hasSprite)
            throw "Object has no sprite";
        return this.__sprite;
    }

    onCreate() {} // this is a very special function, every subclass that overrides this method will have it called with the args on creation

    onEngineCreate() {}; // MUST BE NULL ARG. never called in this class, only for reference. Called when created via a room

    step() {}

    preDraw() {}

    draw(gui, camera) {}

    onDestroy() {}

    onRoomStart() {}

    onRoomEnd() {} // guaranteed to run any time the current room is changed out of, if the game is ending, this funciton is called before onGameEnd

    onGameEnd() {}

    destroy() {
        IM.destroy(this);
    }
}