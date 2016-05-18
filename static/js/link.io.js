/**
 * Link.IO Web API
 */
socket = {};
var linkIO = new __LinkIO();
function __LinkIO() {
	this.socket = undefined;
	this.eventHandlers = {};
	this.currentRoom = "";
	this.joinRoomHandler = function() {};
}

__LinkIO.prototype.connect = function(serverUrl, mail, password, api_key, cb) {
	this.socket = io(serverUrl + "?mail=" + encodeURIComponent(mail) + "&password=" + encodeURIComponent(password) + "&api_key=" + encodeURIComponent(api_key));
	this.socket.on('connect', function() {
		cb();
	});
	socket = this.socket;
	var that = this;

	bindEvent(this);

	socket.on('reconnect', function() {
		if(that.currentRoom != "") {
			that.joinRoom(that.currentRoom != 'crash' ? that.currentRoom : 'abcd', that.joinRoomHandler);
		}
	})
}

function bindEvent(linkIO) {
	linkIO.socket.on("event", function(e) {
		if(typeof e.type != 'undefined' && typeof linkIO.eventHandlers[e.type] != 'undefined') {
			linkIO.eventHandlers[e.type](e.data);
		}
	});
}

__LinkIO.prototype.createRoom = function(cb) {
	this.__checkInit();
	var that = this;
	this.socket.emit("createRoom", "", function(id) {
		that.currentRoom = id;
		cb();
	});
}

__LinkIO.prototype.joinRoom = function(id, cb) {
	this.__checkInit();
	this.currentRoom = id;
	this.joinRoomHandler = cb;
	this.socket.emit("joinRoom", id, cb);
}

__LinkIO.prototype.onUsersInRoomChange = function(callback) {
	this.__checkInit();
	this.socket.on("users", callback);
}

__LinkIO.prototype.on = function(name, callback) {
	this.eventHandlers[name] = callback;
}

__LinkIO.prototype.off = function(name) {
	return delete this.eventHandlers["_" + name];
}

__LinkIO.prototype.emit = function(name, data, receiveAlso) {
	this.__checkInit();
	if(typeof receiveAlso == 'undefined')
		receiveAlso = false;

	var ev = {};
	ev.data = data;
	ev.type = name;
	ev.me = receiveAlso;

	this.socket.emit("event", ev);
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