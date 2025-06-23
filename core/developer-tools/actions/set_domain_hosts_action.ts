import type {
  SetDomainHostsDto,
  DomainHostRecord,
} from '#root/core/developer-tools/dtos/set_domain_hosts_dto.js'
import { NamecheapApiTool } from '#root/core/developer-tools/tools/namecheap_api_tool.js'

type ApiResponse = {
  Domain: string
  IsSuccess: 'true' | 'false'
}

export class SetDomainHostsAction {
  constructor(private namecheapApiTool = new NamecheapApiTool()) {}

  async handle(payload: SetDomainHostsDto) {
    const result = await this.updateDomainHostsViaApi(payload.domain, payload.records)
    this.validateApiResponse(result, payload.domain)

    return this.buildSuccessResponse(payload.domain, result)
  }

  private async updateDomainHostsViaApi(
    domainName: string,
    records: DomainHostRecord[],
  ): Promise<ApiResponse | undefined> {
    return await this.namecheapApiTool.setDomainHosts(domainName, records)
  }

  private validateApiResponse(result: ApiResponse | undefined, domainName: string): void {
    if (result?.IsSuccess !== 'true') {
      throw new Error(`Failed to set domain hosts for ${domainName}`)
    }
  }

  private buildSuccessResponse(
    domainName: string,
    namecheapResult: ApiResponse | undefined,
  ) {
    return {
      success: true,
      domain: domainName,
      recordsCreated: 0,
      records: [],
      namecheapResult,
    }
  }
}
