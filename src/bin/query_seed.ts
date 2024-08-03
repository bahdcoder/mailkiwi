import { faker } from "@faker-js/faker";
import { cuid } from "@/shared/utils/cuid/cuid.js";
import { ContainerKey } from "@/shared/container/index.js";
import {
  createDatabaseClient,
  createDrizzleDatabase,
} from "@/database/client.js";
import {
  users,
  teams,
  audiences,
  contacts as ContactsTable,
  broadcasts,
  sends,
  abTestVariants,
  emailContents,
} from "@/database/schema/schema.js";
import cluster from "node:cluster";
import { cpus } from "node:os";
import { Worker } from "node:worker_threads";
import { env } from "@/shared/env/index.js";
import { container } from "@/utils/typi.js";
import { count, eq } from "drizzle-orm";
import { refreshDatabase } from "@/tests/mocks/teams/teams.ts";
import { sleep } from "@/utils/sleep.ts";

// Set up database connection
const connection = await createDatabaseClient(env.DATABASE_URL);
const database = createDrizzleDatabase(connection);

container.registerInstance(ContainerKey.env, env);
container.registerInstance(ContainerKey.database, database);

class BaseSeed {
  protected db = database;

  protected async batchInsert<T extends Record<string, any>>(
    table: any,
    data: T[],
    message?: string,
    batchSize = 10000,
  ) {
    console.log(`Inserting ${data.length} ${message || ""}`);

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await this.db.insert(table).values(batch);
      console.log(
        `Inserted batch of length ${batch.length} ${i / batchSize + 1} of ${Math.ceil(data.length / batchSize)}`,
      );
    }
  }
}

class UserSeed extends BaseSeed {
  async seed(count: number) {
    const userData = Array.from({ length: count }, () => ({
      id: cuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      password: faker.internet.password(),
    }));
    await this.batchInsert(users, userData, "users");
    return userData;
  }
}

class TeamSeed extends BaseSeed {
  async seed(userId: string) {
    const teamData = {
      id: cuid(),
      name: faker.company.name(),
      userId,
      configurationKey: faker.string.uuid(),
    };
    await this.db.insert(teams).values(teamData);
    return teamData;
  }
}

class AudienceSeed extends BaseSeed {
  async seed(teamId: string) {
    const audienceData = {
      id: cuid(),
      name: faker.word.words(2),
      teamId,
    };
    await this.db.insert(audiences).values(audienceData);
    return audienceData;
  }
}

class ContactSeed extends BaseSeed {
  async seed(audienceId: string, count: number) {
    const contactData = Array.from({ length: count }, () => ({
      id: cuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: `${faker.string.nanoid(8)}.${faker.internet.email()}`,
      audienceId,
      subscribedAt: faker.date.past(),
    }));
    await this.batchInsert(ContactsTable, contactData, "contacts");
    return contactData;
  }
}

class EmailContentSeed extends BaseSeed {
  async seed(count: number) {
    const emailContentData = Array.from({ length: count }, () => ({
      id: cuid(),
      fromName: faker.person.fullName(),
      fromEmail: faker.internet.email(),
      replyToEmail: faker.internet.email(),
      replyToName: faker.person.fullName(),
      subject: faker.lorem.sentence(),
      previewText: faker.lorem.sentence(),
      contentJson: JSON.stringify(this.generateEmailStructure()),
      contentHtml: this.generateHtmlContent(),
      contentText: faker.lorem.paragraphs(3),
    }));
    await this.batchInsert(emailContents, emailContentData, "email contents");
    return emailContentData;
  }

  private generateEmailStructure() {
    return {
      body: {
        type: "container",
        children: [
          {
            type: "text",
            value: faker.lorem.paragraph(),
          },
          {
            type: "button",
            value: "Click me!",
            url: faker.internet.url(),
          },
        ],
      },
    };
  }

  private generateHtmlContent() {
    return `
      <html>
        <body>
          <h1>${faker.lorem.sentence()}</h1>
          <p>${faker.lorem.paragraph()}</p>
          <p>${faker.lorem.paragraph()}</p>
          <a href="${faker.internet.url()}">${faker.lorem.words(3)}</a>
        </body>
      </html>
    `;
  }
}

class BroadcastSeed extends BaseSeed {
  async seed(audienceId: string, teamId: string, count: number) {
    const broadcastData = Array.from({ length: count }, () => ({
      id: cuid(),
      name: faker.lorem.words(3),
      audienceId,
      teamId,
      status: "DRAFT",
      isAbTest: Math.random() < 0.5, // 50% chance of being an A/B test
    }));
    await this.batchInsert(broadcasts, broadcastData, "broadcasts");
    return broadcastData;
  }
}

class ABTestVariantSeed extends BaseSeed {
  private emailContentSeed: EmailContentSeed;

  constructor() {
    super();
    this.emailContentSeed = new EmailContentSeed();
  }

  async seed(broadcastId: string, isAbTest: boolean) {
    const variantCount = isAbTest ? Math.floor(Math.random() * 2) + 2 : 1; // 2 or 3 variants for A/B tests, 1 for regular broadcasts
    const emailContents = await this.emailContentSeed.seed(variantCount);

    const variantData = emailContents.map((content, index) => ({
      id: cuid(),
      broadcastId,
      name: `Variant ${index + 1}`,
      emailContentId: content.id,
      weight: this.calculateVariantWeight(index, variantCount),
    }));

    await this.batchInsert(abTestVariants, variantData, "abtests");
    return variantData;
  }

  private calculateVariantWeight(index: number, totalVariants: number): number {
    if (totalVariants === 1) return 100;
    if (totalVariants === 2) return index === 0 ? 50 : 50;
    if (totalVariants === 3) return [40, 30, 30][index];
    return Math.floor(100 / totalVariants); // Fallback for unexpected cases
  }
}

class SendSeed extends BaseSeed {
  async seed(
    broadcastId: string,
    variants: any[],
    contactData: any[],
    linkCount: number,
  ) {
    const totalWeight = variants.reduce(
      (sum, variant) => sum + variant.weight,
      0,
    );
    const variantThresholds = variants.map((variant, index, array) => ({
      ...variant,
      threshold:
        array.slice(0, index + 1).reduce((sum, v) => sum + v.weight, 0) /
        totalWeight,
    }));

    const sendData = contactData.map((contact) => {
      const random = Math.random();
      const selectedVariant =
        variantThresholds.find((v) => random <= v.threshold) ||
        variants[variants.length - 1];

      return {
        id: cuid(),
        broadcastId,
        variantId: selectedVariant.id,
        contactId: contact.id,
        status: "SENT",
        sentAt: faker.date.recent(),
        openedAt: Math.random() < 0.3 ? faker.date.recent() : null,
        firstClickAt: Math.random() < 0.1 ? faker.date.recent() : null,
        openCount: Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0,
        clickCount: Math.random() < 0.1 ? Math.floor(Math.random() * 5) + 1 : 0,
        clickedLinks:
          Math.random() < 0.1 ? this.generateClickedLinks(linkCount) : null,
      };
    });

    await this.batchInsert(sends, sendData, "sends");
  }

  private generateClickedLinks(linkCount: number): Record<string, number> {
    const clickedLinks: Record<string, number> = {};
    for (let i = 0; i < linkCount; i++) {
      if (Math.random() < 0.25) {
        clickedLinks[`http://example.com/link${i + 1}`] =
          Math.floor(Math.random() * 3) + 1;
      }
    }
    return clickedLinks;
  }
}

class DatabaseSeeder {
  private userSeed = new UserSeed();
  private teamSeed = new TeamSeed();
  private audienceSeed = new AudienceSeed();
  private contactSeed = new ContactSeed();
  private broadcastSeed = new BroadcastSeed();
  private abTestVariantSeed = new ABTestVariantSeed();
  private sendSeed = new SendSeed();

  async seed() {
    console.log("Starting database seed...");

    const seededUsers = await this.userSeed.seed(100);
    console.log("Seeded 100 users");

    for (const user of seededUsers) {
      await sleep(5000);
      const team = await this.teamSeed.seed(user.id);
      console.log(`Seeded team for user ${user.email}\n`);

      const audience = await this.audienceSeed.seed(team.id);
      console.log(`Seeded audience for team ${team.name}\n`);

      const contacts = await this.contactSeed.seed(audience.id, 1000000);
      console.log(`Seeded 1,000,000 contacts for audience ${audience.name}\n`);

      const broadcasts = await this.broadcastSeed.seed(audience.id, team.id, 1);
      console.log(`Seeded 50 broadcasts for audience ${audience.name}\n`);

      for (const broadcast of broadcasts) {
        const variants = await this.abTestVariantSeed.seed(
          broadcast.id,
          broadcast.isAbTest,
        );
        console.log(
          `Seeded ${variants.length} variant(s) with email content for broadcast ${broadcast.name}\n`,
        );

        await this.sendSeed.seed(broadcast.id, variants, contacts, 4);
        console.log(`Seeded 1,000,000 sends for broadcast ${broadcast.name}\n`);
      }
    }

    console.log("Database seed completed successfully");
  }
}

async function seed() {
  const seeder = new DatabaseSeeder();
  seeder
    .seed()
    .then(() => console.log("Seeding completed"))
    .catch((error) => console.error("Error during seeding:", error));
}

const numCPUs = cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  console.log("Cleaning database ...");
  await refreshDatabase();
  console.log("Done cleaning database.");

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  await seed();
}
