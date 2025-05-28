import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { InjectEmailSchemaDto } from '#root/core/injector/dto/inject_email_dto.js'
import { faker } from '@faker-js/faker'

import type { EmailContentSchemaDto } from '#root/core/content/dto/create_email_content_dto.js'

import { getApiKeyForTeam } from '#root/core/tests/utils/http.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

export function getDefaultEmailContentSchema(): EmailContentSchemaDto {
  return {
    sections: [],
    container: {
      styles: {
        backgroundColor: '#F4F4F4',
        margin: { top: 0, left: 0, right: 0, bottom: 0 },
        padding: { top: 20, left: 0, right: 0, bottom: 20 },
        borderRadius: { top: 0, left: 0, right: 0, bottom: 0 },
        fontFamily: {
          name: 'Montserrat',
          url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
        },
      },
    },
    wrapper: {
      styles: {
        backgroundColor: '#243361',
        margin: { top: 0, left: 0, right: 0, bottom: 0 },
        borderRadius: { top: 0, left: 0, right: 0, bottom: 0 },
        fontFamily: {
          name: 'Arial',
          url: 'https://fonts.googleapis.com/css2?family=Arial:wght@400;500;600;700&display=swap',
        },
        'min-height': 750,
        borderColor: {
          top: '#000',
          left: '#000',
          right: '#000',
          bottom: '#000',
        },
      },
    },
  }
}

export function getInjectEmailContent(
  TEST_DOMAIN: string,
  emailContent?: Partial<InjectEmailSchemaDto>,
) {
  return {
    from: {
      name: faker.person.fullName(),
      email: `${cuid()}@${TEST_DOMAIN}`,
    },
    subject: cuid(),
    text: faker.lorem.paragraphs(12),
    html: readFileSync(path.resolve('core/tests/mocks/emails', 'email.html'), 'utf-8'),
    replyTo: {
      name: faker.person.fullName(),
      email: `${cuid()}@${TEST_DOMAIN}`,
    },
    recipients: faker.helpers
      .multiple(() => faker.internet.email())
      .map(() => ({
        email: `${cuid()}@${TEST_DOMAIN}`,
        name: faker.person.fullName(),
      })),
    ...emailContent,
  }
}

export async function injectEmailForTeam(
  teamId: string,
  TEST_DOMAIN: string,
  emailContent?: Partial<InjectEmailSchemaDto>,
) {
  const injectEmail = getInjectEmailContent(TEST_DOMAIN, emailContent)

  const response = await makeApp().request('/inject', {
    method: 'POST',
    headers: {
      Authorization: await getApiKeyForTeam(teamId),
    },

    body: JSON.stringify(injectEmail),
  })

  return { response, injectEmail }
}
