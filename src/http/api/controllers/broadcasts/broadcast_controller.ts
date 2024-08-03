import { CreateBroadcastAction } from "@/broadcasts/actions/create_broadcast_action.js";
import { DeleteBroadcastAction } from "@/broadcasts/actions/delete_broadcast_action.js";
import { GetBroadcastAction } from "@/broadcasts/actions/get_broadcast_action.ts";
import { SendBroadcastAction } from "@/broadcasts/actions/send_broadcast_action.js";
import { UpdateBroadcastAction } from "@/broadcasts/actions/update_broadcast_action.js";
import { CreateBroadcastDto } from "@/broadcasts/dto/create_broadcast_dto.js";
import {
  SendBroadcastDto,
  SendBroadcastSchema,
} from "@/broadcasts/dto/send_broadcast_dto.js";
import { UpdateBroadcastDto } from "@/broadcasts/dto/update_broadcast_dto.js";
import { BaseController } from "@/shared/controllers/base_controller.js";
import { BroadcastValidationAndAuthorizationConcern } from "@/http/api/concerns/broadcast_validation_concern.js";
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js";
import { makeApp } from "@/shared/container/index.js";
import type { HonoInstance } from "@/server/hono.js";
import type { HonoContext } from "@/server/types.js";
import { container } from "@/utils/typi.js";
import { safeParseAsync } from "valibot";

export class BroadcastController extends BaseController {
  constructor(
    private app: HonoInstance = makeApp(),
    private broadcastValidationAndAuthorizationConcern: BroadcastValidationAndAuthorizationConcern = container.make(
      BroadcastValidationAndAuthorizationConcern,
    ),
  ) {
    super();

    this.app.defineRoutes(
      [
        ["POST", "/", this.create.bind(this)],
        ["DELETE", "/:broadcastId", this.delete.bind(this)],
        ["GET", "/:broadcastId", this.get.bind(this)],
        ["PUT", "/:broadcastId", this.update.bind(this)],
        ["POST", "/:broadcastId/send", this.send.bind(this)],
      ],
      { prefix: "broadcasts" },
    );
  }

  async create(ctx: HonoContext) {
    await this.broadcastValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
    );

    const data = await this.validate(ctx, CreateBroadcastDto);
    const broadcast = await container
      .resolve(CreateBroadcastAction)
      .handle(data, ctx.get("team").id);

    return ctx.json(broadcast, 201);
  }

  async get(ctx: HonoContext) {
    const broadcast =
      await this.broadcastValidationAndAuthorizationConcern.ensureBroadcastExists(
        ctx,
      );
    await this.broadcastValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      broadcast,
    );

    return ctx.json(await container.make(GetBroadcastAction).handle(broadcast));
  }

  async delete(ctx: HonoContext) {
    const broadcast =
      await this.broadcastValidationAndAuthorizationConcern.ensureBroadcastExists(
        ctx,
      );
    await this.broadcastValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      broadcast,
    );
    const id = ctx.req.param("broadcastId");

    await container.resolve(DeleteBroadcastAction).handle(id);

    return ctx.json({ id });
  }

  async update(ctx: HonoContext) {
    const broadcast =
      await this.broadcastValidationAndAuthorizationConcern.ensureBroadcastExists(
        ctx,
      );
    await this.broadcastValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      broadcast,
    );
    const broadcastId = ctx.req.param("broadcastId");

    const data = await this.validate(ctx, UpdateBroadcastDto);

    const { id } = await container
      .resolve(UpdateBroadcastAction)
      .handle(broadcast, data);

    return ctx.json({ id });
  }

  async send(ctx: HonoContext) {
    const broadcast =
      await this.broadcastValidationAndAuthorizationConcern.ensureBroadcastExists(
        ctx,
      );
    await this.broadcastValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
    );

    const { success, issues } = await safeParseAsync(
      SendBroadcastSchema,
      broadcast,
    );

    if (!success) throw E_VALIDATION_FAILED(issues);

    if (broadcast.status !== "DRAFT")
      throw E_VALIDATION_FAILED([
        { message: "Only a draft broadcast can be sent.", field: "status" },
      ]);

    await container.make(SendBroadcastAction).handle(broadcast);

    return ctx.json({ id: broadcast.id });
  }
}
