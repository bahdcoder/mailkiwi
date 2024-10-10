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
local shaping = require 'policy-extras.shaping'
local log_hooks = require 'policy-extras.log_hooks'
local listener_domains = require 'policy-extras.listener_domains'
package.path = 'assets/?.lua;' .. package.path
local utils = require 'policy-extras.policy_utils'

-- ########################### ENVIRONMENT VARIABLES #############################

local API_HTTP_ACCESS_TOKEN = os.getenv 'API_HTTP_ACCESS_TOKEN' or ''
local API_HTTP_SERVER = os.getenv 'API_HTTP_SERVER' or 'http://127.0.0.1:5566'
local TSA_DAEMON_HTTP_SERVER = os.getenv 'TSA_DAEMON_HTTP_SERVER' or 'http://127.0.0.1:8012'
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
  local auth_url = API_HTTP_SERVER .. "/mta/smtp/auth"

  local request = kumo.http.build_client({}):post(auth_url)
  
  request:header('Content-Type', 'application/json')
  request:header('x-mta-access-token', API_HTTP_SERVER)

  request:body(kumo.json_encode {
    username = username,
    passwd = passwd
  })

  print('----------------> SENDING REQUEST')

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
  url = API_HTTP_SERVER .. '/mta/logs',
  log_parameters = {
    headers = {
      'Subject',
      'Message-ID',
      'X-Kibamail-*'
    },
  },
}

--[[

 ########################### KIBAMAIL LOGGING END #############################

]]--

local shaper = shaping:setup_with_automation {
 publish = { TSA_DAEMON_HTTP_SERVER, }, -- TSA daemon from compose is running and exposed on this port.
 subscribe = { TSA_DAEMON_HTTP_SERVER, },
 no_default_files = true,
 extra_files = {
    '/opt/kumomta/etc/policy/extras/shaping.toml',
 },
}

--[[

 ########################### KIBAMAIL DKIM SIGNING #############################

]]--

local authenticated_request = function (url, json)
  local request = kumo.http.build_client({}):post(url)
  
  request:header('Content-Type', 'application/json')
  request:header('x-mta-access-token', API_HTTP_ACCESS_TOKEN)

  request:body(kumo.json_encode(json))
  
  local response = request:send()

  local json = kumo.serde.json_parse(response:text())

  return json
end

local get_domain_dkim_information = function (domain)
  local json = authenticated_request(API_HTTP_SERVER .. "/mta/dkim", {
    domain = domain,
  })

  if json.status ~= 'success' then
    return nil
  end

  return json
end

cached_get_domain_dkim_information = kumo.memoize(get_domain_dkim_information, {
  name = 'domain_dkim_information',
  ttl = '24 hours',
  capacity = 5000
})

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

local process_message_with_tracking = function (message)
  local json = authenticated_request(API_HTTP_SERVER .. "/mta/smtp/message", {
    message = message:get_data(),
    domain = message:sender().domain,
  })

  if json.content == nil then
    kumo.reject(500, 'internal message parsing errors')
  end

  message:set_data(json.content)
end

local on_smtp_server_message_received = function (message)
  local from_header = message:from_header()

  if not from_header then
    kumo.reject(
      552,
      '5.6.0 DKIM signing requires a From header, but it is missing from this message'
    )
  end

  local domain = from_header.domain

  local dkim_information = cached_get_domain_dkim_information(domain)

  if dkim_information == nil then
    kumo.reject(500, 'dkim records for domain not configured on this server')
  end

  -- campaign can be send (transactional) or engage (marketing)
  -- based on resolved campaign, this will determine the egress pool we make.
  message:set_meta("campaign", "send")
  message:set_meta("tenant", domain)

  -- Build egress path.

  sign_message_with_dkim(message, dkim_information)
end

--[[

 ########################### KIBAMAIL DKIM SIGNING END #############################

]]--

kumo.on('init', function()
  kumo.configure_accounting_db_path(os.tmpname())

  kumo.start_esmtp_listener {
    listen = '0:' .. '25',
    -- Open SMTP submissions to any host, as it is protected by SMTP authentication
    relay_hosts = { '0.0.0.0/0' },
    banner = 'Welcome fellow postmaster. Kibamail is ready to accept your message.',
  }

  kumo.start_http_listener {
    listen = '0.0.0.0:' .. HTTP_INJECTOR_PORT,
    -- Access will be controlled by K8s services
    trusted_hosts = { '0.0.0.0/0' },
  }

    shaper.setup_publish()

  -- Define spool locations

  kumo.define_spool {
    name = 'data',
    path = '/var/spool/kumomta/data',
    kind = 'RocksDB',
  }

  kumo.define_spool {
    name = 'meta',
    path = '/var/spool/kumomta/meta',
    kind = 'RocksDB',
  }

  -- No logs are configured: we don't need them
  kumo.configure_local_logs {
    log_dir = '/var/log/kumomta',

    -- We recommend setting this when you're getting started;
    -- this option is discussed in more detail below
    max_segment_duration = '10 seconds',

    headers = {
      'Subject',
      'Message-ID',
      'X-Kibamail-*'
    }
  }
end)

kumo.on(
  'get_listener_domain',
  listener_domains:setup { '/opt/kumomta/etc/policy/extras/listener_domains.toml' }
)

kumo.on('smtp_server_message_received', function(message)
  -- This tracking is only for links from the send product
  -- Engage product emails are injected via SMTP, so do not need any tracking. For those injected by HTTP, no need to process tracking here, but will rather do it in
  process_message_with_tracking(message)
  on_smtp_server_message_received(message)
end)

kumo.on('http_message_generated', function(message)
  on_smtp_server_message_received(message)
end)

kumo.on('get_queue_config', function (destination_domain, tenant, campaign, routing_domain)
  return kumo.make_queue_config {
    egress_pool = tenant
  }
end)

kumo.on('get_egress_pool', function (pool_name)
  return kumo.make_egress_pool {
    name = pool_name,
    entries = {
      {
        name = pool_name,
        weight = 100
      }
    }
  }
end)

kumo.on('get_egress_source', function (source_name)
  local dkim_information = cached_get_domain_dkim_information(source_name)

  return kumo.make_egress_source {
    name = source_name,
    ehlo_domain = dkim_information.send.primary.ehlo_domain,
    socks5_proxy_server = dkim_information.send.primary.socks5_proxy_server,
    socks5_proxy_source_address = dkim_information.send.primary.source_address
  }
end)

kumo.on('get_egress_path_config', shaper.get_egress_path_config)
