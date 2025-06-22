import { eq } from 'drizzle-orm'
import {
  developerTools__domainRecords,
  developerTools__domains,
} from '#root/database/schema.js'
import { makeDatabase } from '#root/core/shared/container/index.js'

// Define types based on the schema
type DeveloperToolsDomain = typeof developerTools__domains.$inferSelect
type DeveloperToolsDomainRecord = typeof developerTools__domainRecords.$inferSelect
type InsertDeveloperToolsDomain = typeof developerTools__domains.$inferInsert
type InsertDeveloperToolsDomainRecord = typeof developerTools__domainRecords.$inferInsert

export class DeveloperToolsRepository {
  constructor(private database = makeDatabase()) {}

  // Domain methods
  async createDomain(data: InsertDeveloperToolsDomain): Promise<DeveloperToolsDomain> {
    const [domain] = await this.database
      .insert(developerTools__domains)
      .values(data)
      .$returningId()

    return this.findDomainById(domain.id)
  }

  async findDomainById(id: string): Promise<DeveloperToolsDomain> {
    const [domain] = await this.database
      .select()
      .from(developerTools__domains)
      .where(eq(developerTools__domains.id, id))

    return domain
  }

  async findAllDomains(): Promise<DeveloperToolsDomain[]> {
    return this.database.select().from(developerTools__domains)
  }

  async deleteDomain(id: string): Promise<void> {
    await this.database
      .delete(developerTools__domains)
      .where(eq(developerTools__domains.id, id))
  }

  // Domain Records methods
  async createDomainRecord(
    data: InsertDeveloperToolsDomainRecord,
  ): Promise<DeveloperToolsDomainRecord> {
    const [record] = await this.database
      .insert(developerTools__domainRecords)
      .values(data)
      .$returningId()

    return this.findDomainRecordById(record.id)
  }

  async findDomainRecordById(id: string): Promise<DeveloperToolsDomainRecord> {
    const [record] = await this.database
      .select()
      .from(developerTools__domainRecords)
      .where(eq(developerTools__domainRecords.id, id))

    return record
  }

  async findDomainRecordsByDomainId(
    domainId: string,
  ): Promise<DeveloperToolsDomainRecord[]> {
    return this.database
      .select()
      .from(developerTools__domainRecords)
      .where(eq(developerTools__domainRecords.developerTools__domainsId, domainId))
  }

  async deleteDomainRecord(id: string): Promise<void> {
    await this.database
      .delete(developerTools__domainRecords)
      .where(eq(developerTools__domainRecords.id, id))
  }

  async findDomainsWithRecords() {
    return this.database.query.developerTools__domains.findMany({
      with: {
        domainRecords: true,
      },
    })
  }
}
