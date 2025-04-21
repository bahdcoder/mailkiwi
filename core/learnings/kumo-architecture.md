# Kumo architecture plan

- [ ] Create an HTTP helper service that listens for incoming calls from the MTA
  - [ ] Authenticates via API token before responding to any requests
  - [ ] Add a GET endpoint to fetch DKIM signature and selector for a domain. Must provide domain in query params
    - [ ] Endpoint must fetch DKIM information from Redis and return
    - [ ] Endpoint must decrypt DKIM before returning it
  - [ ] Add a POST endpoint to confirm authentication credentials during SMTP session. Must provide username and password
    - [ ] Endpoint must return: `true` if authentication was successful.
    - [ ] Endpoint must return: `false` and a `message` if authentication failed. Example message: `Out of email credits.`.
  - [ ] Add a webhooks endpoint for handling webhooks from MTA
    - [ ] Endpoint must receive bounce webhooks from MTA
    - [ ] Endpoint must receive feedback loops from MTA
    - [ ] Endpoint must receive delivered webhooks from MTA
    - [ ] Endpoint receives all the above as logs from Kumo MTA
- [ ] All endpoints are sub 25ms latency.
  - [ ] 10ms read from Redis (if needed)
  - [ ] 5ms decryption (if needed)
  - [ ] 10ms HTTP overhead

# Helpful discord messages

- About how throttles are set (related to shaping rules): https://discord.com/channels/1072980126737907824/1072980127597735999/1283507314086907965
- Just search "per ip" on Kumo MTA Discord. There's a wealth of information there.
- Redirecting to another queue based on SMTP error: https://discord.com/channels/1072980126737907824/1258762146607530106/1258805100189843528
