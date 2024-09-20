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

local CREDS_HTTP_ACCESS_TOKEN = os.getenv 'CREDS_HTTP_ACCESS_TOKEN' or ''

local CREDS_HTTP_SERVER = os.getenv 'CREDS_HTTP_SERVER' or '127.0.0.1:4251'
local LOGS_HTTP_SERVER = os.getenv 'LOGS_HTTP_SERVER' or '127.0.0.1:2578'

local MTA_ENVIRONMENT = os.getenv 'MTA_ENVIRONMENT' or 'production'

local HTTP_INJECTOR_PORT = os.getenv 'HTTP_INJECTOR_PORT' or '8000'

--[[

 ########################### KIBAMAIL AUTHENTICATION #############################
 Define the methods needed for handling smtp authentication
 
 1. Integrate a module for making http requests.
 2. Set environment variable for access to MTA helper API.

 ######################### KIBAMAIL AUTHENTICATION ###############################
]]--

local function smtp_check_auth_credentials(username, passwd)
  local auth_url = CREDS_HTTP_SERVER .. "/smtp/auth"

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
  url = LOGS_HTTP_SERVER .. '/mta/logs',
  log_parameters = {
    headers = { 'Subject' },
  },
}

--[[

 ########################### KIBAMAIL LOGGING END #############################

]]--

--[[

 ########################### KIBAMAIL DKIM SIGNING #############################

]]--

local function escapeString(str)
    str = str:gsub("\\", "\\\\")
    str = str:gsub('"', '\\"')
    str = str:gsub("\n", "\\n")
    str = str:gsub("\r", "\\r")
    str = str:gsub("\t", "\\t")
    return str
end

-- Helper function to serialize a Lua table to JSON
local function tableToJson(tbl)
    local result = {}
    local isArray = (#tbl > 0)

    for key, value in pairs(tbl) do
        local serializedKey
        if not isArray then
            if type(key) == "string" then
                serializedKey = '"' .. escapeString(key) .. '": '
            else
                error("JSON only supports string keys in objects.")
            end
        end

        local serializedValue
        if type(value) == "string" then
            serializedValue = '"' .. escapeString(value) .. '"'
        elseif type(value) == "number" or type(value) == "boolean" then
            serializedValue = tostring(value)
        elseif type(value) == "table" then
            serializedValue = tableToJson(value)
        else
            error("Unsupported data type in table.")
        end

        if isArray then
            table.insert(result, serializedValue)
        else
            table.insert(result, serializedKey .. serializedValue)
        end
    end

    if isArray then
        return "[" .. table.concat(result, ", ") .. "]"
    else
        return "{" .. table.concat(result, ", ") .. "}"
    end
end

local get_domain_dkim_information = function (domain)
  local auth_url = CREDS_HTTP_SERVER .. "/dkim"

  local request = kumo.http.build_client({}):post(auth_url)
  
  request:header('Content-Type', 'application/json')
  request:header('x-mta-access-token', CREDS_HTTP_ACCESS_TOKEN)

  request:body(kumo.json_encode {
    domain = domain,
  })

  local response = request:send()

  local json = kumo.serde.json_parse(response:text())

  if json.status ~= 'success' then
    return nil
  end

  return json
end

local sign_message_with_dkim = function (message, dkim_information)
  local headers_for_signing = {
      "From", "Reply-To", "Subject", "Date", "To", "Cc",
      "Resent-Date", "Resent-From", "Resent-To", "Resent-Cc",
      "In-Reply-To", "References", "List-Id", "List-Help",
      "List-Unsubscribe", "List-Subscribe", "List-Post",
      "List-Owner", "List-Archive"
  }

  local signer = kumo.dkim.rsa_sha256_signer {
    domain = message:sender().domain,
    selector = dkim_information.dkimSubDomain,
    headers = headers_for_signing,
    key = {
      key_data = dkim_information.privateKey
    }
  }

  message:dkim_sign(signer)
end

local on_smtp_server_message_received = function (message)
  local domain = message:sender().domain

  local dkim_information = get_domain_dkim_information(domain)

  if dkim_information == nil then
    kumo.reject(500, 'dkim records for domain not configured on this server')
  end

  sign_message_with_dkim(message, dkim_information)
end

--[[

 ########################### KIBAMAIL DKIM SIGNING END #############################

]]--

kumo.on('init', function()
  kumo.configure_accounting_db_path(os.tmpname())
  kumo.set_config_monitor_globs { SINK_DATA_FILE }

  kumo.start_esmtp_listener {
    listen = '0:' .. '25',
    -- Open SMTP submissions to any host, as it is protected by SMTP authentication
    relay_hosts = { '0.0.0.0/0' },
    banner = 'This system will sink and discard all mail',
  }

  kumo.start_http_listener {
    listen = '0.0.0.0:' .. HTTP_INJECTOR_PORT,
    -- Access will be controlled by K8s services
    trusted_hosts = { '0.0.0.0/0' },
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

kumo.on('smtp_server_message_received', function(message)
  on_smtp_server_message_received(message)
end)

kumo.on('http_message_generated', function(message)
  on_smtp_server_message_received(message)
end)
