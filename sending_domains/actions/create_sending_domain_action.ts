import { apiEnv } from "@/api/env/api_env.js"

import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { CheckSendingDomainDnsConfigurationJob } from "@/sending_domains/jobs/check_sending_domain_dns_configuration_job.js"
import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { DkimHostNameTool } from "@/tools/dkim/dkim_hostname_tool.js"
import { DkimKeyPairTool } from "@/tools/dkim/dkim_keypair_tool.js"

import { makeDatabase } from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"

import { container } from "@/utils/typi.js"

export class CreateSendingDomainAction {
  constructor(
    private env = apiEnv,
    private database = makeDatabase(),
    private teamRepository = container.make(TeamRepository),
    private sendingDomainRepository = container.make(
      SendingDomainRepository,
    ),
  ) {}

  async handle(payload: CreateAudienceDto, teamId: string) {
    const {
      publicKey: dkimPublicKey,
      encrypted: { privateKey: dkimPrivateKey },
    } = new DkimKeyPairTool(this.env.APP_KEY).generate()

    const sendingDomain = await this.database.transaction(
      async (transaction) => {
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
          }),

          this.teamRepository.dkim().forDomain(payload.name).save({
            encryptedDkimPrivateKey: dkimPrivateKey.release(),
            returnPathSubDomain: this.env.software.bounceSubdomain,
            returnPathDomainCnameValue: this.env.software.bounceHost,
            dkimSubDomain,
            dkimPublicKey,
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
      },
    )

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
