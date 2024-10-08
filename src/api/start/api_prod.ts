import { IgnitorProd } from "@/api/ignitor/ignitor_api_prod.js"

new IgnitorProd().boot().start().catch(console.error)
