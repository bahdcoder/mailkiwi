import Os from "node:os"
import Cluster from "node:cluster"

import { sleep } from "./utils/sleep.ts"
import { Queue } from "./domains/shared/queue/queue.ts"
import { WorkerIgnitor } from "./infrastructure/worker/worker_ignitor.ts"
import { SendBroadcastJob } from "./domains/broadcasts/jobs/send_broadcast_job.ts"
import { SendTransactionalEmailJob } from "./domains/transactional/jobs/send_transactional_email_job.ts"

const execute = () => new WorkerIgnitor().boot().start().listen()

if (Cluster.isPrimary) {
  const coresCount = Os.cpus().length

  for (let i = 0; i < coresCount; i++) {
    Cluster.fork()
  }

  Cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
    Cluster.fork() // Restart the worker
  })
} else {
  execute()
}
