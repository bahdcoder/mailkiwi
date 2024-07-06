import "reflect-metadata"

import { IgnitorDev } from "@/infrastructure/boot/ignitor_dev.js"

new IgnitorDev().boot().register().start()
