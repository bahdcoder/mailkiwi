import { ChannelRepository } from '#root/core/chat/repositories/channel_repository.js'
import { WebsiteRepository } from '#root/core/websites/repositories/website_repository.js'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { update } from 'tar'
import { createFakeAbTestEmailContent } from '../audiences/email_content.js'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'
import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { RegisterUserAction } from '#root/core/auth/actions/register_user_action.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { CreateSendingDomainAction } from '#root/core/sending_domains/actions/create_sending_domain_action.js'
import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { createFakeContact } from '#root/core/tests/mocks/audiences/contacts.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import type {
  Team,
  TeamMembership,
  User,
  Website,
  WebsiteWithPages,
} from '#root/database/database_schema_types.js'
import { audiences, broadcastGroups, contacts } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'

export async function createBroadcastForUser(
  user: User,
  teamId: string,
  audienceId: string,
  broadcastGroupId: string,
  options: {
    updateWithValidContent?: boolean
    updateWithABTestsContent?: boolean
    weights?: number[]
    sendingDomainId?: string
    senderIdentityId?: string
    emailContent?: {
      fromEmail?: string
      fromName?: string
    }
  } = {},
) {
  const opts = options || {}

  const requestBody = {
    name: faker.lorem.words(3),
    audienceId,
    broadcastGroupId,
    senderIdentityId: undefined as string | undefined,
  }

  if (options.senderIdentityId) {
    requestBody.senderIdentityId = options.senderIdentityId
  }

  const response = await makeRequestAsUser(user, {
    method: 'POST',
    path: '/broadcasts',
    body: requestBody,
  })

  const json = await response.json()

  if (!options?.sendingDomainId) {
    options.sendingDomainId = await setupSendingDomainForTeam(teamId)
  }

  if (!options?.senderIdentityId) {
    options.senderIdentityId = await createSenderIdentityForTeam(
      teamId,
      options.sendingDomainId,
    )
  }

  if (!json.payload.id) {
    throw new Error('No id in response to create a broadcast')
  }

  const { id } = json.payload

  if (options?.updateWithValidContent) {
    const updateBroadcastResponse = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${id}`,
      body: {
        waitingTimeToPickWinner: faker.number.int({
          min: 1,
          max: 10,
        }),
        emailContent: {
          fromName: faker.lorem.words(2),
          fromEmail: faker.internet.userName().slice(0, 6),
          replyToName: faker.lorem.words(2),
          replyToEmail: faker.internet.email(),
          subject: faker.lorem.words(4),
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
          contentHtml: /* html */ `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width" />
        <title>My awesome newsletter</title>
        <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Rethink+Sans:ital,wght@0,400..800;1,400..800&display=swa"
        />
    </head>

    <body>
        <table class="body">
            <tr>
                <td class="float-center" align="center" valign="top">
                    <center>
                        <table class="row">
                            <tbody>
                                <tr>
                                    <h3 class="text-center">
                                        <span>It has Never Been Easier to Do Things.</span>
                                    </h3>
                                    <p class="text-center"><span>${faker.lorem.paragraph()}</span><span>${faker.lorem.paragraph()}</span></p>
                                    <a href="https://gorilla.com"><img src="http://placehold.it/25" /></a>
                                </tr>
                            </tbody>
                        </table>
                    </center>
                </td>
            </tr>
        </table>
    </body>
</html>

          `,
          contentText: faker.lorem.paragraph(),
          ...options?.emailContent,
        },
        sendingDomainId: options?.sendingDomainId,
        senderIdentityId: options?.senderIdentityId,
        ...(options?.updateWithABTestsContent
          ? {
              emailContentVariants: options?.weights?.map((weight) => ({
                ...createFakeAbTestEmailContent(),
                weight,
              })) ?? [
                createFakeAbTestEmailContent({
                  weight: 25,
                }),
                createFakeAbTestEmailContent({
                  weight: 15,
                }),
              ],
            }
          : {}),
      },
    })
  }

  return id as string
}

export async function createContactsForAudience(
  audienceId: string,
  contactsCount: number,
) {
  const database = makeDatabase()
  const contactIds = faker.helpers.multiple(cuid, {
    count: contactsCount,
  })
  const { audience: otherAudience } = await createUser()

  await database.insert(contacts).values(
    faker.helpers
      .multiple(faker.lorem.word, {
        count: contactsCount,
      })
      .map((_, idx) =>
        createFakeContact(audienceId, {
          id: contactIds[idx],
        }),
      ),
  )
  await database
    .insert(contacts)
    .values(
      faker.helpers
        .multiple(faker.lorem.word, { count: 23 })
        .map(() => createFakeContact(otherAudience.id)),
    )

  return { contactIds }
}

export const createUser = async ({
  createBroadcast,
  createEntireTeam,
  createAudienceForNewsletter,
  enableCommerceOnTeam = true,
  createWebsite = false,
  createKnownProperties = true,
  createAudience = true,
}: {
  createBroadcast?: boolean
  createEntireTeam?: boolean
  enableCommerceOnTeam?: boolean
  createAudienceForNewsletter?: boolean
  createWebsite?: boolean
  createAudience?: boolean
  createKnownProperties?: boolean
} = {}) => {
  const audienceRepository = container.resolve(AudienceRepository)

  const registerUserAction = container.resolve(RegisterUserAction)

  const { user, teamId } = await registerUserAction.handle({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.number.int({ min: 0, max: 99 }) + faker.internet.exampleEmail(),
    emailVerifiedAt: faker.date.past(),
  })

  const channelRepository = container.make(ChannelRepository)

  await container.make(UserRepository).update(user.id, { password: 'password' })

  const teamRepository = container.resolve(TeamRepository)
  const team = await teamRepository.findById(teamId)

  const broadcastGroupId = cuid()

  await makeDatabase()
    .insert(broadcastGroups)
    .values({
      id: broadcastGroupId,
      name: faker.lorem.words(3),
      teamId: team.id,
    })

  if (enableCommerceOnTeam) {
    await teamRepository.teams().update(team.id, {
      commerceProvider: 'paystack',
      commerceProviderAccountId: `acct_${faker.string.uuid()}`,
      commerceProviderConfirmedAt: DateTime.now().toJSDate(),
    })
  }

  let audienceId: string | undefined = undefined

  if (createAudience) {
    const audience = await audienceRepository.create(
      {
        name: 'Newsletter',
        slug: `${faker.number.int({
          min: 10,
          max: 100,
        })}-${faker.lorem.slug()}`,
      },
      team.id,
    )

    audienceId = audience.id
  }

  if (createKnownProperties && createAudience) {
    await makeDatabase()
      .update(audiences)
      .set({
        knownProperties: [
          { id: 'age', label: 'Age', type: 'float' },
          {
            id: 'profession',
            label: 'Your profession',
            type: 'text',
          },
        ],
      })
      .where(eq(audiences.id, audienceId as string))
  }

  const freshUser = await container.make(UserRepository).findById(user.id)

  let broadcastId: string | undefined = undefined

  if (createBroadcast) {
    broadcastId = await createBroadcastForUser(
      freshUser,
      team.id,
      audienceId as string,
      broadcastGroupId,
      {
        updateWithValidContent: true,
      },
    )
  }

  let administratorUser: User = undefined as unknown as User
  let managerUser: User = undefined as unknown as User
  let authorUser: User = undefined as unknown as User
  let guestUser: User = undefined as unknown as User

  if (createEntireTeam) {
    const [administrator, manager, author, guest] = await Promise.all([
      registerUserAction.handle({
        firstName: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: 'password',
      }),
      registerUserAction.handle({
        firstName: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: 'password',
      }),
      registerUserAction.handle({
        firstName: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: 'password',
      }),
      registerUserAction.handle({
        firstName: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: 'password',
      }),
    ])

    const teamMembershipRepository = container.make(TeamMembershipRepository)

    for (const [member, role] of [
      [administrator, 'ADMINISTRATOR'],
      [manager, 'MANAGER'],
      [author, 'AUTHOR'],
      [guest, 'GUEST'],
    ] as const) {
      await teamMembershipRepository.create({
        status: 'ACTIVE',
        expiresAt: new Date(),
        role: role as TeamMembership['role'],
        email: '',
        userId: member?.user?.id,
        teamId: team.id,
      })
    }

    const userRepository = container.make(UserRepository)

    administratorUser = (await userRepository.findById(administrator.user.id)) as User
    managerUser = (await userRepository.findById(manager.user.id)) as User

    authorUser = (await userRepository.findById(author.user.id)) as User

    guestUser = (await userRepository.findById(guest.user.id)) as User
  }

  if (createWebsite) {
    await container.make(WebsiteRepository).create({
      slug: faker.lorem.slug(),
      teamId: team.id,
      websiteDomain: `news-${faker.lorem.slug()}.fastmedia.com`,
      websiteDomainVerifiedAt: DateTime.now().toJSDate(),
      websiteDomainCnameValue: `${faker.lorem.slug()}.fastmedia.com`,
      audienceId: audienceId as string,
    })
  }

  async function findWebsiteWithPages() {
    const website = await container.make(WebsiteRepository).findByTeamId(team?.id)

    if (!website) {
      return undefined
    }

    return container.make(WebsiteRepository).findByIdWithPages(website.id)
  }

  return {
    user: freshUser,
    team,
    audience: { id: audienceId as string },
    administratorUser,
    managerUser,
    guestUser,
    authorUser,
    broadcastId,
    broadcastGroupId,
    website: (await findWebsiteWithPages()) as WebsiteWithPages,
  }
}

export async function setupSendingDomainForTeam(teamId: string) {
  const TEST_DOMAIN = faker.internet.domainName()

  const { id: sendingDomainId } = await container
    .make(CreateSendingDomainAction)
    .handle({ name: TEST_DOMAIN }, teamId)

  await container.make(SendingDomainRepository).update(sendingDomainId, {
    trackingDomainVerifiedAt: DateTime.now().toJSDate(),
    trackingDomainSslVerifiedAt: DateTime.now().toJSDate(),
    returnPathDomainVerifiedAt: DateTime.now().toJSDate(),
    openTrackingEnabled: true,
    clickTrackingEnabled: true,
  })

  return sendingDomainId
}

export async function createSenderIdentityForTeam(
  teamId: string,
  defaultSendingDomainId?: string,
) {
  const sendingDomainId =
    defaultSendingDomainId || (await setupSendingDomainForTeam(teamId))

  const { id: senderIdentityId } = await container.make(SenderIdentityRepository).create({
    name: `${faker.person.firstName()}'s Newsletter`,
    email: faker.internet.userName().toLowerCase(),
    sendingDomainId,
    teamId,
    replyToEmail: faker.internet.email(),
  })

  return senderIdentityId
}
