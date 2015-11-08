var crypto = require('crypto');
var saltLength = 13;

/**
 * Constructor
 * @type {PasswordManager}
 */
function PasswordManager() {
}

/**
 * Generate a hash from a password
 * @param password
 * @returns {String}
 */
PasswordManager.prototype.createHash = function(password) {
    var salt = generateSalt(saltLength);
    var hash = sha1(password + salt);
    return salt + hash;
}

/**
 * Validate or not a password from a hash
 * @param password Password
 * @param hash Hash to compare
 * @returns {boolean}
 */
PasswordManager.prototype.validateHash = function(password, hash) {
    var salt = hash.substr(0, saltLength);
    var validHash = salt + sha1(password + salt);
    return hash === validHash;
}

/**
 * Hash a password thanks to sha1 algorithm
 * @param str Password to hash
 * @returns {boolean}
 * @private
 */
function sha1(str) {
    return crypto.createHash('sha1').update(str).digest('hex');
}

/**
 * Generate a random salt
 * @param len Hash's length
 * @returns {string}
 * @private
 */
function generateSalt(len) {
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ',
        setLen = set.length,
        salt = '';
    for (var i = 0; i < len; i++) {
        var p = Math.floor(Math.random() * setLen);
        salt += set[p];
    }
    return salt;
}

module.exports = function() {
    return new PasswordManager();
};