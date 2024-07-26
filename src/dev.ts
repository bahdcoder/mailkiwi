import { MailhogDriver } from '@/domains/shared/mailers/drivers/mailhog_mailer_driver.ts'
import { IgnitorDev } from '@/infrastructure/boot/ignitor_dev.js'

const ignitor = await new IgnitorDev().boot().start()

ignitor.mailerDriver(({ SMTP_TEST_URL }) => new MailhogDriver(SMTP_TEST_URL))
