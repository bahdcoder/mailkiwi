import { createSign, createVerify } from 'node:crypto'
import { appEnv } from '#root/core/app/env/app_env.js'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import { sendingDomains } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'
import { Encryption } from '#root/core/shared/utils/encryption/encryption.js'

import { container } from '#root/core/utils/typi.js'

describe('@domains', () => {
  test('can create unique sending domains for a team', async ({ expect }) => {
    const { team, user } = await createUser()

    const name = `${cuid()}newsletter.kibamail.com`

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/sending_domains',
      body: {
        name,
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

    const [sendingDomain] = await container
      .make(SendingDomainRepository)
      .domains()
      .findAll(eq(sendingDomains.teamId, team.id))

    const dkimPrivateKey = new Encryption(appEnv.APP_KEY)
      .decrypt(sendingDomain?.dkimPrivateKey)
      ?.release() as string

    /**
     *
     * In order to verify the DKIM key pair was generated correctly,
     * we sign a message using the private key, (just like when sending an email)
     * and use the public key to verify the message.
     */
    const dkimPublicKey = domains[0]?.dkimPublicKey

    const THIS_IS_A_TEST_MESSAGE = 'THIS_IS_A_TEST_MESSAGE'

    const signedMessage = createSign('sha256')
      .update(THIS_IS_A_TEST_MESSAGE)
      .sign(dkimPrivateKey, 'hex')

    const verifiedMessage = createVerify('sha256')
      .update(THIS_IS_A_TEST_MESSAGE)
      .verify(dkimPublicKey, signedMessage, 'hex')

    expect(verifiedMessage).toBe(true)
  })
})
