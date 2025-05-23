import { and, eq } from 'drizzle-orm'

import type { CreateTagDto } from '#root/core/audiences/dto/tags/create_tag_dto.js'
import { TagRepository } from '#root/core/audiences/repositories/tag_repository.js'

import { tags } from '#root/database/schema.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { container } from '#root/core/utils/typi.js'

export class CreateTagAction {
  constructor(private tagRepository = container.make(TagRepository)) {}

  handle = async (payload: CreateTagDto, audienceId: string) => {
    const existingTag = await this.tagRepository.findFirst({
      where: and(eq(tags.name, payload.name), eq(tags.audienceId, audienceId)),
    })

    if (existingTag) {
      throw E_VALIDATION_FAILED([
        {
          message: 'A tag with this name already exists for this audience.',
          field: 'name',
        },
      ])
    }

    const tag = await this.tagRepository.create(payload, audienceId)

    return tag
  }
}
