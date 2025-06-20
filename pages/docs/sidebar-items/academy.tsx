export default {
  'Email marketing fundamentals': {
    routes: [
      ['Introduction to email marketing', '/fundamentals/introduction'],
      ['Email marketing vs other channels', '/fundamentals/vs-other-channels'],
      ['Email marketing ROI', '/fundamentals/roi'],
      ['Building an email strategy', '/fundamentals/strategy'],
      ['Email marketing metrics', '/fundamentals/metrics'],
    ] as const,
  },
  'List building': {
    routes: [
      ['Opt-in strategies', '/list-building/opt-in-strategies'],
      ['Lead magnets', '/list-building/lead-magnets'],
      ['Landing page optimization', '/list-building/landing-pages'],
      ['Social media list building', '/list-building/social-media'],
      ['Event-based collection', '/list-building/events'],
      ['Referral programs', '/list-building/referrals'],
    ] as const,
  },
  'Email design': {
    routes: [
      ['Design principles', '/design/principles'],
      ['Mobile-first design', '/design/mobile-first'],
      ['Color psychology', '/design/color-psychology'],
      ['Typography in emails', '/design/typography'],
      ['Image optimization', '/design/images'],
      ['Accessibility in email', '/design/accessibility'],
    ] as const,
  },
  Copywriting: {
    routes: [
      ['Email copywriting basics', '/copywriting/basics'],
      ['Subject line mastery', '/copywriting/subject-lines'],
      ['Call-to-action optimization', '/copywriting/cta'],
      ['Personalization techniques', '/copywriting/personalization'],
      ['Storytelling in emails', '/copywriting/storytelling'],
      ['Emotional triggers', '/copywriting/emotional-triggers'],
    ] as const,
  },
  Deliverability: {
    routes: [
      ['Understanding deliverability', '/deliverability/understanding'],
      ['Sender reputation', '/deliverability/sender-reputation'],
      ['Authentication protocols', '/deliverability/authentication'],
      ['List hygiene', '/deliverability/list-hygiene'],
      ['Avoiding spam filters', '/deliverability/spam-filters'],
      ['ISP relationships', '/deliverability/isp-relationships'],
    ] as const,
  },
  'Advanced strategies': {
    routes: [
      ['Behavioral email marketing', '/advanced/behavioral'],
      ['Lifecycle email marketing', '/advanced/lifecycle'],
      ['Cross-channel marketing', '/advanced/cross-channel'],
      ['Predictive analytics', '/advanced/predictive-analytics'],
      ['Machine learning in email', '/advanced/machine-learning'],
      ['International email marketing', '/advanced/international'],
    ] as const,
  },
  'Industry insights': {
    routes: [
      ['E-commerce email marketing', '/industry/ecommerce'],
      ['SaaS email marketing', '/industry/saas'],
      ['B2B email marketing', '/industry/b2b'],
      ['Non-profit email marketing', '/industry/nonprofit'],
      ['Healthcare email marketing', '/industry/healthcare'],
      ['Financial services email', '/industry/financial'],
    ] as const,
  },
  'Case studies': {
    routes: [
      ['Successful campaigns', '/case-studies/successful-campaigns'],
      ['Automation success stories', '/case-studies/automation'],
      ['Segmentation wins', '/case-studies/segmentation'],
      ['Design transformations', '/case-studies/design'],
      ['Deliverability improvements', '/case-studies/deliverability'],
      ['ROI improvements', '/case-studies/roi'],
    ] as const,
  },
} as const
