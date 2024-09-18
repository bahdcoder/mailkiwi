--  Init the kumo mta. 
-- Set up event handler for smtp_server_auth_plain: Which handles SMTP injection authentication ✅
-- Set up Dkim signing for Email Service Provider (Kibamail)
-- Set up Dkim signing for sending domain (Kibamail managed tenant)
-- Set up IP pool management and IP address picking for specific Kibamail tenant
-- Set up HTTP injection layer (Should only receive HTTP injections from internal proxy (running nodejs instances)).
-- Setup Socks5 Egress Proxy
-- Setup logs webhooks

-- This config acts as a sink that will discard all received mail
local kumo = require 'kumo'
local log_hooks = require 'policy-extras.log_hooks'
package.path = 'assets/?.lua;' .. package.path
local utils = require 'policy-extras.policy_utils'

local SINK_DATA_FILE = os.getenv 'SINK_DATA'
  or '/opt/kumomta/etc/policy/responses.toml'

-- ########################### ENVIRONMENT VARIABLES #############################

local CREDS_HTTP_SERVER_HOST = os.getenv 'CREDS_HTTP_SERVER_HOST' or '127.0.0.1'
local CREDS_HTTP_SERVER_PORT = os.getenv 'CREDS_HTTP_SERVER_PORT' or '5797'
local CREDS_HTTP_ACCESS_TOKEN = os.getenv 'CREDS_HTTP_ACCESS_TOKEN'

local LOGS_HTTP_SERVER_HOST = os.getenv 'LOGS_HTTP_SERVER_HOST' or '127.0.0.1'
local LOGS_HTTP_SERVER_PORT = os.getenv 'LOGS_HTTP_SERVER_PORT' or '5798'

local CREDS_HTTP_BASE_URL = string.format("http://%s:%s", CREDS_HTTP_SERVER_HOST, CREDS_HTTP_SERVER_PORT)
local LOGS_HTTP_BASE_URL = string.format("http://%s:%s", LOGS_HTTP_SERVER_HOST, LOGS_HTTP_SERVER_PORT)

--[[

 ########################### KIBAMAIL AUTHENTICATION #############################
 Define the methods needed for handling smtp authentication
 
 1. Integrate a module for making http requests.
 2. Set environment variable for access to MTA helper API.

 ######################### KIBAMAIL AUTHENTICATION ###############################
]]--

local function smtp_check_auth_credentials(username, passwd)
  local auth_url = CREDS_HTTP_BASE_URL .. "/smtp/auth"

  local request = kumo.http.build_client({}):post(auth_url)
  
  request:header('Content-Type', 'application/json')
  request:header('x-mta-access-token', CREDS_HTTP_ACCESS_TOKEN)

  request:body(kumo.json_encode {
    username = username,
    passwd = passwd
  })

  local response = request:send()

  return response:status_is_success()
end

kumo.on('smtp_server_auth_plain', function(authz, authc, password, conn_meta)
  return smtp_check_auth_credentials(authc, password)
end)

--[[

 ########################### KIBAMAIL AUTHENTICATION END #############################

]]--


--[[

 ########################### KIBAMAIL LOGGING #############################

]]--
log_hooks:new_json {
  name = 'webhook',
  url = LOGS_HTTP_BASE_URL .. '/mta/logs',
  log_parameters = {
    headers = { 'Subject' },
  },
}

--[[

 ########################### KIBAMAIL LOGGING END #############################

]]--

kumo.on('init', function()
  kumo.configure_accounting_db_path(os.tmpname())
  kumo.set_config_monitor_globs { SINK_DATA_FILE }

  kumo.start_esmtp_listener {
    listen = '0:' .. '25',
    -- Explicitly an open relay, because we want to sink everything
    relay_hosts = { '0.0.0.0/0' },
    banner = 'This system will sink and discard all mail',
  }

  local SINK_HTTP = os.getenv 'SINK_HTTP' or '8000'
  kumo.start_http_listener {
    listen = '0.0.0.0:' .. SINK_HTTP,
    trusted_hosts = { '127.0.0.1', '::1' },
  }

  -- Define spool locations

  local spool_dir = os.getenv 'SINK_SPOOL' or '/var/spool/kumomta'

  for _, name in ipairs { 'data', 'meta' } do
    kumo.define_spool {
      name = name,
      path = spool_dir .. '/' .. name,
      kind = 'RocksDB',
    }
  end

  -- No logs are configured: we don't need them
  kumo.configure_local_logs {
    log_dir = '/var/log/kumomta',

    -- We recommend setting this when you're getting started;
    -- this option is discussed in more detail below
    max_segment_duration = '10 seconds',
  }
end)

-- Load and parse the responses.toml data and resolve the configuration
-- for a given domain
local function load_data_for_domain(domain)
  local data = kumo.toml_load(SINK_DATA_FILE)
  local config = data.domain[domain] or data.default
  config.bounces = data.bounce[domain] or { { code = 550, msg = 'boing!' } }
  config.defers = data.defer[domain] or { { code = 451, msg = 'later!' } }
  return config
end

-- Cache the result of a load_data_for_domain call
local resolve_domain = kumo.memoize(load_data_for_domain, {
  name = 'response-data-cache',
  ttl = '1 hour',
  capacity = 100,
})

kumo.on('smtp_server_message_received', function(msg)
  local recipient = msg:recipient()

  print('>>>>>>>>>>>>>>>>>>>>>', recipient)
  -- -- Do any special responses requested by the client
  -- if string.find(recipient.user, 'tempfail') then
  --   kumo.reject(400, 'tempfail requested')
  -- end
  -- if string.find(recipient.user, 'permfail') then
  --   kumo.reject(500, 'permfail requested')
  -- end
  -- if utils.starts_with(recipient.user, '450-') then
  --   kumo.reject(450, 'you said ' .. recipient.user)
  -- end
  -- if utils.starts_with(recipient.user, '250-') then
  --   msg:set_meta('queue', 'null')
  --   return
  -- end

  -- -- Now any general bounce responses based on the toml file
  -- local domain = recipient.domain
  -- local config = resolve_domain(domain)

  -- local d100 = math.random(100)
  -- local selection = nil
  -- if d100 < config.bounce then
  --   selection = config.bounces
  -- elseif d100 < config.bounce + config.defer then
  --   selection = config.defers
  -- end

  -- if selection then
  --   local choice = selection[math.random(#selection)]
  --   kumo.reject(choice.code, choice.msg)
  -- end

  -- -- Finally, accept and discard any messages that haven't
  -- -- been rejected already
  -- msg:set_meta('queue', 'null')
end)

kumo.on('http_message_generated', function(msg)
  -- Accept and discard all messages
  msg:set_meta('queue', 'null')
end)
