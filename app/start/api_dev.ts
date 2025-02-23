import { IgnitorDev } from '@/app/ignitor/ignitor_dev.js'

await new IgnitorDev().boot().start().catch(console.error)
