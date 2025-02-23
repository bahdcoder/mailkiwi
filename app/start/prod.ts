import { IgnitorProd } from '@/app/ignitor/ignitor_prod.js'

new IgnitorProd().boot().start().catch(console.error)
