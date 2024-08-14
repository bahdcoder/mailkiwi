-- emailSends table
CREATE TABLE IF NOT EXISTS emailSends (
    status Enum8(
        'SENT' = 1,
        'SOFT_BOUNCED' = 2,
        'HARD_BOUNCED' = 3
    ),
    contactId String,
    broadcastId String,
    variantId String,
    sentAt DateTime,
    messageId String,
    automationStepId String
) ENGINE = MergeTree() PRIMARY KEY (broadcastId, contactId, variantId, sentAt);