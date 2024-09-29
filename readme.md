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
- Maxmind GeoLite2 for Geo location database

## Cloud Technology Stack

- Dedicated servers for SMTP sending on Hetzner
- Dedicated /29 ip address reservations from Hetzner
- Consider Hivelocity for dedicated servers and dedicated /29 ip address
  reservations also.
- Kubernetes / Nomad for container orchestration (Workers and Monolith)
- Syself for Kubernetes management (If using Kubernetes)

## Alternate cloud technology stack

- [ ] (2 - 4) Dedicated servers on Hetzner for entire infrastructure
- [ ] Bind all IP addresses on both dedicated servers.
- [ ] Kumo MTA servers running on bare metal on all dedicated servers
- [ ] Redis cluster running on bare metal on all dedicated servers
- [ ] TiDB cluster running on bare metal on all dedicated servers
- [ ] Nomad cluster running on bare metal
  - [ ] Orchestrates the monolith application (API & Dashboard)
  - [ ] Orchestrates the background bullmq job workers.
- [ ] Deployments from Github CI
- [ ] Automated deployment scripts like Kamal.
  - [ ] Pulls mail server configurations from `mail-server-config.docker` image and extracts it into correct path in mail server
  - [ ] Does for both mail servers
- [ ] Entire cluster monitoring on Prometheus and Grafana set up on Nomad cluster
  - [ ] All services (mail servers, databases, API, monolith, workers etc) all report to this Grafana / Prometheus installation.

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
   2. A Kafka consumer receives this event, formats it (by adding geo location information, updating contact activity feed) and adds it to a Kafka topic called clickhouse_smtp_email_opens

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
   - HAProxy could be hosted in Kubernetes/Nomad cluster
   - Mail servers are completely not exposed to the internet.
   - HAProxy load balancer is exposed to the internet.
   - HAProxy load balancer is configured to route traffic to different server ip addresses (which live outside of the cluster).
2. Haraka instances running behind load balancer.
3. Haraka instances connecting to redis to authenticate incoming SMTP connections.
   - Haraka also checks for rate limiting.
   - Perhaps mail servers should have their own Redis cluster.
   - If IP warming is configured, Haraka also does IP warming rate limits for the email client that connected.
4. Haraka instances pick which IP to use for relaying/sending, from our subnet of ip addresses

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

## Zonemta findings

1. In the Zonemta codebase, the lib/mail-queue.js file, the `queuCounterUpdate` method adds a timeout for pulling jobs out of the mongodb queue. If running in production and experience any email delivery delay issues, try playing with this value or raising a Github issue asking how to fix this.

## Must have "Nice to have" features

1. Free DMARC reporting and digests
2. Setup free email validation
3. Build contact activity feed. Store queued, delivered, opened, clicked, bounced, complaints, unsubscribed, events etc in a timeline fashion.
   - Build activity feed for each contact (broadcasts, and automations)

# Email server considerations

1. Haraka inbound is awesome. Haraka outbound is rather hard to customise. Haraka Outbound makes it really hard to use a custom queue driver. It only supports the default disk based queue driver, which is not horizontally scalable.
2. Perhaps fork Haraka and customise it to support a custom queue drivers?
3. Zonemta is great, but it does not have great inbound email support, and the addition of Mongodb to the tech stack could cause additional maintenance overhead.

# Kibahelp

1. One inbox to support them all: An open source Helpscout alternative

# DMARC

1. This [open source github repository](https://github.com/andreialecu/dmarc-report-parser/) contains an open source parser and sample fixtures for testing and building a dmarc digest

2. Before sending the email out using our outbound infrastructure, first we must check to see that DKIM, SPF and DMARC are all correctly configured for the team (sender). If not, we add these emails back to the queue for sending at a later date. The automatic DMARC / DKIM and SPF checking is done by the core api, and will handle alerting the customer if anything is wrong. It will also update Redis to mark the sender as ready to continue sending, so that when next the emails in the queue are processed by Haraka, they will be sent out.

# GO TO MARKET STRATEGY

1. 10,000 emails per month plan forever is a steal for any business. Do the math over and over, and see if this is feasible and scalable.
2. Target solo founders just starting out.
   1. Find them on Twitter
   2. Find them on Product Hunt
   3. Reach out to them and propose your product. Keep doing that over and over and over until someone obliges.
3. Target open source communities spending on Mailchimp.
   1. Target OSCA Africa (Spends close to $1,000 on Mailchimp every year)
   2. Target other Africa based open source communities and make a value proposition.
4. Patience is the key here. Before launching, budget 300 euros a month (for at least 18 months of infrastructure runway)
   1. Consider paying in bulk for dedicated servers.

# Server infrastructure setup / planning

1. Purchase only 1 dedicated server for email sending and receiving. This will be `smtp.kbmta.net` and `mail.kbmta.net` with a static ip address (one ip from the purchased subnet)
   1. On this dedicated server, run haproxy as a load balancer listening on port 25 (for inbound emails) and port 587/457 (for inbound submissions)
   2. Start 4 haraka processes using PM2 on port 25565, 25566, 25567, 25568. HaProxy balances traffic to these 4 servers equally.
   3. Each instance
2. Everything else is deployed to the cloud on hetzner: A nomad or Kubernetes cluster running Clickhouse, MySQL, Kafka, Redis, and NodeJS services (docker images). With a Hetzner load balancer sending traffic to the nomad cluster (NodeJS services).

# RBAC planning

- [ ] A user can create unlimited projects (teams)
- [ ] A user can invite unlimited members to a project
- [ ] Each member of a project can have one of three roles:
  > - [ ] Administrator -> Can invite new members, remove members, manage domains, settings, etc. All teams have by default one admin, the owner/creator of the team.
  > - [ ] Manager -> Can do everything, but cannot manage billing, domains, or export data
  > - [ ] Author -> Can create / edit / delete everything, but cannot launch campaigns, send broadcasts, etc
  > - [ ] Guest -> Can view reports / view campaigns, but nothing more.
- [ ] User fetch endpoint returns a list of all their teams
- [ ] Users can secure their accounts via two factor authentication
- [ ]

# Pricing plans

- [ ] $0.25 per 1,000 emails. That's it. It's that simple. No more noise.
- [ ] -> 10,000 free emails per month
- [ ] Sending 25,000 emails in a month:
  - your total is 25,000 - 10,000 = 15,000 / 1,000 = 15 x $0.25 = $3.75
- [ ] Sending 250,000 emails in a month:

  - your total is 250,000 - 10,000 = 240,000 / 1,000 = 240 x $0.25 = $60

- Calculation of entire infrastructure: $5000 per year ($600 per month)
  - Infrastructure can send max 500,000 emails per hour
  - Total per month (30 days, 10 hours a day): 30 x 10 x 500,000 = 150,000,000 emails per month
  - Cost per email: 150,000,000 / 600 = $0.000004 per email

# Helpful email tools

https://github.com/domainaware/parsedmarc
https://github.com/Mindbaz/awesome-opensource-email
https://dev.me/

# Email timeline / activity history and storage

1. Email is submitted to MTA via HTTP or SMTP
2. MTA sends log to track "Received"
3. Log processor adds this log to a Redis Stream and returns OK. This is to ensure temporal durability as HTTP is not a reliable way to ensure the message is delivered.
4. Consumers consume the Redis stream and insert the data into the database. This is to ensure fast, multiple processors of logs and fault tolerance so logs are never dropped.
5. Other consumers consume the Redis stream and send webhook notifications to our customers.
6. Rather than adding to a redis stream, let's just queue a job using BullMQ. It supports retries, information is not lost, and it can scale horizontally across multiple workers.
