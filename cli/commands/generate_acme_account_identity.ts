import { appEnv } from "@/app/env/app_env.js"
import { SettingRepository } from "@/settings/repositories/setting_repository.js"
import { command } from "@drizzle-team/brocli"

import { AcmeCertificatesTool } from "@/tools/ssl/acme_certificates_tool.js"

import { container } from "@/utils/typi.js"

export const generateAcmeAccountIdentityCommand = command({
  name: "generate_acme_account_identity",
  desc: "Generate the account identity used to generate ssl certificates with Let's encrypt.",
  async transform(opts) {
    return opts
  },
  async handler() {
    const acmeCertificatesTool = container.make(AcmeCertificatesTool)
    const settingRepository = container.make(SettingRepository)

    const settingsExist = await settingRepository.get()

    if (settingsExist) {
      console.log("👍 Account identity already generated.")

      return
    }

    const { accountPrivateKey } =
      await acmeCertificatesTool.createAccount()

    await settingRepository.create({
      acmeAccountIdentity: accountPrivateKey.toString("utf-8"),
    })

    console.log("👍 Account identity generated")
  },
})
