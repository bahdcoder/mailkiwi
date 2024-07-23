import { cuid } from '@/domains/shared/utils/cuid/cuid.ts'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const queueJobs = sqliteTable('queueJobs', {
  id: text('id', { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  jobId: text('jobId').notNull(),
  attemptsCount: integer('attemptsCount').notNull().default(0),
  maxAttempts: integer('maxAttempts').notNull().default(3),
  dispatchedAt: integer('dispatchedAt', { mode: 'timestamp' }).notNull(),
  lockedAt: integer('lockedAt', { mode: 'timestamp' }),
  processAt: integer('processAt', { mode: 'timestamp' }),
  payload: text('payload', { mode: 'json' })
    .$type<Record<string, unknown>>()
    .notNull(),
  queue: text('queue'),

  attemptLogs: text('attemptLogs', { mode: 'json' }).$type<string[]>(),
})
