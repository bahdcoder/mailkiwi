import { DeveloperToolsRepository } from '#root/core/developer-tools/repositories/developer_tools_repository.js'
import { container } from '#root/core/utils/typi.js'

export class GetSubdomainsAction {
  constructor(
    private developerToolsRepository = container.make(DeveloperToolsRepository),
  ) {}

  async handle() {
    const domains = await this.developerToolsRepository.findDomainsWithRecords()

    return domains.map((domain) => ({
      id: domain.id,
      subdomain: domain.subdomain,
      domain: domain.domain,
      fullDomain: `${domain.subdomain}.${domain.domain}`,
      externalId: domain.externalId,
      recordsCount: domain.domainRecords.length,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }))
  }
}
