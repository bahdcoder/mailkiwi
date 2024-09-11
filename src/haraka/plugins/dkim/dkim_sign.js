const plugin = require("haraka-plugin-dkim")

exports.register = function () {
  this.api_keys_plugin = api_keys_plugin
  this.inherits("haraka-plugin-dkim")

  // this.inherits("haraka-plugin-redis")

  // this.cfg = {
  //   redis: get_redis_connection_details(),
  // }

  // this.merge_redis_ini()

  this.load_dkim_ini()

  // this.register_hook("init_master", "init_redis_plugin")
  // this.register_hook("init_child", "init_redis_plugin")
}

exports.load_dkim_ini = function () {
  plugin.load_dkim_ini.call(this)

  this.cfg.sign.enabled = true
  this.cfg.verify.enabled = true
}

exports.get_sign_properties = function (connection, done) {
  if (!connection.transaction) return

  const domain = plugin.get_sender_domain.bind(this)(connection)

  connection.loginfo(
    this,
    `Getting DKIM for currently authenticated team ${domain}.`,
  )

  if (!domain) {
    connection.transaction.results.add(this, {
      msg: "sending domain not detected",
      emit: true,
    })
  }

  const props = { domain }

  if (!connection.notes) {
    connection.notes = {}
  }

  if (!connection.notes.team_usage) {
    const err = new Error(
      `Error getting DKIM for currently authenticated team ${domain}.`,
    )
    connection.logerror(this, err)
    return done(err, props)
  }

  const { decrypted_dkim_private_key, dkimSubDomain: dkim_sub_domain } =
    connection.notes.team_usage

  done(null, {
    domain,
    selector: dkim_sub_domain,
    private_key: decrypted_dkim_private_key,
  })
}
