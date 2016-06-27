'use strict'

/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['api localhost', 'api sproutup'],
  /**
   * Your New Relic license key.
   */
  license_key: '804e8f49f033cb0cc754faa2f571126525ff4fa0',
  logging: {
    filepath: 'stdout',
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'info'
  }
}
