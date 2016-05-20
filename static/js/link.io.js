/**
 * Link.IO Web API
 */
var linkIO = new __LinkIO();

function __LinkIO() {
    this.socket = undefined;
    this.eventHandlers = {};
    this.currentRoom = "";
    this.userJoinHandler = function() {};
    this.userLeftHandler = function() {};
    this.usersInRoom = [];
    this.currentUser = {};
    this.connectedHandler = function() {};
}

/**
 * Start connection to the server
 * @param serverUrl
 * @param mail
 * @param password
 * @param api_key
 * @param callback Called when you are successfully connected. Current user is passed as argument.
 */
__LinkIO.prototype.connect = function(serverUrl, mail, password, api_key, callback) {
    this.socket = io(serverUrl + "?mail=" + encodeURIComponent(mail) + "&password=" + encodeURIComponent(password) + "&api_key=" + encodeURIComponent(api_key));
    var that = this;

    this.socket.on('info', function(currentUser) {
        that.currentUser = currentUser;
        callback(currentUser);
    })

    this.socket.on('error', function(err) {
        throw new Error(err);
    })

    this.socket.on("event", function(e) {
        if(typeof e.type != 'undefined' && typeof that.eventHandlers[e.type] != 'undefined') {
            that.eventHandlers[e.type](e.data);
        }
    });

    this.socket.on('reconnect', function() {
        if(that.currentRoom != "") {
            that.joinRoom(that.currentRoom);
        }
    });

    this.socket.on("users", function(users) {
        if(users.length > that.usersInRoom.length) {
            users.forEach(function(user1) {
                var found = false;
                that.usersInRoom.forEach(function(user2) {
                    if(user1.id == user2.id)
                        found = true;
                });
                if(!found)
                    that.userJoinHandler(user1);
            });
        }
        else {
            that.usersInRoom.forEach(function(user1) {
                var found = false;
                users.forEach(function(user2) {
                    if(user1.id == user2.id)
                        found = true;
                });

                if(!found)
                    that.userLeftHandler(user1);
            });
        }

        that.usersInRoom = users;
    });
}

/**
 * Enter in a new room
 * @param cb
 */
__LinkIO.prototype.createRoom = function(cb) {
    this.__checkInit();
    var that = this;
    this.socket.emit("createRoom", "", function(id) {
        that.currentRoom = id;
        cb();
    });
}

/**
 * Join an existing room. If it doesn't exist, create a new one with the given ID
 * @param id
 * @param cb
 */
__LinkIO.prototype.joinRoom = function(id, cb) {
    this.__checkInit();
    this.currentRoom = id;
    var that = this;
    this.socket.emit("joinRoom", id, function(id, users) {
        that.usersInRoom = users;
        cb(id, users);
    });
}


/**
 * Called when a new user join the current room.
 * @param callback
 */
__LinkIO.prototype.onUserJoinRoom = function(callback) {
    this.userJoinHandler = callback;
}

/**
 * Called when a user leave the current room.
 * @param callback
 */
__LinkIO.prototype.onUserLeftRoom = function(callback) {
    this.userLeftHandler = callback;

}


/**
 * Get all users in current room
 * @param callback
 */
__LinkIO.prototype.getUsersInRoom = function(callback) {
    callback(this.usersInRoom);
}

/**
 * Add an event handler
 * @param name
 * @param callback
 */
__LinkIO.prototype.on = function(name, callback) {
    this.eventHandlers[name] = callback;
}

/**
 * Remove an event handler
 * @param name
 * @param callback
 */
__LinkIO.prototype.off = function(name) {
    return delete this.eventHandlers[name];
}

/**
 * Send an event
 * @param name
 * @param data
 * @param receiveAlso
 */
__LinkIO.prototype.send = function(name, data, receiveAlso) {
    this.__checkInit();
    if(typeof receiveAlso == 'undefined')
        receiveAlso = false;

    var ev = {};
    ev.data = data;
    ev.type = name;
    ev.me = receiveAlso;

    this.socket.emit("event", ev);
}

/**
 * Send an event to specific users
 * @param name
 * @param data
 * @param idList
 */
__LinkIO.prototype.sendToList = function(name, data, idList) {
    this.__checkInit();

    var ev = {};
    ev.data = data;
    ev.type = name;
    ev.idList = idList;

    this.socket.emit("eventToList", ev);
}

__LinkIO.prototype.getLatency = function(callback) {
    var before = new Date();
    this.socket.emit("ping", function() {
        callback(new Date() - before);
    });
}

__LinkIO.prototype.__checkInit = function() {
    if(typeof this.socket == 'undefined')
        throw new Error("LinkIO: call to 'connect' before.");
}