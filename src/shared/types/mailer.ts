import type { UpdateMailerDto } from "@/teams/dto/mailers/update_mailer_dto.js";

export type MailerConfiguration = Required<UpdateMailerDto["configuration"]>;
