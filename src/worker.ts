import { WorkerIgnitor } from '@/infrastructure/worker/worker_ignitor.ts'
import { ArgParser } from '@/utils/args_parser.ts'
import { AVAILABLE_QUEUES } from './domains/shared/queue/config.ts'

const ignitor = await new WorkerIgnitor().boot().start()

ignitor.listen(
  new ArgParser(process.argv)
    .get('queues', Object.values(AVAILABLE_QUEUES).join(','))
    .split(','),
)
