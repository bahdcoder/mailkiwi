const plugin = require("haraka-plugin-dkim")

exports.register = function () {
  this.inherits("haraka-plugin-dkim")

  this.load_dkim_ini()
}

exports.load_dkim_ini = function () {
  plugin.load_dkim_ini.call(this)

  this.cfg.sign.enabled = true
  this.cfg.verify.enabled = true
}

exports.get_sign_properties = function (connection, done) {
  if (!connection.transaction) return

  const domain = plugin.get_sender_domain.bind(this)(connection)

  if (!domain) {
    connection.transaction.results.add(this, {
      msg: "sending domain not detected",
      emit: true,
    })
  }

  const props = { domain }

  if (!connection.notes.team_usage) {
    connection.logerror(this, err)
    return done(
      new Error(
        `Error getting DKIM for currently authenticated team ${domain}: ${err}`,
      ),
      props,
    )
  }

  const { decrypted_dkim_private_key, dkimSubDomain: dkim_sub_domain } =
    connection.notes.team_usage

  done(null, {
    domain,
    selector: dkim_sub_domain,
    private_key: decrypted_dkim_private_key,
  })
}
