import dns from 'node:dns/promises'
import { appEnv } from '#root/core/app/env/app_env.js'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { describe, test, vi } from 'vitest'

import { AssignSendingSourceToSendingDomainAction } from '#root/core/sending_domains/actions/assign_sending_source_to_sending_domain_action.js'
import { CreateSendingDomainAction } from '#root/core/sending_domains/actions/create_sending_domain_action.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { DnsConfigurationTool } from '#root/core/tools/dns/dns_configuration_tool.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'

import type { UpdateSendingDomain } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

export const setupDomainForDnsChecks = async (
  domain?: string,
  domainSettings?: UpdateSendingDomain,
) => {
  const { team, user, audience, broadcastGroupId } = await createUser()

  const TEST_DOMAIN = domain ?? faker.internet.domainName()

  const { id: sendingDomainId } = await container
    .make(CreateSendingDomainAction)
    .handle({ name: TEST_DOMAIN }, team.id)

  await container.make(SendingDomainRepository).update(sendingDomainId, {
    trackingDomainVerifiedAt: DateTime.now().toJSDate(),
    trackingDomainSslVerifiedAt: DateTime.now().toJSDate(),
    returnPathDomainVerifiedAt: DateTime.now().toJSDate(),
    openTrackingEnabled: true,
    clickTrackingEnabled: true,
    ...domainSettings,
  })

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

  await container.make(AssignSendingSourceToSendingDomainAction).handle(sendingDomainId)

  return {
    records,
    sendingDomain,
    sendingDomainId,
    TEST_DOMAIN,
    team,
    user,
    audience,
    broadcastGroupId,
  }
}
