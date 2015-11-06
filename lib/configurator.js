var fs = require('fs');

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
 * @private
 */
Configurator.prototype.getLinkIOServerUrl = function() {

    return this.settings.logs_link_io_server.url;

}

/**
 * Get link.io.server script path
 * @returns {String}
 * @private
 */
Configurator.prototype.getLinkIOServerScript = function() {

    return this.settings.logs_link_io_server.script;

}

/**
 * Get link.io.server.monitoring url
 * @returns {String}
 * @private
 */
Configurator.prototype.getLinkIOMonitoringServerUrl = function() {

    return this.settings.link_io_server_monitoring.url;

}

/**
 * Get link.io.server.monitoring port
 * @returns {int}
 * @private
 */
Configurator.prototype.getLinkIOMonitoringServerPort = function() {

    return this.settings.link_io_server_monitoring.port;

}

/**
 * Get link.io.server.monitoring port
 * @returns {int}
 * @private
 */
Configurator.prototype.getLinkIOMonitoringServerVersion = function() {

    return this.package.version;

}

/**
 * Generate infos file for web client
 * @returns {String}
 * @private
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