var fs = require('fs');
var passwordManager = require('./passwordManager.js')();

var configurator = new Configurator();
var settingsFile = './settings.json';
var packageFile = './package.json';
var publicInfoFile = './client/infos.json';

/**
 * Constructor
 * @type {Configurator}
 */
function Configurator() {
    this.settings = undefined;
    this.package = undefined;
}

/**
 * Initialise with configurations
 * @param settings
 * @param package
 * @returns {Configurator}
 * @private
 */
Configurator.prototype._init = function(settings, package) {
    this.settings = settings;
    this.package = package;

    return this;
}

/**
 * Get app settings
 * @returns {Object}
 * @private
 */
function getSettings() {
    return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
}

/**
 * Update app settings
 * @private
 */
function updateSettings() {
    fs.writeFileSync(settingsFile, JSON.stringify(configurator.settings, null, 2), 'utf8');
}

/**
 * Get app package information
 * @returns {Object}
 * @private
 */
function getPackage() {
    return JSON.parse(fs.readFileSync(packageFile, 'utf8'));
}

/**
 * Get link.io.server url
 * @returns {String}
 */
Configurator.prototype.getLinkIOServerUrl = function() {

    return this.settings.logs_link_io_server.url;

}

/**
 * Get link.io.server script path
 * @returns {String}
 */
Configurator.prototype.getLinkIOServerScript = function() {

    return this.settings.logs_link_io_server.script;

}

/**
 * Get link.io.server.monitoring url
 * @returns {String}
 */
Configurator.prototype.getLinkIOMonitoringServerUrl = function() {

    return this.settings.link_io_server_monitoring.url;

}

/**
 * Get link.io.server.monitoring port
 * @returns {int}
 */
Configurator.prototype.getLinkIOMonitoringServerPort = function() {

    return this.settings.link_io_server_monitoring.port;

}

/**
 * Get link.io.server.monitoring port
 * @returns {int}
 */
Configurator.prototype.getLinkIOMonitoringServerVersion = function() {

    return this.package.version;

}

/**
 * Get link.io.server.monitoring hashed password
 * @returns {String}
 * @private
 */
function getLinkIOMonitoringServerHashedPassword() {

    var password = configurator.settings.link_io_server_monitoring.password;

    // If the password isn't already hashed, we do it
    if(!password.isHashed) {
        var hashedPassword = passwordManager.createHash(password.value);
        password.value = hashedPassword;
        password.isHashed = true;

        // Update settings in the file
        updateSettings();

    }

    return password.value;

}

/**
 * Get link.io.server.monitoring login
 * @returns {String}
 * @private
 */
function getLinkIOMonitoringServerLogin() {

    return configurator.settings.link_io_server_monitoring.login;

}

/**
 * Get link.io.server.monitoring session's length in minutes
 * @returns {int}
 */
Configurator.prototype.getLinkIOMonitoringSessionLength = function() {

    return configurator.settings.link_io_server_monitoring.sessionLength;

}

/**
 * Check if credentials corresponding to the link.io.server.monitoring.credentials
 * @param loginToCompare Login to check
 * @param passwordToCompare Non-hashed password to check
 * @returns {boolean}
 */
Configurator.prototype.checkCredentials = function(loginToCompare, passwordToCompare) {

    // Get server's credentials
    var login = getLinkIOMonitoringServerLogin();
    var hashed = getLinkIOMonitoringServerHashedPassword();

    return (loginToCompare == login) &&  passwordManager.validateHash(passwordToCompare, hashed);

}

/**
 * Generate info file for web client
 * @returns {String}
 */
Configurator.prototype.generatePublicInfosFile = function() {

    var infos = {'link_io_server_monitoring': {
                                                'version' : this.getLinkIOMonitoringServerVersion(),
                                                'url'     : this.getLinkIOMonitoringServerUrl()
                                              }
    };

    fs.writeFile(publicInfoFile, JSON.stringify(infos, null, 4), function(err) {
        if(err)
            console.log(err);
    });

}

module.exports = function() {
    return configurator._init(getSettings(), getPackage());
};