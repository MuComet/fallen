class RoomManager {
    static __addRoom(name, room) {
        RoomManager.__rooms[name] = room;
    }

    static getRoom(name) {
        return RoomManager.__rooms[name];
    }

    static loadRoom(name) {
        var room = RoomManager.getRoom(name);
        if(room===undefined)
            throw "Room " + name + "does not exist.";
        room.loadRoom();
        return room;
    }

    static roomExists(name) {
        return RoomManager.__rooms[name]!==undefined
    }

    static currentRoom() {
        return $engine.__currentRoom;
    }

    static changeRooms(name) {
        $engine.setRoom(name);
    }

    static __init() {
        for(const key in RoomManager.__rooms) {
            RoomManager.__rooms[key].__init();
        }
    }
}

RoomManager.__rooms = {};