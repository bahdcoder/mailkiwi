import { Broadcast as DatabaseBroadcast } from '@/database/database_schema_types.js'
export interface Segment {
  id: string
  name: string
  filterGroups?: {
    groups?: Array<{
      conditions: Array<{
        field: string
        operator: string
        value: string | number | boolean
      }>
    }>
  }
}

export interface Broadcast {
  id: string
  name: string
  emailContent?: {
    subject?: string
    contentJson?: Record<string, unknown>
  }
  status: DatabaseBroadcast['status']
}

export interface BroadcastPageProps {
  broadcast?: Broadcast
  segments?: Segment[]
}
