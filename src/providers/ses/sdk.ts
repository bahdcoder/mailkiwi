import { Secret } from "@poppinss/utils"

import { E_INTERNAL_PROCESSING_ERROR } from "@/utils/errors"

import SESService from "./ses"
import { PermissionsChecker } from "./ses_permission_checker"
import { SNSService } from "./sns"

export class AwsSdk {
  constructor(
    private accessKeyId: Secret<string>,
    private secretAccessKey: Secret<string>,
    private region: string,
  ) {}

  public permissionsChecker() {
    return new PermissionsChecker(
      this.accessKeyId,
      this.secretAccessKey,
      this.region,
    )
  }

  public snsService() {
    return new SNSService(this.accessKeyId, this.secretAccessKey, this.region)
  }

  public sesService() {
    return new SESService(this.accessKeyId, this.secretAccessKey, this.region)
  }

  public async install(configurationSetName: string, endpoint: string) {
    const hasPermissions = await this.permissionsChecker().checkAllAccess()

    if (!hasPermissions) {
      throw E_INTERNAL_PROCESSING_ERROR(
        "Your aws credentials do not have the right permissions to install this mailer.",
      )
    }

    await this.sesService().createConfigurationSet(configurationSetName)

    await this.snsService().createSnsTopic(configurationSetName)

    await this.snsService().createSnsSubscription(
      configurationSetName,
      endpoint,
    )

    const snsTopicArn =
      await this.snsService().getSnsTopic(configurationSetName)

    if (!snsTopicArn?.TopicArn)
      throw E_INTERNAL_PROCESSING_ERROR(`Topic ARN does not exist.`)

    await this.sesService().createConfigurationSetEventsDestination(
      configurationSetName,
      snsTopicArn?.TopicArn,
    )

    return true
  }

  public async uninstall(configurationSetName: string) {
    const topic = await this.snsService().getSnsTopic(configurationSetName)

    if (topic?.TopicArn) {
      await this.snsService().deleteSnsTopic(topic.TopicArn)
    }

    const configurationSet =
      await this.sesService().getConfigurationSet(configurationSetName)

    if (configurationSet) {
      await this.sesService().deleteConfigurationSet(configurationSetName)
    }
  }
}
