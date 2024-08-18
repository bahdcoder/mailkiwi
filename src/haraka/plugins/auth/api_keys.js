// Plugin: auth_redis_api_key.js

exports.register = function () {
  const plugin = this;

  plugin.inherits('redis');
  plugin.inherits('auth/auth_base');

  plugin.register_hook('init_master', 'init_redis_plugin')
  plugin.register_hook('init_child', 'init_redis_plugin')
  plugin.loginfo('api_keys authentication plugin registered.')
};

exports.hook_capabilities = function (next, connection) {
    const plugin = this;
    
    if (!connection.tls.enabled) {
        connection.loginfo(plugin, "No TLS, skipping AUTH advertising");
        return next();
    }

    connection.capabilities.push('AUTH');
    connection.notes.allowed_auth_methods = ['AUTH'];
    next();
};

exports.check_plain_passwd = function (connection, username, password, cb) {
    const plugin = this;

    if (!plugin.redis) {
        connection.logerror(plugin, 'Redis not connected');
        return cb(false);
    }

    const redis_key = `TEAM:${username}:API_KEY`;

    plugin.redis.get(redis_key, (err, encrypted_api_key) => {
        if (err) {
            connection.logerror(plugin, `Redis error: ${err.message}`);
            return cb(false);
        }

        if (!encrypted_api_key) {
            connection.loginfo(plugin, `No API key found for user: ${username}`);
            return cb(false);
        }

        try {
            const decrypted_api_key = plugin.decrypt_api_key(encrypted_api_key);
            const is_valid = (decrypted_api_key === password);

            if (is_valid) {
                connection.loginfo(plugin, `Auth succeeded for user: ${username}`);
                return cb(true);
            } else {
                connection.loginfo(plugin, `Auth failed for user: ${username}`);
                return cb(false);
            }
        } catch (decrypt_err) {
            connection.logerror(plugin, `Decryption error: ${decrypt_err.message}`);
            return cb(false);
        }
    });
};

exports.decrypt_api_key = function (encrypted_api_key) {
    // Implement your decryption logic here
    // This is a placeholder function
    return encrypted_api_key;
};

// // HAS TO MATCH KEYS STORED BY MONOLITH
// const known_keys = {
//   TEAM_API_KEY: (username) => `TEAM:${username}:API_KEY`,
//   TEAM_START_OF_MONTH_DATE: (username) => `TEAM:${username}:START_OF_MONTH_DATE`,
//   TEAM_FREE_CREDITS: (username) => `TEAM:${username}:FREE_CREDITS`,
//   TEAM_AVAILABLE_CREDITS: (username) => `TEAM:${username}:AVAILABLE_CREDITS`,
// }

// exports.register = function () {
//  this.inherits('redis')
// this.inherits('auth/auth_base');

//  // establish a connection to redis.
//  this.cfg = {
//   redis: {
//     host: '127.0.0.1',
//     port: 5570
//   }
//  }

//  this.merge_redis_ini()

//  this.register_hook('init_master', 'init_redis_plugin')
//  this.register_hook('init_child', 'init_redis_plugin')
//  this.loginfo('api_keys authentication plugin registered.')
// }
