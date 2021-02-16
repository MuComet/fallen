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
        IM.__childMap[1] = IM.__childTree;
        var id=2;
        for(const x of instances) {
            IM.__accessMap[id] = [];
            x.__oid=id++;
        };

        var BFS = function(target) {
            var stack = [IM.__childTree];
            if(IM.__childTree.__children!==undefined)
                IM.__childTree.__children.forEach(x => stack.push(x));

            while(stack.length!==0) {
                var len = stack.length;
                for(var i = 0;i<len;i++) {
                    var tree = stack.shift(); // pop(0)
                    if(target.prototype instanceof tree.__oid) // is the current instance a parent of the target instance?
                        return tree;
                    if(tree.__children!==undefined) { // are there more elements?
                        tree.__children.forEach(x=>stack.push(x));
                    }
                }
            }
            return undefined;
        }

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
            //perform BFS
            var result = BFS(x);
            if(result!==undefined) { // result is at some point a superclass of x
                result = returnDeepest(x,result); // result is the lowest superclass of x
                
                var r = {
                    __oid:x,
                    __children:undefined
                };

                if(result.__children===undefined) {
                    result.__children = [];
                } else {
                    rebind(r,result.__children);
                }
                result.__children.push(r);
                IM.__childMap[IM.__oidFrom(x)] = r;
            } else {
                throw "Attemping to add non Instance subclass("+String(x)+") to IM";
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

        IM.__cleanup();
        IM.__deleteFromObjects();
        IM.__step();
        IM.__preDraw();
        IM.__draw();
        IM.__sort();
        
    }

    static __cleanup() {
        for(const obj of IM.__cleanupList) {
            obj.onDestroy();
            $engine.__disposeHandles(obj);
            //obj.__dispose();
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

    static __step() {
        for(const obj of IM.__objects)
            obj.step();
    }

    static __preDraw() {
        for(const obj of IM.__objects) // this is where you can prepare for draw by checking collisions and such -- draw should only draw
            obj.preDraw();
    }

    // DOES NOT ACTUALLY RENDER ANYTHING! (and therefore does not need to be sorted. Engine does the rendering.)
    static __draw() {
        $engine.getCamera().getCameraGraphics().clear();
        $engine.__GUIgraphics.clear();
        for(const obj of IM.__objects)
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
        return IM.__accessMap[oid];
    }

    static __findById(id) {
        for(const inst of objects) {
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
        this.__initializeVariables() // clear IM
    }

    // possible optimization related to instantly breaking out if both are rectangle colliders (since PCS would be the same as an actual collision)
    static __generatePCS(source,x,y, targets) {
        var lst = [];
        if(source.hitbox.getType()==Hitbox.TYPE_RECTANGLE) { // fast mode.
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

    static __isCollidingWith(source, PCS) {
        for(const inst of PCS) {
            if(source.hitbox.doCollision(inst.hitbox))
                return true;
        }
        return false;
    }

    static destroy(...targets) { // marks instances for deletion at the end of the frame
        for(const input of targets)
            for(const inst of IM.__queryObjects(input))
                inst.__alive = false;
                
    }

    static instanceCollision(source,x,y, ...targets) {
        var PCS = IM.__generatePCS(source,x,y,targets);
        
        for(const inst of PCS) {
            if(source.hitbox.doCollision(inst.hitbox,x,y))
                return true;
        }
        return false;
    }

    static instanceCollisionList(source,x,y,...targets) {
        var PCS = IM.__generatePCS(source,x,y,targets);

        var lst = []
        for(const inst of PCS) {
            if(source.hitbox.doCollision(inst.hitbox,x,y))
                lst.push(inst);
        }
        return lst;
    }

    static instanceCollisionPoint(x,y, ...targets) {
        var PCS = IM.__generatePCSFromPoint(x,y,...targets);
        for(const inst of PCS) {
            if(inst.hitbox.containsPoint(x,y));
                return true;
        }
        return false;
    }

    static instanceCollisionPointList(x,y, ...targets) {
        var PCS = IM.__generatePCSFromPoint(x,y,...targets);
        var lst = [];
        for(const inst of PCS) {
            if(inst.hitbox.containsPoint(x,y));
                lst.push(inst);
        }
        return lst;
    }

    static instanceNearest(source, ...targets) {
        var nearest=null;
        var dst = 99999999;
        for(const i of targets) {
            var lst = IM.__queryObjects(i);
            for(const inst of lst) {
                var nDst = source.hitbox.distanceToHitboxSq(inst.hitbox);
                if(nDst < dst) {
                    dst = nDst;
                    nearest = inst;
                }
            }
        }
        return nearest;
    }

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
                }
            }
        }
        return nearest;
    }

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
     * 
     * @param {EngineInstance} obj  the class to query
     * @param {Number} ind optional - the nth instance to find.
     * @returns {EngineInstance} The requested instance, or undefined if unvailable.
     */
    static find(obj, ind=0) {
        var oid = IM.__oidFrom(obj);
        return IM.__accessMap[oid][ind]
    }

    static with(target, script, other = undefined) {
        var instances = IM.__queryObjects(target);
        for(const inst of instances)
            script(inst, other);
    }

}

IM.__accessMap = [];        // indexes every single instance with oid being the key and an array of all those instances being the value
IM.__alteredLists = [];     // whether or not this specific OID has had instances removed (lets us skip filtering objects which haven't been touched)
IM.__childMap = {};         // maps each oid to a tree containting all children oid
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
