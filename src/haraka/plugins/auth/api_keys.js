exports.register = function () {
 this.inherits('redis')

 // establish a connection to redis.
 this.cfg = {
  redis: {
    host: '127.0.0.1',
    port: 5570
  }
 }

 this.merge_redis_ini()

 this.register_hook('init_master', 'init_redis_plugin')
 this.register_hook('init_child', 'init_redis_plugin')
 this.loginfo('api_keys authentication plugin registered.')
}
