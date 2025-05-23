import dns from 'node:dns/promises'
import { appEnv } from '#root/core/app/env/app_env.js'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { describe, test, vi } from 'vitest'

import { CreateSendingDomainAction } from '#root/core/sending_domains/actions/create_sending_domain_action.js'
import { CheckSendingDomainDnsConfigurationJob } from '#root/core/sending_domains/jobs/check_sending_domain_dns_configuration_job.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { DnsConfigurationTool } from '#root/core/tools/dns/dns_configuration_tool.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'

import type { UpdateSendingDomain } from '#root/database/database_schema_types.js'
import { sendingDomains } from '#root/database/schema.js'

import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'
import { setupDomainForDnsChecks } from '#root/core/tests/unit/helpers/domains/setup_domain_for_dns_checks.js'

describe('@sending-domains-dns Sending domain dns configuration check', () => {
  test('marks sending domain as verified when dns records are correctly configured', async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { records, sendingDomain, sendingDomainId, TEST_DOMAIN } =
      await setupDomainForDnsChecks()

    const mockResolveCname = vi
      .spyOn(dns, 'resolveCname')
      .mockImplementation(async (cname) => {
        if (cname.includes('clicks')) {
          return [appEnv.software.trackingHostName]
        }

        return [appEnv.software.bounceHost]
      })

    const mockResolveTxt = vi
      .spyOn(dns, 'resolveTxt')
      .mockImplementation(async () => [[records.dkim.value]])

    await container.make(CheckSendingDomainDnsConfigurationJob).handle({
      database: makeDatabase(),
      redis: makeRedis(),
      payload: { sendingDomainId },
      logger: makeLogger(),
    })

    const refreshedSendingDomain = await database.query.sendingDomains.findFirst({
      where: eq(sendingDomains.id, sendingDomainId),
    })

    expect(mockResolveCname).toHaveBeenCalledWith(
      `${appEnv.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeDefined()
    expect(refreshedSendingDomain?.returnPathDomainVerifiedAt).toBeDefined()
    expect(refreshedSendingDomain?.trackingDomainVerifiedAt).toBeDefined()
  })

  test('marks only return path as verified when only return path dns records are correctly configured', async ({
    expect,
  }) => {
    const database = makeDatabase()
    const { team } = await createUser()

    const TEST_DOMAIN = faker.internet.domainName()

    const { id: sendingDomainId } = await container
      .make(CreateSendingDomainAction)
      .handle({ name: TEST_DOMAIN }, team.id)

    const sendingDomain = await database.query.sendingDomains.findFirst({
      where: eq(sendingDomains.id, sendingDomainId),
    })

    const mockResolveCname = vi
      .spyOn(dns, 'resolveCname')
      .mockImplementation(async () => [appEnv.software.bounceHost])

    const mockResolveTxt = vi.spyOn(dns, 'resolveTxt').mockImplementation(async () => [])

    await container.make(CheckSendingDomainDnsConfigurationJob).handle({
      database: makeDatabase(),
      redis: makeRedis(),
      payload: { sendingDomainId },
      logger: makeLogger(),
    })

    const refreshedSendingDomain = await database.query.sendingDomains.findFirst({
      where: eq(sendingDomains.id, sendingDomainId),
    })

    expect(mockResolveCname).toHaveBeenCalledWith(
      `${appEnv.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeFalsy()
    expect(refreshedSendingDomain?.returnPathDomainVerifiedAt).toBeDefined()
  })

  test('marks only dkim as verified when only dkim dns records are correctly configured', async ({
    expect,
  }) => {
    const database = makeDatabase()
    const { team } = await createUser()

    const TEST_DOMAIN = faker.internet.domainName()

    const { id: sendingDomainId } = await container
      .make(CreateSendingDomainAction)
      .handle({ name: TEST_DOMAIN }, team.id)

    const sendingDomain = await database.query.sendingDomains.findFirst({
      where: eq(sendingDomains.id, sendingDomainId),
    })

    const records = container
      .make(DnsConfigurationTool)
      .forDomain(TEST_DOMAIN)
      .getRecords(
        sendingDomain?.dkimPublicKey as string,
        sendingDomain?.dkimSubDomain as string,
      )

    const mockResolveCname = vi
      .spyOn(dns, 'resolveCname')
      .mockImplementation(async () => [])

    const mockResolveTxt = vi
      .spyOn(dns, 'resolveTxt')
      .mockImplementation(async () => [[records.dkim.value]])

    await container.make(CheckSendingDomainDnsConfigurationJob).handle({
      database: makeDatabase(),
      redis: makeRedis(),
      payload: { sendingDomainId },
      logger: makeLogger(),
    })

    const jobs = await Queue.sending_domains().getJobs()

    const checkDnsJobs = jobs.filter(
      (job) =>
        job?.data?.sendingDomainId === sendingDomainId &&
        job?.name === CheckSendingDomainDnsConfigurationJob.id,
    )

    const refreshedSendingDomain = await database.query.sendingDomains.findFirst({
      where: eq(sendingDomains.id, sendingDomainId),
    })

    expect(mockResolveCname).toHaveBeenCalledWith(
      `${appEnv.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeDefined()
    expect(refreshedSendingDomain?.returnPathDomainVerifiedAt).toBeNull()

    expect(checkDnsJobs).toHaveLength(2) // one job queued when sending domain is created, and another queued by the job after it executes
  })
})
