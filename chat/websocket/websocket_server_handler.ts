import { WebSocket } from "ws"

import { UserWithChannelMemberships } from "@/database/database_schema_types.js"

export type MapOfConnections = Map<
  string,
  { user: UserWithChannelMemberships; websocket: WebSocket }
>

export type MapOfChannelConnections = Map<string, Set<string>>

export type WebsocketMessage<T> = {
  name: "message" | "join_channel"
  payload: T
  user: UserWithChannelMemberships
}

export class WebsocketServerHandler {
  constructor(
    protected user: UserWithChannelMemberships,
    message: any,
  ) {}

  onNewMessage = async (
    event: WebsocketMessage<{
      content: {
        blocks: []
      }
    }>,
  ) => {}

  onJoinChannel = async (event: WebsocketMessage<{}>) => {}
}
