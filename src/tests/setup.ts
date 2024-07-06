import "reflect-metadata"

import { Ignitor } from "@/infrastructure/boot/ignitor.js"

process.env.NODE_ENV = "test"

new Ignitor().boot().register()
