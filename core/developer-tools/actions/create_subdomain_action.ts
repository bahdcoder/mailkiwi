import type { CreateSubdomainDto } from '#root/core/developer-tools/dtos/create_subdomain_dto.js'
import { DeveloperToolsRepository } from '#root/core/developer-tools/repositories/developer_tools_repository.js'
import { container } from '#root/core/utils/typi.js'
import { NamecheapApiTool } from '../tools/namecheap_api_tool.js'
import { nanoid } from 'nanoid'

export class CreateSubdomainAction {
  constructor(
    private developerToolsRepository = container.make(DeveloperToolsRepository),
  ) {}

  async handle(payload: CreateSubdomainDto) {
    const subdomain = `${payload.subdomainPrefix}__${nanoid(6)}`

    return { hosts: [] }
  }
}
