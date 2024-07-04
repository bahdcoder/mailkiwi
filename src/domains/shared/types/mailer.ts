import { UpdateMailerDto } from "@/domains/teams/dto/mailers/update_mailer_dto"

export type MailerConfiguration = Required<UpdateMailerDto["configuration"]>
