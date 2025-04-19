import { appEnv } from "@/app/env/app_env.js"
import { SettingRepository } from "@/settings/repositories/setting_repository.js"
import { command } from "@drizzle-team/brocli"

import { AcmeCertificatesTool } from "@/tools/ssl/acme_certificates_tool.js"

import { container } from "@/utils/typi.js"
import { makeLogger } from "@/shared/container/index.js"

export const generateAcmeAccountIdentityCommand = command({
  name: "generate_acme_account_identity",
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
      logger.info("👍 Account identity already generated.")

      return
    }

    const { accountPrivateKey } = await acmeCertificatesTool.createAccount()

    await settingRepository.create({
      acmeAccountIdentity: accountPrivateKey.toString("utf-8"),
    })

    logger.info("👍 Account identity generated")
  },
})
