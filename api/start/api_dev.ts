import { IgnitorDev } from "@/api/ignitor/ignitor_api_dev.js"

await new IgnitorDev().boot().start().catch(console.error)
