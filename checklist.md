# Email Infrastructure Platform Production checklist

## Domain configuration

- [ ] Purchase `kbmta.net` for all mail transfer agent activity
- [ ] Configure a subdomain `spf.kbmta.net` for handling all SPF configuration
- [ ] Configure SPF on the `spf.kbmta.net` to allow email sending from all ip addresses in subnets purchased for email sending
- [ ] Configure email bounce handling with `kb-bounces.kbmta.net`.
- [ ] Configure SPF for `kb-bounces.kbmta.net` to point to `spf.kbmta.net`.
- [ ] Setup A record for domain `smtp.kbmta.net` that points to the HaProxy load balancer.
- [ ] Setup A record for domain `smtp-mkg.kbmta.net` that points to the marketing email HaProxy load balancer.
- [ ] Setup MX records for domain `kb-bounces.kbmta.net` that points to the dedicated email servers
- [ ] Setup A records for all sending IP addresses in purchased subnets.
  - [ ] Setup `us-mta1.kbmta.net`
  - [ ] Setup `us-mta2.kbmta.net`
  - [ ] Setup `eu-mta1.kbmta.net`
  - [ ] Setup `eu-mta2.kbmta.net`
- [ ] Setup PTR records for all domains of sending mailer servers.
  - [ ] Setup PTR for ip addresses pointing to `us-mta1.kbmta.net`
  - [ ] Setup PTR for ip addresses pointing to `us-mta2.kbmta.net`
  - [ ] Setup PTR for ip addresses pointing to `eu-mta1.kbmta.net`
  - [ ] Setup PTR for ip addresses pointing to `eu-mta2.kbmta.net`
- [ ] Setup `kibamail.com` to be the first customer of the email platform. It's DNS settings (CNAME and DKIM) should be configured correctly
  - [ ] `support@kibamail.com` should send using kibamail infrastructure.

## Email server configuration

- [ ] Purchase 2 /24 subnets on Hetzner for sending and receiving emails
  - [ ] One for marketing emails
  - [ ] One for transactional emails
- [ ] Purchase 2 dedicated servers for transactional email sending
- [ ] Purchase 2 dedicated servers for marketing email sending
- [ ] Setup SMTP load balancer using HaProxy that routes all SMTP traffic to the 2 dedicated servers for email sending
- [ ] Setup SMTP load balancer using HaProxy that routes all marketing emails SMTP traffic to the 2 dedicated servers for marketing email sending
- [ ] Configure email servers as inbound servers that handle all incoming emails into `kb-bounces.kbmta.net`
