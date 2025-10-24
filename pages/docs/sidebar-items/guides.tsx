export default {
  'Email marketing basics': {
    routes: [
      ['Email marketing fundamentals', '/email-marketing/fundamentals'],
      ['Building your email list', '/email-marketing/building-list'],
      ['Email design best practices', '/email-marketing/design-best-practices'],
      ['Subject line optimization', '/email-marketing/subject-lines'],
      ['Deliverability best practices', '/email-marketing/deliverability'],
    ] as const,
  },
  'Campaign strategies': {
    routes: [
      ['Welcome email series', '/campaigns/welcome-series'],
      ['Newsletter campaigns', '/campaigns/newsletters'],
      ['Promotional campaigns', '/campaigns/promotional'],
      ['Re-engagement campaigns', '/campaigns/re-engagement'],
      ['Seasonal campaigns', '/campaigns/seasonal'],
      ['Product launch campaigns', '/campaigns/product-launch'],
    ] as const,
  },
  'Automation workflows': {
    routes: [
      ['Setting up automation', '/automation/setup'],
      ['Abandoned cart recovery', '/automation/abandoned-cart'],
      ['Birthday campaigns', '/automation/birthday'],
      ['Post-purchase follow-up', '/automation/post-purchase'],
      ['Lead nurturing', '/automation/lead-nurturing'],
      ['Customer onboarding', '/automation/onboarding'],
    ] as const,
  },
  'Segmentation & targeting': {
    routes: [
      ['Audience segmentation', '/segmentation/audience'],
      ['Behavioral targeting', '/segmentation/behavioral'],
      ['Geographic targeting', '/segmentation/geographic'],
      ['Demographic segmentation', '/segmentation/demographic'],
      ['Purchase-based segments', '/segmentation/purchase-based'],
    ] as const,
  },
  'Analytics & optimization': {
    routes: [
      ['Understanding email metrics', '/analytics/metrics'],
      ['A/B testing strategies', '/analytics/ab-testing'],
      ['Improving open rates', '/analytics/open-rates'],
      ['Increasing click rates', '/analytics/click-rates'],
      ['Reducing unsubscribes', '/analytics/unsubscribes'],
      ['ROI measurement', '/analytics/roi'],
    ] as const,
  },
  Integrations: {
    routes: [
      ['E-commerce platforms', '/integrations/ecommerce'],
      ['CRM integration', '/integrations/crm'],
      ['Social media integration', '/integrations/social-media'],
      ['Analytics tools', '/integrations/analytics'],
      ['Zapier automation', '/integrations/zapier'],
      ['Custom integrations', '/integrations/custom'],
    ] as const,
  },
  'Compliance & legal': {
    routes: [
      ['GDPR compliance', '/compliance/gdpr'],
      ['CAN-SPAM compliance', '/compliance/can-spam'],
      ['CCPA compliance', '/compliance/ccpa'],
      ['Email consent management', '/compliance/consent'],
      ['Data protection', '/compliance/data-protection'],
    ] as const,
  },
} as const
