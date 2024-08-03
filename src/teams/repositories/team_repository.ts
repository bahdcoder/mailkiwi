import { eq } from "drizzle-orm";

import { BaseRepository } from "@/shared/repositories/base_repository.js";
import { Encryption } from "@/shared/utils/encryption/encryption.js";
import string from "@/shared/utils/string.js";
import { makeDatabase, makeEnv } from "@/shared/container/index.js";
import type { DrizzleClient } from "@/database/client.js";
import { teams } from "@/database/schema/schema.js";

import type { CreateTeamDto } from "@/teams/dto/create_team_dto.js";

export class TeamRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super();
  }

  async create(payload: CreateTeamDto, userId: string) {
    const id = this.cuid();

    await this.database.insert(teams).values({
      ...payload,
      id,
      configurationKey: this.generateTeamConfigurationKey(),
      userId,
    });

    return { id };
  }

  async findUserDefaultTeam(userId: string) {
    return this.database.query.teams.findFirst({
      where: eq(teams.userId, userId),
      with: {
        members: true,
        mailer: {
          with: {
            identities: true,
          },
        },
      },
    });
  }

  async findById(teamId: string) {
    const team = await this.database.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        members: true,
        mailer: {
          with: {
            identities: true,
          },
        },
      },
    });

    return team;
  }

  generateTeamConfigurationKey() {
    return new Encryption({
      secret: makeEnv().APP_KEY,
    }).encrypt(string.random(32));
  }
}
