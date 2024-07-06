import { Secret } from "@poppinss/utils"

import { SESService } from "./ses.js"
import { SNSService } from "./sns.js"

export class PermissionsChecker {
  private sesService: SESService
  private snsService: SNSService

  constructor(
    accessKeyId: Secret<string>,
    secretAccessKey: Secret<string>,
    region: string,
  ) {
    this.sesService = new SESService(accessKeyId, secretAccessKey, region)
    this.snsService = new SNSService(accessKeyId, secretAccessKey, region)
  }

  async checkAllAccess(): Promise<boolean> {
    const [sesAccess, snsAccess] = await Promise.all([
      this.sesService.checkAccess(),
      this.snsService.checkAccess(),
    ])

    return sesAccess && snsAccess
  }
}

export default PermissionsChecker
