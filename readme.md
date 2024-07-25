Mail Broadcasting Edge Cases

1. Sending a broadcast endpoint:
    - Cannot send if no valid mailer credentials: ✅
        - Check that AWS keys are valid ✅
        - Check that mailer is installed correct (Check status and status must be ready) ✅
        - Check that sending is enabled on aws. ✅
    - Cannot send if from, to, html, text etc are not properly defined. Must be defined. ✅
2. Background job sending a broadcast: ✅
    1. Fetches all contacts that will receive the broadcast. ✅
        1. Only fetches those with no send. ✅
    2. Batches them into batches of 100. ✅
        1. The larger the number of requests per second, the smaller the batch size, and the more concurrent senders we have, thus faster time to send entire campaign.
        2. The smaller the number of requests per second, the larger the batch size, and the less concurrent senders we have, thus longer time to send entire campaign.
    3. Dispatches a SendBroadcastToContacts job for each batch. ✅
3. SendBroadcastToContacts job:
    1. Loops through all contacts, and sends them the campaign. Can process contacts concurrently depending on sending limit per second. By default, it processes one contact after the other, so just one concurrently. ✅
    2. To process a broadcast for a contact, it first of all creates a send, so it signals to other workers that it is currently sending to this contact. No other workers would be able to pick up the sending to this contact. It also saves a timeoutAt field on the send job, so if the status does not change after a certain time, another worker can pick it up. Next, it calls the AWS api to send the email. Then, it updates the send for that contact with the message ID from AWS.
    3. Dispatches a SummarizeBroadcastResults job after it's done.
4. SummarizeBroadcastResults: job:
    1. Fetches a list of all sends and compares to the list of all contacts that should have received the broadcast.
    2. Calculates total percentage sent already. Based on the results, updates the broadcast status (to sent, or to failed, etc).
