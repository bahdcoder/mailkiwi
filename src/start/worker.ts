import { WorkerIgnitor } from "@/worker/worker_ignitor.js"

import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"

import { ArgParser } from "@/utils/args_parser.js"

const ignitor = await new WorkerIgnitor().boot().start()

ignitor.listen(
  new ArgParser(process.argv)
    .get("queues", Object.values(AVAILABLE_QUEUES).join(","))
    .split(","),
)
