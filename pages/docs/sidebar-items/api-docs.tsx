export default {
  'Getting started': {
    routes: [
      ['Introduction', '/introduction'],
      ['Authentication', '/authentication'],
      ['Rate limits', '/rate-limits'],
      ['Error codes', '/error-codes'],
      ['Pagination', '/pagination'],
    ] as const,
  },
  Campaigns: {
    routes: [
      ['List campaigns', '/campaigns/list', 'GET'],
      ['Create campaign', '/campaigns/create', 'POST'],
      ['Get campaign', '/campaigns/get', 'GET'],
      ['Update campaign', '/campaigns/update', 'PUT'],
      ['Delete campaign', '/campaigns/delete', 'DELETE'],
      ['Send campaign', '/campaigns/send', 'POST'],
      ['Schedule campaign', '/campaigns/schedule', 'POST'],
      ['Campaign stats', '/campaigns/stats', 'GET'],
    ] as const,
  },
  Contacts: {
    routes: [
      ['List contacts', '/contacts/list', 'GET'],
      ['Create contact', '/contacts/create', 'POST'],
      ['Get contact', '/contacts/get', 'GET'],
      ['Update contact', '/contacts/update', 'PUT'],
      ['Delete contact', '/contacts/delete', 'DELETE'],
      ['Bulk operations', '/contacts/bulk', 'POST'],
      ['Contact activity', '/contacts/activity', 'GET'],
    ] as const,
  },
  Lists: {
    routes: [
      ['List all lists', '/lists/list', 'GET'],
      ['Create list', '/lists/create', 'POST'],
      ['Get list', '/lists/get', 'GET'],
      ['Update list', '/lists/update', 'PUT'],
      ['Delete list', '/lists/delete', 'DELETE'],
      ['Add contacts to list', '/lists/add-contacts', 'POST'],
      ['Remove contacts from list', '/lists/remove-contacts', 'DELETE'],
    ] as const,
  },
  Templates: {
    routes: [
      ['List templates', '/templates/list', 'GET'],
      ['Create template', '/templates/create', 'POST'],
      ['Get template', '/templates/get', 'GET'],
      ['Update template', '/templates/update', 'PUT'],
      ['Delete template', '/templates/delete', 'DELETE'],
      ['Clone template', '/templates/clone', 'POST'],
    ] as const,
  },
  Automation: {
    routes: [
      ['List workflows', '/automation/list', 'GET'],
      ['Create workflow', '/automation/create', 'POST'],
      ['Get workflow', '/automation/get', 'GET'],
      ['Update workflow', '/automation/update', 'PUT'],
      ['Delete workflow', '/automation/delete', 'DELETE'],
      ['Start workflow', '/automation/start', 'POST'],
      ['Stop workflow', '/automation/stop', 'POST'],
    ] as const,
  },
  Analytics: {
    routes: [
      ['Campaign analytics', '/analytics/campaigns', 'GET'],
      ['Contact analytics', '/analytics/contacts', 'GET'],
      ['Revenue analytics', '/analytics/revenue', 'GET'],
      ['Engagement metrics', '/analytics/engagement', 'GET'],
      ['Export reports', '/analytics/export', 'GET'],
    ] as const,
  },
  Webhooks: {
    routes: [
      ['List webhooks', '/webhooks/list', 'GET'],
      ['Create webhook', '/webhooks/create', 'POST'],
      ['Get webhook', '/webhooks/get', 'GET'],
      ['Update webhook', '/webhooks/update', 'PUT'],
      ['Delete webhook', '/webhooks/delete', 'DELETE'],
      ['Test webhook', '/webhooks/test', 'POST'],
    ] as const,
  },
} as const
