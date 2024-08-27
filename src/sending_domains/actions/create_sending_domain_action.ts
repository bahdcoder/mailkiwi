import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { CheckSendingDomainDnsConfigurationJob } from "@/sending_domains/jobs/check_sending_domain_dns_configuration_job.js"
import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { DkimHostNameTool } from "@/tools/dkim/dkim_hostname_tool.js"
import { DkimKeyPairTool } from "@/tools/dkim/dkim_keypair_tool.js"

import { makeConfig, makeDatabase } from "@/shared/container/index.ts"
import { Queue } from "@/shared/queue/queue.js"

import { container } from "@/utils/typi.js"

export class CreateSendingDomainAction {
  constructor(
    private config = makeConfig(),
    private database = makeDatabase(),
    private teamRepository = container.make(TeamRepository),
    private sendingDomainRepository = container.make(SendingDomainRepository),
  ) {}

  async handle(payload: CreateAudienceDto, teamId: string) {
    const {
      publicKey: dkimPublicKey,
      encrypted: { privateKey: dkimPrivateKey },
    } = container.make(DkimKeyPairTool).generate()

    const sendingDomain = await this.database.transaction(
      async (transaction) => {
        const dkimSubDomain = container.make(DkimHostNameTool).generate()
        const [sendingDomain] = await Promise.all([
          this.sendingDomainRepository.transaction(transaction).create({
            name: payload.name,
            teamId,
            dkimPublicKey,
            dkimPrivateKey: dkimPrivateKey.release(),
            // The default domain for return path would be kb.customerdomain.com -> points to mail.kbmta.net
            returnPathSubDomain: this.config.software.bounceSubdomain,
            returnPathDomainCnameValue: this.config.software.bounceHost,
            dkimSubDomain, // 20241112010101._domainkey
          }),
          this.teamRepository.usage(teamId).set({
            encryptedDkimPrivateKey: dkimPrivateKey.release(),
            returnPathSubDomain: this.config.software.bounceSubdomain,
            returnPathDomainCnameValue: this.config.software.bounceHost,
            dkimSubDomain,
          }),
        ])

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
