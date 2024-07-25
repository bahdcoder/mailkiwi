import { IgnitorDev } from '@/infrastructure/boot/ignitor_dev.js'
import { DatabaseQueueDriver } from './domains/shared/queue/drivers/database_queue_driver.ts'
import { MailhogDriver } from './domains/shared/mailers/drivers/mailhog_mailer_driver.ts'

new IgnitorDev()
  .boot()
  .start()
  .queueDriver(new DatabaseQueueDriver())
  .mailerDriver(({ MAILHOG_URL }) => new MailhogDriver(MAILHOG_URL))
