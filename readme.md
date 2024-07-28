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
        1. The larger the number of requests per second, the smaller the batch size, and the more concurrent senders we have, thus faster time to send entire campaign. ✅
        2. The smaller the number of requests per second, the larger the batch size, and the less concurrent senders we have, thus longer time to send entire campaign. ✅
    3. Dispatches a SendBroadcastToContacts job for each batch. ✅
3. SendBroadcastToContacts job:
    1. Loops through all contacts, and sends them the campaign. Can process contacts concurrently depending on sending limit per second. By default, it processes one contact after the other, so just one concurrently. ✅
    2. To process a broadcast for a contact, it first of all creates a send, so it signals to other workers that it is currently sending to this contact. No other workers would be able to pick up the sending to this contact. It also saves a timeoutAt field on the send job, so if the status does not change after a certain time, another worker can pick it up. Next, it calls the AWS api to send the email. Then, it updates the send for that contact with the message ID from AWS.
    3. Dispatches a SummarizeBroadcastResults job after it's done.
4. SummarizeBroadcastResults: job:
    1. Fetches a list of all sends and compares to the list of all contacts that should have received the broadcast.
    2. Calculates total percentage sent already. Based on the results, updates the broadcast status (to sent, or to failed, etc).

Contact automations

Run automation for contact is triggered by so many events in the app:

1. New tag attached to contact -> Trigger
2. New tag unattached from contact -> Trigger
3. New contact subscribed -> Trigger
4. Existing contact unsubscribed -> Trigger

1. Run automation receives a contact:
    1. Loads all automation steps for that automation
    2. Finds all the completed automation steps for that contact
    3. Determines which automation step is next based on the most recently completed automation step
        1. If contact has not completed any step, then it means they are at the start of the automation.
        2. If contact has completed 5 steps, then they are at the 6th step. Queue the 6th step for execution.
    4. Queues that automation step for execution
2. In the event of deleting an automation step:
    1. Automation step is deleted from the database, which cascades all contact automation steps, thus removing progress of this step.
    2. If this step was already queued for a contact, no problem:
        1. When it runs, in the execution, if it can't find the automation step, then it simply skips it.
        2. It then recomputes the next logical automation step for the contact and queues it.
    3. If the deleted action is a WAIT (which work with the scheduler), then we:
        1. Fetch all contacts on this step
        2. Recompute the next automation step for them
        3. Queue the next automation step immediately
        2. Delete all scheduled wait jobs (Or just allow them run. If they can't find the automation step x amount of time in future, they just exit successfully.)
3. In the event of editing a WAIT automation step:
    1. Fetch all contacts on this step
    2. For each contact, Check the current wait time. Have they already waited more than the new wait time? 
        1. Recompute the next step for them, then queue up its execution.
    3. For each contact, Check the current wait time. Is it shorter than the new wait time, then:
        1. Delete all queued wait jobs.
        2. Queue new wait jobs for each contact, but make sure to add up their already completed waiting time.

4. Run queued automation step for contact
    1. Check if automation step is still valid.
        1. If not, quit
    2. Get automation subtype.
        1. Based on automation subtype, execute specific automation handler
        2. If it is an if / else statement, executor checks and returns next logical automation step.
