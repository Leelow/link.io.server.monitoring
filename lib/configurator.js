var fs = require('fs');
var passwordManager = require('./passwordManager.js')();

var configurator = new Configurator();
var settingsFile = './settings.json';
var packageFile = './package.json';
var publicInfoFile = './static/infos.json';

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
 * Get link.io.server host
 * @returns {String}
 */
Configurator.prototype.getLinkIOServerHost = function() {
    return this.settings.link_io_server.host;
}

/**
 * Get link.io.server port
 * @returns {int}
 */
Configurator.prototype.getLinkIOServerPort = function() {
    return this.settings.link_io_server.port;

}

/**
 * Get link.io.server script path
 * @returns {String}
 */
Configurator.prototype.getLinkIOServerScript = function() {
    return this.settings.link_io_server.script;
}

/**
 * Get link.io.server script arguments
 * @returns {String}
 */
Configurator.prototype.getLinkIOServerArguments = function() {
    return ["monitoring=" + this.settings.link_io_server_monitoring.port,
         "port=" + this.settings.link_io_server.port];
}

/**
 * Get link.io.server.monitoring host
 * @returns {String}
 */
Configurator.prototype.getLinkIOMonitoringServerHost = function() {

    return this.settings.link_io_server_monitoring.host;

}

/**
 * Get link.io.server.monitoring port
 * @returns {int}
 */
Configurator.prototype.getLinkIOMonitoringServerPort = function() {
    return this.settings.link_io_server_monitoring.port;
}


Configurator.prototype.getAdminMail = function() {
    return this.settings.link_io_server_monitoring.adm_account_mail;
}


Configurator.prototype.getAdminPassword = function() {
    return this.settings.link_io_server_monitoring.adm_account_password;
}

/**
 * Get link.io.server.monitoring port
 * @returns {int}
 */
Configurator.prototype.getLinkIOMonitoringServerVersion = function() {
    return this.package.version;
}

/**
 * Generate info file for web client
 * @returns {String}
 */
Configurator.prototype.generatePublicInfosFile = function() {

    var infos = {'link_io_server_monitoring': {
                                                'version' : this.getLinkIOMonitoringServerVersion(),
                                                'host'    : this.getLinkIOMonitoringServerHost(),
                                                'port'    : this.getLinkIOMonitoringServerPort()
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