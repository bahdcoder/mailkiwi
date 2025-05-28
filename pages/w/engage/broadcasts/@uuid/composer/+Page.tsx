import './styles.css'
import { ComposeBroadcastFlow } from '#root/pages/components/flows/compose_broadcast/compose_broadcast_flow.jsx'
import React from 'react'

import type {
  BroadcastWithEmailContent,
  Segment,
} from '#root/database/database_schema_types.js'

export interface EngageBroadcastsComposerPageProps {
  broadcast: BroadcastWithEmailContent
  segments: Segment[]
}

function EngageBroadcastsComposerPage() {
  return <ComposeBroadcastFlow />
}

export { EngageBroadcastsComposerPage as Page }
