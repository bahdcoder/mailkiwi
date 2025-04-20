export interface DeliveryResponse {
  code: number
  enhanced_code: {
    class: number
    subject: number
    detail: number
  }
  content: string
  command: string
}

export interface PeerAddress {
  name: string
  addr: string
}

export interface SourceAddress {
  address: string
}

export type Headers = {
  Subject?: string
  'X-Kibamail-Sending-Domain-ID'?: string
  'X-Kibamail-Message-ID'?: string
  'X-Kibamail-Contact-ID'?: string
  'X-Kibamail-EmailSend-ID'?: string
  'X-Kibamail-Broadcast-ID'?: string
} & { [key: string]: string }

export interface MtaLog {
  type:
    | 'Delivery' /// Recorded by the delivery side, most likely as a result of attempting a delivery to a remote host
    | 'Reception' /// Recorded by a receiving listener
    | 'Bounce'
    | 'TransientFailure'
    | 'Expiration' /// Recorded when a message is expiring from the queue
    | 'AdminBounce' /// Administratively failed
    | 'OOB' /// Contains information about an OOB bounce
    | 'Feedback' /// Contains a feedback report
    | 'Rejection' /// SMTP Listener responded with a 4xx or 5xx
    | 'AdminRebind' /// Administratively rebound from one queue to another
    | 'Click' /// Custom type from Kibamail
    | 'Open' /// Custom type from Kibamail
    | 'Any' /// Special for matching anything in the logging config
  id: string
  sender: string
  recipient: string
  queue: string
  site: string
  size: number
  response: DeliveryResponse
  peer_address: PeerAddress
  timestamp: number
  created: number
  num_attempts: number
  bounce_classification: string
  egress_pool: string
  egress_source: string
  source_address: SourceAddress
  feedback_report: null | Record<string, unknown>
  meta: Record<string, unknown>
  headers: Headers
  delivery_protocol: string
  reception_protocol: string
  nodeid: string

  // click logs
  ip_address: string
  user_agent: string
}
