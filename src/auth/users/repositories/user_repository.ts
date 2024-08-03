import cuid2 from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

import type { CreateUserDto } from "@/auth/users/dto/create_user_dto.js";
import { BaseRepository } from "@/shared/repositories/base_repository.js";
import { scrypt } from "@/shared/utils/hash/scrypt.js";
import { makeDatabase } from "@/shared/container/index.js";
import type { DrizzleClient } from "@/database/client.js";
import { users } from "@/database/schema/schema.js";
import type { FindUserByIdArgs, User } from "@/database/schema/types.js";

export class UserRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super();
  }

  async create(user: CreateUserDto) {
    const id = cuid2.createId();

    await this.database
      .insert(users)
      .values({
        ...user,
        id,
        password: await scrypt().make(user.password),
      })
      .execute();

    return { id };
  }

  async findByEmail(email: string) {
    return this.database.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async findById(id?: string | null, args?: FindUserByIdArgs) {
    if (!id) return null;

    return this.database.query.users.findFirst({
      where: eq(users.id, id),
      ...args,
    });
  }

  async authenticateUserPassword(user: User | undefined, password: string) {
    if (!user) {
      return null;
    }

    return scrypt().verify(user.password, password);
  }
}
