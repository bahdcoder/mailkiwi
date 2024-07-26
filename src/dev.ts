import { MailhogDriver } from '@/domains/shared/mailers/drivers/mailhog_mailer_driver.ts'
import { IgnitorDev } from '@/infrastructure/boot/ignitor_dev.js'

const ignitor = await new IgnitorDev().boot().start()

ignitor.mailerDriver(({ MAILHOG_URL }) => new MailhogDriver(MAILHOG_URL))
