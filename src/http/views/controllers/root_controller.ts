import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { inject, injectable } from "tsyringe"

import { ContainerKey } from "@/infrastructure/container"

@injectable()
export class RootController {
  constructor(@inject(ContainerKey.app) private app: FastifyInstance) {
    this.app.defineRoutes([["GET", "*", this.index.bind(this)]], {
      prefix: "p",
      onRequestHooks: [],
    })
  }

  async index(_: FastifyRequest, reply: FastifyReply) {
    return reply
      .type("text/html")
      .send("<h1>Hello World from the other side.</h1>")
  }
}
