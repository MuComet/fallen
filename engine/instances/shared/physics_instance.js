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

    physicsObjectFromHitbox(options) {
        options = options || {};
        if(!this.hitbox)
            throw new Error("No hitbox available to turn into a physics object");
        var poly = this.hitbox.getPolygonHitbox().__srcPolygon;
        var points = [];
        for(var i =0;i<poly.points.length;i+=2) {
            points.push(new Matter.Vector.create(poly.points[i],poly.points[i+1]))
        }
        points = Matter.Vertices.clockwiseSort(points);
        return Matter.Bodies.fromVertices(this.x,this.y,[points],options)
    }

    __implicit() {
        if(!this.__physicsObject)
            return;
        this.x = this.__physicsObject.position.x
        this.y = this.__physicsObject.position.y
        this.angle = this.__physicsObject.angle
    }
}