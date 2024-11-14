import { createFakeAbTestEmailContent } from "../audiences/email_content.js"
import { WebsiteRepository } from "@/letters/repositories/website_repository.js"
import { faker } from "@faker-js/faker"
import { DateTime } from "luxon"

import { CreateAudienceAction } from "@/audiences/actions/audiences/create_audience_action.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.js"
import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { RegisterUserAction } from "@/auth/actions/register_user_action.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { EmailContentSchemaDto } from "@/content/dto/create_email_content_dto.js"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import type {
  Team,
  TeamMembership,
  User,
  Website,
  WebsiteWithPages,
} from "@/database/database_schema_types.js"
import { contacts } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

export async function createBroadcastForUser(
  user: User,
  audienceId: string,
  options?: {
    updateWithValidContent?: boolean
    updateWithABTestsContent?: boolean
    weights?: number[]
    emailContent?: {
      fromEmail?: string
      fromName?: string
    }
  },
) {
  const response = await makeRequestAsUser(user, {
    method: "POST",
    path: "/broadcasts",
    body: {
      name: faker.lorem.words(3),
      audienceId,
    },
  })

  const { id } = await response.json()

  if (options?.updateWithValidContent) {
    const rr = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${id}`,
      body: {
        waitingTimeToPickWinner: faker.number.int({
          min: 1,
          max: 10,
        }),
        emailContent: {
          fromName: faker.lorem.words(2),
          fromEmail: faker.internet.email(),
          replyToName: faker.lorem.words(2),
          replyToEmail: faker.internet.email(),
          subject: faker.lorem.words(4),
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
}: {
  createBroadcast?: boolean
  createEntireTeam?: boolean
  enableCommerceOnTeam?: boolean
  createAudienceForNewsletter?: boolean
} = {}) => {
  const audienceRepository = container.resolve(AudienceRepository)

  const registerUserAction = container.resolve(RegisterUserAction)

  const { user, team } = await registerUserAction.handle({
    name: faker.person.fullName(),
    email:
      faker.number.int({ min: 0, max: 99 }) +
      faker.internet.exampleEmail(),
    password: "password",
  })

  const teamRepository = container.resolve(TeamRepository)
  const teamObject = await teamRepository.findById(team.id)

  if (enableCommerceOnTeam) {
    await teamRepository.teams().update(team.id, {
      commerceProvider: "paystack",
      commerceProviderAccountId: `acct_${faker.string.uuid()}`,
      commerceProviderConfirmedAt: DateTime.now().toJSDate(),
    })
  }

  const audience = await audienceRepository.create(
    {
      name: "Newsletter",
      slug:
        faker.number.int({ min: 10, max: 100 }) + "-" + faker.lorem.slug(),
    },
    team.id,
  )

  const freshUser = await container.make(UserRepository).findById(user.id)

  let broadcastId: string | undefined = undefined

  if (createBroadcast) {
    broadcastId = await createBroadcastForUser(freshUser, audience.id, {
      updateWithValidContent: true,
    })
  }

  let administratorUser: User = undefined as unknown as User
  let managerUser: User = undefined as unknown as User
  let authorUser: User = undefined as unknown as User
  let guestUser: User = undefined as unknown as User

  if (createEntireTeam) {
    let [administrator, manager, author, guest] = await Promise.all([
      registerUserAction.handle({
        name: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: "password",
      }),
      registerUserAction.handle({
        name: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: "password",
      }),
      registerUserAction.handle({
        name: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: "password",
      }),
      registerUserAction.handle({
        name: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: "password",
      }),
    ])

    const teamMembershipRepository = container.make(
      TeamMembershipRepository,
    )

    for (const [member, role] of [
      [administrator, "ADMINISTRATOR"],
      [manager, "MANAGER"],
      [author, "AUTHOR"],
      [guest, "GUEST"],
    ] as const) {
      await teamMembershipRepository.create({
        status: "ACTIVE",
        expiresAt: new Date(),
        role: role as TeamMembership["role"],
        email: "",
        userId: member?.user?.id,
        teamId: team.id,
      })
    }

    const userRepository = container.make(UserRepository)

    administratorUser = (await userRepository.findById(
      administrator.user.id,
    )) as User
    managerUser = (await userRepository.findById(manager.user.id)) as User

    authorUser = (await userRepository.findById(author.user.id)) as User

    guestUser = (await userRepository.findById(guest.user.id)) as User
  }

  let audienceForNewsletter: { id: string } | undefined = undefined
  if (createAudienceForNewsletter) {
    audienceForNewsletter = await container
      .make(CreateAudienceAction)
      .handle(
        {
          name: faker.lorem.words(3),
          slug:
            faker.number.int({ min: 10, max: 100 }) +
            "-" +
            faker.lorem.slug(),
          product: "letters",
        },
        team.id,
      )

    await container.make(WebsiteRepository).create({
      slug: faker.lorem.slug(),
      teamId: team.id,
      websiteDomain: "news-" + faker.lorem.slug() + ".fastmedia.com",
      websiteDomainVerifiedAt: DateTime.now().toJSDate(),
      websiteDomainCnameValue: `${faker.lorem.slug()}.fastmedia.com`,
    })
  }

  async function findWebsiteWithPages() {
    if (!createAudienceForNewsletter || !audienceForNewsletter) {
      return undefined
    }

    const website = await container
      .make(WebsiteRepository)
      .findByTeamId(team?.id)

    return container.make(WebsiteRepository).findByIdWithPages(website.id)
  }

  return {
    user: freshUser,
    team: teamObject as Team,
    audience,
    administratorUser,
    managerUser,
    guestUser,
    authorUser,
    broadcastId,
    audienceForNewsletter,
    website: (await findWebsiteWithPages()) as WebsiteWithPages,
  }
}
