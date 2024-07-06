import { Secret } from "@poppinss/utils"
import { FastifyReply, FastifyRequest } from "fastify"
import { inject, injectable } from "tsyringe"

import { AccessTokenRepository } from "@/domains/auth/acess_tokens/repositories/access_token_repository.js"

@injectable()
export class AccessTokenMiddleware {
  constructor(
    @inject(AccessTokenRepository)
    private accessTokenRepository: AccessTokenRepository,
  ) {}

  handle = async (request: FastifyRequest, response: FastifyReply) => {
    const tokenHeader = (request.headers["authorization"] as string)?.split(
      "Bearer ",
    )?.[1]

    if (!tokenHeader) {
      return response.status(400).send({ message: "Unauthenticated." })
    }

    const accessToken = await this.accessTokenRepository.verifyToken(
      new Secret(tokenHeader),
    )

    if (!accessToken) {
      return response.status(400).send({ message: "Unauthenticated." })
    }

    request.accessToken = accessToken.accessToken
  }
}
