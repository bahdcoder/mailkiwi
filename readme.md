# Kibamail

## Technology Stack

- Storj for S3 Compatible file storage
- Clickhouse for event storage
- MySQL for transactional storage
- Redis for queuing and SMTP server authentication
- NodeJs / Hono for API
- React JS for frontend
- Haraka for SMTP server
- Tailwind CSS for styling
- Mailpit for previewing and sending emails in development
- PostHog for user insight and analytics
- Docker for containerization
- Github Actions for CI/CD
- Sentry for monitoring and reporting
- Kafka for consuming event streams (Email opens, clicks, form resposes, landing
  page views and visitors, etc etc)
- Graphana / Prometheus for metrics and dashboards

## Cloud Technology Stack

- Dedicated servers for SMTP sending on Hetzner
- Dedicated /29 ip address reservations from Hetzner
- Consider Hivelocity for dedicated servers and dedicated /29 ip address
  reservations also.
- Kubernetes / Nomad for container orchestration (Workers and Monolith)
- Syself for Kubernetes management (If using Kubernetes)

## Email Queueing / Sending Flow

1. User hits publish on broadcast.
2. SendBroadcastJob is queued using Bull MQ / Redis
3. This job executes and for each contact, queues a SendBroadcastToContact job using Bull MQ / Redis
4. The SendBroadcastToContact job calls the Mailer to send the mail.
   1. It attaches a UUID: messageId to the header.
   2. It saves a key: BROADCAST:broadcastId:contactId to redis to mark this email as sent to that contact.
   3. Job concludes successfully.
5. The SMTP server calls the webhook endpoint with the status of the email (bounced, failed, or sent) and the logs from the SMTP communication.
   1. This sent status, logs and messageId is added to a Kafka topic called smtp_messages_statuses
   2. A Kafka consumer receives the messageId, gets the messageId from Redis, and using that identifies the broadcastId, contactId and variantId
   3. The Kafka consumer formats this send data and adds the formatted data to another Kafka topic called clickhouse_smtp_messages
   4. Clickhouse ingests data from this topic
6. When an email open webhook comes in / a click event from an email comes in:
   1. Event is added to a Kafka topic called smtp_email_opens
   2. A Kafka consumer receives this event, formats it and adds it to a Kafka topic called clickhouse_smtp_email_opens
