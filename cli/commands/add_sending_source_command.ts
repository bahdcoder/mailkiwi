import { AddSendingSourceAction } from '#root/core/settings/actions/add_sending_source_action.js'
import { CreateSendingSourceSchema } from '#root/core/settings/dtos/create_sending_source_dto.js'
import { command, string } from '@drizzle-team/brocli'
import { parseAsync } from 'valibot'

import { container } from '#root/core/utils/typi.js'

export const addSendingSourceCommand = command({
  name: 'add_sending_source',
  desc: 'Add a sending source (sending ip address).',
  options: {
    address: string().required().desc('The Ipv4 address to add.'),
    ehloDomain: string()
      .required()
      .desc('The domain pointing to the sending source address.'),
    addressIpv6: string().desc('Associate this ipv4 address with an ipv6 address'),
    pool: string()
      .enum('engage', 'send')
      .required()
      .desc('Define what pool this sending source is for.'),
    status: string()
      .enum('active', 'inactive', 'warming')
      .required()
      .desc('Select a status for this sending source'),
  },
  async transform(opts) {
    return opts
  },
  async handler(opts) {
    const payload = await parseAsync(CreateSendingSourceSchema, opts)

    await container.make(AddSendingSourceAction).handle(payload)
  },
})
