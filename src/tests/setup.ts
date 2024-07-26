import { MailhogDriver } from '@/domains/shared/mailers/drivers/mailhog_mailer_driver.ts'

import { Ignitor } from '@/infrastructure/boot/ignitor.js'

import { refreshDatabase } from '@/tests/mocks/teams/teams.ts'

const ignitor = await new Ignitor().boot().start()

ignitor.mailerDriver(({ MAILHOG_URL }) => new MailhogDriver(MAILHOG_URL))

await refreshDatabase()
