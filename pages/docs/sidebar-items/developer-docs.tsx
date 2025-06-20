export default {
  'Getting started': {
    routes: [
      ['Installation', '/installation'],
      ['Quick start', '/quick-start'],
      ['Environment setup', '/environment-setup'],
      ['Authentication', '/authentication'],
    ] as const,
  },
  Emails: {
    routes: [['Send email', '/emails/send', 'POST']] as const,
  },
  'Core concepts': {
    routes: [
      ['Email templates', '/email-templates'],
      ['Campaign management', '/campaigns'],
      ['Contact management', '/contacts'],
      ['Segmentation', '/segmentation'],
      ['Automation workflows', '/automation'],
      ['Analytics & tracking', '/analytics'],
    ] as const,
  },
  'SDKs & Libraries': {
    routes: [
      ['Node.js SDK', '/sdk-nodejs'],
      ['Python SDK', '/sdk-python'],
      ['PHP SDK', '/sdk-php'],
      ['Ruby SDK', '/sdk-ruby'],
      ['Go SDK', '/sdk-go'],
      ['JavaScript SDK', '/sdk-javascript'],
    ] as const,
  },
  Webhooks: {
    routes: [
      ['Overview', '/webhooks/overview'],
      ['Event types', '/webhooks/events'],
      ['Security', '/webhooks/security'],
      ['Testing', '/webhooks/testing'],
      ['Troubleshooting', '/webhooks/troubleshooting'],
    ] as const,
  },
  'Email composer': {
    routes: [
      ['Template engine', '/composer/template-engine'],
      ['Custom blocks', '/composer/custom-blocks'],
      ['Styling system', '/composer/styling'],
      ['Dynamic content', '/composer/dynamic-content'],
      ['Personalization', '/composer/personalization'],
    ] as const,
  },
  'Advanced features': {
    routes: [
      ['Custom domains', '/custom-domains'],
      ['SMTP configuration', '/smtp-config'],
      ['IP warming', '/ip-warming'],
      ['Deliverability', '/deliverability'],
      ['Rate limiting', '/rate-limiting'],
      ['Error handling', '/error-handling'],
    ] as const,
  },
  'Testing & Debugging': {
    routes: [
      ['Sandbox mode', '/sandbox'],
      ['Test emails', '/test-emails'],
      ['Debugging tools', '/debugging'],
      ['Logs & monitoring', '/logs'],
    ] as const,
  },
} as const
