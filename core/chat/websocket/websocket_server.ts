import type { IncomingMessage, Server } from 'node:http'
import type { ServerType } from '@hono/node-server'
import { type WebSocket, WebSocketServer } from 'ws'
import {
  type MapOfChannelConnections,
  type MapOfConnections,
  WebsocketServerHandler,
} from './websocket_server_handler.js'

import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import type { UserWithChannelMemberships } from '#root/database/database_schema_types.js'

import { makeLogger } from '#root/core/shared/container/index.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { Session } from '#root/core/shared/sessions/sessions.js'

import { container } from '#root/core/utils/typi.js'

export class WebsocketServer {
  protected logger = makeLogger()

  protected connections: MapOfConnections = new Map()

  protected channelConnections: MapOfChannelConnections = new Map()

  protected $wss

  constructor(protected server: ServerType) {
    this.$wss = new WebSocketServer({
      server: this.server as Server,
    })
    this.registerEventListeners()
  }

  wss() {
    return this.$wss
  }

  registerEventListeners() {
    this.$wss.on('connection', this.onConnection)
    this.$wss.on('error', this.onSocketError)
    this.$wss.on('close', this.onClose)
  }

  protected getAuthenticatedUserFromRequest = async (request: IncomingMessage) => {
    const headers = new Headers()
    headers.set('cookie', request.headers.cookie ?? '')

    const auth = await new Session().getUser({
      req: {
        raw: {
          headers,
        },
      },
    } as HonoContext)

    if (!auth?.userId) {
      return undefined
    }

    const user = await container
      .make(UserRepository)
      .findByIdWithChannelMemberships(auth?.userId)

    return user
  }

  onClose = () => {
    this.connections.clear()
  }

  onConnection = async (websocket: WebSocket, request: IncomingMessage) => {
    const self = this

    const user = await self.getAuthenticatedUserFromRequest(request)

    if (!user) {
      websocket.close()

      return
    }

    self.logger.info(`New websocket connection initiated for user: ${user.id}`)

    self.subscribeUserToChannels(user, websocket)

    websocket.on('close', () => {
      self.unsubscribeUserFromChannels(user)
    })

    websocket.on('message', (data) => {
      new WebsocketServerHandler(user, data)
    })
  }

  subscribeUserToChannels = (user: UserWithChannelMemberships, websocket: WebSocket) => {
    const self = this

    self.connections.set(user.id, {
      user,
      websocket,
    })

    for (const channel of user.channels) {
      const members = self.channelConnections.get(channel.channelId)

      if (!members) {
        self.channelConnections.set(channel.channelId, new Set([user.id]))
      } else {
        self.channelConnections.get(channel.channelId)?.add(user.id)
      }
    }
  }

  unsubscribeUserFromChannels = (user: UserWithChannelMemberships) => {
    const self = this

    for (const channel of user.channels) {
      self.channelConnections.get(channel.channelId)?.delete(user.id)
    }

    self.connections.delete(user.id)

    self.logger.info(`Websocket connection terminated for user: ${user.id}`)
  }

  onCloseConnection = () => {}

  onMessage = () => {}

  onSocketError = (error: Error) => {
    this.logger.error(error)
  }
}
