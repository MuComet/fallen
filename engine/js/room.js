/**
 * Containter for a room in the engine.
 * 
 * Highly unfinished and mostly deprecated. Generally used exclusively for creating a MinigameController.
 */
class Room {
    constructor() {
        this.name="DEFAULT_ROOM_NAME";
        this.__instances = [];
        // although technically supported, everything below basically got replaced by
        // the onCreate() event in the minigameController.
        this.__extern = {
        };
        this.__settings = {
            "cameraX":0,
            "cameraY":0,
            "cameraWidth":800,
            "cameraHeight":640,
            "cameraRotation":0,
            "backgroundColour":0x000000
        };
        this.__onLoad = [];
    }

    loadRoom() {
        for(const inst of this.__instances) {
            inst.create();
        }
        for(const script of this.__onLoad) {
            eval(script);
        }
    }

    getExtern(name) {
        var data = this.__extern[name];
        if(data===undefined) throw "External data " + name + " not found"
        return data;
    }

    __putExtern(name, data) {
        this.__extern[name] = data;
    }

    __init() {
        for(const x of this.__instances) {
            x.inst = eval(x.inst);
        }
    }

    static __roomFromData(name, data) {
        var room = new Room();
        const iter = data.entries();
        Room.__parseData(room,iter);
        room.name=name;
        return room;
    }

    static __parseData(room, iter) {
        while(true) {
            var n = iter.next();
            if(n.done) 
                break

            const data = n.value;
            const line = data[1] // do not combine.

            if(line.startsWith("//")) {
                continue;
            } else if(line.startsWith("block")) {
                const arr = EngineUtils.strToArrWhitespace(line);
                let type = arr[1];
                let name = "$ENGINE_DEFAULT";
                if(arr.length>=2) {
                    name = arr[2];
                }
                const blockData = Room.__parseAsLines(iter);
                if(type==="room_data") {
                    Room.__parseKV(room, blockData);
                } else if(type==="instances") {
                    Room.__parseInstances(room, blockData)
                } else if(type==="extern") {
                    room.__putExtern(name,blockData);
                } else if(type==="room_load") {
                    room.__onLoad.push(blockData.join("\n"));
                } else {
                    throw new Error("Unknown room key "+type);
                }
            }
        }
    }

    static __parseInstances(room, data) {
        for(const x of data) { // Instance name, 
            const arr = EngineUtils.strToArrWhitespace(x);// Instance1 <xPos> <yPos> <depth> <rotation> <scaleX> <scaleY>
            var inst = arr[0];
            var xx = parseFloat(arr[1]);
            var yy = parseFloat(arr[2]);
            var depth = arr.length>3 ? parseInt(arr[3]) : 0;
            var rot = arr.length>4 ? parseFloat(arr[4]) : 0;
            var scaleX = arr.length>5 ? parseFloat(arr[5]) : 1;
            var scaleY = arr.length>6 ? parseFloat(arr[6]) : 1;
            room.__instances.push(new RoomInstance(inst,xx,yy,depth,rot,scaleX,scaleY));
        }
    }

    static __castInput(val) {
        var numeric = true;
        var fl = false;
        for(const char of val) {
            if((char<='0' || char >='9')) {
                if(char !== '.') {
                    numeric = false;
                    break;
                } else {
                    fl = true;
                }
            }
        }
        if(numeric) { // number
            if(fl) return parseFloat(val);
            return parseInt(val);
        }
        return val; // string
    }

    static __parseKV(room,data) {
        for(const x of data) {
            const arr = EngineUtils.strToArrWhitespace(data);
            var key = arr[0];
            var val = arr[1];
            room.__settings[key]=Room.__castInput(val);
        }
    }

    static __parseAsLines(iter) {
        var arr = [];
        while(true) {
            var n = iter.next();
            if(n.done) 
                break

            const data = n.value;
            const line = data[1] // no i can't combine these two lines
            if(line==="endblock") {
                return arr;
            } else {
                arr.push(line);
            }
        }
        throw "Unexpected EOF";
    }

}

class RoomInstance {
    constructor(inst,x,y,depth,rot,sx,sy) {
        this.inst = inst;
        this.x = x;
        this.y = y;
        this.depth=depth;
        this.rot = rot;
        this.sx = sx;
        this.sy = sy;
    }

    create() {
        return new this.inst($engine.__instanceCreationSpecial,this.x,this.y,this.depth,this.rot,this.sx,this.sy)
    }
}