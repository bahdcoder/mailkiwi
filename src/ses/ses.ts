import {
  BehaviorOnMXFailure,
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  DeleteConfigurationSetCommand,
  DeleteIdentityCommand,
  DescribeConfigurationSetCommand,
  GetAccountSendingEnabledCommand,
  GetIdentityDkimAttributesCommand,
  GetIdentityMailFromDomainAttributesCommand,
  GetIdentityVerificationAttributesCommand,
  GetSendQuotaCommand,
  type IdentityDkimAttributes,
  type IdentityMailFromDomainAttributes,
  type IdentityVerificationAttributes,
  ListIdentitiesCommand,
  SESClient,
  SetIdentityMailFromDomainCommand,
} from "@aws-sdk/client-ses";
import { CreateEmailIdentityCommand } from "@aws-sdk/client-sesv2";
import { Secret } from "@poppinss/utils";

import { RsaKeyPair } from "@/shared/utils/ssl/rsa.js";

export class SESService {
  private ses: SESClient;

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
    });
  }

  async checkAccess(): Promise<boolean> {
    try {
      await Promise.all([
        this.ses.send(new GetSendQuotaCommand({})),
        this.ses.send(new ListIdentitiesCommand({})),
      ]);

      return true;
    } catch (error) {
      return false;
    }
  }

  async getConfigurationSet(configurationSetName: string) {
    try {
      const response = await this.ses.send(
        new DescribeConfigurationSetCommand({
          ConfigurationSetName: configurationSetName,
          ConfigurationSetAttributeNames: ["eventDestinations"],
        }),
      );

      return response;
    } catch (error) {
      return null;
    }
  }

  async getConfigurationSetEventsDestination(destinationName: string) {
    const configurationSet = await this.getConfigurationSet(destinationName);

    if (!configurationSet) {
      return null;
    }

    return configurationSet?.EventDestinations?.find(
      (destination) => destination.Name === destinationName,
    );
  }

  async getAccountSendingEnabled() {
    return this.ses.send(new GetAccountSendingEnabledCommand({}));
  }

  async getSendingStatus() {
    const [accountSending, sendQuota] = await Promise.all([
      this.getAccountSendingEnabled(),
      this.ses.send(new GetSendQuotaCommand({})),
    ]);

    return {
      Enabled: accountSending?.Enabled,
      Max24HourSend: sendQuota?.Max24HourSend,
      MaxSendRate: sendQuota?.MaxSendRate,
      SentLast24Hours: sendQuota?.SentLast24Hours,
    };
  }

  async createConfigurationSetEventsDestination(
    configurationSetName: string,
    topicArn: string,
  ) {
    const existingDestination =
      await this.getConfigurationSetEventsDestination(configurationSetName);

    if (existingDestination) {
      return existingDestination;
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
    );

    return destination;
  }

  async createConfigurationSet(configurationSetName: string) {
    const existingConfigurationSet =
      await this.getConfigurationSet(configurationSetName);

    if (existingConfigurationSet) {
      return existingConfigurationSet;
    }

    const configurationSet = await this.ses.send(
      new CreateConfigurationSetCommand({
        ConfigurationSet: {
          Name: configurationSetName,
        },
      }),
    );

    return configurationSet;
  }

  async deleteConfigurationSet(configurationSetName: string) {
    await this.ses.send(
      new DeleteConfigurationSetCommand({
        ConfigurationSetName: configurationSetName,
      }),
    );
  }

  async getIdentities() {
    const response = await this.ses.send(new ListIdentitiesCommand({}));

    return response.Identities;
  }

  async getIdentitiesAttributes(identities: string[]) {
    const [
      identityDkimAttributes,
      identityVerificationAttributes,
      identityMailFromAttributes,
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
    ]);

    const attributes: Record<
      string,
      Partial<
        IdentityDkimAttributes &
          IdentityVerificationAttributes &
          IdentityMailFromDomainAttributes
      >
    > = {};

    for (const identity of identities) {
      attributes[identity] = {
        ...identityDkimAttributes?.DkimAttributes?.[identity],
        ...identityVerificationAttributes?.VerificationAttributes?.[identity],
        ...identityMailFromAttributes?.MailFromDomainAttributes?.[identity],
      };
    }

    return attributes;
  }

  async deleteIdentity(value: string) {
    return this.ses.send(
      new DeleteIdentityCommand({
        Identity: value,
      }),
    );
  }

  async createIdentity(
    configurationSetName: string,
    identityValue: string,
    identityType: "DOMAIN" | "EMAIL",
    DomainSigningSelector: string,
  ) {
    const rsaKeyPair = new RsaKeyPair();

    if (identityType === "DOMAIN") {
      rsaKeyPair.generate();
    }

    const identity = await this.ses.send(
      new CreateEmailIdentityCommand({
        EmailIdentity: identityValue,
        ConfigurationSetName: configurationSetName,
        ...(identityType === "DOMAIN" && {
          DkimSigningAttributes: {
            DomainSigningPrivateKey: rsaKeyPair.clean().privateKey,
            DomainSigningSelector,
          },
        }),
      }),
    );

    if (identityType === "DOMAIN") {
      await this.ses.send(
        new SetIdentityMailFromDomainCommand({
          Identity: identityValue,
          MailFromDomain: `send.${identityValue}`,
          BehaviorOnMXFailure: BehaviorOnMXFailure.UseDefaultValue,
        }),
      );
    }

    return {
      identity,
      publicKey: new Secret(rsaKeyPair.clean().publicKey),
      privateKey: new Secret(rsaKeyPair.clean().privateKey),
    };
  }
}

export default SESService;
