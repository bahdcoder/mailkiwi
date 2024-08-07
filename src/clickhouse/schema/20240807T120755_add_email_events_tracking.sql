-- Sends table (moved from MySQL to ClickHouse)
CREATE TABLE IF NOT EXISTS emailSends (
    id UUID DEFAULT generateUUIDv4(),
    type Enum8(
        'AUTOMATION' = 1,
        'TRANSACTIONAL' = 2,
        'BROADCAST' = 3
    ),
    status Enum8('PENDING' = 1, 'SENT' = 2, 'FAILED' = 3),
    contactId String,
    broadcastId String,
    variantId String,
    sentAt DateTime,
    timeoutAt DateTime,
    messageId String,
    logs String,
    automationStepId String
) ENGINE = MergeTree()
ORDER BY
    (sentAt, contactId, broadcastId);

-- Email opens tracking
CREATE TABLE IF NOT EXISTS emailOpens (
    id UUID DEFAULT generateUUIDv4(),
    sendId UUID,
    contactId String,
    broadcastId String,
    variantId String,
    openedAt DateTime,
    userAgent String,
    ipAddress String,
    deviceType Enum8(
        'DESKTOP' = 1,
        'MOBILE' = 2,
        'TABLET' = 3,
        'OTHER' = 4
    )
) ENGINE = MergeTree()
ORDER BY
    (openedAt, contactId, broadcastId);

-- Email clicks tracking
CREATE TABLE IF NOT EXISTS emailClicks (
    id UUID DEFAULT generateUUIDv4(),
    sendId UUID,
    contactId String,
    broadcastId String,
    variantId String,
    clickedAt DateTime,
    linkUrl String,
    userAgent String,
    ipAddress String,
    deviceType Enum8(
        'DESKTOP' = 1,
        'MOBILE' = 2,
        'TABLET' = 3,
        'OTHER' = 4
    )
) ENGINE = MergeTree()
ORDER BY
    (clickedAt, contactId, broadcastId, linkUrl);

-- Materialized view for aggregating opens per broadcast
CREATE MATERIALIZED VIEW IF NOT EXISTS mvBroadcastOpens ENGINE = SummingMergeTree()
ORDER BY
    (broadcastId, variantId) AS
SELECT
    broadcastId,
    variantId,
    count() AS totalOpens,
    uniqExact(contactId) AS uniqueOpens,
    min(openedAt) AS firstOpen,
    max(openedAt) AS lastOpen
FROM
    emailOpens
GROUP BY
    broadcastId,
    variantId;

-- Materialized view for aggregating clicks per broadcast and link
CREATE MATERIALIZED VIEW IF NOT EXISTS mvBroadcastClicks ENGINE = SummingMergeTree()
ORDER BY
    (broadcastId, variantId, linkUrl) AS
SELECT
    broadcastId,
    variantId,
    linkUrl,
    count() AS totalClicks,
    uniqExact(contactId) AS uniqueClicks,
    min(clickedAt) AS firstClick,
    max(clickedAt) AS lastClick
FROM
    emailClicks
GROUP BY
    broadcastId,
    variantId,
    linkUrl;