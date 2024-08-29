// Plugin: auth_redis_api_key.js
const url = require("url")
const { createDecipheriv, createHash } = require("crypto")

// HAS TO MATCH KEYS STORED BY MONOLITH
const known_keys = {
  TEAM: (username) => `TEAM:${username}`,
}

// Configuration: We are disabling constrain_sender option so it allows authentication user during smtp to be different from mail_from in the email.
// Once we set up domain verification, we will add a constraint to make sure only mail_from any_user@exampledomain.com can authenticate and send from a verified exampledomain.com domain.

const encryption_settings = {
  algorithm: "aes-256-cbc",
  encryption_key: createHash("sha256")
    .update(process.env.APP_KEY)
    .digest(),
  iv_delimiter: ":",
}

exports.get_redis_connection_details = function () {
  const parsed_url = url.parse(process.env.REDIS_URL)

  const [username, password] = (parsed_url.auth || "").split(":")

  const host = parsed_url.hostname
  const port = parsed_url.port

  return {
    host,
    port,
    username: username ?? undefined,
    password: password ?? undefined,
  }
}

exports.register = function () {
  const plugin = this

  plugin.inherits("haraka-plugin-redis")
  plugin.inherits("auth/auth_base")

  this.cfg = {
    redis: plugin.get_redis_connection_details(),
  }

  this.merge_redis_ini()

  plugin.register_hook("init_master", "init_redis_plugin")
  plugin.register_hook("init_child", "init_redis_plugin")
}

exports.check_plain_passwd = async function (
  connection,
  username,
  password,
  cb,
) {
  const plugin = this
  const redis = this.db

  if (!redis) {
    connection.logerror(
      plugin,
      "Redis connection needed for authentication.",
    )
    return cb(false)
  }

  const redis_key = known_keys["TEAM"](username)

  connection.loginfo(plugin, `Checking auth for user: ${redis_key}`)

  try {
    const team_usage = await redis.hGetAll(redis_key)

    const {
      apiKey: encrypted_api_key,
      encryptedDkimPrivateKey: dkim_private_key,
      ...other_team_usage_keys
    } = team_usage

    let decrypted_dkim_private_key = null

    if (dkim_private_key) {
      decrypted_dkim_private_key = plugin.decrypt_api_key(
        connection,
        username,
        dkim_private_key,
      )
    }

    connection.loginfo(
      plugin,
      `Setting transaction notes for team details`,
    )
    connection.notes.team_usage = {
      decrypted_dkim_private_key,
      ...other_team_usage_keys,
    }

    if (!encrypted_api_key) {
      connection.loginfo(
        plugin,
        `No API key found for username: ${username}`,
      )
      return cb(false)
    }

    try {
      const decrypted_api_key = plugin.decrypt_api_key(
        connection,
        username,
        encrypted_api_key,
      )
      const is_valid = decrypted_api_key === password

      // todo: check free send credits
      // todo: track sends
      // todo: check paid send credits
      // todo: reject valid with helpful message

      if (is_valid) {
        connection.loginfo(plugin, `Auth succeeded for user: ${username}`)
        return cb(true)
      } else {
        connection.loginfo(plugin, `Auth failed for user: ${username}`)
        return cb(false)
      }
    } catch (decrypt_err) {
      connection.logerror(
        plugin,
        `Decryption error and auth failed: ${decrypt_err.message}`,
      )
      return cb(false)
    }
  } catch (error) {
    if (error) {
      connection.logerror(plugin, `Redis error: ${error.message}`)
      return cb(false)
    }
  }
}

exports.decrypt_api_key = function (
  connection,
  username,
  encrypted_api_key,
) {
  const [iv_hex, encrypted_text] = encrypted_api_key.split(
    encryption_settings.iv_delimiter,
  )
  connection.loginfo(this, "Decrypting api key for username: ", username)
  if (!iv_hex || !encrypted_text) {
    return null
  }

  const iv = Buffer.from(iv_hex, "hex")

  const decipher = createDecipheriv(
    encryption_settings.algorithm,
    encryption_settings.encryption_key,
    iv,
  )

  let decrypted = decipher.update(encrypted_text, "hex", "utf8")

  decrypted += decipher.final("utf8")

  return decrypted
}

exports.hook_capabilities = (next, connection) => {
  if (!connection.tls.enabled) return next()

  const methods = ["LOGIN"]

  connection.capabilities.push(`AUTH ${methods.join(" ")}`)
  connection.notes.allowed_auth_methods = methods

  next()
}
