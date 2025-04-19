# Email Infrastructure Platform Production checklist

## Domain configuration

- [ ] Purchase `kbmta.net` for all mail transfer agent activity
- [ ] Configure a subdomain `spf.kbmta.net` for handling all SPF configuration
- [ ] Configure SPF on the `spf.kbmta.net` to allow email sending from all ip addresses in subnets purchased for email sending
- [ ] Configure email bounce handling with `mail.kbmta.net`.
- [ ] Configure SPF for `mail.kbmta.net` to point to `spf.kbmta.net`.
- [ ] Setup A record for domain `smtp.kbmta.net` that points to the HaProxy load balancer.
- [ ] Setup A record for domain `smtp-mkg.kbmta.net` that points to the marketing email HaProxy load balancer.
- [ ] Setup MX records for domain `mail.kbmta.net` that points to the dedicated email servers
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
- [ ] All domains should expose WHOIS information, pointing to the registered company details of Kibamail
- [ ] Implement all email best practices from the following provider docs:

  - [ ] [Mailgun](https://documentation.mailgun.com/docs/mailgun/email-best-practices/best_practices/)
  - [ ] Postmark

- [ ] Fully comply with all Yahoo email [practices](https://senders.yahooinc.com/best-practices/)
- [ ] Fully comply with all iredmail [practices](https://docs.iredmail.org/setup.dns.html) including those of providers mentioned in this document like Outlook, Google, Yahoo.
- [ ] Fully implemented everything in the [emailtooltester.com checklist](https://www.emailtooltester.com/wp-content/uploads/2024/04/Deliverability-checklist-EmailTooltester-V2.pdf)
- [ ] Handle all Outlook [SMTP error codes](https://sendersupport.olc.protection.outlook.com/pm/troubleshooting)
- [ ] Perform all the above infrastructure set up for `kbmta-dev.net`
- [ ] Perform ip address subnet investigation following guide [ip-background-check](./ip-background-check.md)
- [ ] Research and pick the right digital certificates (TLS,SSL,HTTPS) providers for high reputation building (or trust).
- [ ] Consider purchasing Address verified Certs from Hetzner (Thawte)
- [ ] Comply with all [Gmail outbound requirements here](https://support.google.com/a/answer/81126?visit_id=638615783532703500-624414999&rd=1)
- [ ] Email best practices [Mailop](https://www.mailop.org/best-practices/)
- [ ] Implement all [deliverability guidelines here](https://downloads.ctfassets.net/n75v2ljpkqmb/6GJWNKAkJiGuIDyTX3lyFd/1bb72a680de561a6f60acfb3689d96ab/Ebook_-_The_guide_to_email_deliverability.pdf)
- [ ] Implement email validation checks with [Reacher email](https://github.com/reacherhq/check-if-email-exists)

## Email server configuration

- [ ] Purchase 2 /24 subnets on Hetzner for sending and receiving emails
  - [ ] One for marketing emails
  - [ ] One for transactional emails
- [ ] Purchase 2 dedicated servers for transactional email sending
- [ ] Purchase 2 dedicated servers for marketing email sending
- [ ] Setup SMTP load balancer using HaProxy that routes all SMTP traffic to the 2 dedicated servers for email sending
- [ ] Setup SMTP load balancer using HaProxy that routes all marketing emails SMTP traffic to the 2 dedicated servers for marketing email sending
- [ ] Configure email servers as inbound servers that handle all incoming emails into `mail.kbmta.net`
