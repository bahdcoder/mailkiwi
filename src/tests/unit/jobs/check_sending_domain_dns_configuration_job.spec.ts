import { apiEnv } from "@/api/env/api_env.js"
import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import dns from "node:dns/promises"
import { describe, test, vi } from "vitest"

import { AssignSendingSourceToSendingDomainAction } from "@/sending_domains/actions/assign_sending_source_to_sending_domain_action.js"
import { CreateSendingDomainAction } from "@/sending_domains/actions/create_sending_domain_action.js"
import { CheckSendingDomainDnsConfigurationJob } from "@/sending_domains/jobs/check_sending_domain_dns_configuration_job.js"
import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { DnsConfigurationTool } from "@/tools/dns/dns_configuration_tool.js"

import { createUser } from "@/tests/mocks/auth/users.js"

import { sendingDomains } from "@/database/schema/schema.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"

import { container } from "@/utils/typi.js"

export const setupDomainForDnsChecks = async (domain?: string) => {
  const { team, user } = await createUser()

  const TEST_DOMAIN = domain ?? faker.internet.domainName()

  const { id: sendingDomainId } = await container
    .make(CreateSendingDomainAction)
    .handle({ name: TEST_DOMAIN }, team.id)

  const sendingDomain = await container
    .make(SendingDomainRepository)
    .findById(sendingDomainId)

  const records = container
    .make(DnsConfigurationTool)
    .forDomain(TEST_DOMAIN)
    .getRecords(
      sendingDomain?.dkimPublicKey as string,
      sendingDomain?.dkimSubDomain as string,
    )

  await container
    .make(AssignSendingSourceToSendingDomainAction)
    .handle(sendingDomainId)

  return {
    records,
    sendingDomain,
    sendingDomainId,
    TEST_DOMAIN,
    team,
    user,
  }
}
describe("@sending-domains-dns Sending domain dns configuration check", () => {
  test("marks sending domain as verified when dns records are correctly configured", async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { records, sendingDomain, sendingDomainId, TEST_DOMAIN } =
      await setupDomainForDnsChecks()

    const mockResolveCname = vi
      .spyOn(dns, "resolveCname")
      .mockImplementation(async () => [apiEnv.software.bounceHost])

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
      `${apiEnv.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeDefined()
    expect(
      refreshedSendingDomain?.returnPathDomainVerifiedAt,
    ).toBeDefined()
  })

  test("marks only return path as verified when only return path dns records are correctly configured", async ({
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
      .spyOn(dns, "resolveCname")
      .mockImplementation(async () => [apiEnv.software.bounceHost])

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
      `${apiEnv.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeFalsy()
    expect(
      refreshedSendingDomain?.returnPathDomainVerifiedAt,
    ).toBeDefined()
  })

  test("marks only dkim as verified when only dkim dns records are correctly configured", async ({
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

    const jobs = await Queue.sending_domains().getJobs()

    const checkDnsJobs = jobs.filter(
      (job) =>
        job?.data?.sendingDomainId === sendingDomainId &&
        job?.name === CheckSendingDomainDnsConfigurationJob.id,
    )

    const refreshedSendingDomain =
      await database.query.sendingDomains.findFirst({
        where: eq(sendingDomains.id, sendingDomainId),
      })

    expect(mockResolveCname).toHaveBeenCalledWith(
      `${apiEnv.software.bounceSubdomain}.${TEST_DOMAIN}`,
    )

    expect(mockResolveTxt).toHaveBeenCalledWith(
      `${sendingDomain?.dkimSubDomain}.${TEST_DOMAIN}`,
    )

    expect(refreshedSendingDomain?.dkimVerifiedAt).toBeDefined()
    expect(refreshedSendingDomain?.returnPathDomainVerifiedAt).toBeNull()

    expect(checkDnsJobs).toHaveLength(2) // one job queued when sending domain is created, and another queued by the job after it executes
  })
})
