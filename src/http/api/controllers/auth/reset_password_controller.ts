import { FastifyReply, FastifyRequest } from "fastify"
import { inject } from "tsyringe"

import { UserRepository } from "@/domains/auth/users/repositories/user_repository"

export class ResetPasswordController {
  constructor(
    @inject(UserRepository)
    private userRepository: UserRepository,
  ) {}

  async find(_: FastifyRequest, __: FastifyReply) {
    // Implement controller logic here
  }

  async create(_: FastifyRequest, __: FastifyReply) {
    // Implement controller logic here
  }

  async update(_: FastifyRequest, __: FastifyReply) {
    // Implement controller logic here
  }

  async delete(_: FastifyRequest, __: FastifyReply) {
    // Implement controller logic here
  }
}
