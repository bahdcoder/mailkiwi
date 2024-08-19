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

## Code quality technology Stack

- Scrutinizer ci for code quality

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

## Email reputation building

1. Start with a SAAS application that sends transactional email only. This means newest customers must be transactional email senders.
2. Slowly build reputation with the SAAS product.
3. Slowly add newsletter senders that require double confirmation so recipients can "confirm" and mark as "not spam".
4. Slowly add broadcasting.

### Book launch for warm up

1. Send email to list announcing book launch, but do not send to everyone.
   - Send to 5% of list with a date such as 15th of November
   - Send follow up email with that date
   - Send announcement email for them to purchase.
     - When they purchase, send them an email from our infrastructure. (strategicdev.com) An email saying here's your book order.
2. Keep sending to tiny increments of audience. Maximum 600 per day. That way we only send maybe 100 emails per day in purchases or less.
3. This is our basic warm up process

### Reetcode warm up process

1. Invite people to reetcode. Send login link
2. They click login link.
3. Send announcements for new challenges

## Email sending infrastructure

1. HAProxy load balancer for email routing to different server ip addresses.
   - HAProxy handles TLS and TLS Termination.
2. Haraka instances running behind load balancer.
3. Haraka instances connecting to redis to authenticate incoming SMTP connections.
   - Haraka also checks for rate limiting.
   - If IP warming is configured, Haraka also does IP warming rate limits for the email client that connected.
4. Haraka instances pick which IP to use for relaying/sending, from our subnet of ip addresses

   -
   - Completely isolate subnets used for transactional and marketing infrastructure. 2 different infrastructures. Ideally 2 different email servers.
   - When customers use the SMTP to send emails, Haraka automatically qualifies them as transactional email
   - When an email is coming from Kibamail, then these emails are marketing emails.
   - Haraka email middleware automatically detect bulk, or marketing style campaign emails being sent for a specific client.
   - Haraka email can pause emails for a client if it detects unusual behaviour not aligned with transactional sending.
     - Haraka keeps a list of non transactional email behaviour and automatically checks all email body before relaying it.
   - Haraka rate limits email sending per client.
   - Haraka keeps a per client rate limit.

5. Haraka instances send email

## Cloud architecture

1. Kubernetes runs the following services:
   - Kafka for events processing, clickhouse ingesting
   - Redis for Queueing
   - BullMQ background Workers
   - MySQL database
   - Clickhouse database
   - NodeJS API
   - Kafka consumers (NodeJS apps running)
   - Load balancers for API
2. Manual provision of SMTP servers:
   - Redis for authentication
   - HAProxy for smtp load balancing (High availability)
   - Haraka mail servers on dedicated servers
