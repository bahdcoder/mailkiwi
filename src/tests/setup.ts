import "reflect-metadata"

import { Ignitor } from "@/infrastructure/boot/ignitor"

process.env.NODE_ENV = "test"

new Ignitor().boot().register()
