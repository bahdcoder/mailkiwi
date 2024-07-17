import { inject, injectable } from "tsyringe"

import { CreateTagDto } from "@/domains/audiences/dto/tags/create_tag_dto.js"
import { TagRepository } from "@/domains/audiences/repositories/tag_repository.js"

@injectable()
export class CreateTagAction {
  constructor(
    @inject(TagRepository)
    private tagRepository: TagRepository,
  ) {}

  handle = async (payload: CreateTagDto, audienceId: string) => {
    const audience = await this.tagRepository.create(payload, audienceId)

    return audience
  }
}
