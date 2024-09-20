import { Ignitor } from "@/api/ignitor/ignitor_api.js"

new Ignitor().boot().start().catch(console.error)
