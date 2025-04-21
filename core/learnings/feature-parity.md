# Email Platform Products

These are organised in order of implementation priority:

- [~] Letters (Beehiv / Substack)
- [ ] Email marketing (Mailchimp / Active Campaign replacement)
- [ ] Transactions (Mandrill / Postmark / Mailgun) replacement
- [ ] Email builder (Postcards)
- [ ] Pages (Websites, forms, surveys, etc)
- [ ] Optimise (Inbox placement, Email Preview, Email Validation, Spam Filter Checks) (Free, Automatic, For 100k+ email sends per month)
- [ ] Email reputation monitoring / SPF / DKIM Monitoring / DMARC (Dmarcdigests replacement) (Free, Automatic, For 100k+ email sends per month)

- [ ] Monetize (Create digital products, sell subscriptions, etc) Convertkit replacement

# Email Marketing feature parity

### Mailchimp (Engage marketing product)

- [x] User roles
  - [x] Invite members
  - [x] Accept invites
  - [x] Reject invites
  - [x] Revoke member access
  - [x] View all members
  - [x] Role based access control methods (administrator, manager, author, guest)
- [x] Seats (In our case, unlimited seats)
- [x] Audiences
  - [x] Contacts
    - [x] Contact profiles
    - [x] Detailed contact activities
    - [x] Tags
    - [x] Import contacts
    - [x] Export contacts
    - [x] Add contacts to audiences
    - [x] Enhanced contact properties
- [ ] Segmentation
  - [ ] Personalised emails
  - [x] Segment based on specific campaign activity (Clicks, Email Opens)
  - [x] Segment by contact location\*
  - [x] Segment by behaviour
  - [x] Segment by survey responses (Segment by a tag auto added by a survey response)
  - [ ] Segmentation templates
  - [x] Segment by Tags
  - [x] Segment by custom contact properties
  - [x] Segment by contact details like age ranges, etc
  - [x] Advanced segmentation using logical operators (AND and OR)
- [ ] Surveys
  - [x] Create Surveys
  - [x] Tag contacts based on survey responses
  - [ ] Email list building using Surveys
- [ ] Reports, Metrics & Analytics
  - [ ] Email client specific tracking
    - [ ] Exclude Apple MPP from tracking reports and analytics
  - [ ] Send rates / Open rates / Click rates / Unsubscribe rates
    - [ ] Compared to previous 30 days
    - [ ] Compared to previous 90 days
    - [ ] Compared to previous year
  - [ ] Performance over time: Send rates / Open rates / Click rates / Unsubscribe rates / Clicks per unique open / Total sends
    - [ ] Per day Performance
    - [ ] Per week Performance
    - [ ] Per month performance

### Mailgun (Send Transactional Product)

Read more about mailgun tracking here https://documentation.mailgun.com/docs/mailgun/user-manual/mg_reporting/

- [ ] Tracking (Engage & Send Email Products)

  - [x] Link click tracking
  - [x] Custom tracking domain
  - [x] Email opens tracking
  - [ ] Unsubscribes tracking
  - [ ] Spam complaints tracking
  - [ ] Open and click bot detection [TODO] [OUTSOURCE?]
  - [x] Per link Opt-out tracking
  - [x] Per link Opt-in tracking
  - [x] Per email opt-out & opt-in open tracking
  - [x] Per domain opt-in tracking

- [ ] Reporting
  - [ ] Key Metrics
    - [ ] Accepted, bounced, clicked, complained, delivered, failed, hard / soft bounces, etc.
  - [ ] Rates
    - [ ] Accepted rate, bounce rate, complained rate, failed rate, etc.

### Beehiv (Letters newsletter product)

- [ ] Website Publication

  - [x] Custom domains (with SSL)
  - [x] Kibamail subdomain web hosting (With Wildcard SSL)
  - [~] Unlimited website templates
  - [x] Subscribe forms
  - [x] Surveys
  - [x] Custom webpages
  - [x] Advanced email capture

- [ ] Security

  - [ ] SSO
  - [ ] 2FA

- [ ] Integrations

  - [ ] Giphy
  - [ ] Unsplash
  - [ ] API Access

- [ ] Analytics

  - [x] Letter analytics
  - [ ] Subscribe analytics

- [ ] Newsletter

  - [x] Create segments
  - [~] Custom builder
  - [x] Optimized deliverability
  - [x] Custom contact fields
  - [~] Custom HTML
  - [x] Audience polls (surveys)
  - [x] Write letters to segments

- [ ] Monetisation
  - [ ] Paid subscriptions
  - [ ] Gated access on website
  - [ ] Gated access in emails

### Active campaign

- [ ]

### Glock apps (Optimise)

- [ ] Inbox placement tests (https://www.youtube.com/watch?v=UxxL0Hnwplg)
- [ ] Domain reputation monitoring
- [ ] IP reputation monitoring

### Spam awareness

- [ ] Auto adjusted sending rate limits for all tenants
- [ ] Spam Assassin analysis after email is sent
- [ ] Store spam assassin score to database
- [ ] AI spam score after email is sent
- [ ] Automatic block tenant if spam is detected from any emails
