import type { UpdateBroadcastDto } from "@/broadcasts/dto/update_broadcast_dto.js";
import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js";
import { EmailContentRepository } from "@/content/repositories/email_content_repository.js";
import type { Broadcast } from "@/database/schema/types.js";
import { container } from "@/utils/typi.js";

export class UpdateBroadcastAction {
  constructor(
    private broadcastRepository = container.make(BroadcastRepository),
    private emailContentRepository = container.make(EmailContentRepository),
  ) {}

  async handle(broadcast: Broadcast, payload: UpdateBroadcastDto) {
    const { emailContent, ...broadcastPayload } = payload;

    if (Object.keys(broadcastPayload).length > 0) {
      await this.broadcastRepository.update(broadcast.id, broadcastPayload);
    }

    if (emailContent && Object.keys(emailContent).length > 0) {
      await this.emailContentRepository.updateForBroadcast(
        broadcast,
        emailContent,
      );
    }

    return { id: broadcast.id };
  }
}
