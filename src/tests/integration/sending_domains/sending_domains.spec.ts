import { eq } from "drizzle-orm"
import { createSign, createVerify } from "node:crypto"
import { describe, test } from "vitest"

import { TeamRepository } from "@/teams/repositories/team_repository.ts"

import { createUser } from "@/tests/mocks/auth/users.ts"
import { refreshDatabase } from "@/tests/mocks/teams/teams.ts"
import { makeRequestAsUser } from "@/tests/utils/http.ts"

import { sendingDomains } from "@/database/schema/schema.ts"

import { makeDatabase, makeEnv } from "@/shared/container/index.ts"
import { Queue } from "@/shared/queue/queue.ts"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

import { container } from "@/utils/typi.ts"

describe("Sending domains", () => {
  test("can create unique sending domains for a team", async ({ expect }) => {
    await refreshDatabase()

    const { team, user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/sending_domains",
      body: {
        name: "newsletter.kibamail.com",
      },
    })

    expect(response.status).toEqual(200)

    const domains = await makeDatabase().query.sendingDomains.findMany({
      where: eq(sendingDomains.teamId, team.id),
    })

    expect(domains).toHaveLength(1)

    const checkDnsJobs = await Queue.sending_domains().getJobs()

    expect(checkDnsJobs[0]?.delay).toEqual(60000) // wait 60 seconds before running job
    expect(checkDnsJobs[0]?.data?.sendingDomainId).toEqual(domains[0].id)

    const teamUsage = await container.make(TeamRepository).usage(team.id).get()

    expect(teamUsage?.encryptedDkimPrivateKey).toEqual(
      domains[0]?.dkimPrivateKey,
    )
    const dkimPrivateKey = new Encryption(makeEnv().APP_KEY)
      .decrypt(teamUsage?.encryptedDkimPrivateKey)
      ?.release() as string

    /**
     *
     * In order to verify the DKIM key pair was generated correctly,
     * we sign a message using the private key, (just like when sending an email)
     * and use the public key to verify the message.
     */
    const dkimPublicKey = domains[0]?.dkimPublicKey

    const THIS_IS_A_TEST_MESSAGE = "THIS_IS_A_TEST_MESSAGE"

    const signedMessage = createSign("sha256")
      .update(THIS_IS_A_TEST_MESSAGE)
      .sign(dkimPrivateKey, "hex")

    const verifiedMessage = createVerify("sha256")
      .update(THIS_IS_A_TEST_MESSAGE)
      .verify(dkimPublicKey, signedMessage, "hex")

    expect(verifiedMessage).toBe(true)
  })
})
