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
