import "reflect-metadata"

import { Ignitor } from "@/infrastructure/boot/ignitor.js"

process.env.NODE_ENV = "test"

await new Ignitor().boot().start()
