import { DateTime } from "luxon"

import { InviteTeamMemberDto } from "@/teams/dto/invite_team_member_dto.js"
import { SendTeamMemberInviteJob } from "@/teams/jobs/send_team_member_invite_job.js"
import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.js"

import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { Queue } from "@/shared/queue/queue.js"

import { container } from "@/utils/typi.js"

export class InviteTeamMemberAction {
  constructor(
    private userRepository = container.make(UserRepository),
    private teamMembershipRepository = container.make(
      TeamMembershipRepository,
    ),
  ) {}

  handle = async (payload: InviteTeamMemberDto, teamId: string) => {
    const userExists = await this.userRepository.findByEmail(payload.email)

    const { id: inviteId } = await this.teamMembershipRepository.create({
      teamId,
      role: payload.role,
      userId: userExists?.id,
      email: userExists?.email ?? payload.email,
      expiresAt: DateTime.now().plus({ days: 7 }).toJSDate(),
    })

    await Queue.accounts().add(SendTeamMemberInviteJob.id, {
      inviteId,
    })

    return { id: inviteId }
  }
}
