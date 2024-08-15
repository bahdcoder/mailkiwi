import type { Contact } from '@/database/schema/types.ts'
import { faker } from '@faker-js/faker'

export function createFakeContact(
  audienceId: string,
  contactOverrides?: Partial<Contact>,
) {
  return {
    email: faker.string.nanoid(5) + faker.internet.email(),
    firstName: faker.person.firstName(),
    audienceId,
    lastName: faker.person.lastName(),
    avatarUrl: faker.image.avatarGitHub(),
    subscribedAt: faker.date.past(),
    ...contactOverrides,
  }
}
