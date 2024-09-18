import { IgnitorMtaLogProcessor } from "@/kumologs/ignitor/ignitor_mta_log_processor.js"

await new IgnitorMtaLogProcessor().boot().start()
