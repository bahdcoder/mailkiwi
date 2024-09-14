import { TagRepository } from "@/audiences/repositories/tag_repository.js"

import { container } from "@/utils/typi.js"

export class DeleteTagAction {
  constructor(private tagRepository = container.make(TagRepository)) {}

  handle = async (tagId: number) => {
    await this.tagRepository.delete(tagId)

    return { id: tagId }
  }
}
