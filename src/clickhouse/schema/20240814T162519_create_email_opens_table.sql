-- emailOpens table
CREATE TABLE IF NOT EXISTS emailOpens (
    contactId String,
    broadcastId String,
    variantId String,
    openedAt DateTime
) ENGINE = MergeTree() PRIMARY KEY (broadcastId, contactId, openedAt);