import { MailhogDriver } from '@/domains/shared/mailers/drivers/mailhog_mailer_driver.js'

import { Ignitor } from '@/infrastructure/boot/ignitor.js'

import { refreshDatabase } from '@/tests/mocks/teams/teams.js'

const ignitor = await new Ignitor().boot().start()

ignitor.mailerDriver(({ SMTP_TEST_URL }) => new MailhogDriver(SMTP_TEST_URL))

await refreshDatabase()
