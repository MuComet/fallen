/**
 * Collision checking and general interactions with other instances.
 * All collision functions take in one of 4 possible values for ...targets:
 * (EngineInstance, instance of EngineInstance, instance.id, instance.oid).
 * It is recommended to only use the first two options.
 */
class IM {
    constructor() {
        throw "Cannot instantiate static class.";
    }

    static __initializeVariables() {
        IM.__objects = [];
        IM.__objectsSorted = []
        for(var i = 1;i<=IM.__numRegisteredClasses;i++)
            IM.__accessMap[i] = [];
            IM.__alteredLists[i] = false;
        IM.__cleanupList = [];
        IM.ind = 100000;
    }

    static __init(instances) { // assumed instances is a list of classes.
        IM.__numRegisteredClasses = instances.length;
        IM.__accessMap = [[],];
        IM.__accessMap[1] = [];
        EngineInstance.__oid=1;
        IM.__childMap = [undefined,]
        IM.__childMap[1] = IM.__childTree;
        var id=2;
        for(const x of instances) {
            IM.__accessMap[id] = [];
            x.__oid=id++;
        };

        // find the deepest instance in the tree that is a parent of target
        var returnDeepest = function(target, result) {
            if(result.__children===undefined) {
                return result;
            }
            for(const tree of result.__children) {
                if(target.prototype instanceof tree.__oid)
                    return returnDeepest(target,tree);
            };
            
            return result;
        }

        // check if any child in children is a subclass of newParent, if it is, bind it to the
        // newParent instead of it's previous parent (ensure only direct subclasses are in __children)
        var rebind = function(newParent, children) {
            for(let i =0;i<children.length;i++) {
                if(children[i].__oid.prototype instanceof newParent.__oid) {
                    let t = children[i];
                    children.splice(i--,1);
                    if(newParent.__children === undefined) 
                        newParent.__children=[];
                    newParent.__children.push(t);
                }
            }
        }

        instances.forEach(x => { // manage children
            if(x.prototype instanceof EngineInstance) {
                var result = returnDeepest(x,IM.__childTree); // result is the lowest superclass of x
                
                var r = {
                    __oid:x,
                    __children:undefined
                };

                if(result.__children===undefined) {
                    result.__children = [];
                } else {
                    // check if any children on this level are children of us.
                    rebind(r,result.__children);
                }
                result.__children.push(r);
                IM.__childMap[IM.__oidFrom(x)] = r;
            } else {
                throw new Error("Attemping to add non EngineInstance subclass("+String(x)+") to IM");
            }
        });
        // final step, replace classes with their OID for faster lookup
        var recurseLoop = function(input) {
            if(input===undefined) return;
            for(const x of input) {
                x.__oid = IM.__oidFrom(x.__oid);
                recurseLoop(x.__children);
            }
        }

        recurseLoop(IM.__childTree.__children);
        IM.__childTree.__oid=1;
    }

    static __doSimTick() {
        var mode = $engine.__getPauseMode();
        if(mode===0) {
            IM.__cleanup();
            IM.__deleteFromObjects();
            IM.__implicit();
            IM.__step();
            IM.__preDraw();
            IM.__sort();
            IM.__draw();
        } else if(mode===1) {
            IM.__sort();
            IM.__pause();
            IM.__draw();
        } else {
            IM.__sort();
            IM.__pause();
            $engine.__pauseSpecialInstance.step(); // run the special instance's step.
            IM.__draw();
        }
        
    }

    static __cleanup() {
        for(const obj of IM.__cleanupList) {
            //obj.onDestroy();
            obj.cleanup();
            $engine.__disposeHandles(obj);
        }
    }

    static __deleteFromObjects() {
        IM.__cleanupList = [];
        for(const obj of IM.__objects) {
            if(!obj.__alive) {
                IM.__cleanupList.push(obj);
                IM.__alteredLists[obj.oid]=true;
            }
        }
        if(IM.__cleanupList.length!==0) { // don't waste CPU if there's nothing to update...
            IM.__objects=IM.__objects.filter(x=>x.__alive);
            IM.__objectsSorted=IM.__objectsSorted.filter(x=>x.__alive);
            for(var i =1;i<=IM.__numRegisteredClasses;i++) { // only filter lists that were changed
                if(IM.__alteredLists[i])
                    IM.__accessMap[i] = IM.__accessMap[i].filter(x => x.__alive)
                IM.__alteredLists[i] = false;
            }
        }
    }

    static __implicit() {
        for(const obj of IM.__objects)
            obj.__implicit();
    }

    static __step() {
        for(const obj of IM.__objects)
            obj.step();
    }

    static __preDraw() {
        for(const obj of IM.__objects) // this is where you can prepare for draw by checking collisions and such -- draw should only draw
            obj.preDraw();
    }

    static __pause() {
        for(const obj of IM.__objects)
            obj.pause();
    } 

    // does not actually render anything to the canvas, but is called in sorted order.
    static __draw() {
        $engine.getCamera().getCameraGraphics().clear();
        $engine.__GUIgraphics.clear();
        for(const obj of IM.__objectsSorted)
            obj.draw($engine.__GUIgraphics, $engine.getCamera().getCameraGraphics());
    } 

    static __sort() {
        IM.__objectsSorted.sort((x,y) => {
            // because we sort in place, we must explicitly make our sort stable. later created objects always render last
            var d = (y.depth - x.depth);
            if(d===0)
                return (x.id-y.id)
            return d
        })
    }

    static __getMatrixFor(inst) { //TODO: unnecessary? camera does this?
        return PIXI.Matrix().rotate(inst.angle).scale(inst.xScale,inst.yScale).translate(inst.x,inst.y);
    }

    static __findAll(oid) {
        if(IM.__childMap[oid].children===undefined)
            return IM.__accessMap[oid];
        var result = [];
        result.push(...IM.__accessMap[oid])
        for(const childOid of IM.__childMap[oid].children) {
            result.push(...IM.__findAll(childOid));
        }
        return result;
    }

    static __findById(id) {
        for(const inst of __objects) {
            if(inst.id===id)
                return inst;
        }
        return null;
    }

    static __oidFrom(cl) {
        return cl.__oid;
    }

    static __children(oid) {
        var obj = IM.__childMap[oid];
        return IM.__childrenDFS([],obj);
    }

    static __childrenDFS(list, obj) {
        list.push(obj.__oid);
        if(obj.__children !== undefined)
            obj.__children.forEach(x=>IM.__childrenDFS(list,x));
        return list;
    }

    static __addToWorld(inst) {
        IM.__register(inst);
        IM.__add(inst);
        return inst;
    }

    static __register(inst) {
        var oid = IM.__oidFrom(inst.constructor);
        inst.oid=oid;
        inst.id = IM.ind;
        IM.ind++;
    }

    static __add(inst) {
        if(inst.constructor.__ENGINE_ORDER_FIRST)
            IM.__objects.unshift(inst);
        else
            IM.__objects.push(inst);
        IM.__objectsSorted.push(inst);
        IM.__accessMap[inst.oid].push(inst);
    }

    static __endGame() {
        for(const obj of IM.__objects) {
            obj.onRoomEnd();
        }
        for(const obj of IM.__objects) {
            obj.onGameEnd();
        }
        for(const obj of IM.__objects) {
            obj.cleanup();
            $engine.__disposeHandles(obj);
        }
    }

    static __startRoom() {
        for(const obj of IM.__objects) {
            obj.onRoomStart();
        }
    }

    static __endRoom() {
        for(const obj of IM.__objects) {
            obj.onRoomEnd();
        }
        for(const obj of IM.__objects) {
            obj.onDestroy();
        }
        for(const obj of IM.__objects) {
            obj.cleanup();
            $engine.__disposeHandles(obj)
        }
        this.__initializeVariables() // clear IM
    }

    // possible optimization related to instantly breaking out if both are rectangle colliders (since PCS would be the same as an actual collision)
    static __generatePCS(source,x,y, targets, fastForward = true) {
        var lst = [];
        if(source.hitbox.getType()==Hitbox.TYPE_RECTANGLE && fastForward) { // fast mode.
            for(var i = 0;i<targets.length;i++) {
                var r = IM.__queryObjects(targets[i]).filter(obj=>obj !== source && source.hitbox.checkBoundingBox(obj.hitbox,x,y))
                for(const e of r) {
                    if(e.hitbox.getType()===Hitbox.TYPE_RECTANGLE) {// early break out. both are rectangle so collision is done.
                        return [e];
                    }
                    lst.push(e)
                }
            }
        } else {
            for(var i = 0;i<targets.length;i++) {
                var r = IM.__queryObjects(targets[i]).filter(obj=>obj !== source && source.hitbox.checkBoundingBox(obj.hitbox,x,y))
                for(const e of r)
                    lst.push(e)
            }
        }
        return lst;
        
    }

    static __generatePCSFromPoint(x,y, targets) {
        var lst = [];
        for(var i = 0;i<targets.length;i++) {
            var r = IM.__queryObjects(targets[i]).filter(obj=>obj.hitbox.boundingBoxContainsPoint(x,y));
            for(const e of r)
                lst.push(e)
        }
        return lst;
    }

    static __queryObjects(val) { // returns an array containing the object requested, if the request is invalid the return is undefined.
        var type = typeof(val);
        if(type === 'function') { // an object
            return IM.__findAll(IM.__oidFrom(val));
        } else if(type === 'object'){
            return [val];
        } else { //if(type === 'number')
            if(val < 100000) // we have an OID
                return IM.__findAll(val);
            //otherwise, it's an id.
            var v = IM.__findById(val);
            if(v) 
                return [v];
            return [];
        }
    }

    /**
     * @deprecated
     * @param {*} source 
     * @param {*} PCS 
     */
    static __isCollidingWith(source, PCS) {
        for(const inst of PCS) {
            if(source.hitbox.doCollision(inst.hitbox))
                return true;
        }
        return false;
    }

    /**
     * Queries all targets instanes and then marks them for deletion. Also calls the onDestroy() method immediately.
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     */
    static destroy(...targets) {
        for(const input of targets)
            for(const inst of IM.__queryObjects(input)) {
                if(inst.__alive) {
                    inst.__alive = false;
                    inst.onDestroy();
                }
            }
                
    }

    /**
     * Performs a collision with source against the specified targets.
     * When you call this function, you are asking the engine to move source to x,y and then check if it's colliding with any objects, then move it back
     * @param {EngineInstance} source The source instance to collide with
     * @param {Number} x The x position to collide at
     * @param {Number} y the y position to collide at
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {Boolean} True if there is a collision, false otherwise
     */
    static instanceCollision(source,x,y, ...targets) {
        var PCS = IM.__generatePCS(source,x,y,targets);
        
        for(const inst of PCS) {
            if(source.hitbox.doCollision(inst.hitbox,x,y))
                return true;
        }
        return false;
    }

    /**
     * Performs a collision with source against the specified targets.
     * When you call this function, you are asking the engine to move source to x,y and then check if it's colliding with any objects, then move it back
     * @param {EngineInstance} source The source instance to collide with
     * @param {Number} x The x position to collide at
     * @param {Number} y the y position to collide at
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {EngineInstance} The first EngineInstance that is collided with, or undefined if there are none.
     */
    static instancePlace(source,x,y, ...targets) {
        var PCS = IM.__generatePCS(source,x,y,targets);
        
        for(const inst of PCS) {
            if(source.hitbox.doCollision(inst.hitbox,x,y))
                return inst;
        }
        return undefined;
    }

    /**
     * Performs a collision with source against the specified targets and returns a list of all instances which are colliding with source.
     * This function is slow because the engine is forced to check all instances. consider other options if you don't need a list.
     * When you call this function, you are asking the engine to move source to x, y, then check if it's colliding with any objects, then move it back
     * @param {EngineInstance} source The source instance to collide with
     * @param {Number} x The x position to collide at
     * @param {Number} y the y position to collide at
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {EngineInstance} A non null list of all instances that collide with source
     */
    static instanceCollisionList(source,x,y,...targets) {
        var PCS = IM.__generatePCS(source,x,y,targets,false);

        var lst = []
        for(const inst of PCS) {
            if(source.hitbox.doCollision(inst.hitbox,x,y))
                lst.push(inst);
        }
        return lst;
    }

    /**
     * Performs a collision at the specified location using exact hitboxes and finds the first instance of targets which contains that point.
     * @param {Number} x The x position to collide at
     * @param {Number} y the y position to collide at
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {EngineInstance} The first EngineInstance that is collided with, or undefined if there is none.
     */
    static instancePosition(x,y, ...targets) {
        var PCS = IM.__generatePCSFromPoint(x,y,targets);
        for(const inst of PCS) {
            if(inst.hitbox.containsPoint(x,y));
                return inst;
        }
        return undefined;
    }

    /**
     * Performs a collision at the specified location using exact hitboxes and determines if any instance of targets contains that point
     * @param {Number} x The x position to collide at
     * @param {Number} y the y position to collide at
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {Boolean} True if any instance collides with the point, false otherwise
     */
    static instanceCollisionPoint(x,y, ...targets) {
        var PCS = IM.__generatePCSFromPoint(x,y,targets);
        for(const inst of PCS) {
            if(inst.hitbox.containsPoint(x,y));
                return true;
        }
        return false;
    }
    /**
     * Performs a collision at the specified location using exact hitboxes and returns a list of all instances which are contain x, y.
     * This function is slow because the engine is forced to check all instances. consider other options if you don't need a list.
     * @param {Number} x The x position to collide at
     * @param {Number} y the y position to collide at
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {...EngineInstance} A non null list of all instances that collide with source
     */
    static instanceCollisionPointList(x,y, ...targets) {
        var PCS = IM.__generatePCSFromPoint(x,y,targets,false);
        var lst = [];
        for(const inst of PCS) {
            if(inst.hitbox.containsPoint(x,y));
                lst.push(inst);
        }
        return lst;
    }

    /**
     * Queries targets and finds the nearest instance to source. The distance determined is exact and uses hitboxes to find the nearest position on two instances.
     * As a result, this function is slow. If you don't need exact distance, use instanceNearestPoint.
     * When you call this function, you are asking the engine to move source to x, y, then find the nearest instance, then move it back
     * @param {EngineInstance} source The source instance to collide with
     * @param {Number} x The x position to collide at
     * @param {Number} y the y position to collide at
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {EngineInstance} The nearest instance of targets, or undefined if no targets exist.
     */
    static instanceNearest(source,x,y, ...targets) {
        var ox = source.x
        var oy = source.y;
        source.x = x;
        source.y = y;

        var nearest=undefined;
        var dst = 99999999;
        for(const i of targets) {
            var lst = IM.__queryObjects(i);
            for(const inst of lst) {
                var nDst = source.hitbox.distanceToHitboxSq(inst.hitbox);
                if(nDst < dst) {
                    dst = nDst;
                    nearest = inst;
                    if(nDst===0) {
                        source.x = ox;
                        source.y = oy;
                        return nearest;
                    }
                }
            }
        }
        source.x = ox;
        source.y = oy;
        return nearest;
    }

    /**
     * Queries targets and finds the nearest instance the point x,y.
     * Distance is calculated using exact distance to hitboxes.
     * @param {EngineInstance} source The source instance to collide with
     * @param {Number} x The x position to collide at
     * @param {Number} y the y position to collide at
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {EngineInstance} The nearest instance of targets, or undefined if no targets exist.
     */
    static instanceNearestPoint(x,y,...targets) {
        var nearest=null;
        var dst = 99999999;
        for(const i of targets) {
            var lst = IM.__queryObjects(i);
            for(const inst of lst) {
                var nDst = inst.hitbox.distanceToPointSq(x,y);
                if(nDst < dst) {
                    dst = nDst;
                    nearest = inst;
                    if(nDst===0)
                        return nearest;
                }
            }
        }
        return nearest;
    }

    /**
     * Performs a collision along the line defined by x1,y1,x2,y2. If the line intersects any instance of targets, then the function returns true.
     * @param {Number} x1 The x coord of the first point
     * @param {Number} y1 the y coord of the first point
     * @param {Number} x2 the x coord of the second point
     * @param {Number} y2 the y coord of the second point
     * @param  {...EngineInstance} targets N instances of EngineInstance or classes
     * @returns {Boolean} True if any instance collides with the line, false otherwise
     */
    static instanceCollisionLine(x1,y1,x2,y2,...targets) {
        for(const i of targets) {
            var lst = IM.__queryObjects(i);
            for(const inst of lst) {
                if(inst.hitbox.checkLineCollision(new EngineLightweightPoint(x1,y1),new EngineLightweightPoint(x2,y2)))
                    return true;
            }
        }
        return false;
    }

    /**
     * Queries the InstanceManager's internal list of objects and returns the nth instance of type obj.
     * This is a constant time operation.
     * 
     * NOTE: THIS FUNCTION IS NOT HIERARCY AWARE. Only instances of type obj will be returned, 
     * sublcasses are ignored. This is because the engine makes no guarantees of order after the
     * inital class is found. So finding subclasses would be useless.
     * 
     * @param {EngineInstance} obj  the class to query
     * @param {Number} [ind=0] the nth instance to find.
     * @returns {EngineInstance} The requested instance, or undefined if unvailable.
     */
    static find(obj, ind=0) {
        var oid = IM.__oidFrom(obj);
        return IM.__accessMap[oid][ind]
    }

    /**
     * Runs the specified function as func(target,other) on all instances that match target.
     * @param {EngineInstance} target The target instance, or class.
     * @param {Fucntion} script The script to execute
     * @param {EngineInstance} [other] the calling instance (this)
     */
    static with(target, script, other = undefined) {
        var instances = IM.__queryObjects(target);
        for(const inst of instances)
            script(inst, other);
    }

}

IM.__accessMap = [];        // indexes every single instance with oid being the key and an array of all those instances being the value
IM.__alteredLists = [];     // whether or not this specific OID has had instances removed (lets us skip filtering objects which haven't been touched)
IM.__childMap = [];         // maps each oid to a tree containting all children oid
IM.__childTree = {
    __oid:EngineInstance,
    __children:undefined
}
IM.__numRegisteredClasses = -1;
IM.__initializeVariables();

/*
class Instance {

}

class t extends Instance{

}

class f extends t {
}

class z extends f {

}

class h extends z {
}

IM.__init([t,h,z,f]);

console.log(IM.__children(IM.__oidFrom(Instance)));
*/
