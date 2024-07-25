import { DatabaseQueueDriver } from '@/domains/shared/queue/drivers/database_queue_driver.ts'
import { Ignitor } from '@/infrastructure/boot/ignitor.js'
import { makeDatabase } from '@/infrastructure/container.js'
import { settings } from '@/infrastructure/database/schema/schema.js'
import { container } from '@/utils/typi.ts'
import { refreshDatabase } from './mocks/teams/teams.ts'
import { MailhogDriver } from '@/domains/shared/mailers/drivers/mailhog_mailer_driver.ts'

const ignitor = new Ignitor()
  .boot()
  .startDatabaseConnector()
  .queueDriver(container.make(DatabaseQueueDriver))
  .mailerDriver(({ MAILHOG_URL }) => new MailhogDriver(MAILHOG_URL))

const database = makeDatabase()

await refreshDatabase()

const settingsExist = await database.query.settings.findFirst()

if (!settingsExist) {
  await database.insert(settings).values({
    url: 'https://marketing.example.com',
    domain: 'marketing.example.com',
  })
}

await ignitor.start()
