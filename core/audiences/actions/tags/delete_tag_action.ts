import { TagRepository } from '#root/core/audiences/repositories/tag_repository.js'

import { container } from '#root/core/utils/typi.js'

export class DeleteTagAction {
  constructor(private tagRepository = container.make(TagRepository)) {}

  handle = async (tagId: string) => {
    await this.tagRepository.delete(tagId)

    return { id: tagId }
  }
}
