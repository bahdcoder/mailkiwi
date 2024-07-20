import { CreateTagDto } from "@/domains/audiences/dto/tags/create_tag_dto.js"
import { TagRepository } from "@/domains/audiences/repositories/tag_repository.js"
import { container } from "@/utils/typi.js"

export class CreateTagAction {
  constructor(
    private tagRepository: TagRepository = container.make(TagRepository),
  ) {}

  handle = async (payload: CreateTagDto, audienceId: string) => {
    const audience = await this.tagRepository.create(payload, audienceId)

    return audience
  }
}
