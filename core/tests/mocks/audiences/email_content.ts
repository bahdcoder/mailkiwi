import { faker } from '@faker-js/faker'

import type { EmailContent } from '#root/database/database_schema_types.js'

export function createFakeEmailContent(overrides?: Partial<EmailContent>) {
  return {
    subject: faker.lorem.words(4),
    contentHtml: faker.lorem.paragraph(),
    contentText: faker.lorem.paragraph(),
    previewText: faker.lorem.sentence(),
    contentJson: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              content: 'Hello world',
            },
          ],
        },
      ],
    },
    ...overrides,
  }
}

export function createFakeAbTestEmailContent(overrides?: { weight?: number }) {
  return {
    ...createFakeEmailContent(),
    name: faker.lorem.words(2),
    weight: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  }
}
