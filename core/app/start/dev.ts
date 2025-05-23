import { IgnitorDev } from '#root/core/app/ignitor/ignitor_dev.js'

await new IgnitorDev().boot().start().catch(console.error)
