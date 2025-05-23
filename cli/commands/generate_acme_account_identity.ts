import { appEnv } from '#root/core/app/env/app_env.js'
import { SettingRepository } from '#root/core/settings/repositories/setting_repository.js'
import { command } from '@drizzle-team/brocli'

import { AcmeCertificatesTool } from '#root/core/tools/ssl/acme_certificates_tool.js'

import { makeLogger } from '#root/core/shared/container/index.js'
import { container } from '#root/core/utils/typi.js'

export const generateAcmeAccountIdentityCommand = command({
  name: 'generate_acme_account_identity',
  desc: "Generate the account identity used to generate ssl certificates with Let's encrypt.",
  async transform(opts) {
    return opts
  },
  async handler() {
    const logger = makeLogger()
    const acmeCertificatesTool = container.make(AcmeCertificatesTool)
    const settingRepository = container.make(SettingRepository)

    const settingsExist = await settingRepository.get()

    if (settingsExist) {
      logger.info('👍 Account identity already generated.')

      return
    }

    const { accountPrivateKey } = await acmeCertificatesTool.createAccount()

    await settingRepository.create({
      acmeAccountIdentity: accountPrivateKey.toString('utf-8'),
    })

    logger.info('👍 Account identity generated')
  },
})
