import { faker } from "@faker-js/faker";
import type { EmailContent } from "@/database/schema/types.ts";

export function createFakeEmailContent(overrides?: Partial<EmailContent>) {
  return {
    fromName: faker.lorem.words(2),
    fromEmail: faker.internet.email(),
    replyToName: faker.lorem.words(2),
    replyToEmail: faker.internet.email(),
    subject: faker.lorem.words(4),
    contentHtml: faker.lorem.paragraph(),
    contentText: faker.lorem.paragraph(),
    ...overrides,
  };
}
