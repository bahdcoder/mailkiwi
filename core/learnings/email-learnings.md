## DNS Resolution

When Kumo MTA tries to resolve the domain of a recipient, it looks up the mx for a hostname. Example, If I am sending an email to `hey@gmail.com`, then it tries to find the hostname for that domain `gmail.com` which will resolve to something like `aspx.google.com`. It will then lookup the mx records for this domain and resolve the IP address to connect to.

Here's a valid DNSMASQ config to receive email to `user@localgmail.net` locally.

```conf

address=/mail.localgmail.net/172.20.0.13
mx-host=localgmail.net,mail.localgmail.net,10

# Log all DNS queries
log-queries

# Log DNS replies
log-dhcp

# Fallback to external DNS servers
server=8.8.8.8  # Google's public DNS
server=8.8.4.4  # Google's public DNS
```

Before what I had was:

```conf

address=/localgmail.net/172.20.0.13
mx-host=localgmail.net,172.20.0.13,10

# Log all DNS queries
log-queries

# Log DNS replies
log-dhcp

# Fallback to external DNS servers
server=8.8.8.8  # Google's public DNS
server=8.8.4.4  # Google's public DNS
```

I was pointing the mx host directly to the IP address, and that's just not how most MTAs resolve where to deliver the email.
