function trimLastSlash(path: string) {
  return path.endsWith('/') ? path.slice(0, -1) : path
}

function w(path: string) {
  return `/w/${trimLastSlash(path)}`
}

function engage(path: string) {
  return w(`engage/${path}`)
}

export const aliases = {
  // email/password registration
  auth_register: '/auth/register',
  auth_register_password: '/auth/register/password',
  auth_register_profile: '/auth/register/profile',
  auth_register_email_confirm: '/auth/register/email/confirm',
  auth_passwords_forgot: '/auth/passwords/forgot',
  auth_passwords_reset: '/auth/passwords/reset/:token',

  auth_oauth2_provider: '/auth/:action/oauth2/:provider/authorize',

  // login
  auth_login: '/auth/login',

  // logout
  auth_logout: '/auth/logout',

  // dashboard
  welcome: w('welcome'),
  dashboard: w('dashboard'),

  // community
  community: 'community',

  // products
  send: w('send'),
  optimise: w('optimise'),
  engage: w('engage'),
  letters: w('letters'),
  monetize: w('monetize'),

  // teams
  teams_switch: '/teams/:teamId/switch',

  // error pages
  error_404: '/e/404',
  error_500: '/e/500',

  engage_welcome: w('engage/welcome'),
  engage_onboarding: w('engage/onboarding'),
  engage_contacts: w('engage/contacts'),
  engage_automations: w('engage/flows'),

  // single letter pages
  engage_overview: w('engage/broadcasts/:uuid/'),
  engage_performance: w('engage/broadcasts/:uuid/performance'),

  // audiences
  audience_create: '/audiences',
  audiences_update: '/audiences/:audienceId',

  // imports
  contacts_import: '/audiences/:audienceId/imports',
  update_contacts_import: '/audiences/:audienceId/imports/:importId',

  // contacts
  get_contacts: '/audiences/:audienceId/contacts',
  contacts_search: '/audiences/:audienceId/contacts/search',

  // segments
  create_segment: '/audiences/:audienceId/segments',

  // broadcasts
  broadcasts: engage('/'),
  get_broadcast: '/broadcasts/:uuid',
  preview_broadcast: '/broadcasts/:uuid/preview',
  broadcasts_composer: engage('broadcasts/:uuid/composer'),
  create_broadcast: '/broadcasts',
  update_broadcast: '/broadcasts/:uuid/',
  validate_broadcast: '/broadcasts/:uuid/validate',
  send_broadcast: '/broadcasts/:uuid/send',
  unsend_broadcast: '/broadcasts/:uuid/unsend',

  // broadcast groups
  create_broadcast_group: '/broadcasts_groups',

  // media
  add_media_documents: '/media-documents',

  // automations
  create_automation: '/audiences/:audienceId/automations',
  automation_composer: w('engage/flows/:uuid/composer'),

  // flows
  add_automation_step: '/audiences/:audienceId/automations/:automationId/steps',
} as const

export function route(
  alias: keyof typeof aliases,
  routeParams?: Record<string, string>,
  queryParams?: Record<string, string>,
) {
  let path = aliases[alias]

  if (routeParams) {
    for (const [key, value] of Object.entries(routeParams)) {
      path = path.replace(`:${key}`, value)
    }
  }

  let queryString = ''

  if (queryParams) {
    queryString = new URLSearchParams(queryParams).toString()
  }

  return `${path}${queryString ? `?${queryString}` : ''}`
}

export function wRoute() {}
