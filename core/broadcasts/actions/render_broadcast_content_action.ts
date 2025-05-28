import type { BroadcastWithEmailContent } from '#root/database/database_schema_types.js'
import {
  type ProsemirrorContent,
  ReactEmailBuilderTool,
} from '#root/core/emails/react_email/react_email_builder_tool.jsx'

export class RenderBroadcastContentAction {
  handle(broadcast: BroadcastWithEmailContent) {
    return new ReactEmailBuilderTool().build(
      broadcast.emailContent.contentJson as ProsemirrorContent,
    )
  }
}
