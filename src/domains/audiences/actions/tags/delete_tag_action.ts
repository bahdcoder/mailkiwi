import { TagRepository } from '@/domains/audiences/repositories/tag_repository.js'
import { container } from '@/utils/typi.js'

export class DeleteTagAction {
  constructor(
    private tagRepository: TagRepository = container.make(TagRepository),
  ) {}

  handle = async (tagId: string) => {
    await this.tagRepository.delete(tagId)

    return { id: tagId }
  }
}
