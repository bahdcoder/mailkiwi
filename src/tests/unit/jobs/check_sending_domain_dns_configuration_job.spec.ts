import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import dns from "node:dns/promises"
import { describe, test, vi } from "vitest"

import { CreateSendingDomainAction } from "@/sending_domains/actions/create_sending_domain_action.ts"
import { CheckSendingDomainDnsConfigurationJob } from "@/sending_domains/jobs/check_sending_domain_dns_configuration_job.ts"

import { DnsConfigurationTool } from "@/tools/dns/dns_configuration_tool.ts"

import { createUser } from "@/tests/mocks/auth/users.ts"
import {
  refreshDatabase,
  refreshRedisDatabase,
} from "@/tests/mocks/teams/teams.ts"

import { sendingDomains } from "@/database/schema/schema.ts"

import {
  makeConfig,
  makeDatabase,
  makeRedis,
} from "@/shared/container/index.ts"
import { Queue } from "@/shared/queue/queue.ts"

import { container } from "@/utils/typi.ts"

describe("Sending domain dns configuration check", () => {
  test("marks sending domain as verified when dns records are correctly configured", async ({
    expect,
  }) => {
    await refreshDatabase()
    const config = makeConfig()
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
      .spyOn(dns, "resolveCname")
      .mockImplementation(async () => [config.software.bounceHost])

    const mockResolveTxt = vi
      .spyOn(dns, "resolveTxt")
      .mockImplementation(async () => [[records.dkim.value]])

    await container.make(CheckSendingDomainDnsConfigurationJob).handle({
      database: makeDatabase(),
      redis: makeRedis(),
      payload: { sendingDomainId },
    })

    const refreshedSendingDomain =
      await database.query.sendingDomains.findFirst({
        where: eq(sendingDomains.id, sendingDomainId),
      })

    expect(mockResolveCname).toHaveBeenCalledWith(
      `${config.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeDefined()
    expect(refreshedSendingDomain?.returnPathDomainVerifiedAt).toBeDefined()
  })

  test("marks only return path as verified when only return path dns records are correctly configured", async ({
    expect,
  }) => {
    await refreshDatabase()
    const config = makeConfig()
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
      .spyOn(dns, "resolveCname")
      .mockImplementation(async () => [config.software.bounceHost])

    const mockResolveTxt = vi
      .spyOn(dns, "resolveTxt")
      .mockImplementation(async () => [])

    await container.make(CheckSendingDomainDnsConfigurationJob).handle({
      database: makeDatabase(),
      redis: makeRedis(),
      payload: { sendingDomainId },
    })

    const refreshedSendingDomain =
      await database.query.sendingDomains.findFirst({
        where: eq(sendingDomains.id, sendingDomainId),
      })

    expect(mockResolveCname).toHaveBeenCalledWith(
      `${config.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeFalsy()
    expect(refreshedSendingDomain?.returnPathDomainVerifiedAt).toBeDefined()
  })

  test("marks only dkim as verified when only dkim dns records are correctly configured", async ({
    expect,
  }) => {
    await refreshRedisDatabase()
    await refreshDatabase()
    const config = makeConfig()
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
      .spyOn(dns, "resolveCname")
      .mockImplementation(async () => [])

    const mockResolveTxt = vi
      .spyOn(dns, "resolveTxt")
      .mockImplementation(async () => [[records.dkim.value]])

    await container.make(CheckSendingDomainDnsConfigurationJob).handle({
      database: makeDatabase(),
      redis: makeRedis(),
      payload: { sendingDomainId },
    })

    const checkDnsJobs = await Queue.sending_domains().getJobs()

    const refreshedSendingDomain =
      await database.query.sendingDomains.findFirst({
        where: eq(sendingDomains.id, sendingDomainId),
      })

    expect(mockResolveCname).toHaveBeenCalledWith(
      `${config.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeDefined()
    expect(refreshedSendingDomain?.returnPathDomainVerifiedAt).toBeNull()

    expect(checkDnsJobs).toHaveLength(2) // one job queued when sending domain is created, and another queued by the job after it executes
  })
})
