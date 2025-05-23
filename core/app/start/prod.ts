import { IgnitorProd } from '#root/core/app/ignitor/ignitor_prod.js'

await new IgnitorProd().boot().start().catch(console.error)
