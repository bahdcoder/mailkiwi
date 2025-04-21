/**
 * @typedef {Object} Segment
 * @property {string} id
 * @property {string} name
 * @property {Object} [filterGroups]
 * @property {Array<{conditions: Array<{field: string, operator: string, value: string|number|boolean}>}>} [filterGroups.groups]
 */

/**
 * @typedef {Object} Broadcast
 * @property {string} id
 * @property {string} name
 * @property {string} [status]
 * @property {Object} [emailContent]
 * @property {string} [emailContent.subject]
 * @property {Record<string, unknown>} [emailContent.contentJson]
 */

/**
 * @typedef {Object} BroadcastPageProps
 * @property {Broadcast} [broadcast]
 * @property {Segment[]} [segments]
 */

export {}
