import { appEnv } from '#root/core/app/env/app_env.js'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import type { CreateSendingDomainDto } from '#root/core/sending_domains/dto/create_sending_domain_dto.js'
import { CheckSendingDomainDnsConfigurationJob } from '#root/core/sending_domains/jobs/check_sending_domain_dns_configuration_job.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { DkimHostNameTool } from '#root/core/tools/dkim/dkim_hostname_tool.js'
import { DkimKeyPairTool } from '#root/core/tools/dkim/dkim_keypair_tool.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

export class CreateSendingDomainAction {
  constructor(
    private env = appEnv,
    private database = makeDatabase(),
    private teamRepository = container.make(TeamRepository),
    private sendingDomainRepository = container.make(SendingDomainRepository),
  ) {}

  async handle(payload: CreateSendingDomainDto, teamId: string) {
    const {
      publicKey: dkimPublicKey,
      encrypted: { privateKey: dkimPrivateKey },
    } = new DkimKeyPairTool(this.env.APP_KEY).generate()

    const sendingDomain = await this.database.transaction(async (transaction) => {
      const dkimSubDomain = container.make(DkimHostNameTool).generate()
      const [sendingDomain] = await Promise.all([
        this.sendingDomainRepository.transaction(transaction).create({
          name: payload.name,
          teamId,
          dkimPublicKey,
          dkimPrivateKey: dkimPrivateKey.release(),
          returnPathSubDomain: this.env.software.bounceSubdomain,
          returnPathDomainCnameValue: this.env.software.bounceHost,
          dkimSubDomain,
          trackingSubDomain: this.env.software.trackingSubdomain,
          trackingDomainCnameValue: this.env.software.trackingHostName,
          product: payload.product,
        }),
      ])

      // -> 1. Create tracking CNAME for event tracking of this domain. Example: tracking.customerdomain.com points to e.kbmta.net (our domain)
      // -> 2. The CheckSendingDomainDnsConfigurationJob detects CNAME successfully configured, and triggers a background job to generate SSL certificate for HTTPS tracking
      // -> 3. Store the cert into principal database
      // -> 4. Setup load balancer for email tracking
      // -> 5. Load balancer handles SSL termination
      // -> 6. Load balancer forwards traffic from e.kbmta.net -> kibamail.com/c/<tracking-token>
      // -> 7. the endpoint on monolith decodes tracking token, creates background job for tracking event, and responds with a redirect to original url.

      return sendingDomain
    })

    await Queue.sending_domains().add(
      CheckSendingDomainDnsConfigurationJob.id,
      { sendingDomainId: sendingDomain.id },
      {
        delay: 1 * 60 * 1000, // wait 60 seconds before performing the first check.
      },
    )

    return sendingDomain
  }
}
