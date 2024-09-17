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
