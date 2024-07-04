import {
  BehaviorOnMXFailure,
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  DeleteConfigurationSetCommand,
  DescribeConfigurationSetCommand,
  GetIdentityDkimAttributesCommand,
  GetIdentityMailFromDomainAttributesCommand,
  GetIdentityVerificationAttributesCommand,
  GetSendQuotaCommand,
  IdentityDkimAttributes,
  IdentityMailFromDomainAttributes,
  IdentityVerificationAttributes,
  ListIdentitiesCommand,
  SESClient,
  SetIdentityMailFromDomainCommand,
} from "@aws-sdk/client-ses"
import { CreateEmailIdentityCommand } from "@aws-sdk/client-sesv2"
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

  async getIdentities() {
    const response = await this.ses.send(new ListIdentitiesCommand({}))

    return response.Identities
  }

  async getIdentitiesAttributes(identities: string[]) {
    const [
      { DkimAttributes },
      { VerificationAttributes },
      { MailFromDomainAttributes },
    ] = await Promise.all([
      this.ses.send(
        new GetIdentityDkimAttributesCommand({
          Identities: identities,
        }),
      ),
      this.ses.send(
        new GetIdentityVerificationAttributesCommand({
          Identities: identities,
        }),
      ),
      this.ses.send(
        new GetIdentityMailFromDomainAttributesCommand({
          Identities: identities,
        }),
      ),
    ])

    const attributes: Record<
      string,
      Partial<
        IdentityDkimAttributes &
          IdentityVerificationAttributes &
          IdentityMailFromDomainAttributes
      >
    > = {}

    identities.forEach((identity) => {
      attributes[identity] = {
        ...DkimAttributes?.[identity],
        ...VerificationAttributes?.[identity],
        ...MailFromDomainAttributes?.[identity],
      }
    })

    return attributes
  }

  async createIdentity(configurationSetName: string, identityValue: string) {
    const identity = await this.ses.send(
      new CreateEmailIdentityCommand({
        EmailIdentity: identityValue,
        ConfigurationSetName: configurationSetName,
        DkimSigningAttributes: {
          // Todo: Provide private key.
          DomainSigningPrivateKey: "",
          DomainSigningSelector: "",
        },
      }),
    )

    if (identity.IdentityType === "EMAIL_ADDRESS") return identity

    await this.ses.send(
      new SetIdentityMailFromDomainCommand({
        Identity: identityValue,
        MailFromDomain: `send.${identityValue}`,
        BehaviorOnMXFailure: BehaviorOnMXFailure.UseDefaultValue,
      }),
    )

    return identity
  }
}

export default SESService
