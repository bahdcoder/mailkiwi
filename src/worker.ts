import { WorkerIgnitor } from '@/infrastructure/worker/worker_ignitor.js'
import { ArgParser } from '@/utils/args_parser.js'
import { AVAILABLE_QUEUES } from './domains/shared/queue/config.js'

const ignitor = await new WorkerIgnitor().boot().start()

ignitor.listen(
  new ArgParser(process.argv)
    .get('queues', Object.values(AVAILABLE_QUEUES).join(','))
    .split(','),
)
