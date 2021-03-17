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
            throw new Error("Room " + name + " does not exist.");
        $engine.__currentRoom = room;
        room.loadRoom();
        return room;
    }

    static roomExists(name) {
        return RoomManager.__rooms[name]!==undefined
    }

    /**
     * Gets the current room
     * @returns {Room} The current room
     */
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