import {
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  DeleteConfigurationSetCommand,
  DescribeConfigurationSetCommand,
  GetSendQuotaCommand,
  ListIdentitiesCommand,
  SESClient,
} from "@aws-sdk/client-ses"
import { Secret } from "@poppinss/utils"

export class SESService {
  private ses: SESClient

  constructor(
    accessKeyId: Secret<string>,
    secretAccessKey: Secret<string>,
    region: string,
  ) {
    this.ses = new SESClient({
      credentials: {
        accessKeyId: accessKeyId.release(),
        secretAccessKey: secretAccessKey.release(),
      },
      region,
    })
  }

  async checkAccess(): Promise<boolean> {
    try {
      await Promise.all([
        this.ses.send(new GetSendQuotaCommand({})),
        this.ses.send(new ListIdentitiesCommand({})),
      ])

      return true
    } catch (error) {
      console.error("Error checking SES access:", error)
      return false
    }
  }

  async getConfigurationSet(configurationSetName: string) {
    try {
      const response = await this.ses.send(
        new DescribeConfigurationSetCommand({
          ConfigurationSetName: configurationSetName,
          ConfigurationSetAttributeNames: ["eventDestinations"],
        }),
      )

      return response
    } catch (error) {
      return null
    }
  }

  async getConfigurationSetEventsDestination(destinationName: string) {
    const configurationSet = await this.getConfigurationSet(destinationName)

    if (!configurationSet) {
      return null
    }

    return configurationSet?.EventDestinations?.find(
      (destination) => destination.Name === destinationName,
    )
  }

  async createConfigurationSetEventsDestination(
    configurationSetName: string,
    topicArn: string,
  ) {
    const existingDestination =
      await this.getConfigurationSetEventsDestination(configurationSetName)

    if (existingDestination) {
      return existingDestination
    }

    const destination = await this.ses.send(
      new CreateConfigurationSetEventDestinationCommand({
        ConfigurationSetName: configurationSetName,
        EventDestination: {
          Enabled: true,
          Name: configurationSetName,
          MatchingEventTypes: [
            "reject",
            "bounce",
            "complaint",
            "click",
            "open",
          ],
          SNSDestination: {
            TopicARN: topicArn,
          },
        },
      }),
    )

    return destination
  }

  async createConfigurationSet(configurationSetName: string) {
    const existingConfigurationSet =
      await this.getConfigurationSet(configurationSetName)

    if (existingConfigurationSet) {
      return existingConfigurationSet
    }

    const configurationSet = await this.ses.send(
      new CreateConfigurationSetCommand({
        ConfigurationSet: {
          Name: configurationSetName,
        },
      }),
    )

    return configurationSet
  }

  async deleteConfigurationSet(configurationSetName: string) {
    await this.ses.send(
      new DeleteConfigurationSetCommand({
        ConfigurationSetName: configurationSetName,
      }),
    )
  }
}

export default SESService
