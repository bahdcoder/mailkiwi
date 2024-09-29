# IP management strategy

1. Each tenant has 4 assigned ips:

- 1 core and 1 backup ip for transactional email
- 1 core ip and 1 backup ip for marketing email

2. The core ip is used for all outgoing messages for that tenant.
3. In the case where the ip encounters a transient failure, we listen to the `requeue_message` and queue the reattempt to another queue (if the previous failed attempt was due to a lock or ISP suspension or similar)
4. The strict IP assignment is due to Google's announcement and recommendation to use 1 IP per use case (1 for marketing, 1 for transactional).

## Egress pools

Do not use round robin egress pools (yet). Why ?

1. We want to 100% control which IP from our shared pool is used for which tenant. For example, our marketing shared pool may have 24 ip address, and a customer may only ever use 2 out of those 4, 1 being their main assigned IP and the second being a back up in cases of rate limits or blocks on the second ip.
2. We do manual IP warm ups for our shared IP sending domains at the moment.
   - For example, at launch, we plan to launch 2 new startups (reetcode.com) and the360dev.com in a controlled manner in order to warm up the IP addresses.
3. In future, we can use the round robin (figure out how) so we can warm up new IP addresses. Or, continue manually warming up IPs that go into our shared IP pool.

Create a table that stores all our IP addresses in the database

1. Each sending domain in our app gets assigned a primary and secondary email for both transactional and marketing emails.
2.

## Tenant Queues

Each tenant has 2 campaigns: `engage:tenantid@provider.com` and `send:tenantid@provider.com`. Engage campaign is for our email marketing product, Send campaign is for our transactional email product. Engage emails can only be sent from the Kibamail dashboard. Send emails can be sent from SMTP or HTTP injection.
