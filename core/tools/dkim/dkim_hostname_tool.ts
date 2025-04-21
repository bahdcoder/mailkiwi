import { DateTime } from 'luxon'

export class DkimHostNameTool {
  generate() {
    const now = DateTime.now().toFormat('yyyyMMddHHmmss')

    return `${now}._domainkey`
  }
}
