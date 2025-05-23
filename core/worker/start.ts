import { WorkerIgnitor } from '#root/core/worker/worker_ignitor.js'

import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

import { ArgParser } from '#root/core/utils/args_parser.js'

const ignitor = new WorkerIgnitor().boot()

await ignitor.start()

ignitor.listen(
  new ArgParser(process.argv)
    .get('queues', Object.values(AVAILABLE_QUEUES).join(','))
    .split(','),
)
