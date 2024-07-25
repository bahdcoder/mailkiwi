import Cluster from 'node:cluster'
import Os from 'node:os'

import { WorkerIgnitor } from './infrastructure/worker/worker_ignitor.ts'

const execute = () => new WorkerIgnitor().boot().start().listen()

// if (Cluster.isPrimary) {
//   const coresCount = Os.cpus().length

//   for (let i = 0; i < coresCount; i++) {
//     Cluster.fork()
//   }

//   Cluster.on('exit', (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`)
//     Cluster.fork() // Restart the worker
//   })
// } else {
//   execute()
// }

execute()
