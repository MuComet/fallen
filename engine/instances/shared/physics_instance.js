class EnginePhysicsInstance extends EngineInstance {

    attachPhysicsObject(phys) {
        if(this.__physicsObject !== undefined) {
            this.removePhysicsObject();
        }
        this.__physicsObject = phys;
        $engine.physicsAddBodyToWorld(this.__physicsObject)
        return this;
    }

    detachPhysicsObject() {
        if(this.__physicsObject!==undefined) {
            $engine.physicsRemoveBodyFromWorld(this.__physicsObject)
            this.__physicsObject=undefined;
        }
    }

    getPhysicsObject() {
        return this.__physicsObject;
    }

    __implicit() {
        if(!this.__physicsObject)
            return;
        this.x = this.__physicsObject.position.x
        this.y = this.__physicsObject.position.y
        this.angle = this.__physicsObject.angle
    }
}