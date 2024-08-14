-- emailClicks table
CREATE TABLE IF NOT EXISTS emailClicks (
    contactId String,
    broadcastId String,
    variantId String,
    linkId String,
    clickedAt DateTime,
    isUnsubscribe Boolean
) ENGINE = MergeTree() PRIMARY KEY (broadcastId, contactId, clickedAt);